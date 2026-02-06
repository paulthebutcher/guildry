# Auth Helper

Bridge between Clerk authentication and Supabase user data.

## Overview

This helper provides a unified way to get the current user's authentication context across both Clerk (session management) and Supabase (application data).

## Functions

### `getAuthContext()`

Gets the full authentication context for the current user.

**Returns**: `Promise<AuthContext>`
```typescript
{
  userId: string;        // Internal Supabase user ID
  orgId: string;         // Organization ID
  role: string;          // User role (owner, admin, member)
  clerkUserId: string;   // Clerk user ID
}
```

**Throws**:
- `"Unauthorized"` - No Clerk session found
- `"User not found in database"` - Clerk user doesn't exist in Supabase (webhook not processed yet)

### `requireAuth()`

Convenience wrapper that provides clear semantic meaning in API routes. Identical to `getAuthContext()`.

## Usage Examples

### In API Routes

```typescript
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const { orgId, role } = await requireAuth();
    
    // Now you have the org context to scope queries
    const db = getDb();
    const { data: clients } = await db
      .from("clients")
      .select("*")
      .eq("organization_id", orgId);
    
    return Response.json({ clients });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### Role-Based Access Control

```typescript
import { requireAuth } from "@/lib/auth";
import { UserRole } from "@guildry/database";

export async function DELETE(req: Request) {
  const { orgId, role } = await requireAuth();
  
  // Check if user has permission
  if (role !== UserRole.OWNER && role !== UserRole.ADMIN) {
    return Response.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }
  
  // Proceed with deletion...
}
```

### In Server Actions

```typescript
"use server";

import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function createClient(formData: FormData) {
  const { orgId } = await requireAuth();
  
  const db = getDb();
  const { data: client } = await db
    .from("clients")
    .insert({
      organization_id: orgId,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
    })
    .select()
    .single();
  
  return { success: true, client };
}
```

## How It Works

1. **Clerk Session**: Uses `auth()` from Clerk to get the current user's Clerk ID
2. **Database Lookup**: Queries Supabase `users` table to find the user by `clerk_user_id`
3. **Context Return**: Returns the user's internal ID, organization ID, and role

## Why Both IDs?

- **Clerk User ID**: Useful for Clerk-specific operations (user management, metadata)
- **Supabase User ID**: Required for foreign key relationships in your database
- **Organization ID**: Essential for multi-tenant data scoping (every query should filter by org)

## Error Handling

The helper throws errors instead of returning null to make it clear when auth fails:

```typescript
try {
  const context = await requireAuth();
  // User is authenticated
} catch (error) {
  if (error.message === "Unauthorized") {
    // No Clerk session - redirect to sign-in
  } else if (error.message === "User not found in database") {
    // User exists in Clerk but webhook hasn't synced yet
    // This is rare but can happen if webhook is slow
  }
}
```

## Security Notes

- Uses service role client to bypass RLS (necessary to look up any user)
- Only returns user's own data - no privilege escalation
- Always scope database queries by the returned `orgId` to prevent cross-tenant data access
- Protected routes should be behind Clerk middleware (configured in `middleware.ts`)
