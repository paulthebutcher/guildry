import { getBaseSystemPrompt } from "./system";
import { getClientPrompt } from "./client";
import { getProjectPrompt } from "./project";

/**
 * Get the combined system prompt for a given schema type
 *
 * @param schema - The schema type (e.g., 'client', 'project')
 * @returns Combined system prompt
 */
export function getPromptForSchema(schema: string): string {
  const basePrompt = getBaseSystemPrompt();

  switch (schema.toLowerCase()) {
    case "client":
      return `${basePrompt}\n\n${getClientPrompt()}`;
    case "project":
      return `${basePrompt}\n\n${getProjectPrompt()}`;
    default:
      return basePrompt;
  }
}

// Re-export individual prompts for direct access
export { getBaseSystemPrompt } from "./system";
export { getClientPrompt } from "./client";
export { getProjectPrompt } from "./project";
