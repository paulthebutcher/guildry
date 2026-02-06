# Data Model

## Phase 0 Entities

For Phase 0, we're implementing the core identity layer plus the conversation engine. This is the minimal set needed to authenticate users, scope data to organizations, and run AI conversations.

### Entity Overview

| Entity | Purpose | Owner |
|--------|---------|-------|
| Organization | Tenant boundary | Clerk webhook |
| User | Platform user | Clerk webhook |
| Client | External company you work for | Blueprint (later), Conversation (now) |
| Conversation | AI interaction session | Conversation engine |
| Message | Single message in a conversation | Conversation engine |

## Schema SQL

Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query).

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE IDENTITY
-- ============================================

-- Organizations (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_org_id TEXT UNIQUE,  -- Clerk organization ID
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('agency', 'consultancy', 'studio')) DEFAULT 'agency',
  industry_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,  -- Clerk user ID
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients (who you do work for)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT,
  size_tier TEXT CHECK (size_tier IN ('startup', 'smb', 'mid', 'enterprise')),
  website_url TEXT,
  communication_prefs JSONB DEFAULT '{}',
  lifetime_value DECIMAL(12, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONVERSATION ENGINE
-- ============================================

-- Conversations (AI interaction sessions)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- What kind of conversation is this?
  product TEXT CHECK (product IN ('scout', 'compass', 'blueprint', 'bench', 'relay', 'retro', 'proof', 'general')) DEFAULT 'general',
  target_schema TEXT,  -- e.g., 'client', 'project', etc.
  intent TEXT,  -- human-readable intent

  -- State
  status TEXT CHECK (status IN ('active', 'complete', 'abandoned')) DEFAULT 'active',
  extracted_data JSONB DEFAULT '{}',  -- structured data extracted so far
  created_entities JSONB DEFAULT '{}',  -- { entity_type: id } of entities created

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (individual turns in a conversation)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Message content
  role TEXT CHECK (role IN ('user', 'assistant', 'system', 'tool')) NOT NULL,
  content TEXT NOT NULL,

  -- For tool calls/results
  tool_calls JSONB,  -- array of tool calls made by assistant
  tool_call_id TEXT,  -- for tool results, which call this responds to

  -- Metadata
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Organization lookups
CREATE INDEX idx_organizations_clerk_org_id ON organizations(clerk_org_id);
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- User lookups
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);

-- Client lookups
CREATE INDEX idx_clients_org_id ON clients(org_id);
CREATE INDEX idx_clients_name ON clients(org_id, name);

-- Conversation lookups
CREATE INDEX idx_conversations_org_id ON conversations(org_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(org_id, status);

-- Message lookups
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(conversation_id, created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (for webhooks)
-- Note: Supabase service role key automatically bypasses RLS

-- Organizations: users can only see orgs they belong to
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM users
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- Users: can only see users in same org
CREATE POLICY "Users can view users in their org"
  ON users FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM users
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- Clients: org-scoped
CREATE POLICY "Users can view clients in their org"
  ON clients FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM users
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can insert clients in their org"
  ON clients FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM users
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can update clients in their org"
  ON clients FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM users
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can delete clients in their org"
  ON clients FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM users
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- Conversations: user can see their own org's conversations
CREATE POLICY "Users can view conversations in their org"
  ON conversations FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM users
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can insert conversations in their org"
  ON conversations FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM users
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can update conversations in their org"
  ON conversations FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM users
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- Messages: users can see messages from conversations in their org
CREATE POLICY "Users can view messages from their org conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN users u ON u.org_id = c.org_id
      WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can insert messages to their org conversations"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN users u ON u.org_id = c.org_id
      WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## TypeScript Types

After running the schema, generate TypeScript types:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Generate types
supabase gen types typescript --project-id YOUR_PROJECT_ID > packages/database/src/types.ts
```

Or manually define them:

```typescript
// packages/database/src/types.ts

export type OrganizationType = 'agency' | 'consultancy' | 'studio';
export type UserRole = 'owner' | 'admin' | 'member';
export type ClientSizeTier = 'startup' | 'smb' | 'mid' | 'enterprise';
export type ConversationStatus = 'active' | 'complete' | 'abandoned';
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';
export type Product = 'scout' | 'compass' | 'blueprint' | 'bench' | 'relay' | 'retro' | 'proof' | 'general';

export interface Organization {
  id: string;
  clerk_org_id: string | null;
  name: string;
  slug: string;
  type: OrganizationType;
  industry_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  clerk_user_id: string;
  org_id: string | null;
  email: string;
  name: string | null;
  role: UserRole;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  org_id: string;
  name: string;
  industry: string | null;
  size_tier: ClientSizeTier | null;
  website_url: string | null;
  communication_prefs: Record<string, unknown>;
  lifetime_value: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  org_id: string;
  user_id: string;
  product: Product;
  target_schema: string | null;
  intent: string | null;
  status: ConversationStatus;
  extracted_data: Record<string, unknown>;
  created_entities: Record<string, string>;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  tool_calls: ToolCall[] | null;
  tool_call_id: string | null;
  tokens_used: number | null;
  created_at: string;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}
```

## Database Client

```typescript
// packages/database/src/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser/server components (uses RLS)
export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Client for server-side with user context (uses RLS)
export function createServerClient(accessToken?: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  });
}

// Client that bypasses RLS (for webhooks, admin operations)
export function createServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
}
```

## Seeding Data

For development, create seed data:

```typescript
// packages/database/src/seed.ts
import { createServiceClient } from './client';

async function seed() {
  const supabase = createServiceClient();

  // Create a test organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: 'Test Agency',
      slug: 'test-agency',
      type: 'agency',
      industry_tags: ['web', 'design'],
    })
    .select()
    .single();

  if (orgError) throw orgError;
  console.log('Created org:', org.id);

  // Create some test clients
  const clients = [
    { org_id: org.id, name: 'Acme Corp', industry: 'fintech', size_tier: 'smb' },
    { org_id: org.id, name: 'TechStart Inc', industry: 'saas', size_tier: 'startup' },
    { org_id: org.id, name: 'Big Enterprise', industry: 'healthcare', size_tier: 'enterprise' },
  ];

  const { data: createdClients, error: clientError } = await supabase
    .from('clients')
    .insert(clients)
    .select();

  if (clientError) throw clientError;
  console.log('Created clients:', createdClients.length);

  console.log('Seed complete!');
}

seed().catch(console.error);
```

## Migrations Strategy

For Phase 0, we're using Supabase's SQL editor directly. As the project matures, consider:

1. **Supabase CLI migrations** for version control
2. **Prisma** if you want an ORM layer

For now, keep a running `schema.sql` file in the repo as the source of truth.

## Verifying the Schema

After running the SQL:

1. Go to Supabase Dashboard → Table Editor
2. Verify all tables exist with correct columns
3. Go to Authentication → Policies
4. Verify RLS policies are created

Test with a query:
```sql
-- Should return empty (no data yet)
SELECT * FROM organizations;

-- Insert test org (bypasses RLS in SQL editor)
INSERT INTO organizations (name, slug, type)
VALUES ('Test Org', 'test-org', 'agency')
RETURNING *;
```

## Entity Relationships

```
Organization (1)
    ├── User (many)
    ├── Client (many)
    └── Conversation (many)
            └── Message (many)
```

Note: In later phases, we'll add Project, Phase, Person, Skill, etc. The schema is designed to extend cleanly.
