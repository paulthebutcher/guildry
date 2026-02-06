# Production Deployment Checklist

Complete checklist for deploying Guildry to production.

## Pre-Deployment

### ✅ Code Preparation

- [x] Environment variables validated in `next.config.mjs`
- [x] `.env.example` created with all required variables
- [x] Production metadata added to `layout.tsx` (SEO, OpenGraph, Twitter)
- [x] Security headers configured in `next.config.mjs`
- [x] Favicon/icon created (`app/icon.tsx`)
- [x] No hardcoded localhost URLs in application code
- [x] React Strict Mode enabled
- [x] Powered-by header removed
- [x] README updated with deployment instructions
- [x] All tests passing (`pnpm test:ci`)
- [x] Build successful (`pnpm build`)
- [x] Linting successful (`pnpm lint`)

### 🔧 Configuration Files Ready

- [x] `next.config.mjs` - Production optimizations and security headers
- [x] `apps/web/.env.example` - Template for environment variables
- [x] `.github/workflows/test.yml` - CI/CD pipeline
- [x] `.nvmrc` - Node.js version specification
- [x] `turbo.json` - Monorepo build configuration
- [x] `vitest.config.ts` - Testing configuration

## Deployment Steps

### 1. Third-Party Services Setup

#### Clerk (Authentication)

1. Create production application in [Clerk Dashboard](https://dashboard.clerk.com)
2. Configure allowed redirect URLs:
   - `https://yourdomain.com`
   - `https://yourdomain.com/sign-in`
   - `https://yourdomain.com/sign-up`
   - `https://yourdomain.com/dashboard`
3. Set up webhook:
   - Endpoint URL: `https://yourdomain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`
   - Save webhook secret
4. Copy production keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_WEBHOOK_SECRET`

#### Supabase (Database)

1. Create production project in [Supabase Dashboard](https://supabase.com/dashboard)
2. Run database migrations:
   ```bash
   # If using Supabase CLI
   supabase db push
   
   # Or manually run SQL from supabase/migrations/
   ```
3. Configure Row Level Security (RLS) policies for all tables
4. Set up allowed origins:
   - Go to Authentication > URL Configuration
   - Add `https://yourdomain.com` to allowed redirect URLs
5. Copy production keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

#### Anthropic (AI)

1. Get API key from [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Consider setting usage limits for production
3. Copy production key:
   - `ANTHROPIC_API_KEY`

### 2. Vercel Deployment (Recommended)

#### Initial Setup

1. **Connect Repository:**
   - Go to [Vercel Dashboard](https://vercel.com/new)
   - Import your GitHub repository
   - Select the repository

2. **Configure Project:**
   - Framework Preset: **Next.js**
   - Root Directory: Leave empty (monorepo auto-detected)
   - Build Command: `cd apps/web && pnpm run build`
   - Output Directory: `apps/web/.next`
   - Install Command: `pnpm install`

3. **Environment Variables:**
   Add all variables from `.env.example`:
   
   ```env
   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
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
   
   # App URL (your production domain)
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Note your deployment URL

#### Post-Deployment Configuration

1. **Update Clerk Webhook:**
   - Go to Clerk Dashboard > Webhooks
   - Update endpoint URL to `https://yourdomain.com/api/webhooks/clerk`

2. **Update Clerk Redirects:**
   - Add production domain to allowed redirect URLs

3. **Update Supabase:**
   - Add production domain to allowed origins

4. **Add Custom Domain (Optional):**
   - In Vercel project settings > Domains
   - Add your custom domain
   - Update DNS records as instructed

5. **Test Production Deployment:**
   - Visit your production URL
   - Sign up a new user
   - Create a client via conversation
   - Verify database records in Supabase

### 3. Alternative Platforms

#### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and init
railway login
railway init

# Set environment variables
railway variables set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
# (set all other variables)

# Deploy
railway up
```

#### Render

1. Create new Web Service
2. Connect repository
3. Build Command: `cd apps/web && pnpm run build`
4. Start Command: `cd apps/web && pnpm start`
5. Add environment variables in dashboard
6. Deploy

#### Self-Hosted (Docker)

```dockerfile
# Example Dockerfile (create in root)
FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
RUN pnpm build

FROM base AS runtime
WORKDIR /app
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["pnpm", "start"]
```

## Post-Deployment Verification

### Smoke Tests

- [ ] Homepage loads
- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] Dashboard displays after auth
- [ ] User record created in Supabase
- [ ] Organization created in Supabase
- [ ] Can create client via conversation
- [ ] Client appears in client list
- [ ] Client detail page loads
- [ ] Conversation history persists
- [ ] API routes respond correctly
- [ ] Error pages display properly
- [ ] Loading states work
- [ ] Navigation works

### Performance Checks

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] No console errors
- [ ] All images optimized
- [ ] No unused JavaScript

### Security Checks

- [ ] HTTPS enabled
- [ ] Security headers present (check with securityheaders.com)
- [ ] No sensitive data in client-side code
- [ ] Environment variables not exposed
- [ ] API routes protected by auth
- [ ] RLS policies working in Supabase
- [ ] CORS configured correctly

### Monitoring Setup

- [ ] Set up error tracking (Sentry)
- [ ] Set up analytics (Vercel Analytics or PostHog)
- [ ] Monitor API usage (Anthropic dashboard)
- [ ] Monitor database usage (Supabase dashboard)
- [ ] Set up uptime monitoring (UptimeRobot, Better Uptime)

## Rollback Plan

If deployment fails:

1. **Vercel:** Previous deployment automatically available
   - Go to Deployments tab
   - Click "..." on previous deployment
   - Click "Promote to Production"

2. **Other platforms:** Redeploy previous commit
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Database issues:** Restore from backup
   - Supabase has automatic daily backups
   - Go to Database > Backups in Supabase dashboard

## Ongoing Maintenance

### Regular Tasks

- **Weekly:**
  - [ ] Check error logs
  - [ ] Monitor API usage
  - [ ] Review performance metrics

- **Monthly:**
  - [ ] Update dependencies (`pnpm update`)
  - [ ] Review and rotate secrets
  - [ ] Check security advisories
  - [ ] Analyze usage patterns

- **Quarterly:**
  - [ ] Major dependency updates
  - [ ] Performance audit
  - [ ] Security audit
  - [ ] Backup restore test

### Monitoring Dashboards

- **Vercel:** https://vercel.com/dashboard
- **Clerk:** https://dashboard.clerk.com
- **Supabase:** https://supabase.com/dashboard
- **Anthropic:** https://console.anthropic.com

## Troubleshooting

### Build Fails

- Check environment variables are set
- Verify pnpm version matches `packageManager` in `package.json`
- Review build logs for missing dependencies

### Authentication Issues

- Verify Clerk webhook URL is correct
- Check webhook secret matches
- Ensure redirect URLs include production domain

### Database Connection Fails

- Verify Supabase URL and keys
- Check Supabase project is active (not paused)
- Review RLS policies

### AI Responses Fail

- Check Anthropic API key is valid
- Verify API has sufficient credits
- Review rate limits

## Environment Variables Reference

See [apps/web/.env.example](../apps/web/.env.example) for complete list with descriptions.

**Critical secrets (never commit):**
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

**Public variables (safe to expose):**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

## Success Criteria

Deployment is successful when:

- ✅ All smoke tests pass
- ✅ No errors in production logs
- ✅ Performance metrics meet targets
- ✅ Security headers configured
- ✅ Monitoring is active
- ✅ Team can access and use the app
- ✅ Client creation workflow works end-to-end

## Support

For deployment issues:
- Check [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- Review [Vercel Documentation](https://vercel.com/docs)
- Consult platform-specific docs for other hosts
