# Dashboard Documentation

Complete dashboard interface with sidebar navigation, client management, and conversational AI.

## Structure

```
/dashboard                           - Dashboard home with stats
/clients                             - Client list
/clients/new                         - Add client (conversational)
/clients/[id]                        - Client detail
/conversations                       - Conversation list
/conversations/[id]                  - Continue conversation
```

## Layout Components

### Sidebar (`components/layout/sidebar.tsx`)

**Features:**
- Fixed width (w-64) on desktop
- Hidden on mobile, shown via overlay
- Logo at top
- Navigation links with icons:
  - Dashboard (Home icon)
  - Clients (Users icon)
  - Conversations (MessageSquare icon)
- Active route highlighting
- User section at bottom with Clerk UserButton

**Styling:**
- Active: `bg-accent-blueprint/10 text-accent-blueprint`
- Inactive: `text-slate-700 hover:bg-slate-100`

### Header (`components/layout/header.tsx`)

**Features:**
- Mobile only (hidden on md+)
- Hamburger menu button
- Page title
- UserButton

### Dashboard Layout (`app/(dashboard)/layout.tsx`)

**Features:**
- Client component for sidebar state management
- Responsive layout:
  - Desktop: Fixed sidebar + main content
  - Mobile: Overlay sidebar + hamburger menu
- Max-width container for content
- Slate-50 background

## Pages

### Dashboard Home (`/dashboard`)

**Features:**
- Welcome message
- Quick stats cards:
  - Total clients count
  - Active conversations count
- Quick action cards:
  - Add Client (links to conversational interface)
  - View Conversations

**Stats Query:**
```typescript
// Fetches counts from database
const clientCount = await db.from("clients").count();
const activeConversations = await db
  .from("conversations")
  .count()
  .eq("status", "active");
```

### Client List (`/clients`)

**Features:**
- Grid of client cards (responsive: 1/2/3 columns)
- "Add Client" button in header
- Empty state with call-to-action
- Server component (optimal performance)

**Each card shows:**
- Client name (prominent)
- Industry badge
- Size tier badge (color-coded)
- Website URL preview
- Hover effect

### New Client (`/clients/new`)

**Features:**
- Conversational interface for adding clients
- Creates conversation on mount
- Embeds ChatContainer
- Polls for completion
- Auto-redirects when done (2s delay)
- Loading state during initialization

**Flow:**
1. Page loads → Creates conversation
2. Shows chat interface
3. User chats with AI
4. AI creates client
5. Redirects to `/clients`

### Client Detail (`/clients/[id]`)

**Features:**
- Shows all client information
- Industry and size badges
- Clickable links (website, email, phone)
- Delete button with confirmation
- Server action for deletion
- Back link to client list
- Created/updated timestamps

**Layout:**
- White card with border
- Sections for different field types
- Grid for timestamps

### Conversations List (`/conversations`)

**Features:**
- List of all conversations (most recent first)
- Each item shows:
  - Title or "Untitled Conversation"
  - Status badge (Active/Completed/Archived)
  - Schema type (e.g., "client conversation")
  - Relative timestamp
- "New Conversation" button
- Empty state with call-to-action

**Status Badges:**
- Active: Blue with Clock icon
- Completed: Green with CheckCircle icon
- Archived: Gray with MessageSquare icon

### Conversation Detail (`/conversations/[id]`)

**Features:**
- Full-height chat interface
- Shows conversation title and schema
- Embeds ChatContainer for interaction
- Back link to conversations list
- Can continue closed conversations (view-only essentially)

## Navigation Flow

```
Landing Page (/) 
    ↓ (sign in)
Dashboard
    ├→ Clients List
    │   ├→ Add Client (Chat)
    │   └→ Client Detail (View/Delete)
    │
    └→ Conversations List
        └→ Conversation Detail (Chat)
```

## Responsive Design

### Desktop (md+)
- Sidebar always visible (left side)
- Content area takes remaining space
- Full-width navigation

### Mobile
- Sidebar hidden by default
- Hamburger menu opens overlay
- Click outside to close
- Compact layout

## Icons (lucide-react)

- `Home`: Dashboard
- `Users`: Clients
- `MessageSquare`: Conversations
- `Plus`: Add actions
- `Menu`: Mobile hamburger
- `CheckCircle`: Completed status
- `Clock`: Active status

## Color Scheme

**Primary Brand:** `accent-blueprint` (#0d9488)
- Navigation highlights
- Primary buttons
- Badges and accents

**Neutrals:** Slate scale
- Backgrounds: `bg-white`, `bg-slate-50`
- Borders: `border-slate-200`
- Text: `text-slate-900`, `text-slate-700`, `text-slate-600`, `text-slate-500`

## Data Flow

### Client Management
```
User clicks "Add Client"
  ↓
Create conversation (POST /api/conversations)
  ↓
Chat with AI (POST /api/conversations/:id/messages)
  ↓
AI creates client (processConversation executes create_client tool)
  ↓
Client appears in database
  ↓
User redirected to /clients
```

### Viewing Data
```
Dashboard → Shows counts
  ↓
Clients List → Fetches from /api/clients
  ↓
Client Detail → Server component query
```

## Authentication

All dashboard pages require authentication:
- Protected by Clerk middleware
- Uses `getAuthContext()` to get org context
- All queries scoped to `organization_id`
- UserButton for account management

## Performance

- **Server Components**: Used for list and detail pages (faster initial load)
- **Client Components**: Used for interactive features (sidebar, chat)
- **Optimistic Updates**: Chat UI updates immediately
- **Auto-scroll**: Smooth scroll in chat interface
- **Lazy Loading**: Components load as needed

## Future Enhancements

Placeholders in the UI for:
- Analytics dashboard
- Client editing (inline or modal)
- Conversation search/filter
- Export functionality
- Team collaboration features

## Development

### Run locally:
```bash
pnpm dev
```

### Build for production:
```bash
pnpm build
```

### Test the flow:
1. Sign in via Clerk
2. View dashboard with stats
3. Click "Add Client"
4. Chat with AI to create client
5. View client in list
6. Click client to see details
7. Navigate using sidebar

## Accessibility

- Semantic HTML throughout
- Proper ARIA labels on interactive elements
- Keyboard navigation support
- Focus states on all clickable items
- Screen reader friendly
