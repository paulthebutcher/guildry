import { getAuthContext } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api";

/**
 * GET /api/conversations
 * List all conversations for the authenticated user's organization
 * Returns most recent conversations first
 */
export async function GET() {
  try {
    const { orgId } = await getAuthContext();

    const db = getDb();
    const { data: conversations, error } = await db
      .from("conversations")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch conversations:", error);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to fetch conversations",
        500
      );
    }

    return apiSuccess(conversations || []);
  } catch (error) {
    console.error("Error in GET /api/conversations:", error);

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

/**
 * POST /api/conversations
 * Create a new conversation
 * 
 * Body:
 *   - target_schema: string (e.g., 'client')
 *   - intent?: string (optional description of what user wants)
 */
export async function POST(req: Request) {
  try {
    const { orgId } = await getAuthContext();

    const body = await req.json();
    const { target_schema, intent } = body;

    if (!target_schema) {
      return apiError(
        ApiErrorCode.VALIDATION_ERROR,
        "target_schema is required",
        400
      );
    }

    // Get the user ID for the conversation
    const { userId } = await getAuthContext();

    const db = getDb();
    const { data: conversation, error } = await db
      .from("conversations")
      .insert({
        org_id: orgId,
        user_id: userId,
        target_schema,
        intent: intent || null,
        status: "active",
        extracted_data: {},
        created_entities: {},
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create conversation:", error);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to create conversation",
        500
      );
    }

    return apiSuccess(conversation, 201);
  } catch (error) {
    console.error("Error in POST /api/conversations:", error);

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
