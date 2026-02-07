import { getAuthContext } from "@/lib/auth";
import { getDb, Skill } from "@/lib/db";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api";

/**
 * GET /api/skills
 * List all available skills (these are global, not org-specific)
 * Query params:
 *   - category: Filter by skill category
 *   - search: Search by skill name
 */
export async function GET(req: Request) {
  try {
    // Still need to be authenticated
    await getAuthContext();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const db = getDb();
    let query = db
      .from("skills")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: skills, error } = await query;

    if (error) {
      console.error("Failed to fetch skills:", error);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to fetch skills",
        500
      );
    }

    return apiSuccess<Skill[]>(skills || []);
  } catch (error) {
    console.error("Error in GET /api/skills:", error);

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
