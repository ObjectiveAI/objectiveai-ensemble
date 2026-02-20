# ObjectiveAI Web

The [objective-ai.io](https://objective-ai.io) web interface — a Next.js application for browsing, executing, and creating ObjectiveAI Functions.

[Live Site](https://objective-ai.io) | [GitHub](https://github.com/ObjectiveAI/objectiveai) | [Discord](https://discord.gg/gbNFHensby)

## What's here

| Page | Description |
|------|-------------|
| `/functions` | Browse all indexed Functions with search and filter |
| `/functions/[slug]` | Execute a Function, select a Profile, view scores and reasoning |
| `/functions/create` | JSON builder for creating `function.json` files |
| `/profiles/train` | Train a Profile on labeled data |
| `/ensembles` / `/ensemble-llms` | Browse Ensembles and individual LLM configurations |
| `/ensembles/create` | Build and validate an Ensemble with real-time ID computation |
| `/chat` | Direct chat completions with any Ensemble LLM |
| `/vector` | Direct vector completions for testing scoring logic |
| `/account/keys` | API key management |
| `/account/credits` | Credit balance and Stripe purchase flow |
| `/docs/api/**` | 32-page API reference with request/response schemas |

## Development

```bash
# Install dependencies from the workspace root
npm install

# Start the dev server
npm run dev --workspace=objectiveai-web
```

Open [http://localhost:3000](http://localhost:3000).

## Tech stack

- **Next.js 15** (App Router, RSC, ISR)
- **TypeScript** throughout
- **ObjectiveAI JS SDK** for all API calls (no server-side proxy routes)
- **NextAuth** for OAuth (Google, GitHub, X, Reddit)
- **Stripe** for credit purchases
- **WASM** (via `objectiveai-rs-wasm-js`) for client-side Ensemble validation

## Architecture notes

All API calls use the JS SDK directly from the client — there are no server-side API proxy routes. Browse pages use ISR with a 2-minute revalidation window. Authentication uses OAuth tokens stored in NextAuth sessions.

See [CLAUDE.md](CLAUDE.md) for detailed development guidelines.

## License

MIT
