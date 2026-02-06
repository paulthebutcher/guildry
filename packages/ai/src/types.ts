import Anthropic from "@anthropic-ai/sdk";

// Tool call structure
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

// Options for completion requests
export interface CompletionOptions {
  messages: Anthropic.MessageParam[];
  tools?: Anthropic.Tool[];
  system?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// Result from completion
export interface CompletionResult {
  content: string;
  toolCalls?: ToolCall[];
  stopReason: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}
