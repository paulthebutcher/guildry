import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

/**
 * Zod schema for retrospective creation input
 */
export const RetrospectiveInputSchema = z.object({
  project_id: z.string().uuid("Project ID is required"),
  hours_variance_pct: z.number().optional(),
  cost_variance_pct: z.number().optional(),
  scope_changes_count: z.number().int().nonnegative().default(0),
  client_satisfaction: z.number().min(1).max(5).optional(),
  what_worked: z.string().optional(),
  what_didnt: z.string().optional(),
  lessons: z.array(z.string()).optional(),
  would_repeat: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export type RetrospectiveInput = z.infer<typeof RetrospectiveInputSchema>;

/**
 * Tool definition for Claude to create a retrospective
 */
export const createRetrospectiveTool: Anthropic.Tool = {
  name: "create_retrospective",
  description:
    "Create a retrospective for a completed project. Use this to capture lessons learned, what went well, what didn't, and overall project outcomes. Always confirm the details with the user before calling this tool.",
  input_schema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "UUID of the project this retrospective is for (required)",
      },
      hours_variance_pct: {
        type: "number",
        description:
          "Percentage variance from estimated hours. Positive = over estimate, negative = under. Example: 15 means 15% over estimated hours.",
      },
      cost_variance_pct: {
        type: "number",
        description:
          "Percentage variance from estimated cost. Positive = over budget, negative = under budget.",
      },
      scope_changes_count: {
        type: "number",
        description: "Number of significant scope changes during the project",
      },
      client_satisfaction: {
        type: "number",
        description: "Client satisfaction rating from 1-5 (5 = very satisfied)",
      },
      what_worked: {
        type: "string",
        description: "Summary of what went well on the project",
      },
      what_didnt: {
        type: "string",
        description: "Summary of what didn't go well or could be improved",
      },
      lessons: {
        type: "array",
        items: { type: "string" },
        description: "List of specific lessons learned to apply to future projects",
      },
      would_repeat: {
        type: "boolean",
        description: "Would you take on a similar project again with this client/scope?",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Tags for categorizing this retro (e.g., 'timeline-issues', 'scope-creep', 'great-client')",
      },
    },
    required: ["project_id"],
  },
};

/**
 * Tool to update an existing retrospective
 */
export const updateRetrospectiveTool: Anthropic.Tool = {
  name: "update_retrospective",
  description:
    "Update an existing retrospective with additional insights or corrections.",
  input_schema: {
    type: "object",
    properties: {
      retrospective_id: {
        type: "string",
        description: "UUID of the retrospective to update (required)",
      },
      hours_variance_pct: { type: "number" },
      cost_variance_pct: { type: "number" },
      scope_changes_count: { type: "number" },
      client_satisfaction: { type: "number" },
      what_worked: { type: "string" },
      what_didnt: { type: "string" },
      lessons: { type: "array", items: { type: "string" } },
      would_repeat: { type: "boolean" },
      tags: { type: "array", items: { type: "string" } },
    },
    required: ["retrospective_id"],
  },
};

/**
 * Tool to summarize learnings from past retrospectives
 */
export const summarizeLearningsTool: Anthropic.Tool = {
  name: "summarize_learnings",
  description:
    "Summarize key learnings and patterns from past retrospectives. Use this to help inform future project estimates and approaches.",
  input_schema: {
    type: "object",
    properties: {
      project_type: {
        type: "string",
        enum: ["new_build", "redesign", "fix", "audit", "retainer", "strategy"],
        description: "Filter learnings by project type (optional)",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Filter by specific tags (optional)",
      },
      summary: {
        type: "object",
        properties: {
          avg_hours_variance: { type: "number", description: "Average hours variance across projects" },
          common_issues: { type: "array", items: { type: "string" }, description: "Most common issues encountered" },
          top_lessons: { type: "array", items: { type: "string" }, description: "Most valuable lessons learned" },
          success_patterns: { type: "array", items: { type: "string" }, description: "Patterns that led to successful outcomes" },
        },
        description: "Summary of learnings",
      },
    },
    required: ["summary"],
  },
};
