# Guildry

A modern monorepo for the Guildry platform, built with pnpm, Turborepo, and Next.js 14.

## Structure

```
guildry/
├── apps/
│   └── web/              # Next.js 14 app with App Router
├── packages/
│   ├── ai/               # Placeholder for Claude client
│   ├── database/         # Placeholder for Supabase client
│   └── ui/               # Placeholder for shared components
└── ...config files
```

## Tech Stack

- **Monorepo**: pnpm + Turborepo
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Node**: v20 (see .nvmrc)

## Custom Tailwind Colors

The following accent colors are configured:
- `accent-scout`: #b45309
- `accent-compass`: #4f46e5
- `accent-blueprint`: #0d9488
- `accent-bench`: #dc2626
- `accent-relay`: #7c3aed
- `accent-retro`: #db2777
- `accent-proof`: #059669

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build all apps and packages
pnpm build

# Lint all apps and packages
pnpm lint
```

The web app will be available at `http://localhost:3000`.

## Packages

### @guildry/web
Next.js 14 application with App Router, TypeScript, and Tailwind CSS.

### @guildry/database
Placeholder package for Supabase client integration.

### @guildry/ai
Placeholder package for Claude (Anthropic) client integration.

### @guildry/ui
Placeholder package for shared UI components.

## Next Steps

- Set up Supabase in `packages/database`
- Configure Claude client in `packages/ai`
- Create shared components in `packages/ui`
- Add authentication (Clerk or similar)
