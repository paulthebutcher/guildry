import { getAuthContext } from "@/lib/auth";
import { getDb, Message, MessageRole, ConversationStatus } from "@/lib/db";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api";
import { processConversation } from "@guildry/ai";

/**
 * GET /api/conversations/[id]/messages
 * Get all messages for a conversation
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;

    const db = getDb();

    // Verify conversation belongs to user's org
    const { data: conversation, error: convError } = await db
      .from("conversations")
      .select("id")
      .eq("id", id)
      .eq("organization_id", orgId)
      .single();

    if (convError || !conversation) {
      return apiError(
        ApiErrorCode.NOT_FOUND,
        "Conversation not found",
        404
      );
    }

    // Fetch messages
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

    return apiSuccess<Message[]>(messages || []);
  } catch (error) {
    console.error("Error in GET /api/conversations/[id]/messages:", error);

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
 * POST /api/conversations/[id]/messages
 * Send a message and get AI response
 * 
 * Body:
 *   - content: string (user's message)
 * 
 * Flow:
 *   1. Save user message to DB
 *   2. Call processConversation from @guildry/ai
 *   3. Save assistant message to DB
 *   4. If completed, update conversation status
 *   5. Return both messages + metadata
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await getAuthContext();
    const { id: conversationId } = await params;

    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== "string") {
      return apiError(
        ApiErrorCode.VALIDATION_ERROR,
        "content is required and must be a string",
        400
      );
    }

    const db = getDb();

    // Verify conversation belongs to user's org and fetch it
    const { data: conversation, error: convError } = await db
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("organization_id", orgId)
      .single();

    if (convError || !conversation) {
      console.error("Conversation not found:", convError);
      return apiError(
        ApiErrorCode.NOT_FOUND,
        "Conversation not found",
        404
      );
    }

    // Save user message to database
    const { data: userMessage, error: userMessageError } = await db
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: MessageRole.USER,
        content,
        metadata: null,
      })
      .select()
      .single<Message>();

    if (userMessageError || !userMessage) {
      console.error("Failed to save user message:", userMessageError);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to save message",
        500
      );
    }

    // Process conversation with AI
    let aiResult;
    try {
      aiResult = await processConversation(conversation, content);
    } catch (error) {
      console.error("Failed to process conversation with AI:", error);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to process conversation",
        500
      );
    }

    // Save assistant message to database
    const { data: assistantMessage, error: assistantMessageError } = await db
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: MessageRole.ASSISTANT,
        content: aiResult.content,
        metadata: {
          toolCalls: aiResult.toolCalls,
          createdEntities: aiResult.createdEntities,
        },
      })
      .select()
      .single<Message>();

    if (assistantMessageError || !assistantMessage) {
      console.error("Failed to save assistant message:", assistantMessageError);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to save assistant response",
        500
      );
    }

    // Update conversation status if completed
    if (aiResult.completed) {
      const { error: updateError } = await db
        .from("conversations")
        .update({ status: ConversationStatus.CLOSED })
        .eq("id", conversationId);

      if (updateError) {
        console.error("Failed to update conversation status:", updateError);
        // Don't fail the request, just log the error
      }
    }

    return apiSuccess({
      userMessage,
      assistantMessage,
      completed: aiResult.completed,
      createdEntities: aiResult.createdEntities,
    });
  } catch (error) {
    console.error("Error in POST /api/conversations/[id]/messages:", error);

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
