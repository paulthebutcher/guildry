# Conversation API Routes

API endpoints for managing conversations and interacting with the AI conversation engine.

## Endpoints

### List Conversations

**GET** `/api/conversations`

Get all conversations for the authenticated user's organization, ordered by most recent first.

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "client_id": "uuid | null",
      "title": "Create client",
      "status": "active",
      "metadata": {
        "schema": "client",
        "intent": "Create a new client"
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Errors:**
- `401 UNAUTHORIZED`: Not authenticated
- `500 INTERNAL_ERROR`: Server error

---

### Create Conversation

**POST** `/api/conversations`

Create a new conversation to start interacting with the AI.

**Request Body:**
```json
{
  "target_schema": "client",     // Required: 'client' or other schema type
  "intent": "Create a new client" // Optional: Description of what user wants
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "organization_id": "uuid",
    "client_id": null,
    "title": "Create a new client",
    "status": "active",
    "metadata": {
      "schema": "client",
      "intent": "Create a new client"
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR`: Missing or invalid target_schema
- `401 UNAUTHORIZED`: Not authenticated
- `500 INTERNAL_ERROR`: Server error

---

### Get Conversation

**GET** `/api/conversations/:id`

Get a single conversation with all its messages.

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "organization_id": "uuid",
    "client_id": null,
    "title": "Create client",
    "status": "active",
    "metadata": {
      "schema": "client"
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "messages": [
      {
        "id": "uuid",
        "conversation_id": "uuid",
        "role": "user",
        "content": "I want to add a new client",
        "metadata": null,
        "created_at": "2024-01-01T00:00:00Z"
      },
      {
        "id": "uuid",
        "conversation_id": "uuid",
        "role": "assistant",
        "content": "I'd be happy to help. What's the client's name?",
        "metadata": null,
        "created_at": "2024-01-01T00:00:01Z"
      }
    ]
  }
}
```

**Errors:**
- `404 NOT_FOUND`: Conversation not found or doesn't belong to user's org
- `401 UNAUTHORIZED`: Not authenticated
- `500 INTERNAL_ERROR`: Server error

---

### Get Messages

**GET** `/api/conversations/:id/messages`

Get all messages for a conversation, ordered by created_at.

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "user",
      "content": "Add Acme Corp",
      "metadata": null,
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "assistant",
      "content": "Great! What industry is Acme Corp in?",
      "metadata": null,
      "created_at": "2024-01-01T00:00:01Z"
    }
  ]
}
```

**Errors:**
- `404 NOT_FOUND`: Conversation not found
- `401 UNAUTHORIZED`: Not authenticated
- `500 INTERNAL_ERROR`: Server error

---

### Send Message

**POST** `/api/conversations/:id/messages`

Send a message to the conversation and get an AI response.

This endpoint:
1. Saves the user's message to the database
2. Processes the conversation with the AI engine
3. Saves the AI's response to the database
4. Updates conversation status if completed
5. Returns both messages with metadata

**Request Body:**
```json
{
  "content": "Acme Corp, they're in technology"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "userMessage": {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "user",
      "content": "Acme Corp, they're in technology",
      "metadata": null,
      "created_at": "2024-01-01T00:00:00Z"
    },
    "assistantMessage": {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "assistant",
      "content": "Perfect! I have Acme Corp in Technology. Should I create this client?",
      "metadata": {
        "toolCalls": null,
        "createdEntities": null
      },
      "created_at": "2024-01-01T00:00:01Z"
    },
    "completed": false,
    "createdEntities": undefined
  }
}
```

**When AI creates a record:**
```json
{
  "data": {
    "userMessage": { /* ... */ },
    "assistantMessage": {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "assistant",
      "content": "Great! I've created the client record for Acme Corp.",
      "metadata": {
        "toolCalls": [
          {
            "id": "tool_123",
            "name": "create_client",
            "input": {
              "name": "Acme Corp",
              "industry": "Technology"
            }
          }
        ],
        "createdEntities": [
          {
            "type": "client",
            "id": "client_uuid",
            "name": "Acme Corp"
          }
        ]
      },
      "created_at": "2024-01-01T00:00:01Z"
    },
    "completed": true,
    "createdEntities": [
      {
        "type": "client",
        "id": "client_uuid",
        "name": "Acme Corp"
      }
    ]
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR`: Missing or invalid content
- `404 NOT_FOUND`: Conversation not found
- `401 UNAUTHORIZED`: Not authenticated
- `500 INTERNAL_ERROR`: Server error or AI processing failed

---

## Usage Examples

### 1. Start a Conversation

```typescript
// Create a new conversation
const response = await fetch("/api/conversations", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    target_schema: "client",
    intent: "Add a new client",
  }),
});

const { data: conversation } = await response.json();
console.log(conversation.id); // Use this ID for subsequent messages
```

### 2. Send Messages

```typescript
// Send a message and get AI response
const response = await fetch(
  `/api/conversations/${conversationId}/messages`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: "I want to add Acme Corp",
    }),
  }
);

const { data } = await response.json();
console.log(data.assistantMessage.content);
// "I'd be happy to help. What industry is Acme Corp in?"

console.log(data.completed);
// false (still in progress)
```

### 3. Complete the Flow

```typescript
// Continue conversation
await sendMessage(conversationId, "They're in technology");
// AI: "Great! Should I create this client record?"

const finalResponse = await sendMessage(conversationId, "Yes, please");
const { data } = await finalResponse.json();

console.log(data.completed);
// true

console.log(data.createdEntities);
// [{ type: 'client', id: '...', name: 'Acme Corp' }]
```

### 4. List All Conversations

```typescript
const response = await fetch("/api/conversations");
const { data: conversations } = await response.json();

conversations.forEach((conv) => {
  console.log(`${conv.title} - ${conv.status}`);
});
```

### 5. Get Conversation History

```typescript
const response = await fetch(`/api/conversations/${conversationId}`);
const { data } = await response.json();

console.log(data.messages);
// Full conversation history with user and assistant messages
```

## Message Roles

- `user`: Messages from the user
- `assistant`: Messages from the AI

## Conversation Status

- `active`: Conversation is ongoing
- `archived`: Conversation has been archived
- `closed`: Conversation has been completed (AI called mark_complete)

## Multi-Tenancy

All endpoints automatically scope data to the authenticated user's organization. You cannot access or modify conversations from other organizations.

## AI Integration

The `/messages` POST endpoint integrates with the conversation engine (`processConversation` from `@guildry/ai`), which:
- Maintains conversation context across messages
- Uses appropriate tools based on the target_schema
- Validates data with Zod schemas
- Creates database records when confirmed
- Marks conversations as complete when done

## Frontend Integration Example

```typescript
// Simple chat interface
const [messages, setMessages] = useState([]);
const [conversationId, setConversationId] = useState(null);

async function startConversation() {
  const res = await fetch("/api/conversations", {
    method: "POST",
    body: JSON.stringify({ target_schema: "client" }),
  });
  const { data } = await res.json();
  setConversationId(data.id);
}

async function sendMessage(content) {
  const res = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  const { data } = await res.json();

  setMessages([
    ...messages,
    data.userMessage,
    data.assistantMessage,
  ]);

  if (data.completed) {
    console.log("Created:", data.createdEntities);
  }
}
```
