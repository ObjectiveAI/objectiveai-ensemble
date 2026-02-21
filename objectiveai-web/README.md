# ObjectiveAI Web

Production web interface for [ObjectiveAI](https://objective-ai.io) — browse, execute, and create scoring functions powered by ensembles of LLMs.

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** with TypeScript
- **objectiveai** JS SDK (client-side, no server API routes)
- **NextAuth** for OAuth (Google, GitHub, X, Reddit)
- **Stripe** for credit purchases

## Setup

All commands run from the **monorepo root** (not this directory):

```bash
# Install dependencies
npm install

# Start dev server
npm run dev --workspace=objectiveai-web

# Production build
npm run build --workspace=objectiveai-web
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `objectiveai-web/.env.local` with:

```env
# Required
NEXT_PUBLIC_API_URL=https://api.objective-ai.io
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random-secret>

# OAuth providers (at least one required for auth)
AUTH_GOOGLE_CLIENT_ID=
AUTH_GOOGLE_CLIENT_SECRET=
AUTH_GITHUB_CLIENT_ID=
AUTH_GITHUB_CLIENT_SECRET=
AUTH_TWITTER_CLIENT_ID=
AUTH_TWITTER_CLIENT_SECRET=
AUTH_REDDIT_CLIENT_ID=
AUTH_REDDIT_CLIENT_SECRET=

# Stripe (for credit purchases)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Optional
OPENROUTER_API_KEY=          # Build-time: auto-curates reasoning models
IP_RSA_PUBLIC_KEY=           # Anonymous credit tracking
USER_IP_HEADER=              # Proxy header for IP detection
```

## Architecture

- **No server API routes** (except NextAuth). All data fetching uses the JS SDK directly from the client.
- **Public endpoints** use `createPublicClient()` from `lib/client.ts`
- **Auth-required endpoints** use `useObjectiveAI().getClient()` hook
- **Stripe** uses `fetch` directly (not in SDK)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/functions` | Browse all indexed functions |
| `/functions/[owner]/[repo]` | Function detail + execution UI |
| `/functions/create` | JSON builder for `function.json` |
| `/profiles` | Browse profiles |
| `/profiles/train` | Profile training UI |
| `/ensembles` | Browse ensembles |
| `/ensemble-llms` | Browse ensemble LLMs |
| `/account/keys` | API key management |
| `/account/credits` | Credit balance + purchase |
| `/docs/api/**` | 32 API endpoint docs |

## Design System

| Color | Hex | Usage |
|-------|-----|-------|
| Light | `#EDEDF2` | Light backgrounds |
| Dark | `#1B1B1B` | Dark backgrounds |
| Accent | `#6B5CFF` | Buttons, links, interactive |

Breakpoints: `640px` (mobile), `1024px` (tablet). See `app/globals.css` for full system.

## Deployment

Deployed to Google Cloud Run via Cloud Build. See `Dockerfile` and `cloudbuild.yaml` in this directory.
