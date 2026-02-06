# Phase 0: Cursor Build Guide

Copy-paste prompts into Cursor, test, commit, repeat. Each PR is small enough to succeed on the first try.

---

## Before You Start

### Manual Setup (Do Once)

1. **Create accounts:**
   - [ ] [Supabase](https://supabase.com) - create project, note URL + keys
   - [ ] [Clerk](https://clerk.com) - create app, enable Organizations, note keys
   - [ ] [Anthropic](https://console.anthropic.com) - create API key
   - [ ] [Vercel](https://vercel.com) - connect GitHub account

2. **Local tools:**
   ```bash
   node --version  # Need 20+
   pnpm --version  # Need 8+ (install: npm install -g pnpm)
   ```

3. **Create empty GitHub repo:** `guildry` (or your preferred name)

---

## PR 1: Monorepo Skeleton

### Cursor Prompt
```
Create a pnpm + Turborepo monorepo for a Next.js 14 app called "Guildry".

Structure:
- apps/web: Next.js 14 with App Router, TypeScript, Tailwind
- packages/database: placeholder for Supabase client (just index.ts exporting empty object)
- packages/ai: placeholder for Claude client (just index.ts exporting empty object)
- packages/ui: placeholder for shared components (just index.ts exporting empty object)

Root files needed:
- pnpm-workspace.yaml
- turbo.json with build, dev, lint pipelines
- package.json with scripts: dev, build, lint
- .gitignore (node_modules, .next, .env*, etc.)
- .nvmrc with "20"

For apps/web:
- Use `create-next-app` defaults but with src directory disabled
- tailwind.config.ts with custom colors:
  - accent-scout: #b45309
  - accent-compass: #4f46e5
  - accent-blueprint: #0d9488
  - accent-bench: #dc2626
  - accent-relay: #7c3aed
  - accent-retro: #db2777
  - accent-proof: #059669
- Simple app/page.tsx that just says "Guildry" with the blueprint color
- app/layout.tsx with basic metadata

Each package should have:
- package.json with name @guildry/[package-name]
- tsconfig.json extending a base config
- src/index.ts with placeholder export

Don't install Clerk, Supabase, or Anthropic yet - just the skeleton.
```

### Manual Steps
1. After Cursor generates files, run:
   ```bash
   cd guildry
   pnpm install
   ```

### Build Should Pass?
✅ Yes

### Test Before Next PR
```bash
pnpm dev
# Visit http://localhost:3000
# Should see "Guildry" text
```

```bash
pnpm build
# Should complete without errors
```

### Commit
```bash
git init
git add .
git commit -m "chore: initialize monorepo with Next.js app"
git remote add origin git@github.com:YOUR_USERNAME/guildry.git
git push -u origin main
```

---

## PR 2: Conventions & Standards Docs

### Cursor Prompt
```
Create two reference documents in the repo root:

1. CONVENTIONS.md - Coding standards for this project:
   - File naming: kebab-case for files, PascalCase for components
   - Folder structure: feature-based, not type-based
   - Imports: use @/ alias for apps/web, @guildry/* for packages
   - TypeScript: strict mode, no any, prefer interfaces over types for objects
   - Async: always use async/await, never .then()
   - Error handling: try/catch with typed errors, always log before throwing
   - Comments: only when "why" isn't obvious, no commented-out code
   - Commits: conventional commits (feat:, fix:, chore:, docs:)

2. UI_STANDARDS.md - UI patterns for this project:
   - Tailwind only, no CSS files except globals.css
   - Color usage: use accent-* colors for product-specific UI, slate for neutrals
   - Spacing: use Tailwind's spacing scale (4, 6, 8, 12, 16, 24)
   - Typography: font-sans for body, font-mono for code/data
   - Components: start with HTML + Tailwind, extract to components when reused 3+ times
   - Forms: labels above inputs, error messages below in red-600
   - Buttons: primary (accent-blueprint bg), secondary (slate-200 bg), ghost (transparent)
   - Cards: white bg, slate-200 border, rounded-lg, p-4 or p-6
   - Loading states: use skeleton divs with animate-pulse
   - Empty states: centered text with slate-500, suggest action

Keep both docs concise (under 100 lines each). These are quick references, not exhaustive guides.
```

### Manual Steps
None

### Build Should Pass?
✅ Yes (no code changes)

### Test Before Next PR
```bash
pnpm build  # Still works
```

### Commit
```bash
git add .
git commit -m "docs: add coding conventions and UI standards"
git push
```

---

## PR 3: Clerk Authentication

### Manual Steps FIRST
1. In Clerk dashboard:
   - Go to **Configure → User & Authentication → Email, Phone, Username**
   - Ensure email is enabled
   - Go to **Configure → Organizations** and enable it
   - Go to **API Keys** and copy the keys

2. Create `apps/web/.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   ```

### Cursor Prompt
```
Add Clerk authentication to the Next.js app.

Install @clerk/nextjs.

Create/update these files:

1. apps/web/middleware.ts
   - Protect all routes except /sign-in, /sign-up, /api/webhooks
   - Use clerkMiddleware from @clerk/nextjs/server

2. apps/web/app/layout.tsx
   - Wrap children in ClerkProvider

3. apps/web/app/(auth)/sign-in/[[...sign-in]]/page.tsx
   - Use Clerk's SignIn component
   - Centered on page, minimal styling

4. apps/web/app/(auth)/sign-up/[[...sign-up]]/page.tsx
   - Use Clerk's SignUp component
   - Centered on page, minimal styling

5. apps/web/app/(auth)/layout.tsx
   - Simple centered layout for auth pages
   - No navigation

6. apps/web/app/dashboard/page.tsx
   - Protected page that shows "Welcome to Guildry"
   - Import UserButton from @clerk/nextjs and show it in top right
   - This is a placeholder - we'll build the real dashboard later

7. Update apps/web/app/page.tsx
   - Redirect to /dashboard if signed in, otherwise show landing with link to /sign-in

Use the environment variables from .env.local (already created).
Reference the Clerk Next.js App Router docs for correct imports.
```

### Build Should Pass?
✅ Yes

### Test Before Next PR
```bash
pnpm dev
```

1. Visit http://localhost:3000 → should see landing or redirect
2. Click sign in → Clerk UI appears
3. Create an account
4. Should redirect to /dashboard
5. See "Welcome to Guildry" and UserButton
6. Sign out via UserButton → returns to landing

### Commit
```bash
git add .
git commit -m "feat: add Clerk authentication with sign-in/sign-up flows"
git push
```

---

## PR 4: Supabase Schema & Client

### Manual Steps FIRST
1. In Supabase dashboard → SQL Editor, run this schema:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_org_id TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT,
  size_tier TEXT CHECK (size_tier IN ('startup', 'smb', 'mid', 'enterprise')),
  website_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_schema TEXT,
  intent TEXT,
  status TEXT CHECK (status IN ('active', 'complete', 'abandoned')) DEFAULT 'active',
  extracted_data JSONB DEFAULT '{}',
  created_entities JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system', 'tool')) NOT NULL,
  content TEXT NOT NULL,
  tool_calls JSONB,
  tool_call_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_clients_org_id ON clients(org_id);
CREATE INDEX idx_conversations_org_id ON conversations(org_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

2. Add to `apps/web/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

### Cursor Prompt
```
Set up Supabase client in the database package.

Install @supabase/supabase-js in packages/database.

Create these files:

1. packages/database/src/client.ts
   - createServiceClient(): uses SUPABASE_SERVICE_ROLE_KEY, bypasses RLS
   - Export both functions
   - Handle missing env vars gracefully with clear error messages

2. packages/database/src/types.ts
   - TypeScript interfaces for: Organization, User, Client, Conversation, Message
   - Use proper enums for status fields, role fields, etc.
   - Export all types

3. packages/database/src/index.ts
   - Re-export everything from client.ts and types.ts

4. apps/web/lib/db.ts
   - Import and re-export from @guildry/database for convenience
   - Add a getDb() helper that returns the service client

Update apps/web/package.json to depend on @guildry/database: "workspace:*"

The database schema already exists in Supabase (organizations, users, clients, conversations, messages tables).
```

### Build Should Pass?
✅ Yes

### Test Before Next PR
```bash
pnpm build
```

Create a quick test file (delete after):
```typescript
// apps/web/app/api/test-db/route.ts
import { createServiceClient } from '@guildry/database';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('organizations').select('*').limit(1);
  return NextResponse.json({ data, error });
}
```

```bash
pnpm dev
curl http://localhost:3000/api/test-db
# Should return { "data": [], "error": null }
```

Delete the test file after confirming.

### Commit
```bash
git add .
git commit -m "feat: add Supabase client and database types"
git push
```

---

## PR 5: Clerk Webhook (User Sync)

### Manual Steps FIRST
1. Install ngrok: `brew install ngrok` (or download from ngrok.com)
2. Start ngrok: `ngrok http 3000`
3. Copy the https URL (e.g., `https://abc123.ngrok.io`)
4. In Clerk dashboard → Webhooks → Add Endpoint:
   - URL: `https://abc123.ngrok.io/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`
   - Copy the signing secret
5. Add to `apps/web/.env.local`:
   ```
   CLERK_WEBHOOK_SECRET=whsec_...
   ```

### Cursor Prompt
```
Create Clerk webhook handler that syncs users to Supabase.

Install svix in apps/web (for webhook verification).

Create apps/web/app/api/webhooks/clerk/route.ts:

1. Verify webhook signature using svix and CLERK_WEBHOOK_SECRET
2. Handle 'user.created' event:
   - Create an Organization with name "[User's name]'s Workspace" and slug "org-[first 8 chars of clerk id]"
   - Create a User linked to that org with role 'owner'
   - Use the service client (bypasses RLS)
3. Handle 'user.updated' event:
   - Update the user's email and name in Supabase
4. Return 200 for success, 400 for verification failure

The webhook should:
- Log what it's doing (console.log is fine for now)
- Handle errors gracefully and return appropriate status codes
- Not crash if the user already exists (upsert pattern)

Important: This route must be excluded from Clerk middleware (already done in PR 3).
```

### Build Should Pass?
✅ Yes

### Test Before Next PR
```bash
# Terminal 1
pnpm dev

# Terminal 2
ngrok http 3000
```

1. Make sure Clerk webhook URL matches your ngrok URL
2. Go to your app and **create a new account** (or delete your test account in Clerk dashboard first)
3. After sign-up, check Supabase dashboard:
   - Should see new row in `organizations` table
   - Should see new row in `users` table with `org_id` set

If it doesn't work, check:
- Clerk dashboard → Webhooks → see if there are failed deliveries
- Your terminal for error logs

### Commit
```bash
git add .
git commit -m "feat: add Clerk webhook to sync users to Supabase"
git push
```

---

## PR 6: Auth Context Helper

### Cursor Prompt
```
Create an auth helper that bridges Clerk and Supabase.

Create apps/web/lib/auth.ts:

1. getAuthContext() async function that:
   - Gets the Clerk userId using auth() from @clerk/nextjs/server
   - Throws "Unauthorized" error if no userId
   - Queries Supabase to get the internal user record by clerk_user_id
   - Returns: { userId, orgId, role, clerkUserId }

2. requireAuth() wrapper that:
   - Calls getAuthContext()
   - Returns the context or throws

3. Types for AuthContext

This helper will be used in all API routes to get the current user's org context.

Use the service client for the Supabase query (we need to look up users regardless of RLS).
```

### Build Should Pass?
✅ Yes

### Test Before Next PR
Update the dashboard to show user info:

```typescript
// apps/web/app/dashboard/page.tsx - add this temporarily
import { getAuthContext } from '@/lib/auth';

export default async function DashboardPage() {
  const ctx = await getAuthContext();
  return (
    <div>
      <pre>{JSON.stringify(ctx, null, 2)}</pre>
    </div>
  );
}
```

```bash
pnpm dev
# Sign in and visit /dashboard
# Should see your userId, orgId, role, clerkUserId
```

### Commit
```bash
git add .
git commit -m "feat: add auth context helper bridging Clerk and Supabase"
git push
```

---

## PR 7: Client API Routes

### Cursor Prompt
```
Create CRUD API routes for clients.

Install zod in apps/web.

Create these files:

1. apps/web/lib/api.ts
   - Standard error response helper: apiError(code, message, status)
   - Standard success response helper: apiSuccess(data, status?)
   - Error codes: VALIDATION_ERROR, NOT_FOUND, UNAUTHORIZED, INTERNAL_ERROR

2. apps/web/app/api/clients/route.ts
   - GET: List clients for the user's org
     - Support ?search= query param for filtering by name
     - Return { data: Client[] }
   - POST: Create a client
     - Validate with Zod: name required, industry/size_tier/website_url/notes optional
     - size_tier enum: startup, smb, mid, enterprise
     - Return { data: Client } with 201 status

3. apps/web/app/api/clients/[id]/route.ts
   - GET: Get single client by ID (must belong to user's org)
   - PATCH: Update client (validate same as POST but all fields optional)
   - DELETE: Delete client

All routes should:
- Use getAuthContext() to get orgId
- Scope all queries to org_id = orgId
- Use createServiceClient() for database access
- Return consistent error format
- Log errors with console.error

Follow the patterns in CONVENTIONS.md.
```

### Build Should Pass?
✅ Yes

### Test Before Next PR
```bash
pnpm dev
```

Test with curl (replace with your actual auth - or test via browser network tab):

```bash
# These will fail with 401 since we're not passing auth
# But you can test via browser with dev tools open

# Or add a temporary test that bypasses auth:
```

Create a quick test endpoint:
```typescript
// apps/web/app/api/test-clients/route.ts (temporary)
import { createServiceClient } from '@guildry/database';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createServiceClient();

  // Get first org (your test org)
  const { data: org } = await supabase.from('organizations').select('id').limit(1).single();
  if (!org) return NextResponse.json({ error: 'No org' });

  // Create a test client
  const { data: client, error } = await supabase
    .from('clients')
    .insert({ org_id: org.id, name: 'Test Client', industry: 'tech' })
    .select()
    .single();

  return NextResponse.json({ client, error });
}
```

```bash
curl http://localhost:3000/api/test-clients
# Should return the created client
```

Check Supabase dashboard - client should appear. Delete test endpoint after.

### Commit
```bash
git add .
git commit -m "feat: add client CRUD API routes"
git push
```

---

## PR 8: Claude API Wrapper

### Manual Steps FIRST
Add to `apps/web/.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Cursor Prompt
```
Set up Claude API client in the ai package.

Install @anthropic-ai/sdk in packages/ai.

Create these files:

1. packages/ai/src/client.ts
   - Initialize Anthropic client with ANTHROPIC_API_KEY
   - complete() function: takes messages, tools, system prompt, returns response
   - Handle missing API key with clear error

2. packages/ai/src/types.ts
   - ToolCall interface: { id, name, input }
   - CompletionOptions interface
   - CompletionResult interface

3. packages/ai/src/index.ts
   - Re-export from client.ts and types.ts

4. apps/web/app/api/test-ai/route.ts (temporary test route)
   - Simple endpoint that sends "Say hello" to Claude and returns the response
   - No tools, just basic completion

Update apps/web/package.json to depend on @guildry/ai: "workspace:*"
```

### Build Should Pass?
✅ Yes

### Test Before Next PR
```bash
pnpm dev
curl http://localhost:3000/api/test-ai
# Should return Claude's response
```

Delete `apps/web/app/api/test-ai/route.ts` after testing.

### Commit
```bash
git add .
git commit -m "feat: add Claude API wrapper in ai package"
git push
```

---

## PR 9: Conversation Engine Core

### Cursor Prompt
```
Build the conversation engine that uses Claude to extract structured data.

Create these files in packages/ai/src/:

1. tools/client.ts
   - createClientTool: Tool definition for creating a client
   - Input schema: name (required), industry, size_tier (enum), website_url, notes
   - ClientInputSchema: Zod schema matching the tool

2. tools/common.ts
   - askClarifyingQuestionTool: Tool for AI to ask follow-up questions
   - markCompleteTool: Tool to mark conversation done

3. tools/index.ts
   - getToolsForSchema(schema: string): returns array of tools
   - For 'client' schema: return client tools + common tools
   - Default: return just common tools

4. prompts/system.ts
   - getBaseSystemPrompt(): Base personality and guidelines
   - Be conversational, ask one question at a time, confirm before creating

5. prompts/client.ts
   - getClientPrompt(): Instructions for client creation flow
   - What fields to gather, example conversation

6. prompts/index.ts
   - getPromptForSchema(schema: string): returns combined prompt

7. conversation.ts
   - processConversation(conversation, userMessage): main function
   - Builds messages array from conversation history
   - Calls Claude with appropriate tools and prompts
   - Executes tool calls (create_client inserts to DB)
   - Returns: { content, toolCalls, completed, createdEntities }

   The function should:
   - Take a Conversation object and new user message
   - Query existing messages from DB
   - Build Claude messages array
   - Call Claude API
   - If tool_use response, execute the tool and get follow-up
   - Return the assistant's response

8. Update packages/ai/src/index.ts to export processConversation

For tool execution, import createServiceClient from @guildry/database.
The create_client tool should insert into the clients table using the conversation's org_id.
```

### Build Should Pass?
✅ Yes

### Test Before Next PR
This is complex - we'll test it properly in the next PR when we wire up the API routes.

```bash
pnpm build
# Should pass
```

### Commit
```bash
git add .
git commit -m "feat: add conversation engine with client creation tools"
git push
```

---

## PR 10: Conversation API Routes

### Cursor Prompt
```
Create API routes for conversations that use the conversation engine.

Create these files:

1. apps/web/app/api/conversations/route.ts
   - GET: List conversations for user's org (most recent first)
   - POST: Create new conversation
     - Body: { target_schema: string, intent?: string }
     - Returns the created conversation

2. apps/web/app/api/conversations/[id]/route.ts
   - GET: Get conversation with all its messages
     - Include messages ordered by created_at
     - Verify conversation belongs to user's org

3. apps/web/app/api/conversations/[id]/messages/route.ts
   - GET: Get messages for a conversation
   - POST: Send a message and get AI response
     - Body: { content: string }
     - Save user message to DB
     - Call processConversation from @guildry/ai
     - Save assistant message to DB
     - If conversation completed, update status
     - Return { userMessage, assistantMessage, completed, createdEntities }

All routes use getAuthContext() and scope to org_id.
Handle errors with try/catch and return consistent error format.
```

### Build Should Pass?
✅ Yes

### Test Before Next PR
```bash
pnpm dev
```

Test the full flow via curl or a REST client:

```bash
# 1. Create a conversation (you'll need to be signed in - test via browser network tab)
# POST /api/conversations
# Body: { "target_schema": "client" }

# 2. Send a message
# POST /api/conversations/[id]/messages
# Body: { "content": "Add a client called Acme Corp, they're a fintech startup" }

# 3. Check Supabase - should have:
# - A conversation record
# - Message records (user + assistant)
# - Possibly a client record if AI completed the flow
```

Easier test: Create a temporary test page:

```typescript
// apps/web/app/test-conversation/page.tsx (temporary)
'use client';
import { useState } from 'react';

export default function TestConversation() {
  const [convId, setConvId] = useState('');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');

  async function startConv() {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_schema: 'client' }),
    });
    const data = await res.json();
    setConvId(data.data.id);
    setResponse(JSON.stringify(data, null, 2));
  }

  async function sendMsg() {
    const res = await fetch(`/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });
    const data = await res.json();
    setResponse(JSON.stringify(data, null, 2));
    setMessage('');
  }

  return (
    <div className="p-8 max-w-2xl">
      <button onClick={startConv} className="bg-blue-500 text-white px-4 py-2 rounded">
        Start Conversation
      </button>
      {convId && (
        <div className="mt-4">
          <p>Conv ID: {convId}</p>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="border p-2 w-full mt-2"
            placeholder="Type a message..."
          />
          <button onClick={sendMsg} className="bg-green-500 text-white px-4 py-2 rounded mt-2">
            Send
          </button>
        </div>
      )}
      <pre className="mt-4 bg-gray-100 p-4 overflow-auto text-sm">{response}</pre>
    </div>
  );
}
```

Sign in, visit `/test-conversation`, and test the flow. Delete after.

### Commit
```bash
git add .
git commit -m "feat: add conversation API routes with AI integration"
git push
```

---

## PR 11: Chat UI Components

### Cursor Prompt
```
Create chat UI components following UI_STANDARDS.md.

Create these components in apps/web/components/conversation/:

1. message-bubble.tsx
   - Props: { role: 'user' | 'assistant', content: string, timestamp?: Date }
   - User messages: right-aligned, accent-blueprint bg, white text
   - Assistant messages: left-aligned, slate-100 bg, slate-900 text
   - Show timestamp if provided (relative time like "2m ago")
   - Render markdown in content (install react-markdown)

2. message-list.tsx
   - Props: { messages: Message[] }
   - Renders list of MessageBubble components
   - Auto-scrolls to bottom when new messages added
   - Shows empty state if no messages

3. chat-input.tsx
   - Props: { onSend: (message: string) => void, disabled?: boolean, placeholder?: string }
   - Textarea that grows up to 4 lines
   - Send button (accent-blueprint)
   - Submit on Enter (Shift+Enter for newline)
   - Disable while sending

4. chat-container.tsx
   - Props: { conversationId: string }
   - Client component that manages chat state
   - Fetches messages on mount
   - Handles sending messages via API
   - Shows loading state while AI responds
   - Updates when new messages arrive

5. typing-indicator.tsx
   - Simple animated dots for when AI is "typing"

Install react-markdown in apps/web.

Use Tailwind classes from UI_STANDARDS.md. Keep components simple and focused.
```

### Build Should Pass?
✅ Yes

### Test Before Next PR
Create a test page:

```typescript
// apps/web/app/chat-test/page.tsx (temporary)
import { ChatContainer } from '@/components/conversation/chat-container';

export default function ChatTest() {
  // Use a real conversation ID from your test, or we'll handle the "no ID" case
  return (
    <div className="h-screen p-4">
      <ChatContainer conversationId="test" />
    </div>
  );
}
```

The component should render (even if it shows an error for invalid conversation ID).

### Commit
```bash
git add .
git commit -m "feat: add chat UI components"
git push
```

---

## PR 12: Clients Page & New Client Flow

### Cursor Prompt
```
Create client management pages.

1. apps/web/app/(dashboard)/clients/page.tsx
   - Server component that fetches clients for user's org
   - Grid of client cards (name, industry, size_tier)
   - "Add Client" button that links to /clients/new
   - Empty state if no clients

2. apps/web/app/(dashboard)/clients/new/page.tsx
   - Page that starts a conversation for creating a client
   - On mount, POST to /api/conversations with target_schema: 'client'
   - Render ChatContainer with the new conversation ID
   - When conversation completes, redirect to /clients

3. apps/web/app/(dashboard)/clients/[id]/page.tsx
   - Server component showing client details
   - Fetch client by ID (verify org ownership in API)
   - Show all client fields
   - Edit button (future: inline editing)
   - Delete button with confirmation
   - Back link to /clients

4. apps/web/components/clients/client-card.tsx
   - Props: { client: Client }
   - Clickable card that links to /clients/[id]
   - Shows name prominently, industry and size as badges

5. Update apps/web/app/(dashboard)/layout.tsx if needed:
   - Add navigation link to /clients

Use the API routes we already created. Follow UI_STANDARDS.md for styling.
```

### Build Should Pass?
✅ Yes

### Test Before Next PR
```bash
pnpm dev
```

1. Sign in and go to `/clients`
2. Should see empty state (or your test clients)
3. Click "Add Client"
4. Chat interface should appear
5. Say "Add a client called Test Corp, they're a startup in healthcare"
6. AI should create the client
7. Should redirect to /clients showing your new client
8. Click on the client to see details

### Commit
```bash
git add .
git commit -m "feat: add client management pages with conversational creation"
git push
```

---

## PR 13: Dashboard Layout & Navigation

### Cursor Prompt
```
Create the main dashboard layout with navigation.

1. apps/web/components/layout/sidebar.tsx
   - Fixed sidebar on left (w-64)
   - Logo/brand at top ("Guildry" in accent-blueprint)
   - Navigation links:
     - Dashboard (home icon) -> /dashboard
     - Clients (users icon) -> /clients
     - Conversations (chat icon) -> /conversations (we'll add this page)
   - User section at bottom with UserButton from Clerk
   - Highlight active route
   - Use lucide-react for icons

2. apps/web/components/layout/header.tsx
   - Top header bar for mobile (hidden on desktop)
   - Hamburger menu to toggle sidebar
   - Page title

3. Update apps/web/app/(dashboard)/layout.tsx
   - Use Sidebar component
   - Main content area with proper padding
   - Responsive: sidebar hidden on mobile, shown on md+

4. apps/web/app/(dashboard)/page.tsx (update)
   - Dashboard home page
   - Welcome message with user's name
   - Quick stats: number of clients, recent conversations
   - Quick action buttons: "Add Client", "Start Conversation"

5. apps/web/app/(dashboard)/conversations/page.tsx
   - List of user's conversations
   - Show target_schema, status, created_at
   - Click to view/continue conversation

Install lucide-react in apps/web if not already installed.
```

### Build Should Pass?
✅ Yes

### Test Before Next PR
```bash
pnpm dev
```

1. Sign in
2. Should see sidebar with navigation
3. Click through: Dashboard, Clients, Conversations
4. Each page should load
5. On mobile (resize browser), sidebar should hide

### Commit
```bash
git add .
git commit -m "feat: add dashboard layout with sidebar navigation"
git push
```

---

## PR 14: Error Handling & Loading States

### Cursor Prompt
```
Add proper error handling and loading states throughout the app.

1. apps/web/app/(dashboard)/error.tsx
   - Error boundary for dashboard routes
   - Show friendly error message
   - "Try again" button that calls reset()
   - Log error to console (Sentry later)

2. apps/web/app/(dashboard)/loading.tsx
   - Loading skeleton for dashboard
   - Use animate-pulse on placeholder divs

3. apps/web/app/(dashboard)/clients/loading.tsx
   - Grid of skeleton client cards

4. apps/web/app/(dashboard)/clients/[id]/loading.tsx
   - Skeleton for client detail page

5. apps/web/components/ui/skeleton.tsx
   - Reusable Skeleton component
   - Props: className for sizing

6. apps/web/components/ui/error-message.tsx
   - Props: { title?, message, retry?: () => void }
   - Red-tinted card with error icon
   - Optional retry button

7. Update chat components to show errors:
   - ChatContainer: show error message if API fails
   - ChatInput: show error state, allow retry

8. apps/web/lib/errors.ts
   - captureError(error, context): logs error, prepares for Sentry
   - isApiError(error): type guard
   - getErrorMessage(error): extract user-friendly message

Follow UI_STANDARDS.md for error styling (red-600 text, red-50 background).
```

### Build Should Pass?
✅ Yes

### Test Before Next PR
1. Trigger an error (e.g., go to `/clients/invalid-uuid`)
2. Should see error boundary, not crash
3. Loading states should appear briefly when navigating

### Commit
```bash
git add .
git commit -m "feat: add error boundaries and loading states"
git push
```

---

## PR 15: Basic Tests

### Cursor Prompt
```
Set up testing infrastructure and add basic tests.

1. Install in root:
   - vitest
   - @testing-library/react
   - @vitejs/plugin-react (for vitest)

2. Create vitest.config.ts in root:
   - Configure for monorepo
   - Set up path aliases

3. packages/ai/src/__tests__/tools.test.ts
   - Test that ClientInputSchema validates correctly
   - Test valid input passes
   - Test missing name fails
   - Test invalid size_tier fails

4. packages/database/src/__tests__/types.test.ts
   - Simple test that types are exported correctly

5. apps/web/lib/__tests__/api.test.ts
   - Test apiError helper returns correct format
   - Test apiSuccess helper returns correct format

6. Update root package.json:
   - Add "test": "vitest" script
   - Add "test:ci": "vitest run" for CI

7. Create .github/workflows/test.yml:
   - Run on push to main and PRs
   - Install deps, run pnpm test:ci, run pnpm build

Keep tests simple and fast. We're not aiming for high coverage, just catching obvious breaks.
```

### Build Should Pass?
✅ Yes

### Test Before Next PR
```bash
pnpm test
# Should run and pass

pnpm test:ci
# Should run once and exit
```

### Commit
```bash
git add .
git commit -m "feat: add testing infrastructure with initial tests"
git push
```

---

## PR 16: Production Deploy

### Manual Steps FIRST
1. Push your repo to GitHub if not already
2. Go to [Vercel](https://vercel.com) and import your repo
3. Configure environment variables in Vercel:
   - All the variables from `.env.local`
4. Update Clerk webhook URL to your Vercel production URL:
   - `https://your-app.vercel.app/api/webhooks/clerk`

### Cursor Prompt
```
Prepare the app for production deployment.

1. apps/web/next.config.js
   - Add any necessary production config
   - Ensure environment variables are validated

2. Create apps/web/.env.example
   - List all required env vars with placeholder values
   - Add comments explaining each

3. Update README.md in root:
   - Project description
   - Tech stack
   - Setup instructions (link to .env.example)
   - Development commands
   - Deployment instructions

4. apps/web/app/layout.tsx
   - Add proper metadata for SEO
   - Title: "Guildry | Project Intelligence Platform"
   - Description: appropriate for the app

5. Create apps/web/public/favicon.ico
   - Simple favicon (can be placeholder)

Make sure there are no hardcoded localhost URLs anywhere.
```

### Build Should Pass?
✅ Yes

### Test Before Celebrating
1. Vercel should auto-deploy on push
2. Visit your production URL
3. Sign up with a fresh account
4. Create a client through conversation
5. Verify data appears in Supabase
6. Check Clerk dashboard for the new user

### Commit
```bash
git add .
git commit -m "chore: prepare for production deployment"
git push
```

---

## Phase 0 Complete Checklist

After all PRs, verify:

- [ ] Can sign up via Clerk
- [ ] Sign-up creates User + Organization in Supabase
- [ ] Can navigate dashboard (sidebar works)
- [ ] Can view clients list (empty state or with data)
- [ ] Can create client via conversation
- [ ] AI asks relevant questions
- [ ] AI creates client record
- [ ] Client appears in list after creation
- [ ] Can view client details
- [ ] Can see conversation history
- [ ] Loading states appear
- [ ] Errors are handled gracefully
- [ ] Tests pass
- [ ] Production deployment works

---

## Troubleshooting

### Clerk webhook not firing
- Check ngrok is running and URL matches Clerk config
- Check Clerk dashboard → Webhooks for failed deliveries
- Verify CLERK_WEBHOOK_SECRET is correct

### Supabase queries failing
- Check RLS is not blocking (use service client)
- Verify env vars are set correctly
- Check Supabase logs in dashboard

### Claude not responding
- Verify ANTHROPIC_API_KEY is valid
- Check for rate limit errors in console
- Ensure you have API credits

### Build failing
- Run `pnpm install` to ensure deps are synced
- Check for TypeScript errors: `pnpm build`
- Make sure all imports use correct paths

### Vercel deploy failing
- Check build logs in Vercel dashboard
- Verify all env vars are set in Vercel
- Ensure no secrets are in code
