# 🛡️ FRONTEND-ONLY GUARDRAILS: Phase 1-6 Policy Clarification

## What Changed

You correctly pointed out: **This should NEVER touch backend/functions.**

I've created explicit guardrails to ensure 100% frontend-only development.

---

## 📄 New Documents Created

### 1. **CRITICAL_FRONTEND_ONLY_POLICY.md**
The definitive reference document that:
- ✅ Lists exactly what you CAN touch (frontend code, CSS, React)
- ✅ Lists exactly what you CANNOT touch (functions, backend, SDK)
- Shows data flow (backend untouched, frontend reads only)
- Includes safety checklist before each phase
- Commit message template that explicitly states "FRONTEND ONLY"
- Q&A for when you doubt whether something is in-scope

**Use this:** When you're unsure if something violates the policy

---

### 2. **PHASE_1_FRONTEND_ONLY_PROMPT.md**
Updated Claude Code prompt that:
- Explicitly states FRONTEND-ONLY in red flags
- Lists ALLOWED actions (components, CSS, R3F)
- Lists PROHIBITED actions (functions, backend, SDK)
- Includes safety checklist before submission
- Shorter version for quick execution
- Confirms zero backend impact

**Use this:** Instead of the original Phase 1 prompt

---

## 🛡️ The Guardrails (Summary)

### ✅ YOU CAN BUILD
- React components in `/components/`
- CSS with design tokens in `/lib/`
- R3F visualization
- TypeScript interfaces (frontend types only)
- Any frontend feature

### ❌ YOU CANNOT BUILD
- Function implementations in `/functions/`
- Backend logic changes
- SDK modifications
- Task structure changes
- Vote/score calculation changes
- Execution flow modifications
- Streaming behavior changes

---

## 🎯 Updated Phase 1-6 Scope (All Frontend)

### Phase 1: Foundation (Frontend)
- ✅ Component structure
- ✅ R3F setup
- ✅ Static tree display
- ❌ NO backend changes

### Phase 2: Data Integration (Frontend)
- ✅ Read execution.tasks
- ✅ Handle streaming updates
- ✅ Convert to tree format
- ❌ NO backend changes

### Phase 3: Node Components (Frontend)
- ✅ Display 6 node types
- ✅ Show votes/scores/labels
- ✅ Read from cache/RNG flags
- ❌ NO backend changes

### Phase 4: Edges & Animations (Frontend)
- ✅ Draw connections
- ✅ Visual animations
- ✅ Responsive timing
- ❌ NO backend changes

### Phase 5: Mobile Optimization (Frontend)
- ✅ Responsive design
- ✅ FPS monitoring
- ✅ Feature degradation
- ❌ NO backend changes

### Phase 6: Integration & Testing (Frontend)
- ✅ Add to function detail page
- ✅ Toggle visualization
- ✅ Cross-device testing
- ❌ NO backend changes

---

## 🎯 The Architecture (Immutable)

```
──────────────────────────────────────────
    BACKEND (Ronald/Untouched)
  - Function execution
  - Task creation
  - Vote/Score calculation
  - Streaming to frontend
────────────────────┬─────────────────────
                   │
          (Sends execution data)
                   │
                   │
──────────────────────────────────────────
    FRONTEND (You/This Project)
  - Receives execution data
  - Displays in tree format
  - Handles visualization
  - Shows on function detail page
──────────────────────────────────────────
```

**Frontend READS from backend. Frontend NEVER WRITES to backend.**

---

## 📖 How to Use These Documents

### When Starting Phase 1
1. Open **PHASE_1_FRONTEND_ONLY_PROMPT.md**
2. Copy one of the prompts (full or short version)
3. Paste into Claude Code
4. Execute

### When You Have Questions
- "Should I edit X?" → Read **CRITICAL_FRONTEND_ONLY_POLICY.md**
- "What can I build?" → Look at "ALLOWED" section
- "What can't I build?" → Look at "PROHIBITED" section

### Before Submitting Each Phase
- Check **CRITICAL_FRONTEND_ONLY_POLICY.md** → Safety Checklist
- Verify you haven't modified anything in:
  - `/functions/` folder
  - `backend/` folder
  - `objectiveai-sdk/` folder
  - Any backend logic

### Before PR to Main
- Commit message uses template from **CRITICAL_FRONTEND_ONLY_POLICY.md**
- Explicitly states "FRONTEND ONLY - Zero backend changes"
- No backend files in changed files list

---

## ✨ What This Means

### For You
- **Clear scope:** Build a beautiful frontend visualization
- **No ambiguity:** Read the policy doc if you doubt
- **Safety:** Multiple checkpoints ensure you stay in-scope
- **Confidence:** When done, you know it's 100% frontend

### For Ronald
- **Easy review:** Only frontend code to review
- **No backend risk:** Visualization doesn't impact execution
- **Fast approval:** No backend architect needed
- **Deployment easy:** Frontend changes don't need SDK testing

### For nano banana
- **Design input:** Can see Phase 1 tree and provide mockups
- **Visual focus:** Only designs the presentation layer
- **No backend concern:** Doesn't touch actual execution

---

## 📋 Updated File Manifest

### New Policy Documents
- ✅ CRITICAL_FRONTEND_ONLY_POLICY.md (definitive reference)
- ✅ PHASE_1_FRONTEND_ONLY_PROMPT.md (Claude Code prompt)

### Existing Documents (Still Relevant)
- ✅ PHASE_1_CLAUDE_CODE_PROMPT.md (has been updated)
- ✅ All other documentation (unchanged, 100% frontend-scoped)

---

## 🎯 Your Next Action

**Use this prompt for Phase 1:**

```
Copy PHASE_1_FRONTEND_ONLY_PROMPT.md into Claude Code and execute.

This ensures:
✅ Phase 1 stays frontend-only
✅ Zero backend changes
✅ Component builds correctly
✅ Responsive tree renders
```

---

## 🛡️ Safety Confirmation Checklist

Before starting Phase 1, confirm:

- ✅ I understand this is FRONTEND ONLY
- ✅ I will not modify any functions
- ✅ I will not change backend logic
- ✅ I will not edit the SDK
- ✅ I will only create/modify frontend code
- ✅ I will read CRITICAL_FRONTEND_ONLY_POLICY.md if I doubt
- ✅ I will use PHASE_1_FRONTEND_ONLY_PROMPT.md for Claude Code

---

## Final Word

**This entire project is a presentation layer.**

The backend (functions, execution, streaming) is completely untouched.

You're building the visual layer that displays what the backend provides.

**Frontend-only. Beautiful visualization. Zero backend impact.**

---

**Ready to start Phase 1 with guardrails in place?**

Use: **PHASE_1_FRONTEND_ONLY_PROMPT.md**

All six phases follow this same frontend-only policy.

🚀 Build with confidence.
