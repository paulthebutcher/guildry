# Error Handling and Loading States

Comprehensive error handling and loading states throughout the application.

## Architecture

### 1. Error Utilities (`lib/errors.ts`)

**Core Functions:**

- `captureError(error, context?)`: Logs errors for debugging, prepared for Sentry integration
- `isApiError(error)`: Type guard for API error responses
- `getErrorMessage(error)`: Extracts user-friendly messages from any error type
- `ERROR_MESSAGES`: Common error messages for consistency

**Usage:**
```typescript
import { captureError, getErrorMessage } from "@/lib/errors";

try {
  // ... operation
} catch (err) {
  captureError(err, { context: "operation_name", userId });
  setError(getErrorMessage(err));
}
```

### 2. UI Components

#### Skeleton (`components/ui/skeleton.tsx`)

Reusable loading placeholder with pulse animation.

```typescript
<Skeleton className="h-8 w-64" />
```

**Props:**
- `className`: Tailwind classes for sizing/positioning

**Styling:**
- `animate-pulse`: Built-in Tailwind animation
- `bg-slate-200`: Neutral gray color
- `rounded`: Matches component shapes

#### ErrorMessage (`components/ui/error-message.tsx`)

Displays errors with optional retry functionality.

```typescript
<ErrorMessage
  title="Something went wrong"
  message="Failed to load data"
  retry={() => refetch()}
/>
```

**Props:**
- `title?`: Optional heading
- `message`: Error description (required)
- `retry?`: Optional callback for retry button

**Styling:**
- Red-tinted (`bg-red-50`, `border-red-200`)
- Alert icon from `lucide-react`
- Prominent retry button if provided

### 3. Route-Level Error Boundaries

#### Dashboard Error Boundary (`app/(dashboard)/error.tsx`)

Catches errors in any dashboard route.

**Features:**
- Client component (required for error boundaries)
- Logs error with `captureError` and digest
- Displays friendly error message
- Provides "Try Again" button that calls `reset()`

**When it triggers:**
- Server component throws during render
- Data fetching fails
- Unexpected runtime errors

#### Other Error Boundaries

Create similar `error.tsx` files in route segments as needed:
- `app/(auth)/error.tsx`
- `app/(dashboard)/clients/error.tsx`
- etc.

### 4. Loading States

#### Dashboard Loading (`app/(dashboard)/loading.tsx`)

Shows skeleton while dashboard page loads.

**Structure:**
- Header skeleton (title + subtitle)
- Stats cards (2 skeletons)
- Quick action cards (2 skeletons)

#### Clients Loading (`app/(dashboard)/clients/loading.tsx`)

Shows skeleton grid while clients load.

**Structure:**
- Header skeleton (title + button)
- 6 client card skeletons in responsive grid

#### Client Detail Loading (`app/(dashboard)/clients/[id]/loading.tsx`)

Shows skeleton for individual client page.

**Structure:**
- Back link skeleton
- Card with header (title + badges + button)
- Field skeletons (multiple sections)

### 5. Component-Level Error Handling

#### ChatContainer Updates

Enhanced with comprehensive error handling:

**Features:**
- Uses `captureError` for all errors
- Uses `getErrorMessage` for display
- Shows `ErrorMessage` component with retry
- Uses `Skeleton` component for loading
- Handles both fetch and send errors separately

**Error States:**
```typescript
// Loading messages
if (isLoading) return <Skeleton />;

// Error fetching
if (error) return <ErrorMessage retry={handleRetry} />;

// Error sending (inline)
{error && <ErrorMessage message={error} />}
```

#### ChatInput Updates

Added visual error state:

**Props:**
- `error?: boolean`: Highlights input in red when true

**Styling:**
```typescript
className={`... ${
  error
    ? "border-red-300 focus:ring-red-500"
    : "border-slate-300 focus:ring-accent-blueprint"
}`}
```

## Loading State Patterns

### Server Components (Automatic)

Next.js automatically shows `loading.tsx` while server components fetch data:

```typescript
// app/(dashboard)/clients/page.tsx
export default async function ClientsPage() {
  const clients = await fetchClients(); // Shows loading.tsx during fetch
  return <ClientList clients={clients} />;
}
```

### Client Components (Manual)

Use state to manage loading:

```typescript
const [isLoading, setIsLoading] = useState(true);
const [data, setData] = useState(null);

useEffect(() => {
  async function load() {
    setIsLoading(true);
    try {
      const result = await fetchData();
      setData(result);
    } finally {
      setIsLoading(false);
    }
  }
  load();
}, []);

if (isLoading) return <Skeleton className="h-full" />;
```

## Error Handling Patterns

### API Routes

Consistent error responses:

```typescript
import { apiError, ApiErrorCode } from "@/lib/api";
import { captureError } from "@/lib/errors";

try {
  // ... operation
} catch (error) {
  captureError(error, { route: "/api/clients" });
  return apiError(
    ApiErrorCode.INTERNAL_ERROR,
    "Failed to fetch clients",
    500
  );
}
```

### Server Components

Throw errors to trigger nearest error boundary:

```typescript
export default async function ClientPage({ params }: Props) {
  const client = await getClient(params.id);
  
  if (!client) {
    throw new Error("Client not found");
  }
  
  return <ClientDetail client={client} />;
}
```

### Client Components

Use state and display inline:

```typescript
const [error, setError] = useState<string | null>(null);

try {
  // ... operation
} catch (err) {
  captureError(err);
  setError(getErrorMessage(err));
}

return (
  <>
    {error && <ErrorMessage message={error} retry={handleRetry} />}
    {/* ... rest of UI */}
  </>
);
```

## Styling Guidelines (from UI_STANDARDS.md)

### Loading States

- **Color**: `bg-slate-200` for skeletons
- **Animation**: `animate-pulse` from Tailwind
- **Shape**: Match the component being loaded (height, width, rounded)
- **Layout**: Preserve space to prevent layout shift

### Error States

- **Background**: `bg-red-50`
- **Border**: `border-red-200`
- **Text**: `text-red-800` for message, `text-red-900` for title
- **Button**: `bg-red-600 hover:bg-red-700` for retry
- **Icon**: `text-red-600` (AlertCircle from lucide-react)

### Empty States

Not errors, but related:
- **Text**: `text-slate-500`
- **Background**: Usually transparent or white
- **Icon**: `text-slate-400`
- **CTA**: Primary button color (accent-blueprint)

## Future Enhancements

### Sentry Integration

Currently `captureError` logs to console. To add Sentry:

1. Install: `pnpm add @sentry/nextjs`
2. Update `lib/errors.ts`:
   ```typescript
   import * as Sentry from "@sentry/nextjs";
   
   export function captureError(error: unknown, context?: Record<string, unknown>) {
     console.error("Error captured:", { error, context });
     
     Sentry.captureException(error, {
       extra: context,
     });
   }
   ```
3. Configure `sentry.client.config.ts` and `sentry.server.config.ts`

### Toast Notifications

For non-blocking errors (e.g., "Failed to copy"):

1. Install: `pnpm add sonner`
2. Add `<Toaster />` to root layout
3. Use: `toast.error("Failed to copy")`

### Retry with Exponential Backoff

For transient errors (network issues):

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000));
    }
  }
  throw new Error("Max retries exceeded");
}
```

### Offline Detection

Show offline banner when network is unavailable:

```typescript
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  window.addEventListener("online", () => setIsOnline(true));
  window.addEventListener("offline", () => setIsOnline(false));
  // cleanup...
}, []);

{!isOnline && (
  <div className="bg-amber-50 border-b border-amber-200 p-2 text-center">
    You are offline. Some features may not work.
  </div>
)}
```

## Testing Error States

### Simulating Errors

1. **Network errors**: Use browser DevTools to throttle or disable network
2. **API errors**: Modify API routes to return errors temporarily
3. **Component errors**: Add `throw new Error("Test")` in render
4. **Loading states**: Add artificial delays: `await new Promise(r => setTimeout(r, 2000))`

### Manual Testing Checklist

- [ ] Dashboard loads with skeleton
- [ ] Dashboard shows error boundary on failure
- [ ] Client list loads with skeleton
- [ ] Client list shows empty state when no clients
- [ ] Client detail loads with skeleton
- [ ] Client detail shows 404 error for invalid ID
- [ ] Chat shows error when API fails
- [ ] Chat retry button works
- [ ] Chat input shows error state
- [ ] All retry buttons work

## Accessibility

- **Loading states**: Use `aria-label="Loading..."` on skeletons
- **Error messages**: Use `role="alert"` for dynamic errors
- **Retry buttons**: Keyboard accessible, clear focus states
- **Error boundaries**: Provide meaningful message and recovery option

## Performance

- **Suspense boundaries**: Use React Suspense for more granular loading
- **Lazy loading**: Use `next/dynamic` for heavy components
- **Optimistic updates**: Update UI immediately, revert on error
- **Cached data**: Show stale data while refetching

## Summary

**Complete error handling system:**
- ✅ Reusable UI components (Skeleton, ErrorMessage)
- ✅ Error utility functions (captureError, getErrorMessage)
- ✅ Route-level error boundaries
- ✅ Route-level loading states
- ✅ Component-level error handling
- ✅ Visual error states (red borders, icons)
- ✅ Retry mechanisms throughout
- ✅ Consistent styling per UI_STANDARDS.md
- ✅ Prepared for Sentry integration

**All pages covered:**
- Dashboard home
- Client list
- Client detail
- Conversations
- Chat interface
