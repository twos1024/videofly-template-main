# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VideoFly is a SaaS platform for AI-powered video/image generation. Next.js 15 (App Router) + React 19 + TypeScript + Drizzle ORM + Better Auth + Tailwind CSS 4 + shadcn/ui. Package manager: **pnpm**.

## Commands

```bash
pnpm dev              # Start dev server (port 3000)
pnpm build            # Production build
pnpm typecheck        # TypeScript type checking (tsc --noEmit)
pnpm lint             # Lint with Biome
pnpm format           # Format with Biome (write mode)

# Database (Drizzle ORM + PostgreSQL)
pnpm db:generate      # Generate migrations from schema changes
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema directly (dev only)
pnpm db:studio        # Open Drizzle Studio GUI

# Credit management scripts (require .env.local)
pnpm script:add-credits
pnpm script:check-credits
pnpm script:reset-credits
```

## Architecture

### Video/Image Generation Lifecycle

The core flow spans multiple modules and uses an async callback pattern:

1. **Request** (`src/services/video.ts:generate` / `src/services/image.ts:generate`)
   - Validate model config from `src/config/credits.ts`
   - Insert DB record (status: PENDING)
   - Freeze credits via `CreditService.freeze()` (FIFO across packages with `pg_advisory_xact_lock`)
   - Call AI provider API with signed callback URL
   - Update status to GENERATING

2. **AI Processing** (async, external)
   - Provider calls back to `/api/v1/video/callback/[provider]` when done
   - Callback URL includes HMAC signature for verification (`src/ai/utils/callback-signature.ts`)

3. **Completion** (`tryCompleteGeneration`)
   - Download result from provider → validate media (magic bytes) → re-upload to R2/S3
   - Within a DB transaction: settle credits + update status to COMPLETED
   - Emit real-time event via Postgres LISTEN/NOTIFY (`src/lib/video-events.ts`)

4. **Failure** (`tryFailGeneration`)
   - Within a DB transaction: release frozen credits + update status to FAILED

### Credit System (`src/services/credit.ts`)

FIFO-based with freeze/settle/release pattern. Credits come in packages with expiration dates. The `creditHolds` table tracks frozen amounts with `packageAllocation` (JSONB) mapping credits back to source packages. Both video and image tasks share the same hold mechanism (`creditHolds.videoUuid` is reused as generic asset identifier — image UUIDs use `img_` prefix, video UUIDs use `vid_` prefix).

Key invariant: `pg_advisory_xact_lock` ensures no concurrent freeze/settle/release on the same user or video UUID.

### AI Provider Abstraction (`src/ai/`)

Factory pattern via `getProvider(type)`. Providers implement `createTask`, `getTaskStatus`, `parseCallback`. Currently: **evolink** (primary) and **kie** (secondary). Model configurations and credit costs are in `src/config/credits.ts`.

### Authentication (`src/lib/auth/`)

Better Auth with Google OAuth + Magic Link. Server-side helpers: `getCurrentUser` (nullable) and `requireAuth` (throws 401) in `src/lib/auth/index.ts`. API routes use `requireAuth(request)` pattern.

### Storage (`src/lib/storage.ts`)

R2/S3-compatible via `s3mini`. Singleton factory `getStorage()`. Remote downloads go through `fetchValidatedRemoteMedia()` in `src/lib/media-validation.ts` which enforces:
- Domain allowlist (`REMOTE_ASSET_ALLOWED_HOSTS` env var, required in production)
- HTTPS-only (except localhost in dev)
- Magic bytes validation (not Content-Type)
- Size limits with streaming enforcement
- Redirect count limits with re-validation per hop

### Real-time Updates (`src/lib/video-events.ts`)

Uses Postgres `LISTEN/NOTIFY` bridged to a Node.js EventEmitter. SSE endpoint at `/api/v1/video/events` (requires `runtime = "nodejs"`). Falls back to in-process emitter if DB notifications unavailable.

### Payment

Dual payment support: **Creem** (primary, via `@creem_io/better-auth` plugin) and **Stripe** (secondary). Webhook handlers credit user accounts via `CreditService.recharge()`. Config in `src/payment/`.

### i18n

`next-intl` with locale-prefixed routes (`/[locale]/...`). Locale config in `src/config/i18n-config.ts`. Messages in `src/messages/{locale}.json`. Client-side: `useTranslations("Namespace")`. Server-side: `getTranslations("Namespace")`.

### Internal/Admin APIs

Recovery endpoint (`/api/v1/video/recover`) and admin features use `assertConfiguredBearerSecret()` from `src/lib/admin-secret.ts` — disabled when env var is unset, uses timing-safe comparison.

## Key Patterns

- **API routes**: `try { requireAuth() → logic → apiSuccess() } catch { handleApiError() }` pattern in `src/app/api/v1/`
- **API responses**: Standardized via `src/lib/api/response.ts` (`apiSuccess`, `apiError`, `handleApiError`)
- **Env validation**: `@t3-oss/env-nextjs` with Zod schemas in `src/env.mjs` and `src/lib/auth/env.mjs`
- **Cursor pagination**: `encodeCompositeCursor`/`decodeCompositeCursor` in `src/lib/pagination-cursor.ts` (base64url-encoded `{createdAt, uuid}`)
- **DB**: Schema in `src/db/schema.ts`, connection in `src/db/index.ts`. Exports a proxy that throws helpful errors when `DATABASE_URL` is missing (allows build without DB)
- **Linter**: Biome (not ESLint). Single quotes, trailing commas, semicolons. `src/db/**` is excluded from linting
- **Soft delete**: Both `videos` and `images` tables use `isDeleted` boolean flag

## Architecture Decisions

1. **Drizzle ORM** over Prisma — better TypeScript inference, lighter runtime
2. **REST API** for new features (not tRPC) — simpler for webhooks and Better Auth
3. **Creem** as primary payment — better-auth plugin integration
4. **FIFO credit consumption** — fair expiration across multiple packages
5. **Callback-based AI** — async generation with webhook completion, SSE for frontend
6. **R2 storage** — cost-effective video/image storage with CDN
7. **Route groups** — `(marketing)`, `(dashboard)`, `(tool)`, `(auth)`, `(admin)` for page organization
