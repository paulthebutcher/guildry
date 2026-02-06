import { auth } from "@clerk/nextjs/server";
import { getDb, User } from "@/lib/db";

export interface AuthContext {
  userId: string; // Internal Supabase user ID
  orgId: string; // Organization ID
  role: string; // User role (owner, admin, member)
  clerkUserId: string; // Clerk user ID
}

/**
 * Gets the authenticated user context by bridging Clerk and Supabase
 * 
 * This function:
 * 1. Gets the Clerk userId from the current session
 * 2. Queries Supabase to get the internal user record
 * 3. Returns the user's org context
 * 
 * @throws {Error} "Unauthorized" if no Clerk session
 * @throws {Error} "User not found in database" if Clerk user doesn't exist in Supabase
 * @returns {Promise<AuthContext>} The user's authentication context
 */
export async function getAuthContext(): Promise<AuthContext> {
  // Get Clerk user ID from the session
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new Error("Unauthorized");
  }

  // Query Supabase for the internal user record
  const db = getDb();
  const { data: user, error } = await db
    .from("users")
    .select("id, organization_id, role")
    .eq("clerk_user_id", clerkUserId)
    .single<Pick<User, "id" | "organization_id" | "role">>();

  if (error || !user) {
    console.error("Failed to fetch user from database:", error);
    throw new Error("User not found in database");
  }

  return {
    userId: user.id,
    orgId: user.organization_id,
    role: user.role,
    clerkUserId,
  };
}

/**
 * Requires authentication and returns the auth context
 * 
 * This is a convenience wrapper around getAuthContext() that
 * provides a clear semantic meaning in API routes.
 * 
 * @throws {Error} "Unauthorized" if no Clerk session
 * @throws {Error} "User not found in database" if user doesn't exist
 * @returns {Promise<AuthContext>} The user's authentication context
 * 
 * @example
 * ```typescript
 * // In an API route
 * export async function POST(req: Request) {
 *   const { userId, orgId, role } = await requireAuth();
 *   
 *   // Now you can use orgId to scope queries
 *   const { data } = await db
 *     .from("clients")
 *     .select("*")
 *     .eq("organization_id", orgId);
 * }
 * ```
 */
export async function requireAuth(): Promise<AuthContext> {
  return getAuthContext();
}
