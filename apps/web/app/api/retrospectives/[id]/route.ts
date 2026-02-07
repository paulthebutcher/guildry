import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { getDb, Retrospective } from "@/lib/db";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api";

// Validation schema for updating a retrospective
const updateRetrospectiveSchema = z.object({
  hours_variance_pct: z.number().optional().nullable(),
  cost_variance_pct: z.number().optional().nullable(),
  scope_changes_count: z.number().int().nonnegative().optional(),
  client_satisfaction: z.number().min(1).max(5).optional().nullable(),
  what_worked: z.string().optional().nullable(),
  what_didnt: z.string().optional().nullable(),
  lessons: z.array(z.string()).optional().nullable(),
  would_repeat: z.boolean().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/retrospectives/:id
 * Get a single retrospective by ID with project details
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;

    const db = getDb();

    // Get retrospective with project info
    const { data: retrospective, error } = await db
      .from("retrospectives")
      .select("*, project:projects(id, name, type, description, estimated_hours, actual_hours, client:clients(id, name))")
      .eq("id", id)
      .single<Retrospective>();

    if (error || !retrospective) {
      return apiError(ApiErrorCode.NOT_FOUND, "Retrospective not found", 404);
    }

    // Verify the project belongs to this org
    const { data: project } = await db
      .from("projects")
      .select("org_id")
      .eq("id", retrospective.project_id)
      .single();

    if (!project || project.org_id !== orgId) {
      return apiError(ApiErrorCode.NOT_FOUND, "Retrospective not found", 404);
    }

    return apiSuccess<Retrospective>(retrospective);
  } catch (error) {
    console.error("Error in GET /api/retrospectives/:id:", error);

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
 * PATCH /api/retrospectives/:id
 * Update a retrospective's details
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;

    const body = await req.json();
    const validation = updateRetrospectiveSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");

      return apiError(ApiErrorCode.VALIDATION_ERROR, errorMessage, 400);
    }

    const data = validation.data;

    const db = getDb();

    // First verify retrospective exists and belongs to org's project
    const { data: existing } = await db
      .from("retrospectives")
      .select("project_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return apiError(ApiErrorCode.NOT_FOUND, "Retrospective not found", 404);
    }

    const { data: project } = await db
      .from("projects")
      .select("org_id")
      .eq("id", existing.project_id)
      .single();

    if (!project || project.org_id !== orgId) {
      return apiError(ApiErrorCode.NOT_FOUND, "Retrospective not found", 404);
    }

    // Update the retrospective
    const { data: retrospective, error } = await db
      .from("retrospectives")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single<Retrospective>();

    if (error || !retrospective) {
      console.error("Failed to update retrospective:", error);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to update retrospective",
        500
      );
    }

    return apiSuccess<Retrospective>(retrospective);
  } catch (error) {
    console.error("Error in PATCH /api/retrospectives/:id:", error);

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
 * DELETE /api/retrospectives/:id
 * Delete a retrospective
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;

    const db = getDb();

    // First verify retrospective exists and belongs to org's project
    const { data: existing } = await db
      .from("retrospectives")
      .select("project_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return apiError(ApiErrorCode.NOT_FOUND, "Retrospective not found", 404);
    }

    const { data: project } = await db
      .from("projects")
      .select("org_id")
      .eq("id", existing.project_id)
      .single();

    if (!project || project.org_id !== orgId) {
      return apiError(ApiErrorCode.NOT_FOUND, "Retrospective not found", 404);
    }

    // Delete the retrospective
    const { error } = await db
      .from("retrospectives")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete retrospective:", error);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to delete retrospective",
        500
      );
    }

    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("Error in DELETE /api/retrospectives/:id:", error);

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
