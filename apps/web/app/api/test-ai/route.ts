import { complete } from "@guildry/ai";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api";

/**
 * GET /api/test-ai
 * Test endpoint for Claude API integration
 * Sends a simple "Say hello" message to Claude
 */
export async function GET() {
  try {
    const result = await complete({
      messages: [
        {
          role: "user",
          content: "Say hello and introduce yourself briefly",
        },
      ],
      system: "You are a helpful AI assistant built into Guildry.",
      maxTokens: 200,
    });

    return apiSuccess({
      response: result.content,
      usage: result.usage,
      stopReason: result.stopReason,
    });
  } catch (error) {
    console.error("Error in test-ai route:", error);

    if (
      error instanceof Error &&
      error.message.includes("ANTHROPIC_API_KEY")
    ) {
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Claude API key not configured",
        500
      );
    }

    return apiError(
      ApiErrorCode.INTERNAL_ERROR,
      "Failed to complete Claude request",
      500
    );
  }
}
