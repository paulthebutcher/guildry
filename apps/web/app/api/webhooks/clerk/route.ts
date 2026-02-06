import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!CLERK_WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing svix headers");
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.text();

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the webhook signature
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log(`Received webhook event: ${eventType}`);

  try {
    if (eventType === "user.created") {
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;

      console.log(`Creating user for Clerk ID: ${id}`);

      const primaryEmail = email_addresses.find(
        (email) => email.id === evt.data.primary_email_address_id
      );

      if (!primaryEmail) {
        console.error("No primary email found for user");
        return new Response("No primary email found", { status: 400 });
      }

      const db = getDb();

      // Create organization for the user
      const orgName = first_name
        ? `${first_name}'s Workspace`
        : "My Workspace";
      const orgSlug = `org-${id.slice(0, 8)}`;

      console.log(`Creating organization: ${orgName} (${orgSlug})`);

      const { data: organization, error: orgError } = await db
        .from("organizations")
        .insert({
          name: orgName,
          slug: orgSlug,
        })
        .select()
        .single();

      if (orgError) {
        console.error("Error creating organization:", orgError);
        return new Response("Failed to create organization", { status: 500 });
      }

      console.log(`Organization created with ID: ${organization.id}`);

      // Create user linked to the organization
      const { data: user, error: userError } = await db
  .from("users")
  .upsert(
    {
      clerk_user_id: id,
      org_id: organization.id,  // was organization_id
      email: primaryEmail.email_address,
      name: [first_name, last_name].filter(Boolean).join(' ') || null,  // combine into name
      role: 'owner',  // string, not enum
    },
    {
      onConflict: "clerk_user_id",
    }
  )
  .select()
  .single();

      if (userError) {
        console.error("Error creating user:", userError);
        return new Response("Failed to create user", { status: 500 });
      }

      console.log(`User created with ID: ${user.id}`);

      return new Response("User created successfully", { status: 200 });
    }

    if (eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;

      console.log(`Updating user for Clerk ID: ${id}`);

      const primaryEmail = email_addresses.find(
        (email) => email.id === evt.data.primary_email_address_id
      );

      if (!primaryEmail) {
        console.error("No primary email found for user");
        return new Response("No primary email found", { status: 400 });
      }

      const db = getDb();

      // Update the user
      const { data: user, error: userError } = await db
        .from("users")
        .update({
          email: primaryEmail.email_address,
          name: [first_name, last_name].filter(Boolean).join(' ') || null,
        })
        .eq("clerk_user_id", id)
        .select()
        .single();

      if (userError) {
        console.error("Error updating user:", userError);
        return new Response("Failed to update user", { status: 500 });
      }

      console.log(`User updated: ${user.id}`);

      return new Response("User updated successfully", { status: 200 });
    }

    // Log unhandled event types
    console.log(`Unhandled webhook event type: ${eventType}`);
    return new Response("Event type not handled", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
