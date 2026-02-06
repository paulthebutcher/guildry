import Anthropic from "@anthropic-ai/sdk";
import { createClientTool } from "./client";
import { askClarifyingQuestionTool, markCompleteTool } from "./common";

/**
 * Get the appropriate tools for a given schema type
 * 
 * @param schema - The schema type (e.g., 'client')
 * @returns Array of Anthropic tools
 */
export function getToolsForSchema(schema: string): Anthropic.Tool[] {
  const commonTools = [askClarifyingQuestionTool, markCompleteTool];

  switch (schema.toLowerCase()) {
    case "client":
      return [createClientTool, ...commonTools];
    default:
      return commonTools;
  }
}

// Re-export tools for direct access
export { createClientTool } from "./client";
export { askClarifyingQuestionTool, markCompleteTool } from "./common";
