import { getAuthContext } from "@/lib/auth";
import { getDb, Conversation } from "@/lib/db";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api";

/**
 * GET /api/conversations/[id]
 * Get a single conversation with all its messages
 * Includes messages ordered by created_at
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;

    const db = getDb();

    // Fetch conversation
    const { data: conversation, error: convError } = await db
      .from("conversations")
      .select("*")
      .eq("id", id)
      .eq("org_id", orgId)
      .single<Conversation>();

    if (convError || !conversation) {
      console.error("Conversation not found:", convError);
      return apiError(
        ApiErrorCode.NOT_FOUND,
        "Conversation not found",
        404
      );
    }

    // Fetch messages for this conversation
    const { data: messages, error: messagesError } = await db
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Failed to fetch messages:", messagesError);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to fetch messages",
        500
      );
    }

    return apiSuccess({
      ...conversation,
      messages: messages || [],
    });
  } catch (error) {
    console.error("Error in GET /api/conversations/[id]:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    }

    return apiError(
      ApiErrorCode.INTERNAL_ERROR,
      "Internal server error",
      500
    );
  }
}
