# Real Functions Integration Strategy

**Created:** 2026-01-28
**Status:** Planning (awaiting decisions)

## Current State

### Web-new (Mock Data)
- `app/functions/page.tsx` - `MOCK_FUNCTIONS` array (8 hardcoded items)
- `app/functions/[slug]/page.tsx` - `FUNCTION_DATA` object + `handleRun()` with `setTimeout` mock

### SDK Capabilities
- Functions execute via `client.functions.executions.create()`
- Functions are GitHub-hosted (`owner/repo` pattern with `function.json` at root)
- Output: **scalar** (single 0-1 score) or **vector** (array summing to ~1)
- Response includes: `id`, `tasks`, `output`, `error`, `retry_token`, `usage`

## Proposed Phases

### Phase 1: Infrastructure Setup
1. Create API client wrapper (server-side route or edge function)
2. Add environment variable for API key (`OBJECTIVEAI_API_KEY`)
3. Always use `from_cache: true` + `from_rng: true` per CLAUDE.md

### Phase 2: Single Function Proof-of-Concept
1. Pick one function to wire up end-to-end
2. Option A: Use an **existing GitHub-hosted function** (if any exist)
3. Option B: Define an **inline function** in code (no GitHub needed)
4. Replace `handleRun()` mock with real SDK call
5. Map response `output` to existing results UI

### Phase 3: Function Registry
1. Replace `MOCK_FUNCTIONS` with either:
   - A static registry of known `owner/repo` functions
   - Dynamic fetching from a functions index API (if one exists)
2. Fetch function metadata (description, input_schema) from GitHub repos

### Phase 4: Polish
1. Add streaming responses for real-time feedback
2. Handle errors gracefully (show retry option with `retry_token`)
3. Display `usage` cost information

## Open Questions

1. **Do real GitHub-hosted functions exist?** (e.g., `objectiveai/sentiment-analyzer`)
   - If yes: Wire those up directly
   - If no: Create inline functions in code, or create actual GitHub repos?

2. **How should the API key be handled?**
   - Environment variable only (server-side calls)
   - User provides their own key (client-side with user auth)
   - Both (default key for demo, user key for production)

3. **Which function to start with?**
   - `trip-must-see` (Ranking)
   - `email-classifier` (Scoring)
   - `sentiment-analyzer` (Scoring)

4. **Inline vs Remote functions?**
   - Inline: Faster to prototype, function logic lives in code
   - Remote: Matches production pattern, requires GitHub repos

## SDK Usage Pattern

From `objectiveai-web-new/CLAUDE.md`:

```typescript
const result = await client.functions.executions.create("owner/repo", {
  input: { /* ... */ },
  from_cache: true,  // Use cached votes
  from_rng: true,    // RNG for missing votes (no real LLM calls in dev)
});
```

**Priority order:** `retry_token` > `from_cache` > `from_rng`

## Response Structure

```typescript
{
  id: string,
  tasks: Task[],
  tasks_errors: boolean,
  reasoning: ReasoningSummary | null,
  output: number | number[],  // scalar or vector
  error: ObjectiveAIError | null,
  retry_token: string | null,
  created: number,
  function: string | null,
  profile: string | null,
  usage: Usage,
}
```

## Files to Modify

1. **New:** `app/api/functions/execute/route.ts` - Server-side API route
2. **Modify:** `app/functions/page.tsx` - Replace MOCK_FUNCTIONS
3. **Modify:** `app/functions/[slug]/page.tsx` - Replace handleRun() mock
4. **New:** `lib/objectiveai.ts` - SDK client wrapper with from_cache/from_rng defaults
