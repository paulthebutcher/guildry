import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";

/**
 * Example API route demonstrating the auth helper
 * GET /api/example - Returns current user's organization context
 */
export async function GET() {
  try {
    // Get the authenticated user context
    const { userId, orgId, role, clerkUserId } = await requireAuth();

    // Use the org context to fetch organization details
    const db = getDb();
    const { data: organization, error } = await db
      .from("organizations")
      .select("id, name, slug, status")
      .eq("id", orgId)
      .single();

    if (error) {
      console.error("Failed to fetch organization:", error);
      return Response.json(
        { error: "Failed to fetch organization" },
        { status: 500 }
      );
    }

    // Return the user's context
    return Response.json({
      user: {
        id: userId,
        clerkUserId,
        role,
      },
      organization,
    });
  } catch (error) {
    console.error("Auth error:", error);

    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "User not found in database") {
        return Response.json(
          { error: "User not synced to database yet" },
          { status: 404 }
        );
      }
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
