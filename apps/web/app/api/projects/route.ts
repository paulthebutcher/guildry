import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { getDb, Project, ProjectStatus, ProjectType } from "@/lib/db";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api";

// Validation schema for creating a project
const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  client_id: z.string().uuid().optional(),
  description: z.string().optional(),
  type: z.nativeEnum(ProjectType).optional(),
  estimated_hours: z.number().positive().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  tags: z.array(z.string()).optional(),
  phases: z
    .array(
      z.object({
        name: z.string(),
        estimated_hours: z.number().positive(),
      })
    )
    .optional(),
});

/**
 * GET /api/projects
 * List all projects for the authenticated user's organization
 * Query params:
 *   - status: Filter by project status
 *   - client_id: Filter by client
 */
export async function GET(req: Request) {
  try {
    const { orgId } = await getAuthContext();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("client_id");

    const db = getDb();
    let query = db
      .from("projects")
      .select("*, client:clients(id, name)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }
    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error("Failed to fetch projects:", error);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to fetch projects",
        500
      );
    }

    return apiSuccess<Project[]>(projects || []);
  } catch (error) {
    console.error("Error in GET /api/projects:", error);

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
 * POST /api/projects
 * Create a new project for the authenticated user's organization
 */
export async function POST(req: Request) {
  try {
    const { orgId } = await getAuthContext();

    const body = await req.json();
    const validation = createProjectSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");

      return apiError(ApiErrorCode.VALIDATION_ERROR, errorMessage, 400);
    }

    const data = validation.data;

    const db = getDb();

    // Create the project
    const { data: project, error: projectError } = await db
      .from("projects")
      .insert({
        org_id: orgId,
        name: data.name,
        client_id: data.client_id || null,
        description: data.description || null,
        type: data.type || null,
        status: ProjectStatus.DRAFT,
        estimated_hours: data.estimated_hours || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        tags: data.tags || null,
      })
      .select()
      .single<Project>();

    if (projectError) {
      console.error("Failed to create project:", projectError);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to create project",
        500
      );
    }

    // Create phases if provided
    if (data.phases && data.phases.length > 0) {
      const phasesWithOrder = data.phases.map((phase, index) => ({
        project_id: project.id,
        name: phase.name,
        estimated_hours: phase.estimated_hours,
        sort_order: index,
        status: "planned",
      }));

      const { error: phasesError } = await db.from("phases").insert(phasesWithOrder);

      if (phasesError) {
        console.error("Failed to create phases:", phasesError);
        // Project was created, phases failed - log but don't fail the request
      }
    }

    return apiSuccess<Project>(project, 201);
  } catch (error) {
    console.error("Error in POST /api/projects:", error);

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
