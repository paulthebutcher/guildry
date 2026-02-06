# Getting Started

## Prerequisites

- Node.js v20+ (see `.nvmrc`)
- pnpm v8+
- Supabase account
- Clerk account
- Anthropic API key

## Quick Start

```bash
# Clone the repository
git clone https://github.com/paulthebutcher/guildry.git
cd guildry/guildry

# Install dependencies
pnpm install

# Copy environment template
cp apps/web/.env.example apps/web/.env.local

# Start development server
pnpm dev
```

The web app will be available at `http://localhost:3000`.

## Environment Variables

Create `apps/web/.env.local` with:

```bash
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...
```

## External Service Setup

### Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API to get your keys
3. Run the schema SQL from `docs/architecture/data-model.md`
4. Enable Row Level Security on all tables

### Clerk

1. Create an application at [clerk.com](https://clerk.com)
2. Enable GitHub OAuth (recommended for dev teams)
3. Set up webhook endpoint: `https://your-domain.com/api/webhooks/clerk`
4. Subscribe to `user.created` and `user.updated` events

### Anthropic

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Add to `.env.local`

## Project Structure

```
guildry/
├── apps/
│   └── web/                    # Next.js 14 app
│       ├── app/
│       │   ├── (auth)/         # Sign-in/sign-up pages
│       │   ├── (dashboard)/    # Authenticated routes
│       │   └── api/            # API routes
│       ├── components/
│       │   ├── ui/             # Base components
│       │   ├── conversation/   # Chat UI
│       │   └── layout/         # Navigation, sidebar
│       └── lib/                # Utilities
├── packages/
│   ├── ai/                     # Claude API wrapper & conversation engine
│   └── database/               # Supabase client & types
├── docs/                       # Documentation (you are here)
└── ...config files
```

## Common Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm test             # Run tests

# Individual packages
pnpm --filter @guildry/web dev
pnpm --filter @guildry/ai build
```

## Next Steps

1. Read the [Architecture Overview](./architecture/overview.md)
2. Understand the [Data Model](./architecture/data-model.md)
3. Review [Code Conventions](./guides/conventions.md)
4. Start building with the [Phase 1 Build Guide](./build-guides/phase-1.md)
