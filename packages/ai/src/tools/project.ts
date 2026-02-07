import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

/**
 * Zod schema for project creation input
 */
export const ProjectInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  client_id: z.string().uuid().optional(),
  description: z.string().optional(),
  type: z
    .enum(["new_build", "redesign", "fix", "audit", "retainer", "strategy"])
    .optional()
    .describe("Type of project"),
  estimated_hours: z.number().positive().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type ProjectInput = z.infer<typeof ProjectInputSchema>;

/**
 * Zod schema for phase input
 */
export const PhaseInputSchema = z.object({
  name: z.string(),
  estimated_hours: z.number().positive(),
  sort_order: z.number().int().nonnegative(),
});

export type PhaseInput = z.infer<typeof PhaseInputSchema>;

/**
 * Tool definition for Claude to create a new project
 */
export const createProjectTool: Anthropic.Tool = {
  name: "create_project",
  description:
    "Create a new project record in the database. Use this when you have gathered enough information about the project scope from the conversation. Always confirm the details with the user before calling this tool.",
  input_schema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Project name (required)",
      },
      client_id: {
        type: "string",
        description: "UUID of the associated client (optional)",
      },
      description: {
        type: "string",
        description: "Brief description of the project scope and goals",
      },
      type: {
        type: "string",
        enum: ["new_build", "redesign", "fix", "audit", "retainer", "strategy"],
        description:
          "Type of project: new_build (greenfield), redesign (existing product refresh), fix (bug fixes/improvements), audit (review/assessment), retainer (ongoing support), strategy (planning/consulting)",
      },
      estimated_hours: {
        type: "number",
        description: "Total estimated hours for the project",
      },
      start_date: {
        type: "string",
        description: "Expected start date (ISO format: YYYY-MM-DD)",
      },
      end_date: {
        type: "string",
        description: "Expected end date (ISO format: YYYY-MM-DD)",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Tags for categorization (e.g., 'web', 'mobile', 'urgent')",
      },
      phases: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Phase name (e.g., Discovery, Design, Development)" },
            estimated_hours: { type: "number", description: "Hours for this phase" },
          },
          required: ["name", "estimated_hours"],
        },
        description: "Optional breakdown into phases",
      },
    },
    required: ["name"],
  },
};

/**
 * Tool for Claude to suggest a phase breakdown based on project type
 */
export const suggestPhasesTool: Anthropic.Tool = {
  name: "suggest_phases",
  description:
    "Suggest a typical phase breakdown for the project based on its type and complexity. Use this to present options to the user before finalizing the project structure.",
  input_schema: {
    type: "object",
    properties: {
      project_type: {
        type: "string",
        enum: ["new_build", "redesign", "fix", "audit", "retainer", "strategy"],
        description: "Type of project",
      },
      complexity: {
        type: "string",
        enum: ["simple", "moderate", "complex"],
        description: "Estimated complexity level",
      },
      phases: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            typical_hours_range: { type: "string" },
          },
          required: ["name", "description", "typical_hours_range"],
        },
        description: "Suggested phases with descriptions and hour ranges",
      },
    },
    required: ["project_type", "complexity", "phases"],
  },
};

/**
 * Tool to update an existing project (for iterating on scope)
 */
export const updateProjectTool: Anthropic.Tool = {
  name: "update_project",
  description:
    "Update an existing project's details. Use this when the user wants to modify scope, timeline, or other project attributes.",
  input_schema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "UUID of the project to update (required)",
      },
      name: { type: "string" },
      description: { type: "string" },
      type: {
        type: "string",
        enum: ["new_build", "redesign", "fix", "audit", "retainer", "strategy"],
      },
      status: {
        type: "string",
        enum: ["draft", "scoping", "proposed", "active", "paused", "complete", "cancelled"],
        description: "Project status",
      },
      estimated_hours: { type: "number" },
      start_date: { type: "string" },
      end_date: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
    },
    required: ["project_id"],
  },
};
