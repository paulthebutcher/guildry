# @guildry/ai

Claude API client for Guildry using the Anthropic SDK.

## Installation

This package is already included in the monorepo workspace. To use it in another package:

```json
{
  "dependencies": {
    "@guildry/ai": "workspace:*"
  }
}
```

## Setup

Add your Anthropic API key to `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Get your API key from [Anthropic Console](https://console.anthropic.com/settings/keys).

## Usage

### Basic Completion

```typescript
import { complete } from "@guildry/ai";

const result = await complete({
  messages: [
    {
      role: "user",
      content: "What is the capital of France?",
    },
  ],
  system: "You are a helpful geography tutor.",
});

console.log(result.content); // "The capital of France is Paris."
console.log(result.usage); // { inputTokens: 20, outputTokens: 10 }
```

### With Tools (Function Calling)

```typescript
import { complete } from "@guildry/ai";

const result = await complete({
  messages: [
    {
      role: "user",
      content: "What's the weather in San Francisco?",
    },
  ],
  tools: [
    {
      name: "get_weather",
      description: "Get the current weather in a location",
      input_schema: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "City name",
          },
        },
        required: ["location"],
      },
    },
  ],
});

if (result.toolCalls) {
  for (const tool of result.toolCalls) {
    console.log(`Call ${tool.name} with:`, tool.input);
    // { location: "San Francisco" }
  }
}
```

### Full Options

```typescript
const result = await complete({
  messages: [
    { role: "user", content: "Hello!" },
    { role: "assistant", content: "Hi! How can I help?" },
    { role: "user", content: "Tell me a joke" },
  ],
  system: "You are a funny comedian",
  tools: [], // Optional array of tools
  model: "claude-3-5-sonnet-20250219", // Default
  maxTokens: 4096, // Default
  temperature: 1.0, // Default (0-1)
});
```

## API Reference

### `complete(options: CompletionOptions): Promise<CompletionResult>`

Send a completion request to Claude.

**Parameters:**

- `messages` - Array of message objects with `role` and `content`
- `system` (optional) - System prompt to set Claude's behavior
- `tools` (optional) - Array of tool definitions for function calling
- `model` (optional) - Model to use (default: `claude-3-5-sonnet-20250219`)
- `maxTokens` (optional) - Maximum tokens to generate (default: 4096)
- `temperature` (optional) - Randomness 0-1 (default: 1.0)

**Returns:** `CompletionResult`

```typescript
{
  content: string;              // Text response from Claude
  toolCalls?: ToolCall[];       // Tool calls if any
  stopReason: string | null;    // Why generation stopped
  usage: {
    inputTokens: number;        // Tokens in the input
    outputTokens: number;       // Tokens in the output
  };
}
```

## Types

### `CompletionOptions`

```typescript
interface CompletionOptions {
  messages: Anthropic.MessageParam[];
  tools?: Anthropic.Tool[];
  system?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}
```

### `CompletionResult`

```typescript
interface CompletionResult {
  content: string;
  toolCalls?: ToolCall[];
  stopReason: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}
```

### `ToolCall`

```typescript
interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}
```

## Error Handling

The client will throw an error if `ANTHROPIC_API_KEY` is not set:

```typescript
try {
  const result = await complete({
    messages: [{ role: "user", content: "Hello" }],
  });
} catch (error) {
  if (error.message.includes("ANTHROPIC_API_KEY")) {
    console.error("API key not configured");
  }
}
```

## Testing

A test endpoint is available at `/api/test-ai` (GET):

```bash
curl http://localhost:3000/api/test-ai
```

Response:

```json
{
  "data": {
    "response": "Hello! I'm Claude, an AI assistant...",
    "usage": {
      "inputTokens": 15,
      "outputTokens": 25
    },
    "stopReason": "end_turn"
  }
}
```

## Models

Current default: `claude-3-5-sonnet-20250219`

Other available models:
- `claude-3-7-sonnet-20250219` (most capable)
- `claude-3-5-haiku-20241022` (fastest, lowest cost)
- `claude-3-opus-20240229` (legacy, most capable)

See [Anthropic docs](https://docs.anthropic.com/en/docs/about-claude/models) for the latest models.

## Best Practices

1. **System Prompts**: Use clear, specific system prompts to set Claude's role and behavior
2. **Token Limits**: Monitor usage and adjust `maxTokens` based on your needs
3. **Temperature**: Use lower values (0.2-0.5) for factual tasks, higher (0.8-1.0) for creative tasks
4. **Error Handling**: Always wrap calls in try-catch for production use
5. **Rate Limits**: Be mindful of Anthropic's rate limits in production

## Security Notes

- API key is server-side only (never exposed to client)
- Only use this package in API routes or server components
- Never log API keys or sensitive content
