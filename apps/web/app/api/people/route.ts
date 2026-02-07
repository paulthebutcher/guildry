import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { getDb, Person, PersonType, AvailabilityStatus } from "@/lib/db";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api";

// Validation schema for creating a person
const createPersonSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(PersonType),
  email: z.string().email().optional().nullable(),
  location: z.string().optional().nullable(),
  hourly_rate: z.number().positive().optional().nullable(),
  currency: z.string().default("USD"),
  availability_status: z.nativeEnum(AvailabilityStatus).default(AvailabilityStatus.AVAILABLE),
  notes: z.string().optional().nullable(),
  skills: z
    .array(
      z.object({
        skill_name: z.string(),
        proficiency_level: z.number().int().min(1).max(5),
        years_experience: z.number().optional(),
      })
    )
    .optional(),
});

/**
 * GET /api/people
 * List all people for the authenticated user's organization
 * Query params:
 *   - type: Filter by person type (employee, contractor, referral)
 *   - availability: Filter by availability status
 *   - skill: Filter by skill name
 */
export async function GET(req: Request) {
  try {
    const { orgId } = await getAuthContext();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const availability = searchParams.get("availability");
    const skill = searchParams.get("skill");

    const db = getDb();
    let query = db
      .from("people")
      .select("*, person_skills(skill_id, proficiency_level, years_experience, skill:skills(id, name, category))")
      .eq("org_id", orgId)
      .order("name", { ascending: true });

    if (type) {
      query = query.eq("type", type);
    }
    if (availability) {
      query = query.eq("availability_status", availability);
    }

    const { data: people, error } = await query;

    if (error) {
      console.error("Failed to fetch people:", error);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to fetch people",
        500
      );
    }

    // If filtering by skill, we need to post-filter since it's a join
    let filteredPeople = people || [];
    if (skill) {
      filteredPeople = filteredPeople.filter((person) =>
        person.person_skills?.some(
          (ps: { skill: { name: string } }) =>
            ps.skill?.name?.toLowerCase().includes(skill.toLowerCase())
        )
      );
    }

    return apiSuccess<Person[]>(filteredPeople);
  } catch (error) {
    console.error("Error in GET /api/people:", error);

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
 * POST /api/people
 * Create a new person for the authenticated user's organization
 */
export async function POST(req: Request) {
  try {
    const { orgId } = await getAuthContext();

    const body = await req.json();
    const validation = createPersonSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");

      return apiError(ApiErrorCode.VALIDATION_ERROR, errorMessage, 400);
    }

    const data = validation.data;

    const db = getDb();

    // Create the person
    const { data: person, error: personError } = await db
      .from("people")
      .insert({
        org_id: orgId,
        name: data.name,
        type: data.type,
        email: data.email || null,
        location: data.location || null,
        hourly_rate: data.hourly_rate || null,
        currency: data.currency,
        availability_status: data.availability_status,
        notes: data.notes || null,
      })
      .select()
      .single<Person>();

    if (personError) {
      console.error("Failed to create person:", personError);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to create person",
        500
      );
    }

    // Link skills if provided
    if (data.skills && data.skills.length > 0) {
      // First, look up skill IDs by name (or create if they don't exist)
      for (const skillData of data.skills) {
        // Try to find existing skill
        const { data: existingSkill } = await db
          .from("skills")
          .select("id")
          .ilike("name", skillData.skill_name)
          .single();

        let skillId = existingSkill?.id;

        // If skill doesn't exist, we skip it (skills should be pre-seeded)
        // In a future iteration, we could create custom skills here
        if (skillId) {
          await db.from("person_skills").insert({
            person_id: person.id,
            skill_id: skillId,
            proficiency_level: skillData.proficiency_level,
            years_experience: skillData.years_experience || null,
          });
        }
      }
    }

    return apiSuccess<Person>(person, 201);
  } catch (error) {
    console.error("Error in POST /api/people:", error);

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
