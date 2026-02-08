# CTA Button Destinations

## Context
The landing page has two primary CTA buttons in the hero:
- **Vibe-Native** - For users who want to use functions directly (no-code path)
- **SDK-First** - For developers who want to integrate via code

## Vibe-Native Options

| Option | Destination | Pros | Cons |
|--------|-------------|------|------|
| **A. `/functions`** | Internal page | Keeps users on-site, page already exists, natural discovery flow | Currently uses mock data |
| **B. Discord** | `discord.gg/gbNFHensby` | Community discovery, real engagement | Leaves site |
| **C. External playground** | TBD | Best UX if available | May not exist yet |

**Recommendation: `/functions` (internal)**

## SDK-First Options

| Option | Destination | Pros | Cons |
|--------|-------------|------|------|
| **A. Docs** | `docs.objective-ai.io` | Standard developer path, best DX | Need to verify exists |
| **B. npm** | `npmjs.com/package/objectiveai` | Shows install, types, trusted source | Less context than docs |
| **C. GitHub** | `github.com/ObjectiveAI/objectiveai` | Full source, examples, community | Can be overwhelming |
| **D. API reference** | `api.objective-ai.io` | Direct to API | Less beginner-friendly |

**Recommendation: Docs site if exists, otherwise GitHub**

## Implementation

```tsx
// Vibe-Native → internal /functions page
<Link href="/functions" className="pillBtn">Vibe-Native</Link>

// SDK-First → external docs or GitHub
<a
  href="https://github.com/ObjectiveAI/objectiveai"
  target="_blank"
  rel="noopener noreferrer"
  className="pillBtn"
>
  SDK-First
</a>
```

## Next Steps
1. Verify if `docs.objective-ai.io` exists
2. Implement button destinations
3. Consider adding tooltips or hover descriptions explaining each path
