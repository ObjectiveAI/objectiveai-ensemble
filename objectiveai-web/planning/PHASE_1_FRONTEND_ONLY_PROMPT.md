# Phase 1 Prompt: Frontend-Only Execution Tree Visualization

## 🚨 GUARDRAIL: FRONTEND-ONLY PROJECT

**This prompt ensures ZERO backend changes.**

**ALLOWED:**
- ✅ Create React components (visualization only)
- ✅ Add CSS variables for styling
- ✅ Setup R3F canvas (display only)
- ✅ Read execution data from backend
- ✅ Render existing task structure
- ✅ Display votes/scores/labels

**PROHIBITED:**
- ❌ Modify any function code
- ❌ Change backend logic
- ❌ Edit SDK or types
- ❌ Alter task structure
- ❌ Change vote/score calculation
- ❌ Modify execution flow
- ❌ Add backend features
- ❌ Touch `/functions/` folder
- ❌ Modify `Functions.Executions.create()` call

**Scope:** Build a presentation layer that displays execution results. Zero impact on actual execution.

---

## Copy & Paste Into Claude Code

```
🚨 CRITICAL: FRONTEND-ONLY VISUALIZATION

This is a frontend-only project. We are visualizing existing execution data.
ZERO changes to functions, backend, or SDK.

PHASE 1: Build the foundation for execution tree visualization

ALLOWED (Frontend):
✅ Create ExecutionTreeVisualization component
✅ Setup R3F with Canvas
✅ Render test tree with static data
✅ Use CSS variables (design tokens)
✅ Read execution data from backend
✅ Display in responsive tree layout

PROHIBITED (Backend):
❌ Modify any function code
❌ Change execution logic
❌ Edit SDK or backend
❌ Alter task structure
❌ Calculate votes/scores
❌ Change streaming behavior
❌ Add backend features

TASK: Build frontend component shell

1. CREATE FOLDER & FILES
   Folder: objectiveai-web/components/ExecutionTreeVisualization/
   Files:
   - index.tsx (main component)
   - index.css (styling with CSS variables only)
   - TreeScene.tsx (R3F scene)
   - types.ts (frontend types only)

2. FILE: types.ts (FRONTEND TYPES ONLY)
   Define:
   - TreeNode (for visualization)
   - LayoutPosition (for positioning)
   - LayoutResult (for layout)
   Do NOT create backend types or modify SDK types.

3. FILE: index.tsx (MAIN COMPONENT)
   - 'use client' directive
   - Import useTreeLayout from lib
   - Import useDeviceCapabilities from lib
   - Create hardcoded test tree (3 nodes: Function → Task → Output)
   - Pass test tree to useTreeLayout for positioning
   - Render Canvas with TreeScene
   - Use CSS variables for all styling
   - Do NOT call Functions.Executions.create()
   - Do NOT execute any functions
   - Do NOT modify execution logic

4. FILE: TreeScene.tsx (R3F SCENE - DISPLAY ONLY)
   - Use R3F hooks (useFrame, useThree)
   - Render nodes as 3D boxes using BoxGeometry
   - Position nodes using layout positions
   - Add lights (ambientLight, pointLight)
   - Color nodes by type
   - Do NOT calculate anything
   - Do NOT modify data
   - DISPLAY ONLY

5. FILE: index.css (STYLING - CSS VARIABLES ONLY)
   - Use CSS variables: --canvas-height, --spacing-lg, --color-bg-page, --font-function-label
   - No hardcoded values
   - No @media queries for sizing
   - No breakpoints
   - Responsive flexbox container

6. INSTALL DEPENDENCIES (FRONTEND ONLY)
   npm install @react-three/fiber @react-three/drei three --workspace=objectiveai-web
   Do NOT modify SDK or backend dependencies.

7. VERIFY BUILD (FRONTEND ONLY)
   npm run typecheck --workspace=objectiveai-web
   npm run build --workspace=objectiveai-web
   Both must pass.

8. TEST IN BROWSER (FRONTEND ONLY)
   npm run dev --workspace=objectiveai-web
   Create test page: app/tree-test/page.tsx
   Navigate to http://localhost:3000/tree-test

   Test responsive scaling:
   - 375px (iPhone)
   - 768px (Tablet)
   - 1440px (Desktop)
   - 2560px (Ultra-wide)

   Verify:
   - Tree renders at all sizes
   - No horizontal scrolling
   - Smooth scaling (no jumps)
   - Text readable
   - No console errors
   - Dark mode works

SUCCESS = All tests pass + Zero backend changes

CRITICAL SAFETY CHECK:
Before submitting, verify:
- ✅ No files modified in /functions/ folder
- ✅ No files modified in backend/ folder
- ✅ No SDK files modified
- ✅ No backend types created
- ✅ No execution logic touched
- ✅ Only component code added
- ✅ Only CSS variables used (no breakpoints)
- ✅ No Functions.Executions call modified
- ✅ ZERO backend impact

FRONTEND-ONLY RULE:
This visualization displays existing execution data.
It does NOT execute functions.
It does NOT calculate votes or scores.
It does NOT modify task structure.
It ONLY displays what the backend provides.

When done, reply with:
✅ Phase 1 complete - Static tree rendering verified - FRONTEND ONLY (zero backend changes)
```

---

## Shorter Version (Copy This):

```
🚨 FRONTEND-ONLY PROJECT: Phase 1

Build ExecutionTreeVisualization component (display layer only, ZERO backend changes):

1. Create folder: objectiveai-web/components/ExecutionTreeVisualization/
2. Files: index.tsx, index.css, TreeScene.tsx, types.ts
3. index.tsx: Use 'use client', create test tree, use CSS variables only
4. TreeScene.tsx: R3F scene with lights and boxes (display only)
5. index.css: CSS variables only, no breakpoints
6. types.ts: Frontend types only (TreeNode, LayoutPosition, LayoutResult)
7. npm install @react-three/fiber @react-three/drei three --workspace=objectiveai-web
8. npm run typecheck && npm run build (both pass)
9. Test page at app/tree-test/page.tsx
10. Test responsive scaling: 375px, 768px, 1440px, 2560px

SAFETY:
✅ No function modifications
✅ No backend changes
✅ No SDK edits
✅ No execution logic
✅ Frontend-only visualization

When done: ✅ Phase 1 complete - FRONTEND ONLY
```

---

## Key Clarifications for This Phase

### What You're Building
A **presentation layer** that displays execution tree.

### What You're NOT Building
- Backend execution logic
- Function behavior
- Task calculation
- Vote/score logic
- Streaming implementation

### Data Flow (Display Only)
```
Backend executes function → Provides execution data
                               │
Frontend receives execution data (READ-ONLY)
                               │
Frontend converts to tree structure
                               │
Frontend renders in R3F
                               │
User sees beautiful tree visualization

BACKEND IS UNTOUCHED
```

### Why This Matters
Ronald and nano banana don't need to review backend changes.
This is pure frontend.
It integrates with existing execution.
It doesn't modify how execution works.

---

## Files You Will Create (Frontend Only)

```
NEW FILES (Frontend):
✅ components/ExecutionTreeVisualization/index.tsx
✅ components/ExecutionTreeVisualization/index.css
✅ components/ExecutionTreeVisualization/TreeScene.tsx
✅ components/ExecutionTreeVisualization/types.ts
✅ app/tree-test/page.tsx (test page)

MODIFIED FILES (CSS only):
✅ app/globals.css (CSS import only - already done)

UNTOUCHED FILES (Backend/Functions):
✅ /functions/ (zero changes)
✅ backend/ (zero changes)
✅ objectiveai-sdk/ (zero changes)
✅ All function implementations (zero changes)
✅ All execution logic (zero changes)
```

---

## Before & After Phase 1

### Before Phase 1
- ✅ Design system infrastructure active
- ✅ No execution tree visualization
- Backend: unchanged
- Functions: unchanged

### After Phase 1
- ✅ Design system infrastructure active
- ✅ Execution tree visualization component exists
- ✅ Static test tree renders in R3F
- ✅ Responsive scaling verified (375px → 2560px)
- Backend: **STILL UNCHANGED** ← IMPORTANT
- Functions: **STILL UNCHANGED** ← IMPORTANT

---

## The Promise

When Phase 1 is done, you can say:

**"I built a beautiful responsive execution tree visualization that displays existing execution data. Zero backend changes. Pure frontend. Ready for Ronald to review."**

Not:

**"I modified how functions execute..."** ← This would be wrong

---

## Your Safety Net

If you ever think "Should I edit X?":

1. Is X in `/functions/` folder? → NO
2. Is X a function implementation? → NO
3. Is X backend logic? → NO
4. Is X the SDK? → NO
5. Is X how execution works? → NO
6. Is X a presentation component? → YES? Then OK
7. Is X CSS/styling? → YES? Then OK

If you answer NO to questions 1-5, you're safe.

---

## Go Build Phase 1

Copy one of the prompts above → Paste into Claude Code → Execute

**Remember: Frontend-only visualization. Zero backend impact.**

🚀 Build something beautiful. 🎨
