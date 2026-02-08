# ObjectiveAI

**Score everything. Rank everything. Simulate anyone.**

ObjectiveAI is a REST API platform for scoring, ranking, and simulating preferences using ensembles of LLMs. Instead of asking one model for an answer, it uses multiple LLMs with explicit weights to produce structured numeric outputs.

**API:** https://api.objective-ai.io

## Repository Structure

```
objectiveai/
├── objectiveai-rs/                 # Rust SDK (core crate: data structures, validation, compilation)
├── objectiveai-api/                # API server (self-hostable, or import as library)
├── objectiveai-rs-wasm-js/         # WASM bindings for browser/Node.js
├── objectiveai-js/                 # TypeScript SDK (npm: objectiveai)
├── objectiveai-web/                # Next.js web interface (production)
└── coding-agent-scratch/           # Scratch folder for testing SDK calls
```

## Core Concepts

### Ensemble LLM

A fully-specified configuration of a single upstream LLM:
- Model identity (e.g., `openai/gpt-4o`, `google/gemini-3.0-pro`)
- Prompt structure (prefix/suffix messages)
- Decoding parameters (temperature, top_p, etc.)
- Output mode (`instruction`, `json_schema`, `tool_call`)
- Provider preferences, reasoning settings

**Content-addressed:** IDs are computed deterministically from the definition using XXHash3-128. Identical definitions always produce identical IDs.

### Ensemble

A collection of Ensemble LLMs used together for voting. Key properties:
- **Immutable** - any change produces a new ID
- **Does NOT contain weights** - weights are execution-time parameters
- Can be defined inline or referenced by pre-computed ID

### Weights

Execution-time parameters controlling each LLM's influence. Weights are:
- External to Ensembles (same Ensemble can behave differently with different weights)
- Learnable via training (Profiles)
- Never baked into definitions

## API Capabilities

### Chat Completions

Standard LLM chat (messages in, text out). The "model" can be an Ensemble LLM ID or inline definition with pre-configured settings.

### Vector Completions

The core primitive. Produces **scores**, not text:

1. Takes a prompt and possible **responses** (text, images, videos, files, audio)
2. Runs Chat Completions across all LLMs in an Ensemble
3. Each LLM **votes** for one of the responses
4. Votes are combined using **weights** to produce **scores**
5. Returns a vector of scores that sums to 1

**Important distinctions:**
- `weights` vector: Same length as `responses`. Shows total weight allocated to each response option.
- `scores` vector: Same length as `responses`. Final normalized scores (sum ≈ 1).
- For discrete votes, an LLM's full weight goes to its selected response.
- For probabilistic votes, weight is divided according to the distribution.

**Probabilistic Voting via Logprobs:**

LLMs are inherently probabilistic - the sampler makes the final discrete choice. ObjectiveAI bypasses the sampler using **logprobs** to capture the model's full preference distribution. Instead of getting one answer and losing confidence signals, we extract probabilities for each option simultaneously.

The prefix tree (`pfx.rs` in objectiveai-api) structures responses around logprobs limits. Tree width matches the number of logprobs returned (typically 20), enabling voting over hundreds of options while preserving probability information at each level. For large response sets, nested prefixes (e.g., `` `A` `` `` `B` ``) capture preferences in stages.

### Functions

Composable scoring pipelines. **Data in → Score(s) out.**

Functions execute a list of **tasks**, where each task is either:
- A Vector Completion
- Another Function (scalar or vector)

Functions produce either:
- **Scalar**: Single score in [0, 1]
- **Vector**: Array of scores that sum ≈ 1

#### GitHub-Hosted Functions

Functions are hosted on GitHub as `function.json` at repository root. Reference by `owner/repo` (optionally with commit SHA for immutability).

**Important:** There is no server-side function creation. When a function is executed via the API (e.g., `Functions.Executions.create`), the server fetches `function.json` from the GitHub repository. Any execution that incurs usage causes the function to be indexed and discoverable via the list endpoint. This means anyone can create a function, publish it to GitHub, execute it via the API, and it becomes an indexed function.

**Note:** If `/functions` returns an empty list (`{"data":[]}`), this means no functions have been executed yet or the index was cleared. Functions only appear in the list after being executed at least once.

The `/functions/create` page is a **JSON builder/editor tool** that helps users construct `function.json` files to save to their own repositories—it does not create functions on the server.

**Content Policy:** The service is 18+ only. Report functionality for inappropriate functions is planned for the future.

### Profiles

Learned weights for Functions. ObjectiveAI doesn't fine-tune LLMs—it learns optimal **weights** over fixed models.

Training provides:
- Dataset of inputs with expected outputs
- ObjectiveAI executes repeatedly, computes loss, adjusts weights
- Produces a Profile (learned weight configuration)

Profiles are also GitHub-hosted as `profile.json`. Highly recommended to specify commit SHA since the profile's shape may change in future versions.

## Expression System (Complex)

Functions use **expressions** for dynamic behavior. Two languages are supported:
- **JMESPath** (`{"$jmespath": "..."}`) - JSON query language
- **Starlark** (`{"$starlark": "..."}`) - Python-like configuration language (not Turing-complete)

This is the most complex part of the SDK.

### Input Maps

`input_maps` transforms input into a **2D array** for mapped task execution:

```json
{
  "input_maps": [
    {"$jmespath": "input.items"},
    {"$starlark": "input['categories']"}
  ]
}
```

Each sub-array can be referenced by tasks via their `map` index.

### Task Expressions

Each task can have:

- **`skip`**: Boolean expression. If true, task is skipped.
  ```json
  {"$jmespath": "input.count < `10`"}
  ```
  or with Starlark:
  ```json
  {"$starlark": "input['count'] < 10"}
  ```

- **`map`**: Index into `input_maps`. Creates **multiple task instances**—one per element in that sub-array. Each instance is compiled with a different value from the 1D array. The number of compiled tasks equals the length of that sub-array.

- **`input`**: Expression defining task input from function input and map context.

### Task Output Expressions

Each task has an `output` expression that transforms its raw result into a FunctionOutput. The function's final output is the **weighted average** of all task outputs using profile weights.

```json
{
  "type": "vector.completion",
  "prompt": "...",
  "responses": [...],
  "output": {"$starlark": "output['scores'][0]"}
}
```

**Task output expression receives:**
- For vector completion tasks: `output` is a VectorCompletionOutput (or array if mapped)
- For function tasks: `output` is a FunctionOutput (or array if mapped)

**Constraints:**
- Each task's output must be valid for the parent function's type
- Scalar functions: task outputs must be in [0, 1]
- Vector functions: task outputs must sum ≈ 1 and match `output_length` if specified

### Expression Context

Available variables during compilation:
- `input`: Original function input
- `map`: Current map element (only in mapped task context)
- `output`: Raw task result (only in task output expressions)

### Compilation Methods

Client-side compilation is for **previewing during authoring**, not required before execution:

- **`compile_tasks(input)`**: Shows what final tasks look like for given input
- **`compile_one()`**: Expects exactly one value. OK for single value or 1-element array. Error for null, empty array, or multi-element array.

**Validation checks:**
- Each task's output type matches function type (scalar vs vector)
- Scalar task outputs in [0, 1]
- Vector task outputs sum ≈ 1
- Vector task outputs match `output_length` if specified

## Usage Response Fields

**Cost fields (important distinction):**
- `cost`: What ObjectiveAI charged for this request
- `total_cost`: Sum of all costs including upstream providers (only differs with BYOK)
- `cost_details`: Breakdown showing `upstream` and `upstream_upstream` costs

**Reasoning field:**
- `models`: Fallback models tried in order if primary is rate-limited or errors

## Rust SDK

Location: `objectiveai-rs/`

**Capabilities:**
1. Data structures and validation
2. Deterministic ID computation (XXHash3-128, base62 encoded)
3. Client-side Function compilation (JMESPath and Starlark expression evaluation)
4. HTTP client (optional `http` feature, enabled by default)

**Key modules:**
- `auth/` - API key authentication
- `chat/completions/` - Chat request/response types
- `vector/completions/` - Vector completion types, votes, scores
- `ensemble/` - Ensemble validation and ID computation
- `ensemble_llm/` - Ensemble LLM configuration and validation
- `functions/` - Function definitions, tasks, profiles, expressions
- `http/` - HTTP client (feature-gated)

## API Server

Location: `objectiveai-api/`

Self-hostable API server. Can be run locally or imported as a library to build custom servers.

**Modules:**
- `auth/` - Authentication client
- `chat/completions/` - Chat completions with backoff and streaming
- `vector/completions/` - Vector completions orchestration, probabilistic voting, caching
- `functions/` - Function execution, flattening, Profile computations
- `ensemble/` and `ensemble_llm/` - Fetching and caching
- `ctx/` - Request context for dependency injection (enables BYOK)

**Key implementation details:**
- `pfx.rs` - Prefix tree for logprobs-based probabilistic voting
- `flat_task_profile.rs` - Flattens nested Function + Profile trees for parallel execution
- `completion_votes_fetcher/` - Fetches votes from actual LLM inference (excludes cached/RNG votes, includes retries)

**Running locally:**
```bash
cd objectiveai-api
OPENROUTER_API_KEY=sk-or-... cargo run --release
```

## WASM Bindings

Location: `objectiveai-rs-wasm-js/`

Exports:
- `validateEnsembleLlm(llm)` - Validate and compute Ensemble LLM ID
- `validateEnsemble(ensemble)` - Validate and compute Ensemble ID
- `compileFunctionTasks(function, input)` - Compile tasks client-side

Enables browser-based validation and preview without server round-trips.

## Development

**npm commands should always be run from the workspace root**, not from individual package directories:

```bash
# Good - from workspace root
npm install
npm run build --workspace=@objectiveai/function-agent
npm run build --workspace=objectiveai

# Bad - from package directory
cd objectiveai-js && npm run build
```

## Design Principles

1. **Content-addressed identities** - Reproducibility via deterministic IDs
2. **Weights separate from definitions** - Same Ensemble, different behaviors
3. **Composition** - Functions call Functions, building complex pipelines from simple parts
4. **No fine-tuning** - Learn weights over fixed models (faster, more interpretable)
5. **Cross-environment** - Same logic in Rust, Node.js, and browsers

---

## TypeScript SDK (`objectiveai-js`)

### Client Setup

```typescript
import { ObjectiveAI, Functions, EnsembleLlm } from "objectiveai";

const client = new ObjectiveAI({
  apiKey: process.env.OBJECTIVEAI_API_KEY, // or reads from env automatically
});
```

### Key Namespaces

- `Functions` - List, retrieve, and execute functions
- `Functions.Executions` - Execute functions with profiles
- `EnsembleLlm` - Retrieve ensemble LLM details by ID
- `Chat` - Direct chat completions
- `Vector` - Direct vector completions

### Function Execution

```typescript
// Execute a remote function with a remote profile
const result = await Functions.Executions.create(
  client,
  { owner: "objective-ai", repository: "is-spam", commit: "abc123" },
  { owner: "objective-ai", repository: "is-spam", commit: "def456" },
  {
    input: { text: "Hello world" },
    from_cache: true,   // Use cached votes when available
    from_rng: true,     // Generate remaining votes via RNG (free, simulated)
    reasoning: {        // Optional: generate reasoning summary
      model: "openai/gpt-4o-mini",
    },
  }
);
```

### Execution Response Structure

```typescript
interface FunctionExecution {
  id: string;
  output: number | number[];  // Scalar [0,1] or Vector (sums to ~1)
  tasks: Task[];              // Executed tasks with votes/completions
  reasoning: ReasoningSummary | null;  // AI-generated explanation
  usage: Usage;
}

interface Task {
  votes: Vote[];        // How each LLM voted
  completions: ChatCompletion[];  // What each LLM said before voting
  scores: number[];     // Final weighted scores
}

interface Vote {
  model: string;        // Ensemble LLM ID (cryptic, content-addressed)
  vote: number[];       // Distribution over options
  weight: number;       // This LLM's influence
  from_cache?: boolean;
  from_rng?: boolean;
}
```

### Looking Up Model Names

Votes contain cryptic IDs like `0QMZqudstCDbls4uoQOhEC`. To get the readable name:

```typescript
const details = await EnsembleLlm.retrieve(client, vote.model);
console.log(details.model); // "openai/gpt-4o"
```

### Execution Options

| Option | Description |
|--------|-------------|
| `from_cache: true` | Use globally cached votes (higher priority than RNG) |
| `from_rng: true` | Generate votes via RNG if not cached (free, simulated) |
| `reasoning: { model }` | Generate AI explanation of the result |
| `stream: true` | Stream chunks as execution progresses |
| `retry_token` | Resume a failed/incomplete execution |

---

## Web Interface (`objectiveai-web`)

### Scope

**UI/UX only.** Never modify files outside of `objectiveai-web/`. Backend is off-limits.

### Design System

| Color | Hex | Usage |
|-------|-----|-------|
| Light | `#EDEDF2` | Light bg, dark text |
| Dark | `#1B1B1B` | Dark bg, light text |
| Accent | `#6B5CFF` | Buttons, links, interactive |
| Score Green | `rgb(34, 197, 94)` | Scores ≥66% |
| Score Yellow | `rgb(234, 179, 8)` | Scores ≥33% |
| Score Orange | `rgb(249, 115, 22)` | Scores ≥15% |
| Score Red | `rgb(239, 68, 68)` | Scores <15% |

**Key rule:** Brand colors (purple) for interactive elements. Warm colors (green→red) for scores/data only.

### Container Layout Standards

**CRITICAL:** Always use the `.container` class for page content wrappers. Never use inline `maxWidth` or custom padding styles that duplicate container behavior.

```jsx
// CORRECT - Use container class
<div className="page">
  <div className="container">
    {/* Page content */}
  </div>
</div>

// WRONG - Don't use inline width/padding overrides
<div className="page">
  <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 32px' }}>
    {/* This causes inconsistent layouts */}
  </div>
</div>
```

**Container specs (from globals.css):**
- `max-width: 1100px` (standard pages)
- `padding: 0 32px` (desktop)
- `padding: 0 24px` (tablet @1024px)
- `padding: 0 16px` (mobile @640px)

**Exceptions:**
- Browse pages (functions, profiles, ensembles, ensemble-llms) intentionally use `maxWidth: '1400px'` for wider grid layouts
- These are the ONLY pages that should override container width

**Common mistakes to avoid:**
- Adding `maxWidth` to content sections inside `.container` (causes narrower content)
- Duplicating padding values inline instead of relying on container
- Using different maxWidth values across similar page types

### No Server-Side API Routes

The web app does NOT have server-side API routes (except NextAuth). All API calls use the JS SDK directly from the client. See "Client-Side SDK Pattern" section below for details.

### Planning Assets

Check `objectiveai-web/planning/` before making design decisions:
- `objectiveai-planning-moodboard.png` - Visual tone
- `objectiveai-planning-color-system.png` - Official palette
- `objectiveai-planning-wireframes-figma.png` - Page layouts

### Navigation Structure

```
Functions → Browse, Profiles
Ensembles → Browse, LLMs
Information → Team, Docs, Legal
```

### Browse Pages Pattern

All browse pages (Functions, Profiles, Ensembles, Ensemble LLMs) follow a consistent pattern:
- **Filter button** left of search bar (toggles `filtersOpen` state)
- **Sticky search bar** with filter toggle
- **Collapsible sidebar** on desktop when filters open (categories/owner filter + sort dropdown)
- **Mobile filter overlay** (bottom sheet) when filters open on mobile
- **Load more pagination** instead of showing all items
- **Responsive grid** that adapts when filters are open/closed

Reference implementation: `app/functions/page.tsx`

### Client-Side SDK Pattern (No Server-Side API Routes)

The web app has **no server-side API routes** except for NextAuth (`app/api/auth/[...nextauth]/route.ts`). All data fetching uses the JS SDK directly from the client:

**Public endpoints (no auth needed):**
```tsx
import { createPublicClient } from "@/lib/client";
import { Functions, Ensemble, EnsembleLlm } from "objectiveai";

const client = createPublicClient();
const functions = await Functions.list(client);
const ensemble = await Ensemble.retrieve(client, id);
```

**Auth-required endpoints (completions, executions, profile training, API keys, credits):**
```tsx
import { useObjectiveAI } from "@/hooks/useObjectiveAI";

const { getClient } = useObjectiveAI();
const client = await getClient();
const result = await Functions.Executions.create(client, ...);
```

**Stripe endpoints** are the only exception — they use `fetch` directly since Stripe is not in the SDK.

Key files:
- `lib/client.ts` — `createPublicClient()` (unauthenticated) and `createClient(session)` (authenticated via OAuth token)
- `hooks/useObjectiveAI.ts` — `getClient()` (auth) and `getPublicClient()` (no auth)
- `lib/provider.ts` — Token session management with OAuth refresh logic

Note: Profiles list endpoint only returns identifiers. To get `description`/`changelog`, individual fetches are required (N+1 pattern).

### Authentication

OAuth providers (Google, GitHub, X, Reddit) via NextAuth. Auth is fully functional:
- Auth route: `app/api/auth/[...nextauth]/route.ts`
- Provider module: `lib/provider.ts` (token session management with refresh logic)
- Auth context: `contexts/AuthContext.tsx`

**Anonymous execution:** Backend provides ~5¢ free credit for anonymous users. To show remaining credits, call `Auth.Credits.retrieve(client)` with the SDK.

**CORS:** API has `Access-Control-Allow-Origin: *` - client-side SDK calls work from any origin.

**No user tiers:** There are no free/pro/enterprise tiers. All users have the same access level.

### Disabled Features

- **Profile training** is wired to the real SDK (`Functions.Profiles.Computations.remoteFunctionCreate`)

### Current State (Feature-Complete)

All user-facing features have been implemented. The site is in production.

**Production-Ready Pages:**
- `/` - Landing with hero, featured functions, onboarding CTAs
- `/functions`, `/profiles`, `/ensembles`, `/ensemble-llms` - Browse pages with search/filter/sort
- `/functions/[slug]` - Function detail with execution UI, profile selector, reasoning
- `/functions/create` - JSON builder for `function.json` files
- `/ensembles/[id]` - Ensemble detail with LLM list and usage stats
- `/ensembles/create` - Ensemble builder with WASM validation
- `/ensemble-llms/[id]` - Ensemble LLM detail with config display
- `/ensemble-llms/create` - Ensemble LLM builder with WASM validation
- `/account/keys` - API keys management (create, view, disable)
- `/account/credits` - Credit balance + Stripe purchase + billing address
- `/people` - Team page with founder bios
- `/information`, `/faq` - FAQ (24 Q&As), API docs, SDK links
- `/legal` - Terms + Privacy (expandable cards)
- `/sdk-first`, `/vibe-native` - Onboarding guides
- `/chat`, `/vector` - Direct completions pages
- `/docs/api/**` - 32 API endpoint docs with Zod schema introspection
- `/profiles/train` - Profile training UI (wired to real SDK)

### Key Files

| File | Purpose |
|------|---------|
| `app/globals.css` | Design system (831 lines) |
| `components/AppShell.tsx` | Navigation, theme toggle, mobile menu |
| `lib/objectiveai.ts` | Dev execution defaults (`from_cache`, `from_rng`), display helpers |
| `lib/client.ts` | `createPublicClient()` and `createClient(session)` for SDK access |
| `hooks/useObjectiveAI.ts` | React hook for authenticated/public SDK clients |
| `lib/provider.ts` | Token session management with OAuth refresh logic |
| `lib/stripe.ts` | Stripe utilities (retry, theme, formatting) |
| `lib/stripe-types.ts` | TypeScript types for Stripe API responses |
| `components/stripe/` | PurchaseCreditsForm, BillingAddressForm, CreditsBreakdown |
| `components/docs/EndpointDocs.tsx` | API endpoint docs with Zod schema introspection |
| `contexts/AuthContext.tsx` | Auth provider with NextAuth integration |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth route (Google, GitHub, X, Reddit) |
| `planning/` | Wireframes, moodboards, design guidelines |

---

## Deep Technical Reference

### Content-Addressed ID Computation

**Algorithm:** XXHash3-128 → base62 → pad to 22 characters

```rust
// From objectiveai-rs/src/ensemble_llm/ensemble_llm.rs
fn id(&self) -> String {
    let mut hasher = XxHash3_128::with_seed(0);
    hasher.write(serde_json::to_string(self).unwrap().as_bytes());
    format!("{:0>22}", base62::encode(hasher.finish_128()))
}
```

**Critical:** Structure must be normalized before hashing (defaults removed, collections sorted).

### Ensemble LLM Validation Rules

| Field | Range | Notes |
|-------|-------|-------|
| `model` | non-empty | e.g., `openai/gpt-4o` |
| `temperature` | [0, 2] | Default 1.0 removed before hashing |
| `top_p` | [0, 1] | Default 1.0 removed |
| `top_logprobs` | [2, 20] | Enables probabilistic voting |
| `frequency_penalty` | [-2, 2] | |
| `presence_penalty` | [-2, 2] | |

### Ensemble Validation

- Total LLM count (sum of all `count` fields): [1, 128]
- No duplicate primary+fallback ID combinations
- LLMs with `count: 0` are skipped

### Probabilistic Voting (Prefix Tree)

**Location:** `objectiveai-api/src/vector/completions/pfx.rs`

**How it works:**
1. Set `top_logprobs` (2-20) on Ensemble LLM
2. Responses get prefixed keys: `` `A` ``, `` `B` ``, etc.
3. For >20 responses, nested prefixes: `` `A` `` `` `A` ``, `` `A` `` `` `B` ``
4. Extract logprobs from final token to get probability distribution
5. Tree is randomized per-request to prevent position bias

**Vote calculation:**
```
weights[i] += sum(vote[i] * llm.weight for each LLM)
scores = weights / sum(weights)  // Normalize to sum ≈ 1
```

### Vote Priority (Cache Behavior)

1. **Retry votes** - From previous execution via `retry_token`
2. **Cache votes** - Global ObjectiveAI cache (`from_cache: true`)
3. **RNG votes** - Simulated, free (`from_rng: true`)
4. **Fresh votes** - Actual LLM inference

### Function Flattening

**Location:** `objectiveai-api/src/functions/flat_task_profile.rs`

Nested functions are flattened for parallel execution:
```
Function A
├─ Task 1: VectorCompletion  ──→  Parallel batch
├─ Task 2: Function B
│  ├─ Task 2.1: VectorCompletion  ──→  Same batch
│  └─ Task 2.2: VectorCompletion  ──→  Same batch
└─ Task 3: VectorCompletion  ──→  Same batch
```

All leaf vector completions execute in parallel, results aggregate up the tree.

### Expression Context Variables

| Variable | Available In | Description |
|----------|--------------|-------------|
| `input` | Everywhere | Function input data |
| `tasks` | Output expression only | Array of task outputs (null if skipped) |
| `map` | Mapped task expressions | Current element from `input_maps` |

### Expression Custom Functions

**JMESPath** (from `objectiveai-rs/src/functions/expression/runtime.rs`):
- Math: `add(a,b)`, `subtract(a,b)`, `multiply(a,b)`, `divide(a,b)`, `mod(a,b)`
- Utilities: `json_parse(s)`, `is_null(v)`, `if(cond, then, else)`
- Advanced: `l1_normalize(array)`, `zip_map(expref, array)`, `repeat(value, n)`

**Starlark** (from `objectiveai-rs/src/functions/expression/starlark.rs`):
- `sum(list)`, `abs(x)`, `float(x)`, `round(x)`
- Full list comprehensions, dictionary comprehensions

### Output Validation

**Scalar functions:** Output must be in [0, 1]

**Vector functions:**
- Sum must be ~1 (tolerance: 0.99-1.01)
- Length must match `output_length` if specified

### TypeScript SDK Key Types

```typescript
// Vote contains cryptic 22-char ID
interface Vote {
  model: string;        // e.g., "0QMZqudstCDbls4uoQOhEC"
  vote: number[];       // Distribution over responses
  weight: number;       // LLM's influence [0, 1]
  from_cache?: boolean;
  from_rng?: boolean;
}

// To get readable model name:
const details = await EnsembleLlm.retrieve(client, vote.model);
console.log(details.model); // "openai/gpt-4o"
```

### Request Context (BYOK Support)

**Location:** `objectiveai-api/src/ctx/`

The `Context` struct enables:
- Per-request ensemble/LLM caching (prevents N+1 queries)
- BYOK (Bring Your Own Key) via `ContextExt` trait
- Cost tracking per user

### Swiss System Strategy

For vector functions, enables tournament-style ranking:
1. Split input into pools (default size 10)
2. Score each pool
3. Re-sort by cumulative scores
4. Re-pool and score again
5. Repeat for N rounds (default 3)
6. Average scores across rounds

**Note:** Swiss system strategy is handled entirely server-side. Client code handles responses from both strategies identically—no UI configuration needed.

---

## Feature Audit

### What's Implemented ✅

| Feature | Status | Notes |
|---------|--------|-------|
| Browse Functions | Complete | Search, filter, pagination |
| Execute Functions | Complete | Streaming, results visualization, model breakdown |
| Browse Profiles/Ensembles/LLMs | Complete | List views with search |
| Detail Pages | Complete | Function, Ensemble, Ensemble LLM details |
| API Key Management | Complete | Create, view, disable |
| Credit Balance + Purchase | Complete | Stripe integration fully ported |
| Media Input Component | Ready | `ArrayInput.tsx` supports images, audio, video, files |

### Recently Implemented ✅ (Feb 2026)

| Feature | Status | Notes |
|---------|--------|-------|
| Profile Selector | Complete | Dropdown when multiple profiles exist |
| Reasoning Model Selector | Complete | Toggle + model dropdown (GPT-4o Mini, GPT-4o, Claude 3 Haiku/Sonnet) |
| Direct Chat Completions | Complete | `/chat` page with SDK streaming |
| Direct Vector Completions | Complete | `/vector` page with score viz, SDK calls |
| File Uploads | Complete | Removed `textOnly` restriction from ArrayInput |
| Ensemble LLM Creation | Complete | `/ensemble-llms/create` with WASM validation |
| Ensemble Creation | Complete | `/ensembles/create` with WASM validation |
| Function JSON Builder | Complete | `/functions/create` - JSON editor for creating `function.json` files (not server-side creation) |
| Profile Training UI | Complete | `/profiles/train` — wired to real SDK |
| WASM Validation | Complete | `lib/wasm-validation.ts` for real-time ID computation |
| Stripe Credit Purchase | Complete | Full purchase flow, billing address, breakdown display |
| API Docs (32 pages) | Complete | `/docs/api/**` with Zod schema introspection via `EndpointDocs` |

### Code Quality Improvements (Feb 2026)

| Improvement | Files | Notes |
|-------------|-------|-------|
| `useIsMobile` hook | `hooks/useIsMobile.ts` | Replaces duplicated mobile detection in 22 files |
| Shared types | `lib/types.ts` | Comprehensive TypeScript types for API responses |
| Error handling utility | `lib/error-handling.ts` | `normalizeError()`, `isAuthError()`, etc. |
| Named constants | `lib/constants.ts` | Timeout/animation durations (no more magic numbers) |
| AuthContext types | `contexts/AuthContext.tsx` | Fixed implicit `any` types for OAuth responses |
| BrowsePage component | `components/BrowsePage.tsx` | Reusable compound component for browse pages |
| Streaming re-enabled | `lib/objectiveai.ts` | `stream: true` (was disabled for dev mode issues) |

### WASM Bindings

Now integrated via `lib/wasm-validation.ts`. Used in creation pages for real-time validation:

| Function | Used In |
|----------|---------|
| `validateEnsembleLlm(llm)` | `/ensemble-llms/create` |
| `validateEnsemble(ensemble)` | `/ensembles/create` |

Module loads gracefully - shows "Enter model to see ID" when WASM unavailable.

### SDK Integrations

All API interactions use the JS SDK directly (no server-side API routes):

| Feature | SDK Call | Auth Required |
|---------|----------|---------------|
| Chat completions | `Chat.Completions.create(client, { stream: true })` | Yes |
| Vector completions | `Vector.Completions.create(client, body)` | Yes |
| Function execution | `Functions.Executions.create(client, ...)` | Yes |
| Profile training | `Functions.Profiles.Computations.remoteFunctionCreate(client, ...)` | Yes |
| Browse functions | `Functions.list(client)`, `Functions.retrieve(client, ...)` | No |
| Browse profiles | `Functions.Profiles.list(client)` | No |
| Browse ensembles | `Ensemble.list(client)`, `Ensemble.retrieve(client, id)` | No |
| Browse ensemble LLMs | `EnsembleLlm.list(client)`, `EnsembleLlm.retrieve(client, id)` | No |

### Stripe Integration (Complete)

Stripe integration in `objectiveai-web/`:
- `components/stripe/PurchaseCreditsForm.tsx` - Multi-step purchase flow
- `components/stripe/BillingAddressForm.tsx` - Stripe AddressElement integration
- `components/stripe/CreditsBreakdown.tsx` - Payment breakdown display
- `lib/stripe.ts` - Utilities (retry logic, theme, formatting)
- `lib/stripe-types.ts` - TypeScript types for Stripe API responses
- `hooks/useStripeTheme.ts` - SSR-safe theme syncing for Stripe elements
- Customer session management via `/stripe/customer` endpoint
- Payment intent creation via `/stripe/payment_intent` endpoint
- 10-second retry logic for 429 rate limit (tax propagation delay)
- Uses `fetch` client-side for Stripe endpoints—these are NOT in the SDK

---

## Production Launch Plan

### Pre-Launch Checklist

**1. ~~Verify Stripe and API key flows match old website behavior~~ DONE**
- Stripe: full parity confirmed (12 behaviors verified)
- API keys: gaps fixed (added cost display, sort, key masking, copy feedback)

**2. ~~Fix `next.config.ts`~~ DONE**
- Added `transpilePackages`, `images.remotePatterns`, security headers

**3. ~~Add production infrastructure files~~ DONE**
- `public/robots.txt`, `app/sitemap.ts`, OG/Twitter meta in `layout.tsx`
- `app/not-found.tsx` (branded 404), `app/error.tsx` (error boundary)
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)

**4. ~~Create Dockerfile and cloudbuild.yaml~~ DONE**
- Multi-stage build (node:20 builder, node:20-slim runner)
- All old build args + 2 new (Sonarly project key, Sonarly ingest point)
- Cloud Build deploys to Cloud Run `objective-ai-web-main` in `us-central1`

**5. ~~Rename and clean up~~ DONE**
- Old site deleted, `objectiveai-web-new/` renamed to `objectiveai-web/`
- All references updated (root `package.json`, Dockerfile, cloudbuild.yaml, CLAUDE.md)

**6. ~~Pre-launch accuracy audit~~ DONE**
- 3-pass audit of all user-facing content, SDK calls, URLs, and claims
- Fixed: fabricated function names (`objective-ai/is-spam`, `is-toxic`, `sentiment`), crashing SDK example (null profile), wrong GitHub URLs (`anthropics/objectiveai-js`), fake email forms (2), wrong Discord invite, Rust SDK marked "Coming Soon" (published on crates.io), unverified founder bios, wrong curl endpoint, copyright year
- Files changed: `sdk-first/page.tsx`, `vibe-native/page.tsx`, `people/page.tsx`, `information/page.tsx`, `functions/create/page.tsx`, `Footer.tsx`, `AppShell.tsx`
- Note for Ronald: API docs show `/vector/completions/{id}` and `/vector/completions/cache` as GET (matching SDK `get_unary`), but `objectiveai-api/src/main.rs` registers them as POST. Docs match the SDK — verify if this is intentional.

**7. Open pull request** via `gh pr create`

### Deployment Reference (from old website)

**Dockerfile pattern** (`objectiveai-web/Dockerfile`):
```
Builder (node:20):
  - Copy root package.json + objectiveai-js/ + objectiveai-web/package.json
  - npm install --include=dev
  - Copy objectiveai-web/ source
  - npm run build --workspace=objectiveai-web
  - Replace symlinked SDK with copied dist

Runner (node:20-slim):
  - Copy .next, public, node_modules, package.json, next.config.ts
  - CMD ["npx", "next", "start"]
```

**Build args** (passed via Cloud Build substitution variables):
- `AUTH_GOOGLE_CLIENT_ID`, `AUTH_GOOGLE_CLIENT_SECRET`
- `AUTH_GITHUB_CLIENT_ID`, `AUTH_GITHUB_CLIENT_SECRET`
- `AUTH_TWITTER_CLIENT_ID`, `AUTH_TWITTER_CLIENT_SECRET`
- `AUTH_REDDIT_CLIENT_ID`, `AUTH_REDDIT_CLIENT_SECRET`
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_API_URL`, `NODE_ENV`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `IP_RSA_PUBLIC_KEY`, `USER_IP_HEADER`
- (New) `NEXT_PUBLIC_SONARLY_PROJECT_KEY`, `NEXT_PUBLIC_SONARLY_INGEST_POINT`

**Cloud Build pipeline** (`cloudbuild.yaml`):
1. Fetch git submodules
2. Build Docker image with all build args
3. Tag as `us-docker.pkg.dev/$PROJECT_ID/objectiveai/objectiveai-web:latest`
4. Push to GCP Artifact Registry
5. Deploy to Cloud Run (`objective-ai-web-main`, `us-central1`, unauthenticated)
6. Timeout: 2100s, Cloud Logging only

---

## Conventions

### Code Changes

When asked to "standardize" or "apply patterns from X to Y", preserve existing functionality while adopting the visual/structural patterns. Never remove features (like filters, sorts, controls) unless explicitly told to.

### Quality Checks

After declaring work "complete" on multi-page tasks, enumerate all affected pages and verify each one was touched before finishing.

### Testing Guidelines

- **No network-hitting tests:** Tests should not hit the backend API directly
- Tests should mock API responses or use local test data
- Focus on component rendering, user interactions, and state management

---

## Development Workflow

### SDK Testing

Use `coding-agent-scratch/` folder for testing SDK calls and exploring API behavior. Create test scripts to verify CORS, client-side SDK usage, and API responses.

### Merging from Main

**CRITICAL:** Any merge from `main` warrants full understanding of its contents and implications. Before merging:

1. Review all changed files and understand the scope
2. Check for changes to:
   - API contracts (request/response types)
   - SDK methods and signatures
   - WASM bindings exports
   - Design system (globals.css, components)
3. Update this CLAUDE.md if backend capabilities change
4. Test affected web pages after merge
5. Verify no regressions in browse/execute flows
