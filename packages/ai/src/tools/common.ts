import Anthropic from "@anthropic-ai/sdk";

/**
 * Tool for Claude to ask clarifying questions
 * Use when more information is needed before proceeding
 */
export const askClarifyingQuestionTool: Anthropic.Tool = {
  name: "ask_clarifying_question",
  description:
    "Ask the user a follow-up question to gather more information. Use this when you need additional details before creating a record or when the user's intent is unclear.",
  input_schema: {
    type: "object",
    properties: {
      question: {
        type: "string",
        description: "The question to ask the user",
      },
      reason: {
        type: "string",
        description: "Brief explanation of why this information is needed",
      },
    },
    required: ["question"],
  },
};

/**
 * Tool for Claude to mark the conversation as complete
 * Use when the task is finished and no further action is needed
 */
export const markCompleteTool: Anthropic.Tool = {
  name: "mark_complete",
  description:
    "Mark the conversation as complete. Use this when you have successfully created the requested record(s) or when the user indicates they are done.",
  input_schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description: "Brief summary of what was accomplished",
      },
    },
    required: ["summary"],
  },
};
