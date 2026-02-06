import Anthropic from "@anthropic-ai/sdk";
import { CompletionOptions, CompletionResult, ToolCall } from "./types";

/**
 * Initialize and return an Anthropic client
 * @throws {Error} if ANTHROPIC_API_KEY is not set
 */
function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing ANTHROPIC_API_KEY environment variable. Please add it to your .env.local file."
    );
  }

  return new Anthropic({
    apiKey,
  });
}

/**
 * Send a completion request to Claude
 * 
 * @param options - Configuration for the completion request
 * @returns Promise<CompletionResult> - The completion result with content and metadata
 * 
 * @example
 * ```typescript
 * const result = await complete({
 *   messages: [{ role: "user", content: "Hello!" }],
 *   system: "You are a helpful assistant",
 * });
 * console.log(result.content);
 * ```
 */
export async function complete(
  options: CompletionOptions
): Promise<CompletionResult> {
  const client = getAnthropicClient();

  const {
    messages,
    tools,
    system,
    model = "claude-3-5-sonnet-20241022",
    maxTokens = 4096,
    temperature = 1.0,
  } = options;

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages,
    ...(system && { system }),
    ...(tools && { tools }),
  });

  // Extract text content
  const textContent = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  // Extract tool calls if any
  const toolCalls: ToolCall[] | undefined = response.content
    .filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    )
    .map((block) => ({
      id: block.id,
      name: block.name,
      input: block.input as Record<string, unknown>,
    }));

  return {
    content: textContent,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    stopReason: response.stop_reason,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}
