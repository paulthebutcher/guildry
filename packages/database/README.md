# @guildry/database

Supabase client and database types for Guildry.

## Installation

This package is already included in the monorepo workspace. To use it in another package:

```json
{
  "dependencies": {
    "@guildry/database": "workspace:*"
  }
}
```

## Usage

### In Next.js App (apps/web)

Use the convenience wrapper from `lib/db.ts`:

```typescript
import { getDb, User, Organization } from "@/lib/db";

// Get the database client
const db = getDb();

// Query users
const { data: users, error } = await db
  .from("users")
  .select("*")
  .eq("organization_id", orgId);

// Insert a new client
const { data: client, error } = await db
  .from("clients")
  .insert({
    organization_id: orgId,
    name: "John Doe",
    email: "john@example.com",
  })
  .select()
  .single();
```

### Direct Import from Package

```typescript
import { createServiceClient, User, Client } from "@guildry/database";

const db = createServiceClient();

// Use the client...
```

## Available Types

### Entities
- `Organization` - Organization/tenant data
- `User` - User accounts linked to Clerk
- `Client` - Clients/customers of the organization
- `Conversation` - Chat conversations with clients
- `Message` - Individual messages in conversations

### Enums
- `OrganizationStatus` - active, inactive, suspended
- `UserRole` - owner, admin, member
- `ConversationStatus` - active, archived, closed
- `MessageRole` - user, assistant, system

### Helper Types
- `CreateOrganization`, `CreateUser`, `CreateClient`, etc.
- `UpdateOrganization`, `UpdateUser`, `UpdateClient`, etc.

## Important Notes

- **Service Role Key**: The `createServiceClient()` function uses the service role key which **bypasses Row Level Security (RLS)**.
- **Server-Side Only**: Never expose the service role key to the client. Only use in API routes, server actions, or server components.
- **Error Handling**: The client functions throw errors if environment variables are missing.

## Environment Variables Required

In your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
