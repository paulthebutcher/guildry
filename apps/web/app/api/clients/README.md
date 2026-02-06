# Client API Documentation

CRUD API endpoints for managing clients in Guildry.

## Base URL

All routes are prefixed with `/api/clients`

## Authentication

All routes require authentication via Clerk. Include the Clerk session cookie in your requests.

## Endpoints

### List Clients

**GET** `/api/clients`

Get all clients for the authenticated user's organization.

**Query Parameters:**
- `search` (optional): Filter clients by name (case-insensitive partial match)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "name": "Acme Corp",
      "industry": "Technology",
      "size_tier": "enterprise",
      "website_url": "https://acme.com",
      "email": "contact@acme.com",
      "phone": "+1234567890",
      "notes": "Important client",
      "metadata": null,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Client

**POST** `/api/clients`

Create a new client for the authenticated user's organization.

**Request Body:**
```json
{
  "name": "Acme Corp",          // Required
  "industry": "Technology",      // Optional
  "size_tier": "enterprise",     // Optional: startup, smb, mid, enterprise
  "website_url": "https://acme.com", // Optional
  "email": "contact@acme.com",   // Optional
  "phone": "+1234567890",        // Optional
  "notes": "Important client"    // Optional
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "organization_id": "uuid",
    "name": "Acme Corp",
    // ... full client object
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR`: Invalid request data
- `401 UNAUTHORIZED`: Not authenticated
- `500 INTERNAL_ERROR`: Server error

### Get Single Client

**GET** `/api/clients/:id`

Get a single client by ID (must belong to user's organization).

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "organization_id": "uuid",
    "name": "Acme Corp",
    // ... full client object
  }
}
```

**Errors:**
- `404 NOT_FOUND`: Client not found or doesn't belong to user's org
- `401 UNAUTHORIZED`: Not authenticated
- `500 INTERNAL_ERROR`: Server error

### Update Client

**PATCH** `/api/clients/:id`

Update a client (must belong to user's organization).

**Request Body:** (all fields optional)
```json
{
  "name": "Acme Corporation",
  "industry": "Tech",
  "size_tier": "enterprise",
  "website_url": "https://acme.co",
  "email": "new@acme.com",
  "phone": "+9876543210",
  "notes": "Updated notes"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    // ... updated client object
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR`: Invalid request data
- `404 NOT_FOUND`: Client not found or doesn't belong to user's org
- `401 UNAUTHORIZED`: Not authenticated
- `500 INTERNAL_ERROR`: Server error

### Delete Client

**DELETE** `/api/clients/:id`

Delete a client (must belong to user's organization).

**Response:** `200 OK`
```json
{
  "data": {
    "success": true
  }
}
```

**Errors:**
- `401 UNAUTHORIZED`: Not authenticated
- `500 INTERNAL_ERROR`: Server error

## Error Response Format

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "name: Name is required"
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `INTERNAL_ERROR`: Server error

## Client Size Tiers

Valid values for `size_tier`:
- `startup`: Startup companies
- `smb`: Small/Medium Business
- `mid`: Mid-market companies
- `enterprise`: Enterprise companies

## Multi-Tenancy

All endpoints automatically scope data to the authenticated user's organization. You cannot access or modify clients from other organizations.

## Usage Examples

### List all clients

```typescript
const response = await fetch("/api/clients");
const { data } = await response.json();
console.log(data); // Array of clients
```

### Search clients

```typescript
const response = await fetch("/api/clients?search=acme");
const { data } = await response.json();
```

### Create a client

```typescript
const response = await fetch("/api/clients", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "New Client",
    industry: "Technology",
    size_tier: "smb",
  }),
});
const { data } = await response.json();
```

### Update a client

```typescript
const response = await fetch(`/api/clients/${clientId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    notes: "Updated notes",
  }),
});
const { data } = await response.json();
```

### Delete a client

```typescript
const response = await fetch(`/api/clients/${clientId}`, {
  method: "DELETE",
});
const { data } = await response.json();
```
