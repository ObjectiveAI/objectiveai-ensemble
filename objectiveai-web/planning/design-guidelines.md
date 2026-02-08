# ObjectiveAI Web Design Guidelines

## Scope

**UI/UX only.** Never modify files outside of `objectiveai-web/`. Backend is off-limits unless explicitly instructed.

Pages in the nav (Functions, People, Resources) are not the only pages—individual functions, legal pages, etc. exist outside the main navigation.

---

## Planning Assets

Reference these files before making design decisions:

- `objectiveai-planning-moodboard.png` — Visual inspiration and tone
- `objectiveai-planning-color-system.png` — Official color palette
- `objectiveai-planning-color-theory.png` — Philosophy: brand uses cool colors, scores use warm spectrum
- `objectiveai-planning-wireframes-figma.png` — Page layouts and structure
- `objectiveai-planning-assets-figma.png` — Component inventory (buttons, text fields, icons)
- `objectiveai-planning-logo-usage.png` — Logo mark and wordmark variants
- `objectiveai-planning-notes-1.png` — Early ideation (rarely needed, premature)

---

## Design System

### Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Light | `#EDEDF2` | Light theme background, dark theme text |
| Dark | `#1B1B1B` | Dark theme background, light theme text |
| Accent | `#6B5CFF` | Primary interactive color, buttons, links |
| Deep Purple | `#271884` | Reserved for specific brand moments |
| Cyan | `#3DF2E1` | Ultra rare highlight—ask before using |

**Score Output Colors:** Function scores and rankings use a green-to-red spectrum for data visualization. The ObjectiveAI brand stays in the cool purple range.

### Typography

Continue with current typefaces:
- **Geist** — UI text
- **Geist Mono** — Code and monospace contexts
- System UI fallbacks

### Components

**Text Fields:**
- Both AI and Human text fields use pill shape by default
- Expand appropriately when text content warrants it
- Behavior adapts to context (router demo starts compact, individual functions may start expanded)
- **AI TextField:** Send arrow points **up**
- **Human TextField:** Send arrow points **right**

**Buttons:**
- Pill-shaped (`border-radius: 50px`)
- Primary: filled with accent color
- Ghost: border only, transparent background

**Cards:**
- 20px border radius
- Subtle border and shadow
- Hover state with elevated shadow

**Navigation:**
- Sticky pill-shaped nav bar
- Current pages: Functions, People, Resources

### Animation

Keep animations minimal and functional:
- **Transitions:** 0.2s–0.3s for hover states, color changes, theme toggle
- **Loading:** Pulsing dots for thinking, spinning circle for processing
- No decorative animations without purpose

---

## Design Principles

1. **Clean and professional** — Premium developer tool aesthetic, not consumer app
2. **Generous whitespace** — Let content breathe
3. **Subtle depth** — Light shadows and borders, no heavy effects
4. **Responsive first** — Breakpoints at 640px (mobile) and 1024px (tablet)
5. **Functional motion** — Animate to communicate state, not to decorate

---

## Audience

**Primary:** Developers seeking AI scoring primitives

**Secondary:**
- Casual AI users exploring functions in-browser
- VCs and investors evaluating the product

---

## Working Style

- **Ask when uncertain:** If more than 30% unsure about design intent, ask for clarification before proceeding
- **Reference planning assets:** Check visual files before making UI decisions
- **Ask about reasoning:** When understanding intent would lead to better decisions, ask
