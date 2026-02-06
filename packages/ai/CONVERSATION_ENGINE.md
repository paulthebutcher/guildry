# Conversation Engine

An AI-powered conversation engine that uses Claude to extract structured data from natural language conversations.

## Overview

The conversation engine enables users to create database records through natural conversation. Claude uses function calling (tools) to gather information, validate it, and execute database operations.

## Architecture

```
User Message
    ↓
processConversation()
    ↓
Build message history from DB
    ↓
Call Claude with tools + system prompt
    ↓
Claude responds (text or tool calls)
    ↓
Execute tools (e.g., create_client)
    ↓
Get follow-up response from Claude
    ↓
Return result to user
```

## Core Components

### 1. Tools (`src/tools/`)

**Client Tools** (`tools/client.ts`):
- `createClientTool`: Create a new client in the database
- `ClientInputSchema`: Zod schema for validation

**Common Tools** (`tools/common.ts`):
- `askClarifyingQuestionTool`: Ask follow-up questions
- `markCompleteTool`: Mark conversation as complete

**Tool Selection** (`tools/index.ts`):
- `getToolsForSchema(schema)`: Returns appropriate tools based on conversation type

### 2. Prompts (`src/prompts/`)

**System Prompt** (`prompts/system.ts`):
- Base personality and interaction guidelines
- General conversation rules

**Client Prompt** (`prompts/client.ts`):
- Specific instructions for client creation
- Example conversation flow
- Field requirements and descriptions

**Prompt Selection** (`prompts/index.ts`):
- `getPromptForSchema(schema)`: Returns combined prompt for conversation type

### 3. Conversation Processor (`src/conversation.ts`)

**Main Function**: `processConversation(conversation, userMessage)`

**Flow**:
1. Fetch conversation history from database
2. Build messages array for Claude
3. Get appropriate tools and system prompt based on schema
4. Call Claude API
5. Execute any tool calls (e.g., database operations)
6. Get Claude's follow-up response after tool execution
7. Return result with metadata

## Usage

### Basic Example

```typescript
import { processConversation } from "@guildry/ai";

const conversation = {
  id: "conv_123",
  organization_id: "org_456",
  client_id: null,
  metadata: { schema: "client" },
};

const result = await processConversation(
  conversation,
  "I want to add a new client called Acme Corp"
);

console.log(result.content);
// "Great! I've got Acme Corp as the client name..."

console.log(result.completed);
// false (still gathering information)

console.log(result.createdEntities);
// undefined (nothing created yet)
```

### Complete Flow Example

```typescript
// User: "Add a new client"
const result1 = await processConversation(conversation, "Add a new client");
// AI: "I'd be happy to help. What's the client's name?"

// User: "Acme Corp, they're in technology"
const result2 = await processConversation(
  conversation,
  "Acme Corp, they're in technology"
);
// AI: "Perfect. I have Acme Corp in Technology. Should I create this record?"

// User: "Yes"
const result3 = await processConversation(conversation, "Yes");
// AI: "Great! I've created the client record for Acme Corp."
// result3.completed === true
// result3.createdEntities === [{ type: 'client', id: '...', name: 'Acme Corp' }]
```

## Response Structure

```typescript
interface ProcessConversationResult {
  content: string; // Claude's response text
  toolCalls?: Array<{
    // Tools Claude used
    id: string;
    name: string;
    input: Record<string, unknown>;
  }>;
  completed: boolean; // Is conversation done?
  createdEntities?: Array<{
    // What was created
    type: string;
    id: string;
    name: string;
  }>;
}
```

## Supported Schemas

### Client Schema

**Purpose**: Create new client records

**Required Fields**:
- `name`: Client company/person name

**Optional Fields**:
- `industry`: Business sector
- `size_tier`: Company size (startup, smb, mid, enterprise)
- `website_url`: Company website
- `notes`: Additional context

**Conversation Flow**:
1. Ask for client name
2. Gather optional details if user provides them
3. Confirm before creating
4. Create client in database
5. Mark conversation complete

## Adding New Schemas

To support a new entity type (e.g., "project"):

1. **Create Tool** (`tools/project.ts`):

```typescript
export const createProjectTool: Anthropic.Tool = {
  name: "create_project",
  description: "Create a new project...",
  input_schema: {
    // Define schema
  },
};
```

2. **Create Prompt** (`prompts/project.ts`):

```typescript
export function getProjectPrompt(): string {
  return `Instructions for project creation...`;
}
```

3. **Update Tool Selector** (`tools/index.ts`):

```typescript
case "project":
  return [createProjectTool, ...commonTools];
```

4. **Update Prompt Selector** (`prompts/index.ts`):

```typescript
case "project":
  return `${basePrompt}\n\n${getProjectPrompt()}`;
```

5. **Add Tool Execution** (`conversation.ts`):

```typescript
if (toolCall.name === "create_project") {
  // Execute project creation
}
```

## Tool Execution

When Claude calls a tool:

1. **Validation**: Input is validated with Zod schema
2. **Database Operation**: Record is inserted using service client
3. **Tracking**: Created entity is tracked in `createdEntities`
4. **Follow-up**: Claude gets tool result and generates friendly response

### Example Tool Execution

```typescript
// Claude calls create_client tool
{
  name: "create_client",
  input: {
    name: "Acme Corp",
    industry: "Technology",
    size_tier: "smb"
  }
}

// Engine validates input
const validated = ClientInputSchema.parse(input);

// Engine inserts to database
const client = await db.from("clients").insert({
  organization_id: conversation.organization_id,
  name: validated.name,
  industry: validated.industry,
  // ...
});

// Engine sends result back to Claude
{
  success: true,
  client_id: "client_789",
  message: "Client 'Acme Corp' created successfully"
}

// Claude responds to user
"Great! I've created the client record for Acme Corp..."
```

## Error Handling

The engine handles errors at multiple levels:

```typescript
try {
  const result = await processConversation(conversation, userMessage);
} catch (error) {
  if (error.message.includes("Failed to load conversation history")) {
    // Database error fetching messages
  }
  if (error.message.includes("Failed to create client")) {
    // Database error creating record
  }
  // Handle error appropriately
}
```

## Best Practices

1. **Schema Selection**: Set `conversation.metadata.schema` to determine which tools to use
2. **Message Storage**: Store both user and assistant messages in DB for context
3. **Org Scoping**: Always use `conversation.organization_id` for multi-tenancy
4. **Confirmation**: Claude is instructed to confirm before creating records
5. **One Question at a Time**: Claude asks for information incrementally
6. **Natural Language**: Users can provide information in any format

## Database Requirements

The conversation engine expects these tables:

**messages**:

```sql
- id: uuid
- conversation_id: uuid
- role: text ('user' or 'assistant')
- content: text
- metadata: jsonb
- created_at: timestamp
```

**conversations**:

```sql
- id: uuid
- organization_id: uuid
- client_id: uuid (nullable)
- metadata: jsonb (with optional 'schema' field)
```

**clients** (for client schema):

```sql
- id: uuid
- organization_id: uuid
- name: text
- industry: text
- size_tier: text
- website_url: text
- notes: text
- created_at: timestamp
- updated_at: timestamp
```

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...  # Required for Claude API
```

## Security Notes

- Uses `createServiceClient()` to bypass RLS for reads/writes
- All operations are scoped to `organization_id`
- Tool execution validates input with Zod schemas
- Never exposes API keys to client
- Only use in server-side code (API routes, server actions)
