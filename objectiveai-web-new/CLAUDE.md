# ObjectiveAI Web New

Guidelines for working with the ObjectiveAI SDK in this project.

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
