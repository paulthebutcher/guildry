import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { getDb, Retrospective } from "@/lib/db";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api";

// Validation schema for creating a retrospective
const createRetrospectiveSchema = z.object({
  project_id: z.string().uuid("Project ID is required"),
  hours_variance_pct: z.number().optional().nullable(),
  cost_variance_pct: z.number().optional().nullable(),
  scope_changes_count: z.number().int().nonnegative().default(0),
  client_satisfaction: z.number().min(1).max(5).optional().nullable(),
  what_worked: z.string().optional().nullable(),
  what_didnt: z.string().optional().nullable(),
  lessons: z.array(z.string()).optional().nullable(),
  would_repeat: z.boolean().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
});

/**
 * GET /api/retrospectives
 * List all retrospectives for the authenticated user's organization
 * Query params:
 *   - project_id: Filter by project
 *   - tag: Filter by tag
 */
export async function GET(req: Request) {
  try {
    const { orgId } = await getAuthContext();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");
    const tag = searchParams.get("tag");

    const db = getDb();

    // First get project IDs for this org
    const { data: orgProjects } = await db
      .from("projects")
      .select("id")
      .eq("org_id", orgId);

    const projectIds = orgProjects?.map((p) => p.id) || [];

    if (projectIds.length === 0) {
      return apiSuccess<Retrospective[]>([]);
    }

    let query = db
      .from("retrospectives")
      .select("*, project:projects(id, name, type, client:clients(id, name))")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    if (tag) {
      query = query.contains("tags", [tag]);
    }

    const { data: retrospectives, error } = await query;

    if (error) {
      console.error("Failed to fetch retrospectives:", error);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to fetch retrospectives",
        500
      );
    }

    return apiSuccess<Retrospective[]>(retrospectives || []);
  } catch (error) {
    console.error("Error in GET /api/retrospectives:", error);

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
 * POST /api/retrospectives
 * Create a new retrospective
 */
export async function POST(req: Request) {
  try {
    const { orgId } = await getAuthContext();

    const body = await req.json();
    const validation = createRetrospectiveSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");

      return apiError(ApiErrorCode.VALIDATION_ERROR, errorMessage, 400);
    }

    const data = validation.data;

    const db = getDb();

    // Verify the project belongs to this org
    const { data: project, error: projectError } = await db
      .from("projects")
      .select("id, org_id")
      .eq("id", data.project_id)
      .eq("org_id", orgId)
      .single();

    if (projectError || !project) {
      return apiError(ApiErrorCode.NOT_FOUND, "Project not found", 404);
    }

    // Create the retrospective
    const { data: retrospective, error: retroError } = await db
      .from("retrospectives")
      .insert({
        project_id: data.project_id,
        completed_at: new Date().toISOString(),
        hours_variance_pct: data.hours_variance_pct || null,
        cost_variance_pct: data.cost_variance_pct || null,
        scope_changes_count: data.scope_changes_count || 0,
        client_satisfaction: data.client_satisfaction || null,
        what_worked: data.what_worked || null,
        what_didnt: data.what_didnt || null,
        lessons: data.lessons || null,
        would_repeat: data.would_repeat ?? null,
        tags: data.tags || null,
      })
      .select()
      .single<Retrospective>();

    if (retroError) {
      console.error("Failed to create retrospective:", retroError);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to create retrospective",
        500
      );
    }

    return apiSuccess<Retrospective>(retrospective, 201);
  } catch (error) {
    console.error("Error in POST /api/retrospectives:", error);

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
