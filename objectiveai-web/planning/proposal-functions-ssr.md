# Proposal: Move `/functions` browse page to server-side rendering with ISR

## The problem

The functions browse page is fully client-rendered. On every visit, it calls `Functions.list()` to get identifiers, then makes a separate `Functions.retrieve()` for every unique repo to get descriptions and types. That's 1 + N HTTP requests from the user's browser on every single page load — no caching, no SSR. Users see a loading spinner while this happens, and search engines see an empty page.

**What this means in practice:**
- Every visitor pays the full N+1 cost from scratch
- The function catalog (arguably the most discoverable public content) isn't indexed by Google
- First paint is slow — blocked on N parallel fetches completing

## The fix

Split the page into a Next.js server component (data fetching) and a client component (search/filter/sort). The N+1 moves to the server and is cached with ISR — it revalidates every ~2 minutes instead of running per-user. Standard Next.js App Router pattern.

**What changes:**
- `page.tsx` becomes a server component that fetches data via `unstable_cache` with 120s revalidation
- A new `FunctionsBrowse.tsx` client component receives pre-fetched data as props and handles all interactivity
- A `loading.tsx` provides a fallback during navigation transitions

**What doesn't change:**
- All interactivity (search, filters, sort, pinned, load more, mobile overlay)
- The SDK calls themselves — same `Functions.list()` + `Functions.retrieve()`, just running server-side
- No new dependencies, no new API routes, no new architecture

## Risk

- If the API is down during ISR revalidation, Next.js serves stale cached content — users unaffected
- If it's down on the very first build (no cache), the existing `error.tsx` boundary handles it
- `createPublicClient()` uses standard `fetch` internally — confirmed server-compatible

## Result

Instant page loads from cache, full SEO, N+1 cost amortized across all users instead of per-visit. Three files touched, zero new patterns.
