import Anthropic from "@anthropic-ai/sdk";
import { complete } from "./client";
import { getToolsForSchema } from "./tools";
import { getPromptForSchema } from "./prompts";
import { ClientInputSchema } from "./tools/client";
import { ProjectInputSchema } from "./tools/project";
import { PersonInputSchema } from "./tools/person";
import { createServiceClient } from "@guildry/database";

export interface Conversation {
  id: string;
  org_id: string;
  user_id: string;
  target_schema: string | null;
  intent: string | null;
  status: string;
  extracted_data: Record<string, unknown>;
  created_entities: Record<string, string>;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ProcessConversationResult {
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    input: Record<string, unknown>;
  }>;
  completed: boolean;
  createdEntities?: Array<{
    type: string;
    id: string;
    name: string;
  }>;
}

/**
 * Process a conversation turn with Claude
 * 
 * @param conversation - The conversation object
 * @param userMessage - The new message from the user
 * @returns ProcessConversationResult with assistant response and metadata
 */
export async function processConversation(
  conversation: Conversation,
  userMessage: string
): Promise<ProcessConversationResult> {
  const db = createServiceClient();

  // Get conversation schema from target_schema (default to 'client')
  const schema = conversation.target_schema || "client";

  // Fetch existing messages from the database
  const { data: existingMessages, error: messagesError } = await db
    .from("messages")
    .select("*")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("Failed to fetch messages:", messagesError);
    throw new Error("Failed to load conversation history");
  }

  // Build messages array for Claude
  const messages: Anthropic.MessageParam[] = [];

  // Add existing conversation history
  for (const msg of existingMessages || []) {
    messages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    });
  }

  // Add the new user message
  messages.push({
    role: "user",
    content: userMessage,
  });

  // Get appropriate tools and system prompt
  const tools = getToolsForSchema(schema);
  const systemPrompt = getPromptForSchema(schema);

  // Call Claude
  const result = await complete({
    messages,
    tools,
    system: systemPrompt,
    maxTokens: 2048,
  });

  // Check if we need to execute tools
  let finalContent = result.content;
  let completed = false;
  const createdEntities: Array<{
    type: string;
    id: string;
    name: string;
  }> = [];

  if (result.toolCalls && result.toolCalls.length > 0) {
    for (const toolCall of result.toolCalls) {
      console.log(`Executing tool: ${toolCall.name}`, toolCall.input);

      // Handle create_client tool
      if (toolCall.name === "create_client") {
        try {
          // Validate input
          const validatedInput = ClientInputSchema.parse(toolCall.input);

          // Insert client into database
          const { data: client, error: clientError } = await db
            .from("clients")
            .insert({
              org_id: conversation.org_id,
              name: validatedInput.name,
              industry: validatedInput.industry || null,
              size_tier: validatedInput.size_tier || null,
              website_url: validatedInput.website_url || null,
              notes: validatedInput.notes || null,
            })
            .select()
            .single();

          if (clientError) {
            console.error("Failed to create client:", clientError);
            throw new Error("Failed to create client in database");
          }

          console.log("Client created successfully:", client.id);

          // Track created entity
          createdEntities.push({
            type: "client",
            id: client.id,
            name: client.name,
          });

          // Get Claude's follow-up response after tool execution
          const followUpResult = await complete({
            messages: [
              ...messages,
              {
                role: "assistant",
                content: [
                  {
                    type: "tool_use",
                    id: toolCall.id,
                    name: toolCall.name,
                    input: toolCall.input,
                  },
                ],
              },
              {
                role: "user",
                content: [
                  {
                    type: "tool_result",
                    tool_use_id: toolCall.id,
                    content: JSON.stringify({
                      success: true,
                      client_id: client.id,
                      message: `Client "${client.name}" created successfully`,
                    }),
                  },
                ],
              },
            ],
            tools,
            system: systemPrompt,
            maxTokens: 1024,
          });

          finalContent = followUpResult.content;
        } catch (error) {
          console.error("Error executing create_client tool:", error);
          throw error;
        }
      }

      // Handle create_project tool
      if (toolCall.name === "create_project") {
        try {
          // Validate input
          const validatedInput = ProjectInputSchema.parse(toolCall.input);
          const phases = (toolCall.input as { phases?: Array<{ name: string; estimated_hours: number }> }).phases;

          // Insert project into database
          const { data: project, error: projectError } = await db
            .from("projects")
            .insert({
              org_id: conversation.org_id,
              name: validatedInput.name,
              client_id: validatedInput.client_id || null,
              description: validatedInput.description || null,
              type: validatedInput.type || null,
              status: "draft",
              estimated_hours: validatedInput.estimated_hours || null,
              start_date: validatedInput.start_date || null,
              end_date: validatedInput.end_date || null,
              tags: validatedInput.tags || null,
            })
            .select()
            .single();

          if (projectError) {
            console.error("Failed to create project:", projectError);
            throw new Error("Failed to create project in database");
          }

          console.log("Project created successfully:", project.id);

          // Create phases if provided
          if (phases && phases.length > 0) {
            const phasesWithOrder = phases.map((phase, index) => ({
              project_id: project.id,
              name: phase.name,
              estimated_hours: phase.estimated_hours,
              sort_order: index,
              status: "planned",
            }));

            const { error: phasesError } = await db.from("phases").insert(phasesWithOrder);
            if (phasesError) {
              console.error("Failed to create phases:", phasesError);
              // Don't throw - project was created successfully
            }
          }

          // Track created entity
          createdEntities.push({
            type: "project",
            id: project.id,
            name: project.name,
          });

          // Get Claude's follow-up response after tool execution
          const followUpResult = await complete({
            messages: [
              ...messages,
              {
                role: "assistant",
                content: [
                  {
                    type: "tool_use",
                    id: toolCall.id,
                    name: toolCall.name,
                    input: toolCall.input,
                  },
                ],
              },
              {
                role: "user",
                content: [
                  {
                    type: "tool_result",
                    tool_use_id: toolCall.id,
                    content: JSON.stringify({
                      success: true,
                      project_id: project.id,
                      message: `Project "${project.name}" created successfully with ${phases?.length || 0} phases`,
                    }),
                  },
                ],
              },
            ],
            tools,
            system: systemPrompt,
            maxTokens: 1024,
          });

          finalContent = followUpResult.content;
        } catch (error) {
          console.error("Error executing create_project tool:", error);
          throw error;
        }
      }

      // Handle suggest_phases tool (informational only, no DB action)
      if (toolCall.name === "suggest_phases") {
        const input = toolCall.input as {
          project_type: string;
          complexity: string;
          phases: Array<{ name: string; description: string; typical_hours_range: string }>;
        };
        console.log("Phases suggested:", input);

        // Always format and include the phases - this is the key information
        const phasesList = input.phases
          .map((p, i) => `${i + 1}. **${p.name}** (${p.typical_hours_range})\n   ${p.description}`)
          .join("\n\n");

        // Calculate total hours range
        const totalMin = input.phases.reduce((sum, p) => {
          const match = p.typical_hours_range.match(/(\d+)/);
          return sum + (match ? parseInt(match[1]) : 0);
        }, 0);
        const totalMax = input.phases.reduce((sum, p) => {
          const match = p.typical_hours_range.match(/(\d+)[^\d]*(\d+)/);
          return sum + (match ? parseInt(match[2]) : 0);
        }, 0);

        const phasesContent = `**Suggested Phases for ${input.complexity} ${input.project_type}:**\n\n${phasesList}\n\n**Total Estimated: ${totalMin}-${totalMax} hours**\n\nDoes this breakdown look right? I can adjust phases, add/remove items, or modify the hour estimates.`;

        // Append to existing content or use as content
        if (finalContent && finalContent.trim() !== "") {
          finalContent = `${finalContent}\n\n${phasesContent}`;
        } else {
          finalContent = phasesContent;
        }
      }

      // Handle update_project tool
      if (toolCall.name === "update_project") {
        try {
          const input = toolCall.input as { project_id: string; [key: string]: unknown };
          const { project_id, ...updates } = input;

          const { data: project, error: updateError } = await db
            .from("projects")
            .update(updates)
            .eq("id", project_id)
            .eq("org_id", conversation.org_id)
            .select()
            .single();

          if (updateError) {
            console.error("Failed to update project:", updateError);
            throw new Error("Failed to update project in database");
          }

          console.log("Project updated successfully:", project.id);

          // Get Claude's follow-up response
          const followUpResult = await complete({
            messages: [
              ...messages,
              {
                role: "assistant",
                content: [
                  {
                    type: "tool_use",
                    id: toolCall.id,
                    name: toolCall.name,
                    input: toolCall.input,
                  },
                ],
              },
              {
                role: "user",
                content: [
                  {
                    type: "tool_result",
                    tool_use_id: toolCall.id,
                    content: JSON.stringify({
                      success: true,
                      project_id: project.id,
                      message: `Project "${project.name}" updated successfully`,
                    }),
                  },
                ],
              },
            ],
            tools,
            system: systemPrompt,
            maxTokens: 1024,
          });

          finalContent = followUpResult.content;
        } catch (error) {
          console.error("Error executing update_project tool:", error);
          throw error;
        }
      }

      // Handle create_person tool
      if (toolCall.name === "create_person") {
        try {
          // Validate input
          const validatedInput = PersonInputSchema.parse(toolCall.input);
          const skills = (toolCall.input as { skills?: Array<{ skill_name: string; proficiency_level: number; years_experience?: number }> }).skills;

          // Insert person into database
          const { data: person, error: personError } = await db
            .from("people")
            .insert({
              org_id: conversation.org_id,
              name: validatedInput.name,
              type: validatedInput.type,
              email: validatedInput.email || null,
              location: validatedInput.location || null,
              hourly_rate: validatedInput.hourly_rate || null,
              currency: validatedInput.currency || "USD",
              availability_status: validatedInput.availability_status || "available",
              notes: validatedInput.notes || null,
            })
            .select()
            .single();

          if (personError) {
            console.error("Failed to create person:", personError);
            throw new Error("Failed to create person in database");
          }

          console.log("Person created successfully:", person.id);

          // Link skills if provided
          if (skills && skills.length > 0) {
            for (const skillData of skills) {
              // Try to find existing skill by name
              const { data: existingSkill } = await db
                .from("skills")
                .select("id")
                .ilike("name", skillData.skill_name)
                .single();

              if (existingSkill?.id) {
                await db.from("person_skills").insert({
                  person_id: person.id,
                  skill_id: existingSkill.id,
                  proficiency_level: skillData.proficiency_level,
                  years_experience: skillData.years_experience || null,
                });
              }
            }
          }

          // Track created entity
          createdEntities.push({
            type: "person",
            id: person.id,
            name: person.name,
          });

          // Get Claude's follow-up response after tool execution
          const followUpResult = await complete({
            messages: [
              ...messages,
              {
                role: "assistant",
                content: [
                  {
                    type: "tool_use",
                    id: toolCall.id,
                    name: toolCall.name,
                    input: toolCall.input,
                  },
                ],
              },
              {
                role: "user",
                content: [
                  {
                    type: "tool_result",
                    tool_use_id: toolCall.id,
                    content: JSON.stringify({
                      success: true,
                      person_id: person.id,
                      message: `${person.name} added to your talent network`,
                    }),
                  },
                ],
              },
            ],
            tools,
            system: systemPrompt,
            maxTokens: 1024,
          });

          finalContent = followUpResult.content;
        } catch (error) {
          console.error("Error executing create_person tool:", error);
          throw error;
        }
      }

      // Handle update_person tool
      if (toolCall.name === "update_person") {
        try {
          const input = toolCall.input as { person_id: string; [key: string]: unknown };
          const { person_id, ...updates } = input;

          const { data: person, error: updateError } = await db
            .from("people")
            .update(updates)
            .eq("id", person_id)
            .eq("org_id", conversation.org_id)
            .select()
            .single();

          if (updateError) {
            console.error("Failed to update person:", updateError);
            throw new Error("Failed to update person in database");
          }

          console.log("Person updated successfully:", person.id);

          // Get Claude's follow-up response
          const followUpResult = await complete({
            messages: [
              ...messages,
              {
                role: "assistant",
                content: [
                  {
                    type: "tool_use",
                    id: toolCall.id,
                    name: toolCall.name,
                    input: toolCall.input,
                  },
                ],
              },
              {
                role: "user",
                content: [
                  {
                    type: "tool_result",
                    tool_use_id: toolCall.id,
                    content: JSON.stringify({
                      success: true,
                      person_id: person.id,
                      message: `${person.name}'s profile updated successfully`,
                    }),
                  },
                ],
              },
            ],
            tools,
            system: systemPrompt,
            maxTokens: 1024,
          });

          finalContent = followUpResult.content;
        } catch (error) {
          console.error("Error executing update_person tool:", error);
          throw error;
        }
      }

      // Handle suggest_skills tool (informational only, no DB action)
      if (toolCall.name === "suggest_skills") {
        const input = toolCall.input as {
          role_description: string;
          suggested_skills: Array<{ name: string; category: string; typical_for_role: boolean }>;
        };
        console.log("Skills suggested:", input);

        // Format skills as readable content
        const typicalSkills = input.suggested_skills.filter((s) => s.typical_for_role);
        const bonusSkills = input.suggested_skills.filter((s) => !s.typical_for_role);

        let skillsContent = `**Suggested skills for "${input.role_description}":**\n\n`;

        if (typicalSkills.length > 0) {
          skillsContent += `**Core skills:**\n${typicalSkills.map((s) => `• ${s.name} (${s.category})`).join("\n")}\n\n`;
        }
        if (bonusSkills.length > 0) {
          skillsContent += `**Also common:**\n${bonusSkills.map((s) => `• ${s.name} (${s.category})`).join("\n")}\n\n`;
        }

        skillsContent += "Which of these apply? Or tell me about their specific expertise.";

        // Append to existing content or use as content
        if (finalContent && finalContent.trim() !== "") {
          finalContent = `${finalContent}\n\n${skillsContent}`;
        } else {
          finalContent = skillsContent;
        }
      }

      // Handle find_people_by_skills tool (query, no DB mutation)
      if (toolCall.name === "find_people_by_skills") {
        const input = toolCall.input as {
          required_skills: string[];
          preferred_skills?: string[];
          availability_filter?: string;
          max_hourly_rate?: number;
        };
        console.log("Finding people by skills:", input);

        // This is an informational tool - format the search criteria
        let searchContent = `**Searching for talent with:**\n`;
        searchContent += `• Required: ${input.required_skills.join(", ")}\n`;
        if (input.preferred_skills?.length) {
          searchContent += `• Nice to have: ${input.preferred_skills.join(", ")}\n`;
        }
        if (input.availability_filter) {
          searchContent += `• Availability: ${input.availability_filter}\n`;
        }
        if (input.max_hourly_rate) {
          searchContent += `• Max rate: $${input.max_hourly_rate}/hr\n`;
        }

        // Append to existing content or use as content
        if (finalContent && finalContent.trim() !== "") {
          finalContent = `${finalContent}\n\n${searchContent}`;
        } else {
          finalContent = searchContent;
        }
      }

      // Handle mark_complete tool
      if (toolCall.name === "mark_complete") {
        completed = true;
        const input = toolCall.input as { summary: string };
        console.log("Conversation marked as complete:", input);
        // Use the summary as the response content if no text was provided
        if (!finalContent || finalContent.trim() === "") {
          finalContent = input.summary;
        }
      }

      // Handle ask_clarifying_question tool
      if (toolCall.name === "ask_clarifying_question") {
        const input = toolCall.input as { question: string; reason?: string };
        console.log("Clarifying question asked:", input);
        // Use the question as the response content if no text was provided
        if (!finalContent || finalContent.trim() === "") {
          finalContent = input.question;
        }
      }
    }
  }

  return {
    content: finalContent,
    toolCalls: result.toolCalls,
    completed,
    createdEntities: createdEntities.length > 0 ? createdEntities : undefined,
  };
}
