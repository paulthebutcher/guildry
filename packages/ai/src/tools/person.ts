import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

/**
 * Zod schema for person creation input
 */
export const PersonInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z
    .enum(["employee", "contractor", "referral"])
    .describe("Type of person in your network"),
  email: z.string().email().optional(),
  location: z.string().optional(),
  hourly_rate: z.number().positive().optional(),
  currency: z.string().default("USD"),
  availability_status: z
    .enum(["available", "partial", "booked", "unavailable"])
    .default("available"),
  notes: z.string().optional(),
});

export type PersonInput = z.infer<typeof PersonInputSchema>;

/**
 * Zod schema for person skills
 */
export const PersonSkillInputSchema = z.object({
  skill_id: z.string().uuid(),
  proficiency_level: z.number().int().min(1).max(5),
  years_experience: z.number().optional(),
});

export type PersonSkillInput = z.infer<typeof PersonSkillInputSchema>;

/**
 * Tool definition for Claude to create a new person
 */
export const createPersonTool: Anthropic.Tool = {
  name: "create_person",
  description:
    "Create a new person in the talent network. Use this when you have gathered enough information about the person from the conversation. Always confirm the details with the user before calling this tool.",
  input_schema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Person's full name (required)",
      },
      type: {
        type: "string",
        enum: ["employee", "contractor", "referral"],
        description:
          "Relationship type: employee (full-time staff), contractor (freelancer/agency), referral (recommended talent you haven't worked with yet)",
      },
      email: {
        type: "string",
        description: "Email address for contact",
      },
      location: {
        type: "string",
        description: "City, country, or timezone (e.g., 'San Francisco, USA' or 'GMT+2')",
      },
      hourly_rate: {
        type: "number",
        description: "Hourly rate in the specified currency",
      },
      currency: {
        type: "string",
        description: "Currency code for the rate (default: USD)",
        default: "USD",
      },
      availability_status: {
        type: "string",
        enum: ["available", "partial", "booked", "unavailable"],
        description:
          "Current availability: available (ready for new work), partial (some capacity), booked (no availability), unavailable (not taking work)",
      },
      notes: {
        type: "string",
        description: "Any additional notes about this person",
      },
      skills: {
        type: "array",
        items: {
          type: "object",
          properties: {
            skill_name: {
              type: "string",
              description: "Name of the skill (e.g., 'React', 'UX Design')",
            },
            proficiency_level: {
              type: "number",
              description: "Proficiency from 1-5 (1=beginner, 5=expert)",
            },
            years_experience: {
              type: "number",
              description: "Years of experience with this skill",
            },
          },
          required: ["skill_name", "proficiency_level"],
        },
        description: "List of skills this person has",
      },
    },
    required: ["name", "type"],
  },
};

/**
 * Tool to update an existing person
 */
export const updatePersonTool: Anthropic.Tool = {
  name: "update_person",
  description:
    "Update an existing person's details. Use this when the user wants to modify availability, rate, skills, or other attributes.",
  input_schema: {
    type: "object",
    properties: {
      person_id: {
        type: "string",
        description: "UUID of the person to update (required)",
      },
      name: { type: "string" },
      type: {
        type: "string",
        enum: ["employee", "contractor", "referral"],
      },
      email: { type: "string" },
      location: { type: "string" },
      hourly_rate: { type: "number" },
      currency: { type: "string" },
      availability_status: {
        type: "string",
        enum: ["available", "partial", "booked", "unavailable"],
      },
      rating: {
        type: "number",
        description: "Performance rating from 1-5",
      },
      notes: { type: "string" },
    },
    required: ["person_id"],
  },
};

/**
 * Tool to suggest skills based on role/description
 */
export const suggestSkillsTool: Anthropic.Tool = {
  name: "suggest_skills",
  description:
    "Suggest relevant skills based on a person's role or description. Use this to help the user identify what skills to track for a person.",
  input_schema: {
    type: "object",
    properties: {
      role_description: {
        type: "string",
        description: "Description of the person's role (e.g., 'senior frontend developer', 'UX designer')",
      },
      suggested_skills: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Skill name" },
            category: {
              type: "string",
              enum: ["design", "engineering", "strategy", "ops", "marketing", "data"],
              description: "Skill category",
            },
            typical_for_role: {
              type: "boolean",
              description: "Whether this skill is typical/expected for the role",
            },
          },
          required: ["name", "category", "typical_for_role"],
        },
        description: "List of suggested skills for this role",
      },
    },
    required: ["role_description", "suggested_skills"],
  },
};

/**
 * Tool to search for people by skills
 */
export const findPeopleBySkillsTool: Anthropic.Tool = {
  name: "find_people_by_skills",
  description:
    "Search for people in the talent network who have specific skills. Use this when staffing a project or looking for specific expertise.",
  input_schema: {
    type: "object",
    properties: {
      required_skills: {
        type: "array",
        items: { type: "string" },
        description: "List of skill names that are required",
      },
      preferred_skills: {
        type: "array",
        items: { type: "string" },
        description: "List of skill names that are nice-to-have",
      },
      availability_filter: {
        type: "string",
        enum: ["available", "partial", "any"],
        description: "Filter by availability status",
      },
      max_hourly_rate: {
        type: "number",
        description: "Maximum hourly rate budget",
      },
    },
    required: ["required_skills"],
  },
};
