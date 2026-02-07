import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { getDb, Person, PersonType, AvailabilityStatus } from "@/lib/db";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api";

// Validation schema for updating a person
const updatePersonSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.nativeEnum(PersonType).optional(),
  email: z.string().email().optional().nullable(),
  location: z.string().optional().nullable(),
  hourly_rate: z.number().positive().optional().nullable(),
  currency: z.string().optional(),
  availability_status: z.nativeEnum(AvailabilityStatus).optional(),
  rating: z.number().min(1).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/people/:id
 * Get a single person by ID with their skills
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;

    const db = getDb();
    const { data: person, error } = await db
      .from("people")
      .select("*, person_skills(skill_id, proficiency_level, years_experience, skill:skills(id, name, category))")
      .eq("id", id)
      .eq("org_id", orgId)
      .single<Person>();

    if (error || !person) {
      return apiError(ApiErrorCode.NOT_FOUND, "Person not found", 404);
    }

    return apiSuccess<Person>(person);
  } catch (error) {
    console.error("Error in GET /api/people/:id:", error);

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
 * PATCH /api/people/:id
 * Update a person's details
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;

    const body = await req.json();
    const validation = updatePersonSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");

      return apiError(ApiErrorCode.VALIDATION_ERROR, errorMessage, 400);
    }

    const data = validation.data;

    const db = getDb();

    // Update the person
    const { data: person, error } = await db
      .from("people")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("org_id", orgId)
      .select()
      .single<Person>();

    if (error || !person) {
      if (error?.code === "PGRST116") {
        return apiError(ApiErrorCode.NOT_FOUND, "Person not found", 404);
      }
      console.error("Failed to update person:", error);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to update person",
        500
      );
    }

    return apiSuccess<Person>(person);
  } catch (error) {
    console.error("Error in PATCH /api/people/:id:", error);

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
 * DELETE /api/people/:id
 * Delete a person from the organization
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;

    const db = getDb();

    // First, delete related person_skills
    await db.from("person_skills").delete().eq("person_id", id);

    // Delete the person
    const { error } = await db
      .from("people")
      .delete()
      .eq("id", id)
      .eq("org_id", orgId);

    if (error) {
      console.error("Failed to delete person:", error);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to delete person",
        500
      );
    }

    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("Error in DELETE /api/people/:id:", error);

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
