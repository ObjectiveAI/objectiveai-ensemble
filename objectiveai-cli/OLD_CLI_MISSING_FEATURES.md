# Missing Features from Old CLI

Features actually exercised during `objectiveai invent` in the old CLI that are not yet implemented in the new CLI.

## CLI & Configuration

- **Commander CLI parsing** — `objectiveai invent [spec]` with all flags (`--name`, `--depth`, `--api-base`, `--api-key`, `--git-user-name`, `--git-user-email`, `--gh-token`, `--agent-upstream`, `--width`, `--min-width`, `--max-width`, `--scalar`, `--vector`, plus 9 Claude model override flags)
- **Config resolution hierarchy** — CLI flags > env vars > `.objectiveai/config.json` (project-level, walks up tree) > `~/.objectiveai/config.json` (user-level) > `git config` (user.name/email) > defaults
- **Config validation** (`checkConfig()`) — verifies git/gh installed, API key set, etc. before starting
- **Parent process watchdog** — if spawned by parent agent (`OBJECTIVEAI_PARENT_PID`), exits when parent dies (3s polling)

## Initialization

- **Git repository init** — `git init` if `.git` doesn't exist
- **Write `.gitignore`** — ignores `examples/`, `sub_functions/`, `network_tests/`, `logs/`, `.objectiveai/`, `.tmp.*`
- **Fetch example functions** — `Functions.list()` → randomly select up to 10 → recursively fetch each with sub-function tasks → save to `examples/` directory
- **Clone existing sub-functions** — if `function.json` exists with function tasks, clone repos via `gh repo clone` into `sub_functions/`

## Agent Steps (Prepare Phase)

The old CLI has these steps that map roughly to the new CLI's 8 steps, but with significant differences:

- **SPEC.md step** — the new CLI doesn't have this as a separate step (it's passed as `inventSpec` option). Old CLI has a dedicated MCP step with tools like `WriteSpec`, `ListExampleFunctions`, `ReadExampleFunction`, `ReadFunctionSchema`, with 3 retries if empty
- **Input schema step** — old CLI has a dedicated `inputSchemaMcp` step to design `input_schema.json`. New CLI handles this within `stepFields`
- **Vector fields step** — old CLI has a separate `vectorFieldsMcp` step for `output_length`, `input_split`, `input_merge`. New CLI handles in `stepFields`

## MCP Tools (~100+ tools)

The old CLI registers extensive tool sets per phase. The new CLI has a minimal `Tool` interface with empty tool arrays in all steps.

### Context Tools (read-only)
- `ReadSpec`, `ReadName`, `ReadType`, `ReadInputSchema`, `ReadEssay`, `ReadEssayTasks`
- `ListExampleFunctions`, `ReadExampleFunction`
- `ReadFunctionSchema`

### Function CRUD Tools
- `ReadFunction`, `CheckFunction`
- `EditType`, `EditDescription`, `EditInputSchema`
- `AppendInputMap`, `EditInputMap`, `DelInputMap`
- `AppendTask`, `EditTask`, `DelTask`
- All task/expression schema read tools

### Example Input Tools
- `ReadExampleInputs`, `ReadExampleInputsSchema`
- `AppendExampleInput`, `EditExampleInput`, `DelExampleInput`
- `CheckExampleInputs`

### Network Test Tools
- `RunNetworkTests` — executes function with all example inputs via API (`from_rng: true`)
- `ReadDefaultNetworkTest`, `ReadSwissSystemNetworkTest`

### Sub-Function Tools (depth > 0)
- `ListSubFunctions`, `ReadSubFunction`

### Publishing Tools
- `WriteReadme`
- `Submit` — validates, commits, pushes, creates GitHub repo

## Plan Phase

- **Dedicated plan MCP** (`planMcp`) — ~75 tools, writes to `plans/{index}.md`
- **Depth-aware prompts** — different plan prompts for depth > 0 (function tasks) vs depth = 0 (vector completion tasks)
- **Plan indexing** — `getNextPlanIndex()` for multiple plan revisions

## Invent Loop

- **5-attempt retry loop** with error feedback on each retry
- **Session resumption** — passes `sessionId` to `resume` option in Claude SDK query
- **Dynamic tool hiding** — conditionally hides tools based on function type, defaults, and state
- **Tool logging** — `wrapToolsWithLogging()` logs every tool invocation result
- **Full detailed prompts** — first attempt gets comprehensive prompt, retries get short error recap

## Submit / Validation Pipeline

- **Profile building** — `buildProfile()` constructs `profile.json` with weight structure matching tasks
- **Function validation** — `checkFunction()` validates schema, expressions, task structure
- **Example input validation** — `checkExampleInputs()` validates against `input_schema`, checks compiled tasks
- **Network test execution** — runs function against all example inputs via ObjectiveAI API
  - Default strategy tests for all functions
  - Swiss system strategy tests for vector functions
  - Results saved to `network_tests/default/{i}.json` and `network_tests/swisssystem/{i}.json`
- **README validation** — must exist and be non-empty
- **Description validation** — `checkDescription()`

## Git / GitHub Publishing

- **`git add -A`** — stage all files
- **`git commit`** with custom author — sets `GIT_AUTHOR_NAME`, `GIT_COMMITTER_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_EMAIL` via env vars
- **GitHub repo creation** — `gh repo create {name} --public --source=. --push`
- **GitHub repo update** — `gh repo edit {owner}/{repo} --description "{description}"`
- **`git push`** — push to remote after commit

## Resolve Phase (Recursive Placeholder Resolution)

- **Recursive orchestration** — after parent submits, spawn child agents for each placeholder task
- **Child options derivation** — extract `spec`, `name`, `type`, `inputSchema`, `depth-1`, vector fields from placeholder
- **Setup files** — write `.tmp.spec.md`, `.tmp.input-schema.json`, `.tmp.output-length.json`, etc.
- **`chdir` orchestration** — change to child directory, recurse, change back
- **Clone function tasks** — `gh repo clone` for real function task references in existing `function.json`
- **Post-resolve commit** — after replacing all placeholders, commit and push updated parent

## Dashboard & Logging

- **Interactive dashboard** — alternate screen buffer, tree-style nested panels for child agents, scrolling logs
- **Input bar** — raw stdin for user messages during execution
- **Event system** — `log`, `name`, `start`, `done` events between parent and child agents
- **Message queue** — `MessageQueue` for handling user input during tool execution
- **Multi-mode logging** — root+TTY (dashboard), root+no-TTY (file+console), child (file+JSON stdout)
- **Log file persistence** — `logs/{index}.txt` with auto-incrementing index

## Session Persistence

- **`session.txt`** — stores Claude session ID for conversation resumption
- **Updated after each step** — prepare steps and submit both write session
- **Session fallback** — if session invalid, retry without session (fresh start)

## Files Generated (not yet produced by new CLI)

- `type.txt`
- `input_schema.json`
- `SPEC.md` (new CLI uses `INVENT_SPEC.md`)
- `ESSAY.md` (new CLI uses `INVENT_ESSAY.md`)
- `ESSAY_TASKS.md` (new CLI uses `INVENT_ESSAY_TASKS.md`)
- `description.txt`
- `input_maps.json`
- `output_length.json`, `input_split.json`, `input_merge.json`
- `inputs.json` (example inputs array)
- `profile.json`
- `network_tests/` directory
- `session.txt`
- `.gitignore`
- `examples/` directory
- `logs/` directory
