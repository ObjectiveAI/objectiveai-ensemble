# Prompt Guidelines

Comprehensive guidelines for each step's prompt in the `invent` pipeline.

The agent proceeds through 7 sequential steps. Each step receives a `prompt` (system-level instruction) and `tools` (the actions available to it). The step retries until the `isDone` check passes or max retries is reached. On retry, the error message is appended to the prompt.

## Architecture Changes from Old CLI

The old CLI used filesystem-based MCP tools (ReadSpec, WriteSpec, ReadEssay, WriteEssay, etc.) and a single large "invent" prompt that combined planning and implementation. The new CLI uses:

- **In-memory state** instead of filesystem I/O during invention
- **Typed tool interfaces** with Zod validation (each tool has `inputSchema` and `fn`)
- **Granular steps** — each step has a focused prompt and only the tools it needs
- **No plan step** — the old plan step has been removed; the essay and essay tasks serve this purpose
- **No SPEC.md file** — the spec is passed as `inventSpec` string on the State and accessed via `getInventSpecTool()`
- **Quality checkers** — `checkFields()` and `checkFunction()` run WASM-powered validation that catches errors with specific codes (QI01, VF01, LS01, etc.)
- **4 inner state classes** — LeafScalar, LeafVector, BranchScalar, BranchVector — each with their own tools and validation

## Step Execution Flow

```
1_type → 2_name → 3_essay → 4_fields → 5_essayTasks → 6_body → 7_description
```

After all steps complete, `writeStateToFilesystem` persists everything. For branch functions (depth > 0), stage2 then recursively invents sub-functions.

---

## Step 1: Type (`1_type.ts`)

### Purpose
Determine whether the function is `scalar.function` (scores a single item, output in [0,1]) or `vector.function` (ranks multiple items, output sums to ~1).

### isDone
`state.getFunctionType()` — succeeds when type is set.

### Tools
- `getInventSpecTool()` — read the spec to understand what the function does
- `setFunctionTypeTool()` — write either `"scalar.function"` or `"vector.function"`

### Prompt Guidelines

The prompt should:
- Explain the two function types clearly and concisely
- **Scalar**: for scoring a single input (output: single number 0-1)
- **Vector**: for ranking multiple items (output: array of scores summing to ~1)
- Instruct the agent to read the spec first, then decide the type
- Be brief — this is a simple binary decision

Key insight from old CLI: the old prompt said "ObjectiveAI Functions are for ranking ('vector.function') multiple items, or for scoring ('scalar.function') a single item." This framing worked well.

### Current Prompt (for reference)
```
You are an inventor creating a new ObjectiveAI Function. ObjectiveAI Functions are
for ranking ("vector.function") multiple items, or for scoring ("scalar.function")
a single item.
```

This is good. Could optionally instruct it to read the spec first.

---

## Step 2: Name (`2_name.ts`)

### Purpose
Generate a short, descriptive, lowercase, hyphen-separated name for the function. This becomes the GitHub repository name.

### isDone
`state.getName()` — succeeds when name is set and non-empty.

### Tools
- `getInventSpecTool()` — read the spec for naming inspiration
- `getFunctionTypeTool()` — know whether it's scalar or vector
- `setNameTool()` — write the name

### Prompt Guidelines

The prompt should:
- Instruct the agent to name the function like a code function/package name
- **All lowercase**, dashes to separate words
- **Do NOT include** "objectiveai", "function", "scalar", or "vector" in the name
- Keep it short and descriptive (like a npm package name)
- Examples of good names: `is-spam`, `humor-scorer`, `essay-ranker`, `toxicity-detector`

### Current Prompt (for reference)
```
Select a name for your ObjectiveAI Function. Do not include "ObjectiveAI" or
"Function" in the name. Name it how you would name a function in code. Use all
lowercase and separate words with dashes.
```

Good. Could also exclude "scalar" and "vector" from the name (old CLI did this).

---

## Step 3: Essay (`3_essay.ts`)

### Purpose
Write a detailed essay exploring the function's purpose, philosophy, evaluation criteria, and approach. This essay guides all subsequent steps — it is the intellectual foundation of the function.

### isDone
`state.getInventEssay()` — succeeds when essay is set and non-empty.

### Tools
- `getInventSpecTool()` — the spec is the source of truth
- `getFunctionTypeTool()` — know the function type
- `getNameTool()` — know the function name
- `setInventEssayTool()` — write the essay

### Prompt Guidelines

The prompt should:
- Instruct the agent to write a comprehensive essay about the function
- **Explore the purpose, inputs, outputs, and use-cases** in detail
- **Explore the qualities, values, and sentiments** that must be evaluated
- This essay underpins the function's philosophy and will guide implementation
- The essay should be thorough — it replaces the old plan step
- Emphasize that the **spec is the universal source of truth** — never contradict it
- The essay should think through:
  - What makes a good/bad score for this function?
  - What dimensions of evaluation matter?
  - What are the edge cases and boundary conditions?
  - How should the function handle ambiguous inputs?

From old CLI:
```
Create ESSAY.md describing the ObjectiveAI Function you are building.
Explore the purpose, inputs, outputs, and use-cases of the function in detail.
Explore, in great detail, the various qualities, values, and sentiments that
must be evaluated by the function. This essay will guide the development of
the function and underpins its philosophy.
```

### Important
The essay step now comes BEFORE fields. This is intentional — the agent should think deeply about what the function does before defining its input schema. The essay informs the schema design.

---

## Step 4: Fields (`4_fields.ts`)

### Purpose
Define the function's input schema (for scalar) or input schema + output_length + input_split + input_merge (for vector). Fields are validated by the quality checkers.

### isDone
`inner.checkFields()` — runs `checkScalarFields()` or `checkVectorFields()` depending on type. This validates:
- Input schema produces at least 2 permutations (QI01)
- For vector: output_length, input_split, input_merge are correct and consistent (VF01-VF10)

### Tools — Scalar (LeafScalar / BranchScalar)
- `getInputSchemaTool()` — read current input schema
- `setInputSchemaTool()` — write input schema
- `checkFieldsTool()` — run validation

### Tools — Vector (LeafVector / BranchVector)
- `getInputSchemaTool()` / `setInputSchemaTool()`
- `getOutputLengthTool()` / `setOutputLengthTool()`
- `getInputSplitTool()` / `setInputSplitTool()`
- `getInputMergeTool()` / `setInputMergeTool()`
- `checkFieldsTool()`

### Prompt Guidelines — Scalar Branch

The prompt should:
- Instruct the agent to define the input schema based on the essay and spec
- The input schema is a JSON Schema object describing what the function accepts
- For scalar functions, the input describes a **single item to score**
- Remind the agent to use CheckFields to validate
- Explain that the schema must produce at least 2 distinct example inputs (the quality checker enforces this)

### Prompt Guidelines — Vector Branch

The prompt should include everything for scalar, PLUS:
- For vector functions, the input must be an **array** or an **object with at least one required array property** (the items to rank)
- Must also define `output_length` (Starlark expression returning the number of items), `input_split` (splits input into N sub-inputs of output_length=1), and `input_merge` (recombines a subset of sub-inputs back into one input)
- These expressions are critical and subtle — explain them clearly:
  - `output_length`: `{"$starlark": "len(input)"}` for array input, `{"$starlark": "len(input['items'])"}` for object input
  - `input_split`: Must return an array of length == output_length, where each element produces output_length=1 when fed back through output_length
  - `input_merge`: Takes a variable-size, arbitrarily-ordered subset of split elements and recombines them
- Provide concrete examples for both array and object schemas

### Expression Language Note
Both prompts should mention:
- **Prefer Starlark** (`{"$starlark": "..."}`) — it's Python-like and more readable
- Only use JMESPath (`{"$jmespath": "..."}`) for very simple field access
- Starlark example: `{"$starlark": "input['items'][0]"}`

---

## Step 5: Essay Tasks (`5_essayTasks.ts`)

### Purpose
Extract from the essay a list of discrete evaluation tasks that the function will perform. Each task description becomes the blueprint for either a vector completion task (leaf) or a placeholder sub-function (branch).

### isDone
`state.getInventEssayTasks()` — succeeds when essay tasks are set and non-empty.

### Tools
- `getInventSpecTool()` — the spec
- `getInventEssayTool()` — the essay (primary source for this step)
- `getFunctionTypeTool()` — scalar or vector
- `getInputSchemaTool()` (from inner state) — know the input shape
- `setInventEssayTasksTool()` — write the task list
- For vector: also `getOutputLengthTool()`, `getInputSplitTool()`, `getInputMergeTool()`

### Prompt Guidelines

The prompt should:
- Instruct the agent to list and describe the key evaluation tasks
- Each task is a **plain language description** of one evaluation dimension
- The number of tasks must be within the width constraints:
  - Leaf functions: `leafMinWidth` to `leafMaxWidth` tasks (default 5-10)
  - Branch functions: `branchMinWidth` to `branchMaxWidth` tasks (default 3-6)
- Each task should evaluate a **distinct quality, value, or sentiment** from the essay
- Tasks should collectively cover the full range of evaluation the function needs
- For branch functions: each task description becomes the `spec` for a sub-function that will be automatically invented
- For leaf functions: each task becomes a vector completion task

From old CLI:
```
Create ESSAY_TASKS.md listing and describing the key tasks the ObjectiveAI Function
must perform in order to fulfill the quality, value, and sentiment evaluations
defined within ESSAY.md. Each task is a plain language description of a task which
will go into the function's tasks array. There must be {widthDesc} tasks.
```

The width description should be dynamic:
- If minWidth == maxWidth: "exactly N"
- If minWidth != maxWidth: "between N and M"

---

## Step 6: Body (`6_body.ts`)

### Purpose
Build the actual function body — tasks, expressions, input_maps (if needed). This is the most complex step. The function must pass the full quality checker (`checkFunction()`).

### isDone
`inner.checkFunction()` — runs the full quality checker for the specific function type (checkLeafScalarFunction, checkLeafVectorFunction, checkBranchScalarFunction, or checkBranchVectorFunction).

### Tools — Leaf Scalar
- `getInventSpecTool()`, `getInventEssayTool()`, `getInventEssayTasksTool()`
- `getInputSchemaTool()`
- `getTasksLengthTool()`, `getTaskTool()`, `appendTaskTool()`, `deleteTaskTool()`, `editTaskTool()`
- `checkFunctionTool()`
- `getSchemaTools()` — JSON schema reference tools for understanding task structure

### Tools — Leaf Vector
Same as Leaf Scalar, plus:
- `getOutputLengthTool()`, `getInputSplitTool()`, `getInputMergeTool()`

### Tools — Branch Scalar
- `getInventSpecTool()`, `getInventEssayTool()`, `getInventEssayTasksTool()`
- `getInputSchemaTool()`
- `getTasksLengthTool()`, `getTaskTool()`, `getTaskSpecTool()`
- `appendTaskTool()` (takes task + spec), `deleteTaskTool()`, `editTaskTool()`, `editTaskSpecTool()`
- `checkFunctionTool()`
- `getSchemaTools()`

### Tools — Branch Vector
- Everything from Branch Scalar, plus:
- `getOutputLengthTool()`, `getInputSplitTool()`, `getInputMergeTool()`
- `appendVectorTaskTool()`, `appendScalarTaskTool()` (takes task + input_map + spec)
- `editVectorTaskTool()`, `editScalarTaskTool()` (takes task + input_map)

### Prompt Guidelines — Leaf Functions (Vector Completion Tasks)

The prompt should:
- Instruct the agent to create vector completion tasks based on the essay tasks
- Each task is a `vector.completion` with `messages`, `responses`, and `output`
- **Messages**: Always use array-of-parts format for content, never plain strings
  - Correct: `{"role": "user", "content": [{"type": "text", "text": "..."}]}`
  - Wrong: `{"role": "user", "content": "..."}`
- **Responses**: Always use array-of-parts format, never plain strings
  - Correct: `[[{"type": "text", "text": "good"}], [{"type": "text", "text": "bad"}]]`
  - Wrong: `["good", "bad"]`
- For vector functions: responses should typically be an expression that maps input items to response format
  - Example: `{"$starlark": "[[{'type': 'text', 'text': x}] for x in input]"}`
- For scalar functions: responses are fixed content parts (the options to vote between)
- **Responses should be phrased as potential assistant messages** — e.g., if ranking dating profiles, ask "what is a good dating profile" and make each response a dating profile
- If a task ranks items from an input array, the array items go into `responses`, not `messages`
- **Never use `str()` on multimodal content** — pass rich content directly
- Use ReadSchema tools to understand expected types before creating tasks
- Use CheckFunction to validate after creating all tasks
- For tasks with fixed responses and maxWidth > 1: vary the number of responses across tasks

### Prompt Guidelines — Branch Functions (Placeholder/Sub-Function Tasks)

The prompt should:
- Instruct the agent to create placeholder tasks that will be auto-invented as sub-functions
- For **branch scalar**: use `placeholder.scalar.function` or `placeholder.vector.function` tasks
  - Each placeholder needs: `input_schema`, `input`, `output`, and a `spec` (description for the sub-function agent)
  - For vector placeholders: also needs `output_length`, `input_split`, `input_merge`
- For **branch vector**: can mix unmapped vector tasks and mapped scalar tasks
  - Unmapped vector tasks: `placeholder.vector.function` — process the full input
  - Mapped scalar tasks: `placeholder.scalar.function` with `map` — iterate over input items via `input_maps`
  - At most 50% of tasks can be mapped scalar (BV09)
  - A single task must be vector-like, not a lone mapped scalar (BV08)
- Each task's `spec` should be detailed enough for a child agent to implement the sub-function independently
- The `input` expression derives the sub-function's input from the parent's input
- The `output` expression transforms the sub-function's output into the parent's output contribution

### Expression Context
Expressions receive these variables:
- `input` — always present, the function input
- `map` — present in mapped tasks, the current element from the input_maps sub-array being iterated
- `output` — present in task output expressions, the raw task result

### Task Output Expressions
- For scalar functions: each task's output must evaluate to a number in [0, 1]
- For vector functions: each task's output must evaluate to an array of scores that sums to ~1 and has length matching `output_length`
- The function's final output is the **weighted average** of all task outputs using profile weights

---

## Step 7: Description (`7_description.ts`)

### Purpose
Generate a concise description (max 350 bytes) and a README.md for the function.

### isDone
Both `state.getDescription()` AND `state.getReadme()` must succeed.

### Tools
- `getInventSpecTool()` — the spec
- `getInventEssayTool()` — the essay
- `getFunctionTypeTool()` — scalar or vector
- `getNameTool()` — the function name
- `getInputSchemaTool()` (from inner state)
- `setDescriptionTool()` — write description (max 350 bytes, enforced by setter)
- `setReadmeTool()` — write README

### Prompt Guidelines

The prompt should:
- Instruct the agent to write both a description and a README
- **Description**: 1-2 sentences, concise, describes what the function does. Max 350 bytes. This appears in function listings.
- **README**: A comprehensive README.md for the function's GitHub repository. Should include:
  - What the function does
  - Input schema explained
  - How scoring/ranking works
  - Example use cases
- The description and README should be consistent with the spec and essay
- Do NOT start the description with "This function..." — be more direct (e.g., "Scores the humor level of text on a scale from 0 to 1")

---

## General Prompt Principles

### Do's
- **Be specific about tool usage** — tell the agent which tools to use and in what order
- **Provide concrete examples** of correct formats (especially for messages/responses content format)
- **State constraints clearly** — width ranges, byte limits, schema requirements
- **Emphasize the spec as source of truth** — the spec should never be contradicted
- **Include format requirements** — Starlark preferred over JMESPath, content-parts format not plain strings

### Don'ts
- **Don't say "Do not re-read anything"** — the old CLI did this because of filesystem-based tools; the new CLI uses in-memory state so this doesn't apply
- **Don't reference SPEC.md, ESSAY.md, etc.** — these are now tools (ReadInventSpec, ReadInventEssay), not files
- **Don't mention the plan step** — it no longer exists
- **Don't reference network tests or Submit** — those happen outside the step pipeline
- **Don't overload a single step** — each step should focus on its one job

### Error Handling
When a step fails and retries, the error message from the quality checker is appended:
```
{original prompt}

The following error occurred: {error message}

Please try again.
```

Quality checker errors include specific codes (QI01, VF01, LS01, BV09, etc.) that identify exactly what went wrong. The agent can use these to fix the specific issue.
