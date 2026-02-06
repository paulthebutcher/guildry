import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { getDb, Client, ClientSizeTier } from "@/lib/db";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api";

// Validation schema for creating a client
const createClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  industry: z.string().optional(),
  size_tier: z.nativeEnum(ClientSizeTier).optional(),
  website_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/clients
 * List all clients for the authenticated user's organization
 * Query params:
 *   - search: Filter by client name (case-insensitive)
 */
export async function GET(req: Request) {
  try {
    const { orgId } = await getAuthContext();

    // Parse query params
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const db = getDb();
    let query = db
      .from("clients")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    // Apply search filter if provided
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: clients, error } = await query;

    if (error) {
      console.error("Failed to fetch clients:", error);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to fetch clients",
        500
      );
    }

    return apiSuccess<Client[]>(clients || []);
  } catch (error) {
    console.error("Error in GET /api/clients:", error);

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
 * POST /api/clients
 * Create a new client for the authenticated user's organization
 */
export async function POST(req: Request) {
  try {
    const { orgId } = await getAuthContext();

    // Parse and validate request body
    const body = await req.json();
    const validation = createClientSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");

      return apiError(ApiErrorCode.VALIDATION_ERROR, errorMessage, 400);
    }

    const data = validation.data;

    // Create the client
    const db = getDb();
    const { data: client, error } = await db
      .from("clients")
      .insert({
        organization_id: orgId,
        name: data.name,
        industry: data.industry || null,
        size_tier: data.size_tier || null,
        website_url: data.website_url || null,
        email: data.email || null,
        phone: data.phone || null,
        notes: data.notes || null,
        metadata: null,
      })
      .select()
      .single<Client>();

    if (error) {
      console.error("Failed to create client:", error);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to create client",
        500
      );
    }

    return apiSuccess<Client>(client, 201);
  } catch (error) {
    console.error("Error in POST /api/clients:", error);

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
