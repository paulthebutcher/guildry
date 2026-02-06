# Clerk Webhook Handler

This webhook handler syncs Clerk user data to the Supabase database.

## Setup Instructions

### 1. Add the Webhook Secret to `.env.local`

```bash
CLERK_WEBHOOK_SECRET=whsec_your_secret_here
```

### 2. Configure the Webhook in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Webhooks** in the sidebar
4. Click **Add Endpoint**
5. Set the endpoint URL:
   - **Development**: Use a tool like [ngrok](https://ngrok.com) or [localtunnel](https://localtunnel.github.io/www/) to expose your local server
   - **Production**: `https://yourdomain.com/api/webhooks/clerk`
6. Subscribe to these events:
   - `user.created`
   - `user.updated`
7. Copy the **Signing Secret** and add it to your `.env.local` as `CLERK_WEBHOOK_SECRET`

### 3. Test the Webhook

After setting up, test by:
1. Creating a new user in your app (sign up)
2. Check your server logs - you should see:
   ```
   Received webhook event: user.created
   Creating user for Clerk ID: user_...
   Creating organization: FirstName's Workspace (org-12345678)
   Organization created with ID: ...
   User created with ID: ...
   ```
3. Verify in Supabase that the `organizations` and `users` tables have new records

## What This Webhook Does

### `user.created` Event

When a user signs up through Clerk:

1. **Creates an Organization**:
   - Name: `"[First Name]'s Workspace"` or `"My Workspace"` if no name
   - Slug: `"org-[first 8 chars of Clerk user ID]"`
   - Status: `active`

2. **Creates a User**:
   - Links to the new organization
   - Role: `owner`
   - Syncs email, name, and avatar from Clerk
   - Uses upsert pattern (won't fail if user already exists)

### `user.updated` Event

When a user updates their profile in Clerk:

- Updates email, first name, last name, and avatar URL in Supabase
- Matches user by `clerk_user_id`

## Error Handling

The webhook:
- Returns `400` for missing headers or invalid signatures
- Returns `500` for database errors
- Returns `200` for successful processing or unhandled events
- Logs all actions and errors to the console

## Security Notes

- Webhook signature is verified using `svix` before processing
- Route is excluded from Clerk middleware (public endpoint)
- Uses service role client (bypasses RLS) - only for server-side use
- Webhook secret should never be exposed to the client

## Troubleshooting

### "Missing svix headers"
- Check that Clerk is sending the webhook with proper headers
- Verify the endpoint URL is correct in Clerk Dashboard

### "Invalid webhook signature"
- Double-check that `CLERK_WEBHOOK_SECRET` matches the signing secret from Clerk Dashboard
- Ensure you copied the entire secret including the `whsec_` prefix

### "Failed to create organization/user"
- Check Supabase logs for detailed error messages
- Verify that `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Ensure your Supabase tables (`organizations`, `users`) have the correct schema
