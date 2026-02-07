import { getBaseSystemPrompt } from "./system";
import { getClientPrompt } from "./client";
import { getProjectPrompt } from "./project";
import { getPersonPrompt } from "./person";
import { getRetrospectivePrompt } from "./retrospective";

/**
 * Get the combined system prompt for a given schema type
 *
 * @param schema - The schema type (e.g., 'client', 'project', 'person', 'retrospective')
 * @returns Combined system prompt
 */
export function getPromptForSchema(schema: string): string {
  const basePrompt = getBaseSystemPrompt();

  switch (schema.toLowerCase()) {
    case "client":
      return `${basePrompt}\n\n${getClientPrompt()}`;
    case "project":
      return `${basePrompt}\n\n${getProjectPrompt()}`;
    case "person":
      return `${basePrompt}\n\n${getPersonPrompt()}`;
    case "retrospective":
      return `${basePrompt}\n\n${getRetrospectivePrompt()}`;
    default:
      return basePrompt;
  }
}

// Re-export individual prompts for direct access
export { getBaseSystemPrompt } from "./system";
export { getClientPrompt } from "./client";
export { getProjectPrompt } from "./project";
export { getPersonPrompt } from "./person";
export { getRetrospectivePrompt } from "./retrospective";
