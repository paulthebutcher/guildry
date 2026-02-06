# Guildry Coding Conventions

Quick reference for coding standards in this project.

## File Naming

- **Files**: `kebab-case.ts`, `kebab-case.tsx`
- **Components**: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- **Utilities**: `kebab-case.ts` (e.g., `format-date.ts`)
- **Tests**: `*.test.ts` or `*.spec.ts`

## Folder Structure

Organize by **feature**, not by type:

```
✅ Good (feature-based)
app/
  dashboard/
    components/
    actions/
    types.ts
  profile/
    components/
    actions/

❌ Bad (type-based)
app/
  components/
    dashboard/
    profile/
  actions/
    dashboard/
    profile/
```

## Imports

- **apps/web**: Use `@/` alias for internal imports
- **packages**: Use `@guildry/*` for cross-package imports

```typescript
// In apps/web
import { Button } from "@/components/Button"
import { database } from "@guildry/database"

// In packages
import { ai } from "@guildry/ai"
```

## TypeScript

- **Strict mode**: Always enabled
- **No `any`**: Use `unknown` if type is truly unknown
- **Prefer interfaces** for object shapes:
  ```typescript
  // ✅ Prefer
  interface User {
    id: string;
    name: string;
  }
  
  // ⚠️ Use for unions/primitives only
  type Status = "active" | "inactive";
  ```
- **Explicit return types** for exported functions
- **Optional chaining** over manual null checks

## Async Operations

- **Always `async/await`**, never `.then()`:
  ```typescript
  // ✅ Good
  async function fetchUser() {
    const response = await fetch("/api/user");
    return await response.json();
  }
  
  // ❌ Bad
  function fetchUser() {
    return fetch("/api/user").then(r => r.json());
  }
  ```

## Error Handling

- **Try/catch** for async operations
- **Typed errors** when possible
- **Always log before throwing**:
  ```typescript
  try {
    await riskyOperation();
  } catch (error) {
    console.error("Failed to execute operation:", error);
    throw new Error("Operation failed", { cause: error });
  }
  ```

## Comments

- **Only explain "why"**, not "what"
- **No commented-out code** (use git history)
- **JSDoc for public APIs**:
  ```typescript
  /**
   * Formats a user's display name
   * Uses nickname if available, falls back to email prefix
   */
  export function formatDisplayName(user: User): string {
    // Implementation
  }
  ```

## Commit Messages

Use **conventional commits**:

- `feat:` - New feature
- `fix:` - Bug fix
- `chore:` - Tooling, dependencies
- `docs:` - Documentation only
- `refactor:` - Code change that neither fixes nor adds
- `style:` - Formatting, whitespace
- `test:` - Adding or updating tests

Examples:
```
feat: add user profile page
fix: correct date formatting in dashboard
chore: update dependencies
docs: add setup instructions to README
```

## React Patterns

- **Server components by default** in Next.js App Router
- **"use client" only when needed** (interactivity, hooks)
- **Named exports** for components (not default)
- **Props interfaces** named with `Props` suffix:
  ```typescript
  interface ButtonProps {
    label: string;
    onClick: () => void;
  }
  
  export function Button({ label, onClick }: ButtonProps) {
    // ...
  }
  ```

## Code Organization

Within a file, order by:
1. Imports
2. Types/Interfaces
3. Constants
4. Main component/function
5. Helper functions
6. Exports (if not inline)
