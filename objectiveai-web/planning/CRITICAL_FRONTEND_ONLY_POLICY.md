# 🚨 CRITICAL: Frontend-Only Implementation Policy

## The Rule: ZERO Backend/Function Changes

**This entire WebGL execution tree project touches ONLY frontend code.**

The execution tree visualization is a **presentation layer** for existing backend data.

---

## What You CAN Touch (Frontend Only)

### ✅ ALLOWED - Frontend Code
- `lib/` folder (design-tokens.css, responsive-scale.ts, device-detection.ts, tree-layout.ts)
- `components/ExecutionTreeVisualization/` (new component)
- `app/` folder (layout, CSS, pages)
- Styling (CSS, design tokens)
- React components
- TypeScript types/interfaces for visualization only
- Browser DevTools
- Package.json (adding dependencies like @react-three/fiber)

### ✅ ALLOWED - Using Existing Backend Data
- Read `execution` object passed from backend
- Read `task.index`, `task.votes`, `task.scores` from existing SDK
- Display that data in the tree
- Convert backend data to visualization format
- React to streaming chunks (already coming from backend)

---

## What You CANNOT Touch (Backend/Function Code)

### ❌ PROHIBITED - Backend Code
- `objectiveai-sdk/` (SDK code)
- `backend/` (any backend)
- `/functions/` folder (function implementations)
- Function definitions
- Function execution logic
- Streaming implementation
- Task structure/schema
- Vote calculation
- Score aggregation
- Cache logic
- RNG logic
- Any backend types/schemas
- Database models
- API endpoints

### ❌ PROHIBITED - Function/SDK Modifications
- Changing how functions execute
- Changing task structure
- Changing vote/score calculation
- Changing streaming protocol
- Modifying any backend SDK
- Creating new backend features
- Editing function parameters
- Changing execution flow

### ❌ PROHIBITED - Integration Point Changes
- The integration point `app/functions/[slug]/page.tsx` at line ~510 is pre-existing
- You are only ADDING the visualization component there
- You are NOT changing how the function is called or executed

---

## Frontend-Only Architecture

```
────────────────────────────────────────────────────────
                    BACKEND (Untouched)
  - Function execution
  - Task creation
  - Vote calculation
  - Score aggregation
  - Streaming chunks
────────────────────┬────────────────────────────────────
                    │
           (Read execution data)
                    │
                    │
────────────────────────────────────────────────────────
              FRONTEND (This Project)
  - Receive execution data from backend
  - Parse data (tasks, votes, scores)
  - Convert to tree structure
  - Render in R3F canvas
  - Handle streaming updates visually
  - Display visualization
────────────────────────────────────────────────────────
```

**Frontend RECEIVES data, does NOT SEND commands to functions.**

---

## Phase 1-6: Frontend Only

### Phase 1: Foundation (Frontend)
- ✅ Create component structure
- ✅ Setup R3F
- ✅ Build static tree display
- ❌ Do NOT modify function execution
- ❌ Do NOT modify task creation

### Phase 2: Data Integration (Frontend)
- ✅ Read execution.tasks from backend
- ✅ Convert to tree structure
- ✅ Handle streaming updates
- ❌ Do NOT change execution logic
- ❌ Do NOT calculate votes/scores

### Phase 3: Node Components (Frontend)
- ✅ Display nodes with backend data
- ✅ Show votes, scores, labels
- ✅ Read from cache/RNG flags
- ❌ Do NOT calculate cache status
- ❌ Do NOT generate scores

### Phase 4: Edges & Animations (Frontend)
- ✅ Draw connections between nodes
- ✅ Animate on data arrival
- ✅ Visual feedback
- ❌ Do NOT change node relationships
- ❌ Do NOT modify execution flow

### Phase 5: Mobile Optimization (Frontend)
- ✅ Responsive design
- ✅ FPS monitoring
- ✅ Feature degradation
- ❌ Do NOT optimize backend
- ❌ Do NOT change streaming

### Phase 6: Integration & Testing (Frontend)
- ✅ Add to function detail page
- ✅ Toggle visualization
- ✅ Test on devices
- ❌ Do NOT integrate with backend
- ❌ Do NOT change function calls

---

## Data Flow (Frontend ONLY Reads)

```
Backend Function Executes
           │
   Generates Execution object:
   {
     id: "exec-123",
     tasks: [           ← Frontend reads
       {
         index: "0",
         votes: [...],  ← Frontend reads
         scores: [...], ← Frontend reads
         from_cache: true,  ← Frontend reads
         from_rng: false,   ← Frontend reads
         tasks: [...]   ← Frontend reads (nested)
       }
     ],
     output: {...}      ← Frontend reads
   }
           │
   Backend streams chunks to frontend
           │
   Frontend receives, parses, renders tree
           │
   User sees execution visualization
```

**Frontend ONLY READS data. NEVER writes to backend.**

---

## Integration Point (Read-Only)

**File:** `app/functions/[slug]/page.tsx` (line ~510)

**Current state:** Shows results after function executes

**What we're adding:**
```typescript
// ✅ ADD THIS (frontend-only visualization)
{showVisualization && (
  <ExecutionTreeVisualization
    execution={results}        // Read execution data
    isStreaming={isRunning}    // Read streaming status
    functionName={functionDetails?.name}  // Read function name
  />
)}
```

**What we're NOT changing:**
```typescript
// ❌ DO NOT TOUCH
const results = await Functions.Executions.create({
  function_id: functionDetails.id,
  params: parsedParams,
  stream: true  // Backend handles streaming, not us
});
```

**The function execution doesn't change. We just visualize the result.**

---

## TypeScript: Frontend Types Only

### ✅ Create Frontend Types
```typescript
// Frontend visualization types (OK to create)
interface TreeNode {
  id: string;
  type: 'function' | 'task' | 'llm' | 'vote' | 'score' | 'output';
  label: string;
  level: number;
}
```

### ❌ Do NOT Create Backend Types
```typescript
// DO NOT create new SDK types or backend schemas
interface FunctionExecution {
  // This already exists in SDK, don't modify
}

interface Task {
  // This already exists in SDK, don't modify
}
```

---

## Dependency Management: Frontend Only

### ✅ Add Frontend Dependencies
```bash
npm install @react-three/fiber @react-three/drei three
npm install (any visualization libraries)
```

### ❌ Do NOT Modify Backend Dependencies
```bash
# Do NOT touch SDK or backend package versions
# Do NOT add backend dependencies
# Do NOT modify objectiveai-sdk
```

---

## SDK Usage: Read-Only

### ✅ Use Existing SDK Features
```typescript
// Read data from existing SDK (OK)
const execution = await Functions.Executions.create({...});
const tasks = execution.tasks;  // Frontend reads
const votes = tasks[0].votes;   // Frontend reads
```

### ❌ Do NOT Add SDK Features
```typescript
// Do NOT create new SDK methods
// Do NOT modify SDK behavior
// Do NOT add calculation methods to SDK
// Do NOT change function execution parameters
```

---

## Testing: Frontend Only

### ✅ Test Frontend Code
```bash
npm run test --workspace=objectiveai-web  # Frontend tests
npm run dev --workspace=objectiveai-web   # Dev server
```

### ❌ Do NOT Test Backend
```bash
# Do NOT run backend tests
# Do NOT modify backend test code
# Do NOT change SDK tests
```

---

## Review Process: Frontend Only

### ✅ When Phase 6 is Complete
- PR to `website-updates` branch
- Code review: "Does visualization work?"
- No backend changes to review

### ❌ What Review Does NOT Include
- Backend/function changes (there are none)
- SDK modifications (there are none)
- Function logic updates (there are none)

---

## Safety Checklist

Before each phase, verify:

- [ ] No files modified in `backend/` folder
- [ ] No files modified in `objectiveai-sdk/` folder
- [ ] No files modified in `/functions/` folder
- [ ] No SDK types/interfaces modified
- [ ] No function execution logic touched
- [ ] No task structure changes
- [ ] No vote/score calculation changes
- [ ] Only frontend code added/modified
- [ ] Component folder: `components/ExecutionTreeVisualization/`
- [ ] Library folder: `lib/` (design system only)
- [ ] CSS/styling only
- [ ] No new backend dependencies added
- [ ] No modification to `Functions.Executions.create()` call
- [ ] Only READING execution data, never WRITING

---

## Commit Message Template

Every commit should clarify: **Frontend-Only Changes**

```
feat(Phase 1): WebGL execution tree - FRONTEND ONLY

✅ Add ExecutionTreeVisualization component (frontend)
✅ Create responsive design system (frontend CSS)
✅ Setup R3F canvas (frontend)
✅ Render static test tree (frontend display)

Zero backend changes:
- No function modifications
- No SDK changes
- No task structure changes
- No execution logic changes
- No backend dependencies modified

Files added: components/ExecutionTreeVisualization/, lib/
Files modified: app/globals.css (CSS import only)
Backend: Untouched

Build: ✅ TypeScript passes, Build succeeds
```

---

## If You Ever Doubt

**Ask yourself:**
1. Am I modifying a function?
2. Am I changing how functions execute?
3. Am I modifying the SDK?
4. Am I changing task structure?
5. Am I calculating votes/scores?
6. Am I changing backend logic?

**If YES to any:** STOP. This is a backend change and OUT OF SCOPE.

**This project visualizes existing execution data. It does NOT execute functions.**

---

## Ronald's Approval

When you submit Phase 6 PR:

✅ **What Ronald approves:**
- "Frontend visualization looks good"
- "Responsive design is solid"
- "R3F integration is clean"
- "No backend impact"

❌ **What would require backend approval:**
- Any function changes
- Any SDK changes
- Any execution logic changes
- Any task/vote/score changes

**Since you're touching ZERO backend, Ronald only reviews frontend code.**

---

## Final Rule

```
─────────────────────────────────────────────
  THIS PROJECT = VISUALIZATION ONLY

  Backend executes functions (untouched)
  Frontend visualizes results (this project)

  You code what happens AFTER execution
  Backend handles execution itself
─────────────────────────────────────────────
```

**If you're touching function code, you're doing the wrong project.**

---

## Zero Ambiguity

| Action | Backend Impact | Status |
|--------|---|---|
| Add CSS variables | None | ✅ OK |
| Create React components | None | ✅ OK |
| Setup R3F canvas | None | ✅ OK |
| Display execution data | None | ✅ OK |
| Read task.votes | None | ✅ OK |
| Modify function execution | Yes | ❌ NOT OK |
| Change task structure | Yes | ❌ NOT OK |
| Calculate votes | Yes | ❌ NOT OK |
| Edit SDK types | Yes | ❌ NOT OK |
| Change streaming logic | Yes | ❌ NOT OK |

---

## Confirmation

**Before starting Phase 1, confirm you understand:**

- ✅ This is a frontend-only visualization project
- ✅ No backend code will be modified
- ✅ No functions will be changed
- ✅ No SDK will be touched
- ✅ Only reading execution data, never modifying it
- ✅ Project scope: Display existing execution in a beautiful tree

**If any of these is unclear, ask Ronald before starting Phase 1.**

---

**This document is your safety net. Reference it if you ever wonder: "Should I edit this?"**

**If you're thinking about editing a function, backend, or SDK: NO. Read this document again.**
