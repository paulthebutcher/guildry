import Anthropic from "@anthropic-ai/sdk";
import { complete } from "./client";
import { getToolsForSchema } from "./tools";
import { getPromptForSchema } from "./prompts";
import { ClientInputSchema } from "./tools/client";
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

      // Handle mark_complete tool
      if (toolCall.name === "mark_complete") {
        completed = true;
        console.log("Conversation marked as complete:", toolCall.input);
      }

      // Handle ask_clarifying_question tool
      if (toolCall.name === "ask_clarifying_question") {
        // The question is already in the content, no additional action needed
        console.log("Clarifying question asked:", toolCall.input);
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
