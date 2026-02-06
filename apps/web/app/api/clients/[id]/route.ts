import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { getDb, Client, ClientSizeTier } from "@/lib/db";
import { apiError, apiSuccess, ApiErrorCode } from "@/lib/api";

// Validation schema for updating a client (all fields optional)
const updateClientSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  industry: z.string().optional(),
  size_tier: z.nativeEnum(ClientSizeTier).optional(),
  website_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/clients/[id]
 * Get a single client by ID (must belong to user's organization)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;

    const db = getDb();
    const { data: client, error } = await db
      .from("clients")
      .select("*")
      .eq("id", id)
      .eq("organization_id", orgId)
      .single<Client>();

    if (error || !client) {
      console.error("Client not found:", error);
      return apiError(ApiErrorCode.NOT_FOUND, "Client not found", 404);
    }

    return apiSuccess<Client>(client);
  } catch (error) {
    console.error("Error in GET /api/clients/[id]:", error);

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
 * PATCH /api/clients/[id]
 * Update a client (must belong to user's organization)
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;

    // Parse and validate request body
    const body = await req.json();
    const validation = updateClientSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");

      return apiError(ApiErrorCode.VALIDATION_ERROR, errorMessage, 400);
    }

    const data = validation.data;

    // Check if client exists and belongs to org
    const db = getDb();
    const { data: existingClient, error: fetchError } = await db
      .from("clients")
      .select("id")
      .eq("id", id)
      .eq("organization_id", orgId)
      .single();

    if (fetchError || !existingClient) {
      console.error("Client not found for update:", fetchError);
      return apiError(ApiErrorCode.NOT_FOUND, "Client not found", 404);
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.industry !== undefined) updateData.industry = data.industry || null;
    if (data.size_tier !== undefined) updateData.size_tier = data.size_tier || null;
    if (data.website_url !== undefined) updateData.website_url = data.website_url || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    // Update the client
    const { data: updatedClient, error: updateError } = await db
      .from("clients")
      .update(updateData)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select()
      .single<Client>();

    if (updateError || !updatedClient) {
      console.error("Failed to update client:", updateError);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to update client",
        500
      );
    }

    return apiSuccess<Client>(updatedClient);
  } catch (error) {
    console.error("Error in PATCH /api/clients/[id]:", error);

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
 * DELETE /api/clients/[id]
 * Delete a client (must belong to user's organization)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await getAuthContext();
    const { id } = await params;

    const db = getDb();

    // Delete the client (will only delete if belongs to org)
    const { error } = await db
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) {
      console.error("Failed to delete client:", error);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to delete client",
        500
      );
    }

    return apiSuccess({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/clients/[id]:", error);

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
