# Guildry

Project intelligence for agencies, studios, and consultancies. Guildry helps teams scope, staff, deliver, learn, and improve through AI-powered conversations.

**Status: Phase 0 (Foundation) Complete** | [Roadmap](https://guildry.paulb.pro/roadmap) | [Website](https://guildry.paulb.pro/)

## Overview

Guildry is a suite of 7 integrated products:

| Product | Purpose | Phase |
|---------|---------|-------|
| **Scout** | Market & competitor research | 3 |
| **Compass** | Business strategy | 3 |
| **Blueprint** | Project scoping & estimation | 1 |
| **Bench** | Team skills & staffing | 1 |
| **Relay** | Client management | 2 |
| **Retro** | Project retrospectives | 1 |
| **Proof** | Sales & proposals | 2 |

## Tech Stack

- **Monorepo**: pnpm + Turborepo
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Auth**: Clerk with webhook sync
- **AI**: Claude API with function calling
- **Node**: v20 (see .nvmrc)

## Project Structure

```
guildry/
├── apps/
│   └── web/                    # Next.js 14 application
│       ├── app/                # App Router pages & API routes
│       │   ├── (auth)/         # Auth pages (sign-in, sign-up)
│       │   ├── (dashboard)/    # Protected dashboard routes
│       │   └── api/            # API endpoints
│       ├── components/         # React components
│       └── lib/                # Utilities and helpers
├── packages/
│   ├── ai/                     # Claude client & conversation engine
│   ├── database/               # Supabase client & type definitions
│   └── ui/                     # Shared UI components
├── docs/                       # Documentation
│   ├── architecture/           # System design docs
│   ├── guides/                 # Development guides
│   ├── api/                    # API reference
│   └── build-guides/           # Phase build instructions
└── supabase/
    └── migrations/             # Database migrations
```

## Getting Started

### Prerequisites

- **Node.js 20+** (use `nvm use` with included .nvmrc)
- **pnpm 9+** (`npm install -g pnpm`)
- **Supabase account** - [Sign up](https://supabase.com)
- **Clerk account** - [Sign up](https://clerk.com)
- **Anthropic API key** - [Get key](https://console.anthropic.com)

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/paulthebutcher/guildry.git
   cd guildry
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure environment variables:**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

   Then edit `apps/web/.env.local` with your actual credentials. See [apps/web/.env.example](apps/web/.env.example) for details on each variable.

4. **Set up the database:**
   - Create a new Supabase project
   - Run migrations from `supabase/migrations/` (or use Supabase CLI)
   - Configure Row Level Security policies
   - Copy your Supabase URL and keys to `.env.local`

5. **Configure Clerk webhook:**
   - In Clerk Dashboard, go to Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/clerk`
   - Subscribe to: `user.created`, `user.updated`
   - Copy webhook secret to `.env.local`

6. **Run the development server:**
   ```bash
   pnpm dev
   ```

   The app will be available at `http://localhost:3000`.

### Development Commands

```bash
pnpm dev         # Start development server (all packages in watch mode)
pnpm build       # Build all apps and packages for production
pnpm lint        # Lint all apps and packages
pnpm test        # Run tests in watch mode
pnpm test:ci     # Run tests once (for CI)
```

## Deployment

### Vercel (Recommended)

1. **Push your code to GitHub**

2. **Import project in Vercel:**
   - Connect your GitHub repository
   - Set root directory to `apps/web`
   - Framework preset: Next.js

3. **Configure environment variables:**
   - Add all variables from `.env.example`
   - Use production values for Clerk, Supabase, and Anthropic

4. **Configure build settings:**
   - Build command: `cd ../.. && pnpm run build --filter=@guildry/web`
   - Output directory: `apps/web/.next`
   - Install command: `pnpm install`

5. **Deploy:**
   - Vercel will automatically deploy on push to main
   - Preview deployments for PRs

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- **Railway**: Connect repo, set root path, add env vars
- **Render**: Create web service, set build command
- **Netlify**: Import from Git, configure build settings
- **Self-hosted**: Use `pnpm build` + `pnpm start` with Node.js 20+

**Important:** Ensure all environment variables are set in your deployment platform.

### Post-Deployment

1. **Update Clerk webhook URL:**
   - Set to `https://yourdomain.com/api/webhooks/clerk`

2. **Configure Clerk redirect URLs:**
   - Add your production domain to allowed redirect URLs

3. **Update Supabase allowed origins:**
   - Add your production domain to Supabase Dashboard > Authentication > URL Configuration

4. **Test the deployment:**
   - Sign up a new user
   - Create a client via conversation
   - Verify database records are created

## Environment Variables

See [apps/web/.env.example](apps/web/.env.example) for a complete list with descriptions.

**Critical variables:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk auth (public)
- `CLERK_SECRET_KEY` - Clerk auth (secret)
- `CLERK_WEBHOOK_SECRET` - Clerk webhook verification
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin access (secret)
- `ANTHROPIC_API_KEY` - Claude API access (secret)

**Optional:**
- `NEXT_PUBLIC_APP_URL` - Your production domain (defaults to localhost)

## Packages

### @guildry/web
Next.js 14 application with App Router. Includes dashboard, client management, and AI conversation interface.

### @guildry/database
Supabase client configuration and TypeScript type definitions for all database tables. Exports both `supabase` (anon client with RLS) and `supabaseAdmin` (service client).

### @guildry/ai
Claude API client and conversation engine. Handles AI-powered conversations with function calling for CRUD operations. Supports multiple "target schemas" (client, project, retro).

### @guildry/ui
Shared UI components (currently minimal, will grow as patterns emerge).

## Documentation

Full documentation is available in the `/docs` folder:

- [**Getting Started**](docs/getting-started.md) - Setup and configuration
- [**Architecture**](docs/architecture/) - System design and data model
- [**Guides**](docs/guides/) - Conventions, UI standards, testing, error handling
- [**API Reference**](docs/api/) - Endpoint documentation
- [**Build Guides**](docs/build-guides/) - Phase-by-phase implementation

## Design System

### Custom Tailwind Colors

Each product has a designated accent color:

| Color | Hex | Product |
|-------|-----|---------|
| `accent-scout` | #b45309 | Scout (research) |
| `accent-compass` | #4f46e5 | Compass (strategy) |
| `accent-blueprint` | #0d9488 | Blueprint (scoping) |
| `accent-bench` | #dc2626 | Bench (staffing) |
| `accent-relay` | #7c3aed | Relay (clients) |
| `accent-retro` | #db2777 | Retro (retrospectives) |
| `accent-proof` | #059669 | Proof (sales) |

## Phase 0 Completion

Phase 0 (Foundation) established the core infrastructure:

- [x] Monorepo with pnpm + Turborepo
- [x] Next.js 14 with App Router
- [x] Clerk authentication with org support
- [x] Supabase database with RLS policies
- [x] Claude API integration with function calling
- [x] AI conversation engine (target schema pattern)
- [x] Client CRUD via natural language
- [x] Error handling and loading states
- [x] Testing infrastructure (Vitest)
- [x] CI/CD with GitHub Actions

## Next Steps

Phase 1 will implement the core project loop:
- **Blueprint**: Project scoping with estimation models
- **Bench**: Team skills and availability tracking
- **Retro**: Project retrospectives and learnings

See [Phase 1 Build Guide](docs/build-guides/phase-1.md) for implementation details.

## License

Private - All rights reserved.
