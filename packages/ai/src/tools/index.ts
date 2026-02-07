import Anthropic from "@anthropic-ai/sdk";
import { createClientTool } from "./client";
import { createProjectTool, suggestPhasesTool, updateProjectTool } from "./project";
import {
  createPersonTool,
  updatePersonTool,
  suggestSkillsTool,
  findPeopleBySkillsTool,
} from "./person";
import {
  createRetrospectiveTool,
  updateRetrospectiveTool,
  summarizeLearningsTool,
} from "./retrospective";
import { askClarifyingQuestionTool, markCompleteTool } from "./common";

/**
 * Get the appropriate tools for a given schema type
 *
 * @param schema - The schema type (e.g., 'client', 'project', 'person', 'retrospective')
 * @returns Array of Anthropic tools
 */
export function getToolsForSchema(schema: string): Anthropic.Tool[] {
  const commonTools = [askClarifyingQuestionTool, markCompleteTool];

  switch (schema.toLowerCase()) {
    case "client":
      return [createClientTool, ...commonTools];
    case "project":
      return [createProjectTool, suggestPhasesTool, updateProjectTool, ...commonTools];
    case "person":
      return [createPersonTool, updatePersonTool, suggestSkillsTool, findPeopleBySkillsTool, ...commonTools];
    case "retrospective":
      return [createRetrospectiveTool, updateRetrospectiveTool, summarizeLearningsTool, ...commonTools];
    default:
      return commonTools;
  }
}

// Re-export tools for direct access
export { createClientTool } from "./client";
export { createProjectTool, suggestPhasesTool, updateProjectTool } from "./project";
export {
  createPersonTool,
  updatePersonTool,
  suggestSkillsTool,
  findPeopleBySkillsTool,
} from "./person";
export {
  createRetrospectiveTool,
  updateRetrospectiveTool,
  summarizeLearningsTool,
} from "./retrospective";
export { askClarifyingQuestionTool, markCompleteTool } from "./common";
