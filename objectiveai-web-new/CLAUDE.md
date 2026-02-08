# ObjectiveAI Web New

Guidelines for working with the ObjectiveAI SDK in this project.

## Scope

**Only work within `objectiveai-web-new/` unless explicitly instructed otherwise.** This is Maya's frontend workspace. Backend, API, SDK, and other directories are off-limits unless the user specifically directs you there.

## Team Context

**Maya Gore** - COO & Co-Founder. Handles UI/UX, creative direction, and frontend work. This is her workspace.

**Ronald Riggles** - CEO & Co-Founder. Handles backend, API, SDK, and technical architecture.

### When to Ask Ronald

Ask Ronald (or mark as placeholder) for:
- **Backend/API questions** - How endpoints work, data structures, authentication
- **SDK behavior** - Expected responses, edge cases, error handling
- **Content that represents the product** - Hyperprompts, official descriptions, technical explanations
- **Anything you'd need to make up** - If it's not in the codebase, don't guess

When unsure about technical accuracy, use obvious placeholders like `[Placeholder: Description from Ronald]` or lorem ipsum rather than inventing content that could be mistaken for real.

## Finding SDK Information

The TypeScript SDK source is at `objectiveai-js/`. Key locations:

```
objectiveai-js/
├── src/
│   ├── auth/
│   │   ├── api_key/api_key.ts    # Auth.ApiKey.list(), create(), disable()
│   │   └── credits/credits.ts     # Auth.Credits.retrieve()
│   ├── functions/                 # Functions.list(), retrieve(), Executions.create()
│   ├── ensemble_llm/              # EnsembleLlm.retrieve()
│   └── http.ts                    # Response wrapper structure ({ data: [...] })
```

**API response structure**: Most list endpoints return `{ data: [...] }`. Check `http.ts` for the wrapper types.

**To find SDK method signatures**: Read the corresponding `.ts` file in `objectiveai-js/src/`.

## Design Context

For design decisions, reference `planning/design-guidelines.md` and the visual assets in `planning/`. When more than 30% unsure about design intent, ask for clarification before proceeding.

## Documentation

**Read documentation frequently.** ObjectiveAI is a complex system with many interrelated concepts. Before implementing features that use the SDK, read relevant documentation from:

- `objectiveai-js/` - TypeScript SDK (this is what you'll use directly)
- `objectiveai-rs/` - Rust SDK (authoritative type definitions and validation logic)
- `objectiveai-api/` - API server (implementation details, especially for understanding behavior)

The root `CLAUDE.md` contains an overview of core concepts (Ensembles, Ensemble LLMs, Functions, Profiles, Weights, etc.). Read it first if you're unfamiliar with the system.

## Development Cost Optimization

When executing Functions during development, **always set `from_cache` and `from_rng` to `true`** to minimize costs:

```typescript
const result = await client.functions.executions.create("owner/repo", {
  input: { /* ... */ },
  from_cache: true,
  from_rng: true,
});
```

**What these do:**

- `from_cache: true` - Uses cached votes from the global ObjectiveAI votes cache when available, avoiding redundant LLM calls
- `from_rng: true` - For any votes not found in cache, generates them via RNG instead of calling LLMs

**Priority order:** `retry_token` > `from_cache` > `from_rng`

This means the system first checks for retry token votes, then cached votes, then falls back to RNG. Setting both flags ensures you never make actual LLM calls during development unless explicitly needed.

Only disable these flags when you need real LLM responses (e.g., testing actual model behavior, production deployments).

## Layout Standards

- **Mobile padding**: 16px horizontal (not 20px)
- **Desktop padding**: 32px horizontal
- **Breakpoints**: 640px (mobile), 1024px (tablet), 1100px+ (desktop)
- **Mobile menu**: Horizontal dropdown with 3 columns (matches footer layout), not a slide-over drawer

## Asset Locations

- **Founder photos**: `public/photos/maya.jpg`, `public/photos/ronald.jpg`
- **Planning assets**: `planning/` directory contains moodboards, wireframes, color system references

## Current State Notes

- **Auth bypass**: Account pages (keys, credits) have `BYPASS_AUTH = true` for development. Remove when auth is working.
- **No server-side API key**: All API calls use the JS SDK directly (client-side with user auth, or public client with no auth for browse endpoints). No `OBJECTIVEAI_API_KEY` env var.
- **Functions integration**: Complete - uses real ObjectiveAI SDK with streaming support (no mock data)
- **Rich content (media) inputs**: Media upload buttons (image, audio, video, file) are available on both function execution and vector completions pages. The `InputBuilder` component has a `textOnly` prop that can hide them if needed but it is not currently used.

### Rich Content in Function Expressions

The pipeline for function execution is: Input → serialize to JSON → JMESPath/Starlark evaluates → deserialize result back to typed values. Rich content (images, audio, video, files) is represented as `RichContentPart` objects (e.g. `{type: "image_url", image_url: {url: "..."}}`).

**Works:** Expressions that pass media objects through intact. If a function does `{"$jmespath": "input.items"}` and `input.items` contains `RichContentPart` objects, the JSON roundtrip preserves the structure and deserialization into `Vec<RichContent>` succeeds.

**Breaks:** Expressions that destructure media objects. If a function does `{"$jmespath": "input.image.image_url"}`, the `type: "image_url"` wrapper is lost and deserialization fails or misinterprets the value as text.

**Cannot do:** Expressions cannot create new media objects from scratch, construct base64-encoded data, or synthesize binary content. The expression runtime (`runtime.rs`, `starlark.rs`) only provides math and text/array manipulation functions.

| Scenario | Works? |
|----------|--------|
| Direct vector completions (no expressions) | Yes |
| Function expressions that pass media through intact (`input.items`) | Yes |
| Function expressions that destructure media objects (`input.image.image_url`) | No |
| Expressions that create new media from scratch | No |

Since most existing functions were written for text inputs, media support is function-specific. If a function's expressions can't handle media, the backend returns a clear deserialization error. No frontend restriction is needed — let users try and let the error surface naturally.
