# API Reference

All API routes are prefixed with `/api` and require authentication (except webhooks).

## Authentication

All requests (except webhooks) require a valid Clerk session. The session is automatically handled by the Clerk middleware.

## Response Format

### Success
```json
{
  "data": { ... },
  "meta": { ... }  // optional pagination, etc.
}
```

### Error
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }  // optional
  }
}
```

## Endpoints

### Clients

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | List all clients for the org |
| POST | `/api/clients` | Create a new client |
| GET | `/api/clients/[id]` | Get a specific client |
| PATCH | `/api/clients/[id]` | Update a client |
| DELETE | `/api/clients/[id]` | Delete a client |

**Query Parameters (GET /api/clients):**
- `search` - Filter by name (partial match)
- `industry` - Filter by industry
- `size_tier` - Filter by size tier

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | List all conversations |
| POST | `/api/conversations` | Start a new conversation |
| GET | `/api/conversations/[id]` | Get conversation details |
| GET | `/api/conversations/[id]/messages` | Get messages in conversation |
| POST | `/api/conversations/[id]/messages` | Send a message (triggers AI response) |

**POST /api/conversations Body:**
```json
{
  "target_schema": "client",  // "client", "project", "retro"
  "intent": "Create a new client"  // optional description
}
```

**POST /api/conversations/[id]/messages Body:**
```json
{
  "content": "The user's message"
}
```

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/clerk` | Clerk user/org sync webhook |

The Clerk webhook handles:
- `user.created` - Creates user in Supabase
- `user.updated` - Updates user in Supabase
- `organization.created` - Creates org in Supabase

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized for this resource |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limiting

Currently no rate limiting is implemented. Will be added in production.

## Pagination

For list endpoints, pagination will be supported via:
- `limit` - Number of items per page (default: 50, max: 100)
- `offset` - Number of items to skip
- `cursor` - Cursor-based pagination (preferred for large datasets)

Response includes:
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```
