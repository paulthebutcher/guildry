import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

/**
 * Zod schema for client creation input
 * Matches the database Client schema
 */
export const ClientInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  industry: z.string().optional(),
  size_tier: z
    .enum(["startup", "smb", "mid", "enterprise"])
    .optional()
    .describe("Company size tier"),
  website_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
});

export type ClientInput = z.infer<typeof ClientInputSchema>;

/**
 * Tool definition for Claude to create a new client
 */
export const createClientTool: Anthropic.Tool = {
  name: "create_client",
  description:
    "Create a new client record in the database. Use this when you have gathered enough information about a client from the conversation. Always confirm the details with the user before calling this tool.",
  input_schema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Client's company or full name (required)",
      },
      industry: {
        type: "string",
        description:
          "Industry or sector the client operates in (e.g., Technology, Healthcare, Finance)",
      },
      size_tier: {
        type: "string",
        enum: ["startup", "smb", "mid", "enterprise"],
        description:
          "Company size: startup (1-10 employees), smb (11-100), mid (101-1000), enterprise (1000+)",
      },
      website_url: {
        type: "string",
        description: "Client's website URL (must be valid URL format)",
      },
      notes: {
        type: "string",
        description: "Additional notes or context about the client",
      },
    },
    required: ["name"],
  },
};
