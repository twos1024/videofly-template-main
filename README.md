# PexelMuse

PexelMuse is a video-first AI creation SaaS built with Next.js 15.

The current repository is intentionally scoped to a deployable MVP:

- `Stripe-only`
- `video-only`
- `polling-only`

This keeps the default Vercel deployment path simple and predictable.

## Highlights

- Multi-model AI video generation with Sora 2, Wan 2.6, Veo 3.1 Fast Lite, and Seedance 1.5 Pro
- Unified landing-page prompt entry and `/create/video` studio workflow
- Credit balance, freezing, settlement, and recovery-safe billing flow
- Better Auth with Google OAuth and optional magic link login
- PostgreSQL + Drizzle ORM backend
- R2 / S3 compatible asset storage
- Chinese and English localization

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Better Auth
- Drizzle ORM
- PostgreSQL
- Stripe
- Cloudflare R2 / S3 compatible storage

## Requirements

- Node.js 20
- pnpm 9+
- PostgreSQL
- R2 / S3 compatible storage

## Quick Start

```bash
git clone <your-repo-url> pexelmuse
cd pexelmuse

# optional if you use nvm/fnm
nvm use

pnpm install
cp .env.example .env.local

# fill real values in .env.local before continuing
pnpm db:push
pnpm dev
```

Open `http://localhost:3000`.

Before deployment, run:

```bash
pnpm run typecheck
pnpm build
```

## Environment Variables

This repository keeps only one committed environment template:

- [`.env.example`](./.env.example)

Local secrets belong in:

- `.env.local`

Guidelines:

- Never commit real secrets, connection strings, API keys, webhook secrets, or OAuth credentials.
- Copy keys from your provider dashboards instead of hand-writing examples from memory.
- Keep production secrets in Vercel Project Settings, not in the repository.

Current MVP groups:

- App and auth
- Database
- Storage
- AI provider
- Billing
- Email / OAuth

Use [`.env.example`](./.env.example) as the source of truth for exact variable names.

## Useful Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm run typecheck
pnpm db:push
pnpm db:studio
pnpm script:add-credits <email> <credits> [reason]
pnpm script:check-credits <email>
pnpm script:reset-credits <email>
```

## Project Structure

```text
pexelmuse/
├── src/
│   ├── app/                    # App Router pages and API routes
│   ├── components/             # UI, landing, tool, generator, dashboard
│   ├── config/                 # site, model, pricing, navigation, feature config
│   ├── services/               # video, credit, billing service layer
│   ├── lib/                    # auth, api, storage, env, shared utilities
│   ├── ai/                     # provider adapters and model mappings
│   ├── db/                     # schema and database entrypoint
│   ├── hooks/                  # React hooks
│   ├── stores/                 # client-side state
│   └── messages/               # i18n dictionaries
├── public/                     # static assets
├── scripts/                    # operational scripts
└── docs/                       # internal project docs
```

## Deployment Notes

- The default target is `Vercel + PostgreSQL + R2/S3`.
- Local development can run without a public callback URL because the app falls back to polling.
- Production should always configure remote asset allowlists and real storage credentials.
- Stripe is the default billing path for this repository state.

## Current MVP Scope

- Text-to-video and image-assisted video generation
- Unified video generator component system
- Video history and retry flow
- Credit-based billing
- User auth and account pages

Out of scope for the default deploy path:

- Multi-provider billing UI branches
- Realtime SSE dependency for completion tracking
- Image generation as a primary product surface

## License

MIT

## Acknowledgements

- shadcn/ui
- Better Auth
- Drizzle ORM
- Next.js
