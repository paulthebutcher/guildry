# Architecture

## Design Principles

### 1. Organization as Tenant Boundary
Everything belongs to an organization. The `org_id` column is the partition key for row-level security. Users can belong to multiple organizations (via Clerk), but data never crosses org boundaries.

```
Organization
├── Users (members of this org)
├── Clients (who this org works for)
├── Projects (work this org does)
├── Conversations (AI interactions)
└── [All other entities]
```

### 2. Clerk for Identity, Supabase for Data
Clerk handles authentication, user management, and organization membership. Supabase stores all application data. They sync via webhooks.

```
User signs up in Clerk
    ↓
Clerk webhook fires
    ↓
/api/webhooks/clerk creates User row in Supabase
    ↓
User accesses app, Clerk provides JWT
    ↓
JWT passed to Supabase for RLS
```

### 3. Conversation as Universal Intake
Every product uses the same conversation engine with different "targets." The AI fills different schemas depending on the conversation's intent.

```typescript
// Same engine, different targets
startConversation({ target: "client", org_id: "..." })     // Creates a Client
startConversation({ target: "project", org_id: "..." })    // Creates a Project
startConversation({ target: "retro", project_id: "..." })  // Creates a Retrospective
```

### 4. Function Calling for Structure
Claude extracts structured data via function calling. The AI doesn't freestyle; it calls defined tools that map to our schema.

```typescript
// AI sees this tool definition
{
  name: "create_client",
  description: "Create a new client record",
  parameters: {
    name: { type: "string", required: true },
    industry: { type: "string" },
    size_tier: { enum: ["startup", "smb", "mid", "enterprise"] }
  }
}

// AI calls it when it has enough info
{ tool: "create_client", args: { name: "Acme Corp", industry: "fintech", size_tier: "smb" } }
```

### 5. Server Components by Default
Use React Server Components for data fetching. Client components only for interactivity (forms, chat, real-time).

```
app/
├── dashboard/
│   ├── page.tsx          # Server component: fetches data
│   ├── clients/
│   │   ├── page.tsx      # Server component: lists clients
│   │   └── [id]/
│   │       └── page.tsx  # Server component: shows one client
│   └── conversations/
│       └── [id]/
│           └── page.tsx  # Mixed: server shell, client chat UI
```

## Authentication Flow

### Sign Up / Sign In

```
1. User visits /sign-in
2. Clerk component handles auth
3. On success, Clerk sets session cookie
4. Middleware validates session, attaches user to request
5. If new user: webhook creates User + Organization in Supabase
```

### Request Flow (Authenticated)

```
1. Request hits middleware (middleware.ts)
2. Clerk validates session
3. Route handler extracts user ID and org ID
4. Supabase client created with user context
5. RLS policies filter data to user's org
```

### Middleware Configuration

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

## Database Access Patterns

### Server Components (Recommended)

```typescript
// app/dashboard/clients/page.tsx
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/db';

export default async function ClientsPage() {
  const { userId, orgId } = auth();
  const supabase = createServerClient();

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('org_id', orgId);

  return <ClientList clients={clients} />;
}
```

### API Routes

```typescript
// app/api/clients/route.ts
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const { orgId } = auth();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('org_id', orgId);

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { orgId } = auth();
  const body = await req.json();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('clients')
    .insert({ ...body, org_id: orgId })
    .select()
    .single();

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
```

### Client Components (When Needed)

```typescript
// components/client-form.tsx
'use client';

import { useState } from 'react';

export function ClientForm() {
  const [name, setName] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/clients', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    // Handle response
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## AI Integration Pattern

### Conversation Loop

```typescript
// Simplified conversation flow
async function runConversation(conversationId: string, userMessage: string) {
  // 1. Get conversation history
  const conversation = await getConversation(conversationId);

  // 2. Build messages array
  const messages = [
    { role: 'system', content: getSystemPrompt(conversation.target) },
    ...conversation.messages,
    { role: 'user', content: userMessage }
  ];

  // 3. Call Claude with tools
  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    messages,
    tools: getToolsForTarget(conversation.target),
    max_tokens: 1024,
  });

  // 4. Handle response
  if (response.stop_reason === 'tool_use') {
    // AI wants to call a tool
    const toolCall = response.content.find(c => c.type === 'tool_use');
    const result = await executeToolCall(toolCall, conversation);

    // Continue conversation with tool result
    return runConversation(conversationId, toolResultMessage(result));
  }

  // 5. Save and return assistant message
  const assistantMessage = response.content.find(c => c.type === 'text');
  await saveMessage(conversationId, 'assistant', assistantMessage.text);

  return assistantMessage.text;
}
```

### Tool Execution

```typescript
async function executeToolCall(toolCall: ToolUse, conversation: Conversation) {
  switch (toolCall.name) {
    case 'create_client':
      return createClient(conversation.org_id, toolCall.input);
    case 'update_client':
      return updateClient(toolCall.input.id, toolCall.input);
    case 'ask_clarifying_question':
      // AI is asking for more info, no DB write
      return { success: true, message: 'Question asked' };
    default:
      throw new Error(`Unknown tool: ${toolCall.name}`);
  }
}
```

## Error Handling

### API Error Response Format

```typescript
// Standard error shape
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Usage
return NextResponse.json({
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Name is required',
    details: { field: 'name' }
  }
}, { status: 400 });
```

### Sentry Integration

```typescript
// lib/errors.ts
import * as Sentry from '@sentry/nextjs';

export function captureError(error: Error, context?: Record<string, unknown>) {
  console.error(error);
  Sentry.captureException(error, { extra: context });
}

// Usage in API routes
try {
  // ... operation
} catch (error) {
  captureError(error, { conversationId, userId });
  return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, { status: 500 });
}
```

## File Organization

### Feature-Based Structure

```
app/
├── (auth)/                  # Auth routes (no layout)
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
├── (dashboard)/             # Authenticated routes (shared layout)
│   ├── layout.tsx           # Sidebar, nav
│   ├── page.tsx             # Dashboard home
│   ├── clients/
│   │   ├── page.tsx         # List clients
│   │   ├── new/page.tsx     # New client (starts conversation)
│   │   └── [id]/page.tsx    # Client detail
│   └── conversations/
│       ├── page.tsx         # List conversations
│       └── [id]/page.tsx    # Conversation view
└── api/
    ├── clients/
    │   └── route.ts         # CRUD
    ├── conversations/
    │   ├── route.ts         # Create, list
    │   └── [id]/
    │       ├── route.ts     # Get, update
    │       └── messages/
    │           └── route.ts # Add message, get AI response
    └── webhooks/
        └── clerk/
            └── route.ts     # Sync users/orgs to Supabase
```

### Lib Organization

```
lib/
├── db.ts           # Supabase client factory
├── ai.ts           # Claude client wrapper
├── auth.ts         # Clerk helpers
├── errors.ts       # Error handling utilities
└── utils.ts        # General utilities
```

### Components Organization

```
components/
├── ui/                      # Primitives (shadcn-style)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...
├── layout/
│   ├── sidebar.tsx
│   ├── header.tsx
│   └── nav.tsx
├── conversation/
│   ├── chat-container.tsx   # Main chat UI
│   ├── message-list.tsx
│   ├── message-bubble.tsx
│   └── input-bar.tsx
└── clients/
    ├── client-card.tsx
    └── client-list.tsx
```

## Performance Considerations

### Database
- Add indexes on `org_id` for all tables (RLS filter)
- Use `select()` to limit columns returned
- Paginate large lists

### AI
- Stream responses for better UX
- Cache system prompts
- Limit conversation history sent to Claude (last N messages)

### Next.js
- Use server components for initial data
- Implement loading states with Suspense
- Use route handlers instead of client-side fetches when possible

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] `org_id` check in every RLS policy
- [ ] Service role key only used server-side
- [ ] Clerk webhook signature verified
- [ ] API routes check authentication
- [ ] Input validation with Zod
- [ ] Environment variables not exposed to client
