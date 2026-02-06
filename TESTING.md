# Testing Infrastructure

Simple, fast testing setup using Vitest for the Guildry monorepo.

## Quick Start

```bash
# Run tests in watch mode (for development)
pnpm test

# Run tests once (for CI)
pnpm test:ci
```

## Stack

- **Vitest**: Fast test runner with ESM support
- **Testing Library**: React component testing utilities
- **jsdom**: Browser environment for DOM testing

## Configuration

### Root Config (`vitest.config.ts`)

- **Environment**: jsdom (for React component tests)
- **Globals**: Enabled (`describe`, `it`, `expect` available without imports)
- **Path Aliases**: Configured for all packages (`@guildry/*`) and web app (`@/`)
- **Setup File**: `vitest.setup.ts` (imports jest-dom matchers)

### Test Files

Tests are discovered using these patterns:
- `**/__tests__/**/*.test.{ts,tsx}`
- `**/*.test.{ts,tsx}`

Excluded:
- `**/node_modules/**`
- `**/dist/**`
- `**/.next/**`

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from "vitest";

describe("MyFeature", () => {
  it("should do something", () => {
    const result = myFunction();
    expect(result).toBe(expected);
  });
});
```

### Testing Zod Schemas

```typescript
import { ClientInputSchema } from "../tools/client";

it("should validate correct input", () => {
  const input = { name: "Acme Corp" };
  const result = ClientInputSchema.safeParse(input);
  
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.name).toBe("Acme Corp");
  }
});

it("should reject invalid input", () => {
  const input = { invalid: "data" };
  const result = ClientInputSchema.safeParse(input);
  
  expect(result.success).toBe(false);
});
```

### Testing API Helpers

```typescript
import { apiError, apiSuccess } from "../api";

it("should return error response", async () => {
  const result = apiError("NOT_FOUND", "Not found", 404);
  
  expect(result.status).toBe(404);
  
  const json = await result.json();
  expect(json).toEqual({
    error: { code: "NOT_FOUND", message: "Not found" }
  });
});
```

### Testing React Components (Future)

```typescript
import { render, screen } from "@testing-library/react";
import { MyComponent } from "./my-component";

it("should render", () => {
  render(<MyComponent title="Hello" />);
  expect(screen.getByText("Hello")).toBeInTheDocument();
});
```

## Existing Tests

### `packages/ai/src/__tests__/tools.test.ts`

Tests for Zod schema validation:
- ✅ Valid client input
- ✅ Minimal input (only required fields)
- ✅ Missing required fields
- ✅ Invalid enum values
- ✅ All valid size_tier options

### `packages/database/src/__tests__/types.test.ts`

Tests that TypeScript types are properly exported:
- ✅ Organization type
- ✅ User type
- ✅ Client type
- ✅ Conversation type
- ✅ Message type
- ✅ Enum types

### `apps/web/lib/__tests__/api.test.ts`

Tests for API response helpers:
- ✅ `apiError` with different status codes
- ✅ `apiSuccess` with various data types
- ✅ ApiErrorCode enum values

## CI/CD

### GitHub Actions (`.github/workflows/test.yml`)

Runs on every push to `main` and on all PRs.

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Setup pnpm with caching
4. Install dependencies
5. Run tests (`pnpm test:ci`)
6. Run linter (`pnpm lint`)
7. Build project (`pnpm build`)

**Environment Variables:**
- Uses secrets if available
- Falls back to dummy values for build (not used in tests)

## Coverage (Future)

To add coverage reporting:

1. Update `vitest.config.ts`:
   ```typescript
   test: {
     coverage: {
       provider: 'v8',
       reporter: ['text', 'json', 'html'],
       exclude: ['**/__tests__/**', '**/*.test.ts'],
     },
   }
   ```

2. Run with coverage:
   ```bash
   pnpm test:ci --coverage
   ```

## Testing Philosophy

**Goals:**
- ✅ Fast (< 1s for full test suite)
- ✅ Simple (no complex setup or mocking)
- ✅ Focused (test core logic, not implementation details)
- ✅ Catch obvious breaks (schema changes, API contract changes)

**Not Goals:**
- ❌ High coverage percentage
- ❌ Testing every function
- ❌ Complex integration tests

**What to Test:**
- ✅ Schema validation (catches API contract breaks)
- ✅ Type exports (catches breaking type changes)
- ✅ API helpers (catches response format changes)
- ✅ Utility functions (pure functions with clear inputs/outputs)

**What Not to Test:**
- ❌ UI components (until they have complex logic)
- ❌ API routes (covered by build step)
- ❌ Database queries (would require test database)
- ❌ External API calls (use mocks when needed)

## Adding New Tests

### For a Package

1. Create `__tests__` directory in package `src/`
2. Add `.test.ts` file with tests
3. Tests will automatically be discovered

### For the Web App

1. Create `__tests__` directory next to the code
2. Add `.test.ts` or `.test.tsx` file
3. Import from `@/` alias for web code

### Example Structure

```
packages/ai/
  src/
    __tests__/
      tools.test.ts       ← Test Zod schemas
      prompts.test.ts     ← Test prompt builders
    tools/
      client.ts
    prompts/
      system.ts

apps/web/
  lib/
    __tests__/
      api.test.ts         ← Test API helpers
      errors.test.ts      ← Test error utilities
    api.ts
    errors.ts
```

## Debugging Tests

### Run Single Test File

```bash
pnpm test tools.test.ts
```

### Run Tests Matching Pattern

```bash
pnpm test --grep "ClientInputSchema"
```

### Run with UI (Interactive)

```bash
pnpm test --ui
```

### Run in Watch Mode

```bash
pnpm test
```

## Troubleshooting

### "Cannot find module"

- Check path aliases in `vitest.config.ts`
- Verify file exists and exports are correct

### "ReferenceError: X is not defined"

- Add to `globals: true` in vitest config
- Or import explicitly: `import { describe, it, expect } from 'vitest'`

### Tests timing out

- Increase timeout: `it("test", async () => {...}, { timeout: 10000 })`
- Or set globally in config: `test: { testTimeout: 10000 }`

### Module not found in CI

- Ensure `pnpm install --frozen-lockfile` is used
- Check that all dependencies are in `package.json`, not just `devDependencies`

## Next Steps

Potential future enhancements:
- Add React component tests
- Add integration tests for API routes (with mock database)
- Add E2E tests with Playwright
- Add visual regression tests
- Set up coverage thresholds
- Add mutation testing

## Resources

- [Vitest Docs](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Zod Testing Guide](https://zod.dev/)
