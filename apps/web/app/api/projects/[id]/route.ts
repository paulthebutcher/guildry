import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { getDb, Project, ProjectStatus, ProjectType } from "@/lib/db";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api";

// Validation schema for updating a project (all fields optional)
const updateProjectSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  client_id: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(ProjectType).optional().nullable(),
  status: z.nativeEnum(ProjectStatus).optional(),
  estimated_hours: z.number().positive().optional().nullable(),
  actual_hours: z.number().positive().optional().nullable(),
  estimated_cost: z.number().positive().optional().nullable(),
  actual_cost: z.number().positive().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
});

/**
 * GET /api/projects/[id]
 * Get a single project by ID with phases
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;

    const db = getDb();
    const { data: project, error } = await db
      .from("projects")
      .select("*, client:clients(id, name), phases(id, name, sort_order, estimated_hours, actual_hours, status)")
      .eq("id", id)
      .eq("org_id", orgId)
      .order("sort_order", { referencedTable: "phases", ascending: true })
      .single();

    if (error || !project) {
      console.error("Project not found:", error);
      return apiError(ApiErrorCode.NOT_FOUND, "Project not found", 404);
    }

    return apiSuccess(project);
  } catch (error) {
    console.error("Error in GET /api/projects/[id]:", error);

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
 * PATCH /api/projects/[id]
 * Update a project
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;

    const body = await req.json();
    const validation = updateProjectSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");

      return apiError(ApiErrorCode.VALIDATION_ERROR, errorMessage, 400);
    }

    const data = validation.data;

    // Check if project exists and belongs to org
    const db = getDb();
    const { data: existingProject, error: fetchError } = await db
      .from("projects")
      .select("id")
      .eq("id", id)
      .eq("org_id", orgId)
      .single();

    if (fetchError || !existingProject) {
      console.error("Project not found for update:", fetchError);
      return apiError(ApiErrorCode.NOT_FOUND, "Project not found", 404);
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.client_id !== undefined) updateData.client_id = data.client_id;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.estimated_hours !== undefined) updateData.estimated_hours = data.estimated_hours;
    if (data.actual_hours !== undefined) updateData.actual_hours = data.actual_hours;
    if (data.estimated_cost !== undefined) updateData.estimated_cost = data.estimated_cost;
    if (data.actual_cost !== undefined) updateData.actual_cost = data.actual_cost;
    if (data.start_date !== undefined) updateData.start_date = data.start_date;
    if (data.end_date !== undefined) updateData.end_date = data.end_date;
    if (data.tags !== undefined) updateData.tags = data.tags;

    // Update the project
    const { data: updatedProject, error: updateError } = await db
      .from("projects")
      .update(updateData)
      .eq("id", id)
      .eq("org_id", orgId)
      .select("*, client:clients(id, name)")
      .single<Project>();

    if (updateError || !updatedProject) {
      console.error("Failed to update project:", updateError);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to update project",
        500
      );
    }

    return apiSuccess<Project>(updatedProject);
  } catch (error) {
    console.error("Error in PATCH /api/projects/[id]:", error);

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
 * DELETE /api/projects/[id]
 * Delete a project (cascades to phases)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;

    const db = getDb();

    // Delete the project (cascades to phases via ON DELETE CASCADE)
    const { error } = await db
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("org_id", orgId);

    if (error) {
      console.error("Failed to delete project:", error);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to delete project",
        500
      );
    }

    return apiSuccess({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/projects/[id]:", error);

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
