import { createInterface } from 'readline';
import { execSync, spawn } from 'child_process';
import { existsSync, readdirSync, writeFileSync, readFileSync, mkdirSync, appendFileSync, unlinkSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { Functions, Chat, ObjectiveAI, JsonValueSchema, JsonValueExpressionSchema } from 'objectiveai';
import { createSdkMcpServer, query, tool } from '@anthropic-ai/claude-agent-sdk';
import z18, { z } from 'zod';

var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/claude/index.ts
var claude_exports = {};
__export(claude_exports, {
  amend: () => amend,
  amendMcp: () => amendMcp,
  dryrun: () => dryrun,
  essayMcp: () => essayMcp,
  essayTasksMcp: () => essayTasksMcp,
  invent: () => invent,
  inventMcp: () => inventMcp,
  nameMcp: () => nameMcp,
  prepare: () => prepare,
  specMcp: () => specMcp
});

// src/events.ts
function serializeEvent(evt) {
  return JSON.stringify(evt);
}
function parseEvent(line) {
  try {
    const obj = JSON.parse(line);
    if (typeof obj !== "object" || obj === null) return null;
    if (typeof obj.event !== "string" || typeof obj.path !== "string") return null;
    switch (obj.event) {
      case "log":
        return typeof obj.line === "string" ? obj : null;
      case "name":
        return typeof obj.name === "string" ? obj : null;
      case "start":
      case "done":
        return obj;
      default:
        return null;
    }
  } catch {
    return null;
  }
}
function prefixEvent(evt, prefix) {
  const path = evt.path ? `${prefix}/${evt.path}` : prefix;
  return { ...evt, path };
}

// src/logging.ts
function getNextLogIndex() {
  const logsDir = "logs";
  let nextIndex = 1;
  if (existsSync(logsDir)) {
    const files = readdirSync(logsDir);
    const logNumbers = files.filter((f) => /^\d+\.txt$/.test(f)).map((f) => parseInt(f.replace(".txt", ""), 10)).filter((n) => !isNaN(n));
    if (logNumbers.length > 0) {
      nextIndex = Math.max(...logNumbers) + 1;
    }
  }
  return nextIndex;
}
function createFileAppender() {
  const logsDir = "logs";
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }
  const logIndex = getNextLogIndex();
  const logPath = `${logsDir}/${logIndex}.txt`;
  writeFileSync(logPath, "");
  const append = (message) => {
    appendFileSync(logPath, message + "\n");
  };
  return { logPath, append };
}
function createFileLogger() {
  const { logPath, append } = createFileAppender();
  const log = (...args) => {
    const message = args.map((arg) => typeof arg === "string" ? arg : String(arg)).join(" ");
    append(message);
    console.log(message);
  };
  return { log, logPath };
}
function createRootLogger(dashboard) {
  const { logPath, append } = createFileAppender();
  const log = (...args) => {
    const message = args.map((arg) => typeof arg === "string" ? arg : String(arg)).join(" ");
    append(message);
    dashboard.handleEvent({ event: "log", path: "", line: message });
  };
  return { log, logPath };
}
function createChildLogger() {
  const { logPath, append } = createFileAppender();
  const log = (...args) => {
    const message = args.map((arg) => typeof arg === "string" ? arg : String(arg)).join(" ");
    append(message);
    process.stdout.write(serializeEvent({ event: "log", path: "", line: message }) + "\n");
  };
  return { log, logPath };
}
function formatMessage(msg) {
  switch (msg.type) {
    case "system": {
      if (msg.subtype === "init") {
        return `[init] session=${msg.session_id} model=${msg.model}`;
      }
      if (msg.subtype === "compact_boundary") {
        return `[compact]`;
      }
      return null;
    }
    case "assistant": {
      const parts = [];
      for (const block of msg.message.content) {
        if (block.type === "text") {
          const text = block.text.trim();
          if (text) parts.push(text);
        } else if (block.type === "tool_use") {
          parts.push(`[tool_use] ${block.name}`);
        }
      }
      return parts.length > 0 ? parts.join("\n") : null;
    }
    case "result": {
      const durationSec = (msg.duration_ms / 1e3).toFixed(1);
      if (msg.subtype === "success") {
        return `[result] success turns=${msg.num_turns} cost=$${msg.total_cost_usd.toFixed(4)} duration=${durationSec}s`;
      }
      return `[result] error=${msg.subtype} turns=${msg.num_turns} cost=$${msg.total_cost_usd.toFixed(4)} duration=${durationSec}s errors=${JSON.stringify(msg.errors)}`;
    }
    default:
      return null;
  }
}
async function consumeStream(stream, log, sessionId) {
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    const formatted = formatMessage(message);
    if (formatted) log(formatted);
  }
  return sessionId;
}
function getLatestLogPath() {
  const logsDir = "logs";
  if (!existsSync(logsDir)) {
    return null;
  }
  const files = readdirSync(logsDir);
  const logNumbers = files.filter((f) => /^\d+\.txt$/.test(f)).map((f) => parseInt(f.replace(".txt", ""), 10)).filter((n) => !isNaN(n));
  if (logNumbers.length === 0) {
    return null;
  }
  const maxIndex = Math.max(...logNumbers);
  return `${logsDir}/${maxIndex}.txt`;
}
function readSession() {
  if (!existsSync("session.txt")) return void 0;
  const content = readFileSync("session.txt", "utf-8").trim();
  return content || void 0;
}
function writeSession(sessionId) {
  writeFileSync("session.txt", sessionId);
}

// src/agentOptions.ts
function readEnv(name) {
  return typeof process !== "undefined" ? process.env?.[name]?.trim() || void 0 : void 0;
}
function getGitConfig(key) {
  try {
    return execSync(`git config ${key}`, { encoding: "utf-8", stdio: "pipe" }).trim() || void 0;
  } catch {
    return void 0;
  }
}
function makeAgentOptions(options = {}) {
  const apiBase = options.apiBase ?? readEnv("OBJECTIVEAI_API_BASE") ?? "https://api.objective-ai.io";
  const apiKey = options.apiKey ?? readEnv("OBJECTIVEAI_API_KEY");
  if (!apiKey) {
    throw new Error("API key is required. Set OBJECTIVEAI_API_KEY or pass apiKey.");
  }
  const log = options.log ?? createFileLogger().log;
  const depth = options.depth ?? 0;
  const rawMin = options.minWidth && options.minWidth > 0 ? Math.round(options.minWidth) : void 0;
  const rawMax = options.maxWidth && options.maxWidth > 0 ? Math.round(options.maxWidth) : void 0;
  let minWidth;
  let maxWidth;
  if (rawMin && rawMax) {
    minWidth = rawMin;
    maxWidth = rawMax;
  } else if (rawMin) {
    minWidth = rawMin;
    maxWidth = Math.max(10, minWidth);
  } else if (rawMax) {
    maxWidth = rawMax;
    minWidth = Math.min(5, maxWidth);
  } else {
    minWidth = 5;
    maxWidth = 10;
  }
  const gitUserName = options.gitUserName ?? readEnv("GIT_AUTHOR_NAME") ?? readEnv("GIT_COMMITTER_NAME") ?? getGitConfig("user.name");
  if (!gitUserName) {
    throw new Error("Git user name is required. Set GIT_AUTHOR_NAME, configure git config user.name, or pass gitUserName.");
  }
  const gitUserEmail = options.gitUserEmail ?? readEnv("GIT_AUTHOR_EMAIL") ?? readEnv("GIT_COMMITTER_EMAIL") ?? getGitConfig("user.email");
  if (!gitUserEmail) {
    throw new Error("Git user email is required. Set GIT_AUTHOR_EMAIL, configure git config user.email, or pass gitUserEmail.");
  }
  const ghToken = options.ghToken ?? readEnv("GH_TOKEN");
  if (!ghToken) {
    throw new Error("GitHub token is required. Set GH_TOKEN or pass ghToken.");
  }
  const sessionId = options.sessionId ?? readSession();
  return {
    ...options,
    apiBase,
    apiKey,
    sessionId,
    log,
    depth,
    minWidth,
    maxWidth,
    gitUserName,
    gitUserEmail,
    ghToken
  };
}

// src/banner.ts
var PURPLE = "\x1B[38;2;107;92;255m";
var BOLD = "\x1B[1m";
var RESET = "\x1B[0m";
function bannerLines() {
  return [
    "",
    `  ${PURPLE}${BOLD}{ai}${RESET} ${BOLD}| ObjectiveAI${RESET}`,
    ""
  ];
}
function printBanner() {
  for (const line of bannerLines()) {
    console.log(line);
  }
}
function getFunctionPath(ref) {
  return join(
    "examples",
    "functions",
    ref.owner,
    ref.repository,
    ref.commit,
    "function.json"
  );
}
function functionExists(ref) {
  return existsSync(getFunctionPath(ref));
}
function writeFunction(ref, data) {
  const path = getFunctionPath(ref);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2));
}
async function fetchFunctionRecursively(objectiveai, ref) {
  if (functionExists(ref)) {
    return;
  }
  const func = await Functions.retrieve(
    objectiveai,
    ref.owner,
    ref.repository,
    ref.commit
  );
  writeFunction(ref, func);
  for (const task of func.tasks) {
    if (task.type === "scalar.function" || task.type === "vector.function") {
      const subRef = {
        owner: task.owner,
        repository: task.repository,
        commit: task.commit
      };
      await fetchFunctionRecursively(objectiveai, subRef);
    }
  }
}
async function fetchExamples(apiBase, apiKey) {
  if (existsSync(join("examples", "examples.json"))) {
    return;
  }
  const objectiveai = new ObjectiveAI({ ...apiBase && { apiBase }, ...apiKey && { apiKey } });
  const { data: functions } = await Functions.list(objectiveai);
  const shuffled = functions.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(10, shuffled.length));
  for (const func of selected) {
    await fetchFunctionRecursively(objectiveai, func);
  }
  mkdirSync("examples", { recursive: true });
  writeFileSync(
    join("examples", "examples.json"),
    JSON.stringify(selected, null, 2)
  );
}
function writeGitignore() {
  writeFileSync(
    ".gitignore",
    ["examples/", "agent_functions/", "network_tests/", "logs/", ""].join("\n")
  );
}
async function init(options) {
  if (!existsSync(".git")) {
    execSync("git init", { stdio: "pipe" });
  }
  writeGitignore();
  await fetchExamples(options.apiBase, options.apiKey);
  if (!existsSync("parameters.json")) {
    const parameters = {
      depth: options.depth,
      min_width: options.minWidth,
      max_width: options.maxWidth
    };
    writeFileSync("parameters.json", JSON.stringify(parameters, null, 2));
  }
  cloneAgentFunctions(options.ghToken);
}
function cloneAgentFunctions(ghToken) {
  if (!existsSync("function.json")) return;
  let func;
  try {
    func = JSON.parse(readFileSync("function.json", "utf-8"));
  } catch {
    return;
  }
  if (!Array.isArray(func.tasks)) return;
  const env = { ...process.env, GH_TOKEN: ghToken };
  for (const task of func.tasks) {
    if (task.type !== "scalar.function" && task.type !== "vector.function") continue;
    const dir = join("agent_functions", task.repository);
    if (existsSync(dir)) continue;
    mkdirSync("agent_functions", { recursive: true });
    execSync(`gh repo clone ${task.owner}/${task.repository} ${dir}`, {
      stdio: "pipe",
      env
    });
  }
}

// src/tools/markdown/index.ts
var markdown_exports = {};
__export(markdown_exports, {
  appendAmendment: () => appendAmendment,
  getLatestPlanIndex: () => getLatestPlanIndex,
  isDefaultReadme: () => isDefaultReadme,
  readEssay: () => readEssay,
  readEssayTasks: () => readEssayTasks,
  readPlan: () => readPlan,
  readReadme: () => readReadme,
  readSpec: () => readSpec,
  writeEssay: () => writeEssay,
  writeEssayTasks: () => writeEssayTasks,
  writePlan: () => writePlan,
  writeReadme: () => writeReadme,
  writeSpec: () => writeSpec
});
function readEssay() {
  if (!existsSync("ESSAY.md")) {
    return { ok: false, value: void 0, error: "ESSAY.md is missing" };
  }
  return { ok: true, value: readFileSync("ESSAY.md", "utf-8"), error: void 0 };
}
function writeEssay(content) {
  writeFileSync("ESSAY.md", content);
  return { ok: true, value: void 0, error: void 0 };
}
function readEssayTasks() {
  if (!existsSync("ESSAY_TASKS.md")) {
    return { ok: false, value: void 0, error: "ESSAY_TASKS.md is missing" };
  }
  return { ok: true, value: readFileSync("ESSAY_TASKS.md", "utf-8"), error: void 0 };
}
function writeEssayTasks(content) {
  writeFileSync("ESSAY_TASKS.md", content);
  return { ok: true, value: void 0, error: void 0 };
}
function readPlan(index) {
  const path = `plans/${index}.md`;
  if (!existsSync(path)) {
    return { ok: false, value: void 0, error: `${path} is missing` };
  }
  return { ok: true, value: readFileSync(path, "utf-8"), error: void 0 };
}
function writePlan(index, content) {
  mkdirSync("plans", { recursive: true });
  writeFileSync(`plans/${index}.md`, content);
  return { ok: true, value: void 0, error: void 0 };
}
function getLatestPlanIndex() {
  if (!existsSync("plans")) {
    return { ok: false, value: void 0, error: "plans/ directory does not exist" };
  }
  const files = readdirSync("plans");
  const indices = files.filter((f) => /^\d+\.md$/.test(f)).map((f) => parseInt(f.replace(".md", ""), 10)).filter((n) => !isNaN(n));
  if (indices.length === 0) {
    return { ok: false, value: void 0, error: "No plan files found" };
  }
  return { ok: true, value: Math.max(...indices), error: void 0 };
}
function readReadme() {
  if (!existsSync("README.md")) {
    return { ok: false, value: void 0, error: "README.md is missing" };
  }
  return { ok: true, value: readFileSync("README.md", "utf-8"), error: void 0 };
}
function isDefaultReadme() {
  const result = readReadme();
  return !result.ok || !result.value.trim();
}
function writeReadme(content) {
  writeFileSync("README.md", content);
  return { ok: true, value: void 0, error: void 0 };
}
function readSpec() {
  if (!existsSync("SPEC.md")) {
    return { ok: false, value: void 0, error: "SPEC.md is missing" };
  }
  return { ok: true, value: readFileSync("SPEC.md", "utf-8"), error: void 0 };
}
function writeSpec(content) {
  writeFileSync("SPEC.md", content);
  return { ok: true, value: void 0, error: void 0 };
}
function appendAmendment(content) {
  const existing = existsSync("SPEC.md") ? readFileSync("SPEC.md", "utf-8") : "";
  const matches = existing.match(/===AMENDMENT \d+===/g);
  const nextIndex = matches ? matches.length + 1 : 1;
  appendFileSync("SPEC.md", `
===AMENDMENT ${nextIndex}===
${content}`);
  return nextIndex;
}

// src/tools/claude/util.ts
var _messageQueue;
function setMessageQueue(queue) {
  _messageQueue = queue;
}
function drainMessages(result) {
  if (!_messageQueue || _messageQueue.length === 0) return result;
  const messages = _messageQueue.drain();
  const suffix = "\n\n[USER MESSAGE]: " + messages.join("\n[USER MESSAGE]: ");
  const last = result.content[result.content.length - 1];
  if (last && "type" in last && last.type === "text") {
    last.text += suffix;
  } else {
    result.content.push({ type: "text", text: suffix });
  }
  return result;
}
function textResult(text) {
  return drainMessages({ content: [{ type: "text", text }] });
}
function errorResult(error) {
  return drainMessages({ content: [{ type: "text", text: error }], isError: true });
}
function resultFromResult(result) {
  if (!result.ok) {
    return errorResult(result.error);
  }
  if (result.value === void 0) {
    return textResult("OK");
  }
  if (typeof result.value === "string") {
    return textResult(result.value);
  }
  return textResult(JSON.stringify(result.value, null, 2));
}
function makeReadSpec(state) {
  return tool("ReadSpec", "Read SPEC.md", {}, async () => {
    state.hasReadOrWrittenSpec = true;
    return resultFromResult(readSpec());
  });
}
function makeWriteSpec(state) {
  return tool(
    "WriteSpec",
    "Write SPEC.md",
    { content: z18.string() },
    async ({ content }) => {
      state.hasReadOrWrittenSpec = true;
      return resultFromResult(writeSpec(content));
    }
  );
}
function listExampleFunctions() {
  const path = join("examples", "examples.json");
  if (!existsSync(path)) {
    return { ok: false, value: void 0, error: "examples/examples.json does not exist" };
  }
  try {
    const content = JSON.parse(readFileSync(path, "utf-8"));
    if (!Array.isArray(content)) {
      return { ok: false, value: void 0, error: "examples/examples.json is not an array" };
    }
    return { ok: true, value: content, error: void 0 };
  } catch (e) {
    return { ok: false, value: void 0, error: `Failed to parse examples/examples.json: ${e.message}` };
  }
}
function readExampleFunction(owner, repository, commit) {
  const path = join("examples", "functions", owner, repository, commit, "function.json");
  if (!existsSync(path)) {
    return { ok: false, value: void 0, error: `${path} does not exist` };
  }
  try {
    return { ok: true, value: JSON.parse(readFileSync(path, "utf-8")), error: void 0 };
  } catch (e) {
    return { ok: false, value: void 0, error: `Failed to parse ${path}: ${e.message}` };
  }
}
function makeListExampleFunctions(state) {
  return tool(
    "ListExampleFunctions",
    "List root example functions",
    {},
    async () => {
      state.hasReadExampleFunctions = true;
      return resultFromResult(listExampleFunctions());
    }
  );
}
function makeReadExampleFunction(state) {
  return tool(
    "ReadExampleFunction",
    "Read an example function by owner, repository, and commit",
    {
      owner: z18.string(),
      repository: z18.string(),
      commit: z18.string()
    },
    async ({ owner, repository, commit }) => {
      state.hasReadExampleFunctions = true;
      return resultFromResult(readExampleFunction(owner, repository, commit));
    }
  );
}

// src/tools/function/index.ts
var function_exports = {};
__export(function_exports, {
  appendInputMap: () => appendInputMap,
  appendTask: () => appendTask,
  checkDescription: () => checkDescription,
  checkFunction: () => checkFunction,
  checkInputMaps: () => checkInputMaps,
  checkInputMerge: () => checkInputMerge,
  checkInputSchema: () => checkInputSchema,
  checkInputSplit: () => checkInputSplit,
  checkOutputLength: () => checkOutputLength,
  checkTasks: () => checkTasks,
  checkType: () => checkType,
  delInputMap: () => delInputMap,
  delInputMaps: () => delInputMaps,
  delInputMerge: () => delInputMerge,
  delInputSplit: () => delInputSplit,
  delOutputLength: () => delOutputLength,
  delTask: () => delTask,
  delTasks: () => delTasks,
  editDescription: () => editDescription,
  editFunction: () => editFunction,
  editInputMaps: () => editInputMaps,
  editInputMerge: () => editInputMerge,
  editInputSchema: () => editInputSchema,
  editInputSplit: () => editInputSplit,
  editOutputLength: () => editOutputLength,
  editTask: () => editTask,
  editTasks: () => editTasks,
  editType: () => editType,
  isDefaultDescription: () => isDefaultDescription,
  isDefaultInputMaps: () => isDefaultInputMaps,
  isDefaultInputMerge: () => isDefaultInputMerge,
  isDefaultInputSchema: () => isDefaultInputSchema,
  isDefaultInputSplit: () => isDefaultInputSplit,
  isDefaultOutputLength: () => isDefaultOutputLength,
  isDefaultTasks: () => isDefaultTasks,
  isDefaultType: () => isDefaultType,
  readDescription: () => readDescription,
  readDescriptionSchema: () => readDescriptionSchema,
  readFunction: () => readFunction,
  readFunctionSchema: () => readFunctionSchema,
  readInputMaps: () => readInputMaps,
  readInputMapsSchema: () => readInputMapsSchema,
  readInputMerge: () => readInputMerge,
  readInputMergeSchema: () => readInputMergeSchema,
  readInputSchema: () => readInputSchema,
  readInputSchemaSchema: () => readInputSchemaSchema,
  readInputSplit: () => readInputSplit,
  readInputSplitSchema: () => readInputSplitSchema,
  readMessagesSchema: () => readMessagesSchema,
  readOutputLength: () => readOutputLength,
  readOutputLengthSchema: () => readOutputLengthSchema,
  readResponsesSchema: () => readResponsesSchema,
  readTasks: () => readTasks,
  readTasksSchema: () => readTasksSchema,
  readToolsSchema: () => readToolsSchema,
  readType: () => readType,
  readTypeSchema: () => readTypeSchema,
  validateDescription: () => validateDescription,
  validateFunction: () => validateFunction,
  validateInputMaps: () => validateInputMaps,
  validateInputMerge: () => validateInputMerge,
  validateInputSchema: () => validateInputSchema,
  validateInputSplit: () => validateInputSplit,
  validateOutputLength: () => validateOutputLength,
  validateTasks: () => validateTasks,
  validateType: () => validateType
});
var FunctionTypeSchema = z18.enum([
  ...new Set(
    Functions.RemoteFunctionSchema.options.map((opt) => opt.shape.type.value)
  )
]);
function readType() {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: void 0, error: fn.error };
  }
  return { ok: true, value: fn.value.type, error: void 0 };
}
function readTypeSchema() {
  return FunctionTypeSchema;
}
function checkType(fn) {
  if (!fn) {
    const read = readFunction();
    if (!read.ok) {
      return { ok: false, value: void 0, error: `Unable to check type: ${read.error}` };
    }
    fn = read.value;
  }
  const result = validateType(fn);
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Type is invalid: ${result.error}`
    };
  }
  return { ok: true, value: void 0, error: void 0 };
}
function editType(value) {
  const result = validateType({ type: value });
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Invalid type: ${result.error}`
    };
  }
  return editFunction({ type: result.value });
}
function isDefaultType() {
  const result = readType();
  return result.ok && result.value === void 0;
}
function validateType(fn) {
  const parsed = FunctionTypeSchema.safeParse(fn.type);
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: void 0 };
}
function readInputSchema(dir) {
  const fn = readFunction(dir);
  if (!fn.ok) {
    return { ok: false, value: void 0, error: fn.error };
  }
  return { ok: true, value: fn.value.input_schema, error: void 0 };
}
function readInputSchemaSchema() {
  return Functions.Expression.InputSchemaSchema;
}
function checkInputSchema(fn) {
  if (!fn) {
    const read = readFunction();
    if (!read.ok) {
      return { ok: false, value: void 0, error: `Unable to check input_schema: ${read.error}` };
    }
    fn = read.value;
  }
  const result = validateInputSchema(fn);
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `input_schema is invalid: ${result.error}`
    };
  }
  return { ok: true, value: void 0, error: void 0 };
}
function editInputSchema(value) {
  const result = validateInputSchema({ input_schema: value });
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Invalid input_schema: ${result.error}`
    };
  }
  return editFunction({ input_schema: result.value });
}
function isDefaultInputSchema() {
  const result = readInputSchema();
  return result.ok && result.value === void 0;
}
function validateInputSchema(fn) {
  const parsed = Functions.Expression.InputSchemaSchema.safeParse(
    fn.input_schema
  );
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: void 0 };
}
function readInputMaps() {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: void 0, error: fn.error };
  }
  return { ok: true, value: fn.value.input_maps, error: void 0 };
}
function readInputMapsSchema() {
  return Functions.Expression.InputMapsExpressionSchema;
}
function checkInputMaps(fn) {
  if (!fn) {
    const read = readFunction();
    if (!read.ok) {
      return { ok: false, value: void 0, error: `Unable to check input_maps: ${read.error}` };
    }
    fn = read.value;
  }
  if (fn.input_maps === void 0) {
    return { ok: true, value: void 0, error: void 0 };
  }
  const result = validateInputMaps(fn);
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `input_maps is invalid: ${result.error}`
    };
  }
  return { ok: true, value: void 0, error: void 0 };
}
function delInputMaps() {
  return editFunction({ input_maps: void 0 });
}
function editInputMaps(value) {
  const result = validateInputMaps({ input_maps: value });
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Invalid input_maps: ${result.error}`
    };
  }
  return editFunction({ input_maps: result.value });
}
function appendInputMap(value) {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to append input_map: ${fn.error}`
    };
  }
  const existing = Array.isArray(fn.value.input_maps) ? fn.value.input_maps : [];
  const newInputMaps = [...existing, value];
  const result = validateInputMaps({ input_maps: newInputMaps });
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Invalid input_maps after append: ${result.error}`
    };
  }
  const editResult = editFunction({ input_maps: result.value });
  if (!editResult.ok) {
    return editResult;
  }
  return { ok: true, value: `new length: ${newInputMaps.length}`, error: void 0 };
}
function delInputMap(index) {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to delete input_map: ${fn.error}`
    };
  }
  if (!Array.isArray(fn.value.input_maps)) {
    return {
      ok: false,
      value: void 0,
      error: "Unable to delete input_map: input_maps is not an array"
    };
  }
  if (index < 0 || index >= fn.value.input_maps.length) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to delete input_map: index ${index} is out of bounds (length ${fn.value.input_maps.length})`
    };
  }
  const newInputMaps = [...fn.value.input_maps];
  newInputMaps.splice(index, 1);
  const editResult = editFunction({ input_maps: newInputMaps.length > 0 ? newInputMaps : void 0 });
  if (!editResult.ok) {
    return editResult;
  }
  return { ok: true, value: `new length: ${newInputMaps.length}`, error: void 0 };
}
function isDefaultInputMaps() {
  const result = readInputMaps();
  const v = result.ok ? result.value : void 0;
  return v === void 0 || Array.isArray(v) && v.length === 0;
}
function validateInputMaps(fn) {
  const parsed = Functions.Expression.InputMapsExpressionSchema.safeParse(
    fn.input_maps
  );
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: void 0 };
}

// src/tools/parameters/index.ts
var parameters_exports = {};
__export(parameters_exports, {
  checkParameters: () => checkParameters,
  readParameters: () => readParameters,
  readParametersSchema: () => readParametersSchema,
  validateParameters: () => validateParameters
});
var ParametersSchema = z18.object({
  depth: z18.number().int().nonnegative(),
  min_width: z18.int().positive(),
  max_width: z18.int().positive()
});
function readParameters() {
  if (!existsSync("parameters.json")) {
    return { ok: true, value: { depth: 0 }, error: void 0 };
  }
  try {
    return { ok: true, value: JSON.parse(readFileSync("parameters.json", "utf-8")), error: void 0 };
  } catch {
    return { ok: false, value: void 0, error: "parameters.json is not valid JSON" };
  }
}
function readParametersSchema() {
  return ParametersSchema;
}
function validateParameters(value) {
  const parsed = ParametersSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: void 0 };
}
function checkParameters() {
  const raw = readParameters();
  if (!raw.ok) {
    return { ok: false, value: void 0, error: raw.error };
  }
  const result = validateParameters(raw.value);
  if (!result.ok) {
    return { ok: false, value: void 0, error: `Parameters are invalid: ${result.error}` };
  }
  return { ok: true, value: void 0, error: void 0 };
}

// src/tools/function/tasks.ts
var TasksSchema = Functions.TaskExpressionsSchema.min(1);
function delTasks() {
  return editFunction({ tasks: [] });
}
function readTasks() {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: void 0, error: fn.error };
  }
  return { ok: true, value: fn.value.tasks, error: void 0 };
}
function readTasksSchema() {
  return TasksSchema;
}
var MessagesSchema = Functions.VectorCompletionTaskExpressionSchema.shape.messages;
var ToolsSchema = Functions.VectorCompletionTaskExpressionSchema.shape.tools;
var ResponsesSchema = Functions.VectorCompletionTaskExpressionSchema.shape.responses;
function readMessagesSchema() {
  return MessagesSchema;
}
function readToolsSchema() {
  return ToolsSchema;
}
function readResponsesSchema() {
  return ResponsesSchema;
}
function checkTasks(fn) {
  if (!fn) {
    const read = readFunction();
    if (!read.ok) {
      return {
        ok: false,
        value: void 0,
        error: `Unable to check tasks: ${read.error}`
      };
    }
    fn = read.value;
  }
  const result = validateTasks(fn);
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `tasks is invalid: ${result.error}`
    };
  }
  return { ok: true, value: void 0, error: void 0 };
}
function editTasks(value) {
  const result = validateTasks({ tasks: value });
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Invalid tasks: ${result.error}`
    };
  }
  return editFunction({ tasks: result.value });
}
function appendTask(value) {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to append task: ${fn.error}`
    };
  }
  const existing = Array.isArray(fn.value.tasks) ? fn.value.tasks : [];
  const newTasks = [...existing, value];
  const result = validateTasks({ tasks: newTasks });
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Invalid tasks after append: ${result.error}`
    };
  }
  const editResult = editFunction({ tasks: result.value });
  if (!editResult.ok) {
    return editResult;
  }
  return {
    ok: true,
    value: `new length: ${newTasks.length}`,
    error: void 0
  };
}
function editTask(index, value) {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to edit task: ${fn.error}`
    };
  }
  if (!Array.isArray(fn.value.tasks)) {
    return {
      ok: false,
      value: void 0,
      error: "Unable to edit task: tasks is not an array"
    };
  }
  if (index < 0 || index >= fn.value.tasks.length) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to edit task: index ${index} is out of bounds (length ${fn.value.tasks.length})`
    };
  }
  const newTasks = [...fn.value.tasks];
  newTasks[index] = value;
  const result = validateTasks({ tasks: newTasks });
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Invalid tasks after edit: ${result.error}`
    };
  }
  return editFunction({ tasks: result.value });
}
function delTask(index) {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to delete task: ${fn.error}`
    };
  }
  if (!Array.isArray(fn.value.tasks)) {
    return {
      ok: false,
      value: void 0,
      error: "Unable to delete task: tasks is not an array"
    };
  }
  if (index < 0 || index >= fn.value.tasks.length) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to delete task: index ${index} is out of bounds (length ${fn.value.tasks.length})`
    };
  }
  const newTasks = [...fn.value.tasks];
  newTasks.splice(index, 1);
  const editResult = editFunction({ tasks: newTasks });
  if (!editResult.ok) {
    return editResult;
  }
  return {
    ok: true,
    value: `new length: ${newTasks.length}`,
    error: void 0
  };
}
function isDefaultTasks() {
  const result = readTasks();
  const v = result.ok ? result.value : void 0;
  return v === void 0 || Array.isArray(v) && v.length === 0;
}
function validateTasks(fn) {
  const parsed = TasksSchema.safeParse(fn.tasks);
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  const mapIndices = parsed.data.map((t) => t.map).filter((m) => typeof m === "number");
  const seen = /* @__PURE__ */ new Set();
  for (const idx of mapIndices) {
    if (seen.has(idx)) {
      return {
        ok: false,
        value: void 0,
        error: `Duplicate map index: ${idx}. Each task with a map index must reference a unique map index.`
      };
    }
    seen.add(idx);
  }
  const paramsRaw = readParameters();
  if (paramsRaw.ok) {
    const paramsResult = validateParameters(paramsRaw.value);
    if (paramsResult.ok) {
      if (parsed.data.length < paramsResult.value.min_width) {
        return {
          ok: false,
          value: void 0,
          error: `Too few tasks: ${parsed.data.length} is below min_width of ${paramsResult.value.min_width}`
        };
      }
      if (parsed.data.length > paramsResult.value.max_width) {
        return {
          ok: false,
          value: void 0,
          error: `Too many tasks: ${parsed.data.length} exceeds max_width of ${paramsResult.value.max_width}`
        };
      }
    }
  }
  return { ok: true, value: parsed.data, error: void 0 };
}
var OutputLengthSchema = Functions.RemoteVectorFunctionSchema.shape.output_length;
function readOutputLength() {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: void 0, error: fn.error };
  }
  return { ok: true, value: fn.value.output_length, error: void 0 };
}
function readOutputLengthSchema() {
  return OutputLengthSchema;
}
function checkOutputLength(fn) {
  if (!fn) {
    const read = readFunction();
    if (!read.ok) {
      return { ok: false, value: void 0, error: `Unable to check output_length: ${read.error}` };
    }
    fn = read.value;
  }
  const typeResult = validateType(fn);
  if (!typeResult.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to check output_length: type is invalid: ${typeResult.error}`
    };
  }
  if (typeResult.value !== "vector.function") {
    if (fn.output_length !== void 0) {
      return {
        ok: false,
        value: void 0,
        error: `output_length must not be present for type "${typeResult.value}"`
      };
    }
    return { ok: true, value: void 0, error: void 0 };
  }
  const result = validateOutputLength(fn);
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `output_length is invalid: ${result.error}`
    };
  }
  return { ok: true, value: void 0, error: void 0 };
}
function delOutputLength() {
  return editFunction({ output_length: null });
}
function editOutputLength(value) {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to edit output_length: ${fn.error}`
    };
  }
  const typeResult = validateType(fn.value);
  if (!typeResult.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to edit output_length: type is invalid: ${typeResult.error}`
    };
  }
  if (typeResult.value !== "vector.function") {
    return {
      ok: false,
      value: void 0,
      error: `output_length is not applicable for type "${typeResult.value}"`
    };
  }
  const result = validateOutputLength({ output_length: value });
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Invalid output_length: ${result.error}`
    };
  }
  return editFunction({ output_length: result.value });
}
function isDefaultOutputLength() {
  const result = readOutputLength();
  return result.ok && result.value === void 0;
}
function validateOutputLength(fn) {
  const parsed = OutputLengthSchema.safeParse(fn.output_length);
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: void 0 };
}
var InputSplitSchema = Functions.RemoteVectorFunctionSchema.shape.input_split;
function readInputSplit() {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: void 0, error: fn.error };
  }
  return { ok: true, value: fn.value.input_split, error: void 0 };
}
function readInputSplitSchema() {
  return InputSplitSchema;
}
function checkInputSplit(fn) {
  if (!fn) {
    const read = readFunction();
    if (!read.ok) {
      return { ok: false, value: void 0, error: `Unable to check input_split: ${read.error}` };
    }
    fn = read.value;
  }
  const typeResult = validateType(fn);
  if (!typeResult.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to check input_split: type is invalid: ${typeResult.error}`
    };
  }
  if (typeResult.value !== "vector.function") {
    if (fn.input_split !== void 0) {
      return {
        ok: false,
        value: void 0,
        error: `input_split must not be present for type "${typeResult.value}"`
      };
    }
    return { ok: true, value: void 0, error: void 0 };
  }
  const result = validateInputSplit(fn);
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `input_split is invalid: ${result.error}`
    };
  }
  return { ok: true, value: void 0, error: void 0 };
}
function delInputSplit() {
  return editFunction({ input_split: null });
}
function editInputSplit(value) {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to edit input_split: ${fn.error}`
    };
  }
  const typeResult = validateType(fn.value);
  if (!typeResult.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to edit input_split: type is invalid: ${typeResult.error}`
    };
  }
  if (typeResult.value !== "vector.function") {
    return {
      ok: false,
      value: void 0,
      error: `input_split is not applicable for type "${typeResult.value}"`
    };
  }
  const result = validateInputSplit({ input_split: value });
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Invalid input_split: ${result.error}`
    };
  }
  return editFunction({ input_split: result.value });
}
function isDefaultInputSplit() {
  const result = readInputSplit();
  return result.ok && result.value === void 0;
}
function validateInputSplit(fn) {
  const parsed = InputSplitSchema.safeParse(fn.input_split);
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: void 0 };
}
var InputMergeSchema = Functions.RemoteVectorFunctionSchema.shape.input_merge;
function readInputMerge() {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: void 0, error: fn.error };
  }
  return { ok: true, value: fn.value.input_merge, error: void 0 };
}
function readInputMergeSchema() {
  return InputMergeSchema;
}
function checkInputMerge(fn) {
  if (!fn) {
    const read = readFunction();
    if (!read.ok) {
      return { ok: false, value: void 0, error: `Unable to check input_merge: ${read.error}` };
    }
    fn = read.value;
  }
  const typeResult = validateType(fn);
  if (!typeResult.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to check input_merge: type is invalid: ${typeResult.error}`
    };
  }
  if (typeResult.value !== "vector.function") {
    if (fn.input_merge !== void 0) {
      return {
        ok: false,
        value: void 0,
        error: `input_merge must not be present for type "${typeResult.value}"`
      };
    }
    return { ok: true, value: void 0, error: void 0 };
  }
  const result = validateInputMerge(fn);
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `input_merge is invalid: ${result.error}`
    };
  }
  return { ok: true, value: void 0, error: void 0 };
}
function delInputMerge() {
  return editFunction({ input_merge: null });
}
function editInputMerge(value) {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to edit input_merge: ${fn.error}`
    };
  }
  const typeResult = validateType(fn.value);
  if (!typeResult.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to edit input_merge: type is invalid: ${typeResult.error}`
    };
  }
  if (typeResult.value !== "vector.function") {
    return {
      ok: false,
      value: void 0,
      error: `input_merge is not applicable for type "${typeResult.value}"`
    };
  }
  const result = validateInputMerge({ input_merge: value });
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Invalid input_merge: ${result.error}`
    };
  }
  return editFunction({ input_merge: result.value });
}
function isDefaultInputMerge() {
  const result = readInputMerge();
  return result.ok && result.value === void 0;
}
function validateInputMerge(fn) {
  const parsed = InputMergeSchema.safeParse(fn.input_merge);
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: void 0 };
}

// src/tools/function/function.ts
function readFunctionSchema() {
  const fn = readFunction();
  if (!fn.ok) return Functions.RemoteFunctionSchema;
  const type = validateType(fn.value);
  if (!type.ok) return Functions.RemoteFunctionSchema;
  switch (type.value) {
    case "scalar.function":
      return Functions.RemoteScalarFunctionSchema;
    case "vector.function":
      return Functions.RemoteVectorFunctionSchema;
    default:
      return Functions.RemoteFunctionSchema;
  }
}
function checkFunction() {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to check function: ${fn.error}`
    };
  }
  const result = validateFunction(fn.value);
  if (!result.ok) {
    return { ok: false, value: void 0, error: result.error };
  }
  const checks = [
    checkType,
    checkDescription,
    checkInputSchema,
    checkInputMaps,
    checkTasks,
    checkOutputLength,
    checkInputSplit,
    checkInputMerge
  ];
  const errors = [];
  for (const check of checks) {
    const r = check(fn.value);
    if (!r.ok) {
      errors.push(r.error);
    }
  }
  if (errors.length > 0) {
    return { ok: false, value: void 0, error: errors.join("\n") };
  }
  return { ok: true, value: void 0, error: void 0 };
}
function validateFunction(fn) {
  const parsed = Functions.RemoteFunctionSchema.safeParse(fn);
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: void 0 };
}
function readFunction(dir) {
  const path = dir ? join(dir, "function.json") : "function.json";
  if (!existsSync(path)) {
    return { ok: true, value: {}, error: void 0 };
  }
  let fn;
  try {
    fn = JSON.parse(readFileSync(path, "utf-8"));
  } catch (e) {
    return { ok: true, value: {}, error: void 0 };
  }
  if (typeof fn !== "object" || fn === null) {
    return { ok: true, value: {}, error: void 0 };
  }
  return { ok: true, value: fn, error: void 0 };
}
function editFunction(fields) {
  let fn = {};
  if (existsSync("function.json")) {
    try {
      const parsed = JSON.parse(readFileSync("function.json", "utf-8"));
      if (typeof parsed === "object" && parsed !== null) {
        fn = parsed;
      }
    } catch {
    }
  }
  for (const key in fields) {
    const value = fields[key];
    if (value === null) {
      delete fn[key];
    } else if (value !== void 0) {
      fn[key] = value;
    }
  }
  const fieldOrder = [
    "type",
    "description",
    "changelog",
    "input_schema",
    "input_maps",
    "tasks",
    "output_length",
    "input_split",
    "input_merge"
  ];
  const ordered = {};
  for (const key of fieldOrder) {
    if (key in fn) {
      ordered[key] = fn[key];
    }
  }
  for (const key in fn) {
    if (!(key in ordered)) {
      ordered[key] = fn[key];
    }
  }
  writeFileSync("function.json", JSON.stringify(ordered, null, 2));
  return { ok: true, value: void 0, error: void 0 };
}

// src/tools/function/description.ts
var DescriptionSchema = z18.string().nonempty();
function readDescription() {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: void 0, error: fn.error };
  }
  return { ok: true, value: fn.value.description, error: void 0 };
}
function readDescriptionSchema() {
  return DescriptionSchema;
}
function checkDescription(fn) {
  if (!fn) {
    const read = readFunction();
    if (!read.ok) {
      return { ok: false, value: void 0, error: `Unable to check description: ${read.error}` };
    }
    fn = read.value;
  }
  const result = validateDescription(fn);
  if (!result.ok) {
    return { ok: false, value: void 0, error: `Description is invalid: ${result.error}` };
  }
  return { ok: true, value: void 0, error: void 0 };
}
function editDescription(value) {
  const result = validateDescription({ description: value });
  if (!result.ok) {
    return { ok: false, value: void 0, error: `Invalid description: ${result.error}` };
  }
  return editFunction({ description: result.value });
}
function isDefaultDescription() {
  const result = readDescription();
  return result.ok && result.value === void 0;
}
function validateDescription(fn) {
  const parsed = DescriptionSchema.safeParse(fn.description);
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: void 0 };
}

// src/tools/schema.ts
function formatZodSchema(schema, opts) {
  const root = convert(
    schema,
    opts?.resolveLazy ? 1 : 0,
    /* skipDirectRef */
    true
  );
  return JSON.stringify(root, null, 2);
}
function registerLazyRef(schema, toolName) {
  const title = safeMeta(schema)?.title;
  if (title) {
    lazyRefs[title] = toolName;
  }
}
var lazyRefs = {};
function registerPropertyRefs(parentSchema, refs) {
  const existing = propertyRefsBySchema.get(parentSchema);
  propertyRefsBySchema.set(
    parentSchema,
    existing ? { ...existing, ...refs } : refs
  );
}
var propertyRefsBySchema = /* @__PURE__ */ new WeakMap();
function registerSchemaRef(schema, toolName) {
  schemaRefs.set(schema, toolName);
}
var schemaRefs = /* @__PURE__ */ new WeakMap();
function convert(schema, lazyDepth = 0, skipDirectRef = false) {
  if (!skipDirectRef) {
    const directRef = schemaRefs.get(schema);
    if (directRef) return { $ref: directRef };
  }
  const def = schema._def ?? schema.def;
  const type = def?.type ?? "unknown";
  switch (type) {
    // --- wrappers ---
    case "optional":
    case "default":
    case "prefault":
    case "readonly": {
      const wrapperRef = lazyToolRef(schema);
      if (wrapperRef) return wrapperRef;
      return convert(def.innerType, lazyDepth);
    }
    case "nullable":
      return withDesc({ anyOf: [convert(def.innerType, lazyDepth), { type: "null" }] }, schema);
    case "pipe":
      return convert(def.out, lazyDepth);
    // --- primitives ---
    case "string":
      return withDesc({ type: "string" }, schema);
    case "number": {
      const bag = schema._zod?.bag;
      if (bag?.format === "int32" || bag?.format === "uint32" || bag?.format === "int64" || bag?.format === "uint64") {
        return withDesc({ type: "integer" }, schema);
      }
      return withDesc({ type: "number" }, schema);
    }
    case "int":
      return withDesc({ type: "integer" }, schema);
    case "boolean":
      return withDesc({ type: "boolean" }, schema);
    case "null":
      return { type: "null" };
    case "undefined":
      return {};
    case "any":
    case "unknown":
      return withDesc({}, schema);
    case "date":
      return withDesc({ type: "string", format: "date-time" }, schema);
    // --- enums & literals ---
    case "enum":
      return withDesc({ enum: Object.values(def.entries) }, schema);
    case "literal": {
      const values = def.values;
      if (values.length === 1) return withDesc({ const: values[0] }, schema);
      return withDesc({ enum: values }, schema);
    }
    // --- composites ---
    case "object": {
      const shape = def.shape;
      const propRefs = propertyRefsBySchema.get(schema);
      const properties = {};
      const required = [];
      for (const [key, prop] of Object.entries(shape)) {
        const u = unwrap(prop);
        if (propRefs?.[key]) {
          properties[key] = { $ref: propRefs[key] };
        } else {
          let converted = convert(u.inner);
          if (u.nullable) converted = { anyOf: [converted, { type: "null" }] };
          properties[key] = converted;
        }
        if (!u.optional) required.push(key);
      }
      const result = { type: "object", properties };
      if (required.length > 0) result.required = required;
      return withDesc(result, schema);
    }
    case "array":
      return withDesc({ type: "array", items: convert(def.element) }, schema);
    case "tuple": {
      const items = def.items.map((i) => convert(i));
      return withDesc({ type: "array", prefixItems: items }, schema);
    }
    case "record":
      return withDesc({ type: "object", additionalProperties: convert(def.valueType) }, schema);
    // --- set operations ---
    case "union": {
      const options = def.options.map((o) => convert(o));
      return withDesc({ anyOf: options }, schema);
    }
    case "intersection":
      return withDesc({ allOf: [convert(def.left), convert(def.right)] }, schema);
    // --- recursive ---
    // Never call def.getter() — some z.lazy getters create new instances per
    // call which blows the stack even with cycle detection. Emit a $ref to
    // the corresponding MCP tool name instead.
    // If lazyDepth > 0, resolve the getter once (for top-level lazy schemas
    // that need to show their inner structure).
    case "lazy": {
      if (lazyDepth > 0) {
        const inner = def.getter();
        return withDesc(convert(inner), schema);
      }
      return lazyToolRef(schema) ?? withDesc({}, schema);
    }
    // --- fallback ---
    default:
      return withDesc({}, schema);
  }
}
function lazyToolRef(schema) {
  const meta = safeMeta(schema);
  const title = meta?.title;
  const toolName = title ? lazyRefs[title] : void 0;
  return toolName ? { $ref: toolName } : void 0;
}
function withDesc(obj, schema) {
  const d = safeDesc(schema);
  if (d) obj.description = d;
  return obj;
}
function safeDesc(schema) {
  try {
    return schema.description;
  } catch {
    return void 0;
  }
}
function safeMeta(schema) {
  try {
    return schema.meta?.();
  } catch {
    return void 0;
  }
}
function unwrap(schema) {
  let optional = false;
  let nullable = false;
  let current = schema;
  while (true) {
    const def = current._def ?? current.def;
    const t = def?.type ?? "";
    if (t === "optional") {
      optional = true;
      current = def.innerType;
    } else if (t === "nullable") {
      nullable = true;
      current = def.innerType;
    } else if (t === "default" || t === "prefault") {
      optional = true;
      current = def.innerType;
    } else break;
  }
  return { inner: current, optional, nullable };
}

// src/tools/claude/function.ts
function makeReadFunction(state) {
  return tool(
    "ReadFunction",
    "Read the full Function",
    {},
    async () => {
      state.hasReadType = true;
      state.hasReadDescription = true;
      state.hasReadInputSchema = true;
      state.hasReadInputMaps = true;
      state.hasReadTasks = true;
      state.hasReadOutputLength = true;
      state.hasReadInputSplit = true;
      state.hasReadInputMerge = true;
      return resultFromResult(readFunction());
    }
  );
}
function makeReadFunctionSchema(state) {
  return tool(
    "ReadFunctionSchema",
    "Read the schema for Function",
    {},
    async () => textResult(formatZodSchema(readFunctionSchema()))
  );
}
function makeCheckFunction(state) {
  return tool(
    "CheckFunction",
    "Validate the full Function",
    {},
    async () => resultFromResult(checkFunction())
  );
}

// src/claude/prepare/specMcp.ts
function specIsNonEmpty() {
  return existsSync("SPEC.md") && readFileSync("SPEC.md", "utf-8").trim().length > 0;
}
async function specMcp(state, log, sessionId, spec) {
  if (specIsNonEmpty()) return sessionId;
  if (spec) {
    writeSpec(spec);
    return sessionId;
  }
  const tools = [
    makeWriteSpec(state),
    makeListExampleFunctions(state),
    makeReadExampleFunction(state),
    makeReadFunctionSchema()
  ];
  const mcpServer = createSdkMcpServer({ name: "spec", tools });
  const prompt = "Read example functions to understand what ObjectiveAI Functions look like, then create SPEC.md specifying the ObjectiveAI Function to be built. Think deeply about what function to invent:\n- **Scalar Function**: For scoring (outputs a single number in [0, 1])\n- **Vector Function**: For ranking (outputs scores for multiple items that sum to ~1)\n\nBe creative and describe a function with plain language.";
  sessionId = await consumeStream(
    query({
      prompt,
      options: {
        tools: [],
        mcpServers: { spec: mcpServer },
        allowedTools: ["mcp__spec__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId
      }
    }),
    log,
    sessionId
  );
  let retry = 1;
  while (!specIsNonEmpty()) {
    if (retry > 3) {
      throw new Error("SPEC.md is empty after spec phase");
    }
    sessionId = await consumeStream(
      query({
        prompt: "SPEC.md is empty after your spec phase. Create SPEC.md specifying the ObjectiveAI Function to be built. Think deeply about what function to invent:\n- **Scalar Function**: For scoring (outputs a single number in [0, 1])\n- **Vector Function**: For ranking (outputs scores for multiple items that sum to ~1)\n\nBe creative and describe a function with plain language.",
        options: {
          tools: [],
          mcpServers: { spec: mcpServer },
          allowedTools: ["mcp__spec__*"],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId
        }
      }),
      log,
      sessionId
    );
    retry += 1;
  }
  state.anyStepRan = true;
  if (sessionId) writeSession(sessionId);
  return sessionId;
}
function readName() {
  if (!existsSync("name.txt")) {
    return { ok: false, value: void 0, error: "name.txt is missing" };
  }
  return { ok: true, value: readFileSync("name.txt", "utf-8"), error: void 0 };
}
function ghEnv(ghToken) {
  return { ...process.env, GH_TOKEN: ghToken };
}
function getGitHubOwner(ghToken) {
  try {
    return execSync("gh api user --jq .login", {
      encoding: "utf-8",
      stdio: "pipe",
      env: ghEnv(ghToken)
    }).trim();
  } catch {
    return null;
  }
}
function repoExists(owner, name, ghToken) {
  try {
    execSync(`gh repo view ${owner}/${name}`, {
      stdio: "ignore",
      env: ghEnv(ghToken)
    });
    return true;
  } catch {
    return false;
  }
}
function writeName(content, ghToken) {
  const name = content.trim();
  const owner = getGitHubOwner(ghToken);
  if (owner && repoExists(owner, name, ghToken)) {
    return {
      ok: false,
      value: void 0,
      error: `Repository ${owner}/${name} already exists on GitHub. Choose a different name.`
    };
  }
  writeFileSync("name.txt", name);
  return { ok: true, value: void 0, error: void 0 };
}
function makeReadName(state) {
  return tool(
    "ReadName",
    "Read name.txt",
    {},
    async () => resultFromResult(readName())
  );
}
function makeWriteName(state) {
  return tool(
    "WriteName",
    "Write name.txt",
    { content: z18.string() },
    async ({ content }) => resultFromResult(writeName(content, state.ghToken))
  );
}

// src/tools/inputs/index.ts
var inputs_exports = {};
__export(inputs_exports, {
  appendExampleInput: () => appendExampleInput,
  checkExampleInputs: () => checkExampleInputs,
  collectModalities: () => collectModalities,
  delExampleInput: () => delExampleInput,
  delExampleInputs: () => delExampleInputs,
  editExampleInput: () => editExampleInput,
  isDefaultExampleInputs: () => isDefaultExampleInputs,
  readExampleInput: () => readExampleInput,
  readExampleInputs: () => readExampleInputs,
  readExampleInputsSchema: () => readExampleInputsSchema,
  validateExampleInput: () => validateExampleInput,
  validateExampleInputs: () => validateExampleInputs
});
var ExampleInputSchema = z18.object({
  value: Functions.Expression.InputValueSchema,
  compiledTasks: Functions.CompiledTasksSchema,
  outputLength: z18.number().int().nonnegative().nullable().describe("Expected output length for vector functions")
});
var ExampleInputsSchema = z18.array(ExampleInputSchema).min(10).max(100).describe(
  "An array of example inputs for the function. Must contain between 10 and 100 items."
);

// src/tools/profile/index.ts
var profile_exports = {};
__export(profile_exports, {
  buildProfile: () => buildProfile,
  checkProfile: () => checkProfile,
  defaultVectorCompletionTaskProfile: () => defaultVectorCompletionTaskProfile,
  readProfile: () => readProfile,
  readProfileSchema: () => readProfileSchema,
  validateProfile: () => validateProfile
});
var defaultVectorCompletionTaskProfile = {
  ensemble: {
    llms: [
      {
        count: 1,
        model: "openai/gpt-4.1-nano",
        output_mode: "json_schema"
      },
      {
        count: 1,
        model: "google/gemini-2.5-flash-lite",
        output_mode: "json_schema"
      },
      {
        count: 1,
        model: "deepseek/deepseek-v3.2",
        output_mode: "instruction",
        top_logprobs: 20
      },
      {
        count: 1,
        model: "openai/gpt-4o-mini",
        output_mode: "json_schema",
        top_logprobs: 20
      },
      {
        count: 1,
        model: "x-ai/grok-4.1-fast",
        output_mode: "json_schema",
        reasoning: {
          enabled: false
        }
      }
    ]
  },
  profile: [1, 1, 1, 1, 1]
};
function readProfile() {
  if (!existsSync("profile.json")) {
    return { ok: false, value: void 0, error: "profile.json is missing" };
  }
  try {
    return {
      ok: true,
      value: JSON.parse(readFileSync("profile.json", "utf-8")),
      error: void 0
    };
  } catch {
    return {
      ok: false,
      value: void 0,
      error: "profile.json is not valid JSON"
    };
  }
}
function readProfileSchema() {
  return Functions.RemoteProfileSchema;
}
function validateProfile(value) {
  const parsed = Functions.RemoteProfileSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: void 0 };
}
function checkProfile() {
  const raw = readProfile();
  if (!raw.ok) {
    return { ok: false, value: void 0, error: raw.error };
  }
  const result = validateProfile(raw.value);
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Profile is invalid: ${result.error}`
    };
  }
  return { ok: true, value: void 0, error: void 0 };
}
function buildProfile() {
  const raw = readTasks();
  if (!raw.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to build profile: ${raw.error}`
    };
  }
  const tasksResult = validateTasks({ tasks: raw.value });
  if (!tasksResult.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to build profile: tasks are invalid: ${tasksResult.error}`
    };
  }
  const profileTasks = [];
  for (const task of tasksResult.value) {
    if (task.type === "vector.completion") {
      profileTasks.push(defaultVectorCompletionTaskProfile);
    } else if (task.type === "scalar.function" || task.type === "vector.function") {
      profileTasks.push({
        owner: task.owner,
        repository: task.repository,
        commit: task.commit
      });
    }
  }
  const numTasks = profileTasks.length;
  const weights = numTasks > 0 ? profileTasks.map(() => 1 / numTasks) : [];
  const profile = {
    description: "Default profile",
    tasks: profileTasks,
    profile: weights
  };
  writeFileSync("profile.json", JSON.stringify(profile, null, 2));
  return { ok: true, value: void 0, error: void 0 };
}

// src/tools/inputs/index.ts
function validateExampleInput(value, fn) {
  const parsed = ExampleInputSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  const exampleInput = parsed.data;
  const inputSchemaResult = validateInputSchema(fn);
  if (!inputSchemaResult.ok) {
    return {
      ok: false,
      value: void 0,
      error: `input_schema is invalid: ${inputSchemaResult.error}`
    };
  }
  const zodSchema = Functions.Expression.InputSchemaExt.toZodSchema(
    inputSchemaResult.value
  );
  const valueParsed = zodSchema.safeParse(exampleInput.value);
  if (!valueParsed.success) {
    return {
      ok: false,
      value: void 0,
      error: `value does not conform to input_schema: ${valueParsed.error.message}`
    };
  }
  const hasOutputLength = fn.output_length != null;
  if (hasOutputLength && exampleInput.outputLength === null) {
    return {
      ok: false,
      value: void 0,
      error: "outputLength must be present because function has output_length"
    };
  }
  if (!hasOutputLength && exampleInput.outputLength !== null) {
    return {
      ok: false,
      value: void 0,
      error: "outputLength must be null because function does not have output_length"
    };
  }
  const tasksResult = validateTasks2(exampleInput.compiledTasks);
  if (!tasksResult.ok) {
    return { ok: false, value: void 0, error: tasksResult.error };
  }
  return { ok: true, value: exampleInput, error: void 0 };
}
function validateExampleInputs(value, fn) {
  const parsed = ExampleInputsSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  const exampleInputs = parsed.data;
  for (let i = 0; i < exampleInputs.length; i++) {
    const result = validateExampleInput(exampleInputs[i], fn);
    if (!result.ok) {
      return {
        ok: false,
        value: void 0,
        error: `example_inputs[${i}]: ${result.error}`
      };
    }
  }
  return { ok: true, value: exampleInputs, error: void 0 };
}
function delExampleInputs() {
  writeFileSync("inputs.json", "[]");
  return { ok: true, value: void 0, error: void 0 };
}
function isDefaultExampleInputs() {
  const result = readExampleInputsFile();
  const v = result.ok ? result.value : [];
  return !Array.isArray(v) || v.length === 0;
}
function readExampleInput(index) {
  const file = readExampleInputsFile();
  if (!file.ok) return file;
  if (index < 0 || index >= file.value.length) {
    return {
      ok: false,
      value: void 0,
      error: `index ${index} is out of bounds (length ${file.value.length})`
    };
  }
  return { ok: true, value: file.value[index], error: void 0 };
}
function readExampleInputs() {
  return readExampleInputsFile();
}
function readExampleInputsSchema() {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: void 0, error: `Unable to read function: ${fn.error}` };
  }
  const inputSchemaResult = validateInputSchema(fn.value);
  if (!inputSchemaResult.ok) {
    return { ok: false, value: void 0, error: `Unable to read input_schema: ${inputSchemaResult.error}` };
  }
  const zodSchema = Functions.Expression.InputSchemaExt.toZodSchema(inputSchemaResult.value);
  const itemSchema = ExampleInputSchema.extend({ value: zodSchema });
  let arraySchema = z18.array(itemSchema);
  const def = ExampleInputsSchema._def ?? ExampleInputsSchema.def;
  if (def?.minLength != null) {
    arraySchema = arraySchema.min(def.minLength.value ?? def.minLength);
  }
  if (def?.maxLength != null) {
    arraySchema = arraySchema.max(def.maxLength.value ?? def.maxLength);
  }
  if (ExampleInputsSchema.description) {
    arraySchema = arraySchema.describe(ExampleInputsSchema.description);
  }
  return { ok: true, value: arraySchema, error: void 0 };
}
function readExampleInputsFile() {
  if (!existsSync("inputs.json")) {
    return { ok: true, value: [], error: void 0 };
  }
  let content;
  try {
    content = JSON.parse(readFileSync("inputs.json", "utf-8"));
  } catch {
    return { ok: true, value: [], error: void 0 };
  }
  if (!Array.isArray(content)) {
    return { ok: true, value: [], error: void 0 };
  }
  return { ok: true, value: content, error: void 0 };
}
function writeExampleInputsFile(value) {
  writeFileSync("inputs.json", JSON.stringify(value, null, 2));
}
function appendExampleInput(value) {
  const file = readExampleInputsFile();
  if (!file.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to append example input: ${file.error}`
    };
  }
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to append example input: ${fn.error}`
    };
  }
  const existing = file.value;
  const newInputs = [...existing, value];
  for (const [index, input] of newInputs.entries()) {
    const result = validateExampleInput(input, fn.value);
    if (!result.ok) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid example input at index ${index}: ${result.error}`
      };
    }
  }
  writeExampleInputsFile(newInputs);
  return { ok: true, value: `new length: ${newInputs.length}`, error: void 0 };
}
function editExampleInput(index, value) {
  const file = readExampleInputsFile();
  if (!file.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to edit example input: ${file.error}`
    };
  }
  if (index < 0 || index >= file.value.length) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to edit example input: index ${index} is out of bounds (length ${file.value.length})`
    };
  }
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to edit example input: ${fn.error}`
    };
  }
  const newInputs = [...file.value];
  newInputs[index] = value;
  for (const [index2, input] of newInputs.entries()) {
    const result = validateExampleInput(input, fn.value);
    if (!result.ok) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid example input at index ${index2}: ${result.error}`
      };
    }
  }
  writeExampleInputsFile(newInputs);
  return { ok: true, value: void 0, error: void 0 };
}
function delExampleInput(index) {
  const file = readExampleInputsFile();
  if (!file.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to delete example input: ${file.error}`
    };
  }
  if (index < 0 || index >= file.value.length) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to delete example input: index ${index} is out of bounds (length ${file.value.length})`
    };
  }
  const newInputs = [...file.value];
  newInputs.splice(index, 1);
  writeExampleInputsFile(newInputs);
  return { ok: true, value: `new length: ${newInputs.length}`, error: void 0 };
}
function checkExampleInputs() {
  const fnRaw = readFunction();
  if (!fnRaw.ok) {
    return { ok: false, value: void 0, error: `Unable to read function.json: ${fnRaw.error}` };
  }
  const funcResult = validateFunction(fnRaw.value);
  if (!funcResult.ok) {
    return { ok: false, value: void 0, error: `Function schema validation failed: ${funcResult.error}` };
  }
  const func = funcResult.value;
  const buildResult = buildProfile();
  if (!buildResult.ok) {
    return { ok: false, value: void 0, error: `Failed to build profile: ${buildResult.error}` };
  }
  const profileRaw = readProfile();
  if (!profileRaw.ok) {
    return { ok: false, value: void 0, error: profileRaw.error };
  }
  const profileResult = validateProfile(profileRaw.value);
  if (!profileResult.ok) {
    return { ok: false, value: void 0, error: `Profile schema validation failed: ${profileResult.error}` };
  }
  const paramsRaw = readParameters();
  if (!paramsRaw.ok) {
    return { ok: false, value: void 0, error: paramsRaw.error };
  }
  const paramsResult = validateParameters(paramsRaw.value);
  if (!paramsResult.ok) {
    return { ok: false, value: void 0, error: `Parameters validation failed: ${paramsResult.error}` };
  }
  const parameters = paramsResult.value;
  if (parameters.depth === 0) {
    for (const task of func.tasks) {
      if (task.type !== "vector.completion") {
        return { ok: false, value: void 0, error: `All tasks must be vector.completion at depth 0, but found task of type: ${task.type}` };
      }
    }
  } else {
    for (const task of func.tasks) {
      if (task.type !== "scalar.function" && task.type !== "vector.function") {
        return { ok: false, value: void 0, error: `All tasks must be function tasks (scalar.function or vector.function) at depth > 0, but found task of type: ${task.type}` };
      }
    }
  }
  if (func.tasks.length < parameters.min_width) {
    return { ok: false, value: void 0, error: `Too few tasks: ${func.tasks.length} is below min_width of ${parameters.min_width}` };
  }
  if (func.tasks.length > parameters.max_width) {
    return { ok: false, value: void 0, error: `Too many tasks: ${func.tasks.length} exceeds max_width of ${parameters.max_width}` };
  }
  const file = readExampleInputsFile();
  if (!file.ok) {
    return { ok: false, value: void 0, error: `Unable to read inputs.json: ${file.error}` };
  }
  const inputs = [];
  for (let i = 0; i < file.value.length; i++) {
    const parsed = ExampleInputSchema.safeParse(file.value[i]);
    if (!parsed.success) {
      return { ok: false, value: void 0, error: `Example input [${i}] schema validation failed: ${parsed.error.message}` };
    }
    inputs.push(parsed.data);
  }
  if (inputs.length < 10 || inputs.length > 100) {
    return { ok: false, value: void 0, error: `Expected between 10 and 100 example inputs, but got ${inputs.length}` };
  }
  for (let i = 0; i < inputs.length; i++) {
    const { value, compiledTasks, outputLength } = inputs[i];
    const ctParsed = Functions.CompiledTasksSchema.safeParse(compiledTasks);
    if (!ctParsed.success) {
      return { ok: false, value: void 0, error: `Example input [${i}] compiledTasks schema validation failed: ${ctParsed.error.message}` };
    }
    if (!Functions.validateFunctionInput(func, value)) {
      return { ok: false, value: void 0, error: `Example input [${i}] value failed validation against function's input_schema: ${JSON.stringify(value)}` };
    }
    if (func.type === "scalar.function") {
      if (outputLength !== null) {
        return { ok: false, value: void 0, error: `Example input [${i}] outputLength must be null for scalar function` };
      }
    } else if (func.type === "vector.function") {
      if (outputLength === null) {
        return { ok: false, value: void 0, error: `Example input [${i}] outputLength must be non-null for vector function` };
      }
      if (typeof outputLength !== "number") {
        return { ok: false, value: void 0, error: `Example input [${i}] outputLength must be a number for vector function` };
      }
    }
  }
  for (let i = 0; i < inputs.length; i++) {
    const { value, compiledTasks: expectedCompiledTasks } = inputs[i];
    let compiledTasks;
    try {
      compiledTasks = Functions.compileFunctionTasks(func, value);
    } catch (e) {
      return { ok: false, value: void 0, error: `Example input [${i}] failed to compile tasks: ${e.message}` };
    }
    if (compiledTasks.length !== expectedCompiledTasks.length) {
      return { ok: false, value: void 0, error: `Example input [${i}] number of compiled tasks (${compiledTasks.length}) does not match expected (${expectedCompiledTasks.length})` };
    }
    for (let j = 0; j < compiledTasks.length; j++) {
      if (!compiledTasksEqual(compiledTasks[j], expectedCompiledTasks[j])) {
        return { ok: false, value: void 0, error: `Example input [${i}] compiled task [${j}] does not match.

Expected: ${JSON.stringify(expectedCompiledTasks[j])}

Got: ${JSON.stringify(compiledTasks[j])}` };
      }
    }
  }
  for (let i = 0; i < inputs.length; i++) {
    const { compiledTasks } = inputs[i];
    for (let j = 0; j < compiledTasks.length; j++) {
      const result = validateFunctionTaskInputs(compiledTasks[j], i, j);
      if (!result.ok) return result;
    }
  }
  if (func.type === "vector.function") {
    for (let i = 0; i < inputs.length; i++) {
      const { value, outputLength } = inputs[i];
      const compiledOutputLength = Functions.compileFunctionOutputLength(func, value);
      if (compiledOutputLength === null) {
        return { ok: false, value: void 0, error: `Example input [${i}] compiled output length is null for vector function` };
      }
      if (compiledOutputLength !== outputLength) {
        return { ok: false, value: void 0, error: `Example input [${i}] compiled output length (${compiledOutputLength}) does not match expected (${outputLength})` };
      }
      if (compiledOutputLength <= 1) {
        return { ok: false, value: void 0, error: `Example input [${i}] output length must be greater than 1 for vector function, got ${compiledOutputLength}` };
      }
      const inputSplit = Functions.compileFunctionInputSplit(func, value);
      if (inputSplit === null) {
        return { ok: false, value: void 0, error: `Example input [${i}] input split is null for vector function` };
      }
      for (let j = 0; j < inputSplit.length; j++) {
        const compiledSplitOutputLength = Functions.compileFunctionOutputLength(func, inputSplit[j]);
        if (compiledSplitOutputLength !== 1) {
          return { ok: false, value: void 0, error: `Example input [${i}] split input [${j}] output length must be 1, got ${compiledSplitOutputLength}` };
        }
      }
      const mergedOutput = Functions.compileFunctionInputMerge(func, inputSplit);
      if (mergedOutput === null) {
        return { ok: false, value: void 0, error: `Example input [${i}] merged output is null for vector function` };
      }
      const mergedOutputLength = Functions.compileFunctionOutputLength(func, mergedOutput);
      if (mergedOutputLength !== outputLength) {
        return { ok: false, value: void 0, error: `Example input [${i}] merged output length (${mergedOutputLength}) does not match expected (${outputLength})` };
      }
      if (!deepEqual(mergedOutput, value)) {
        return { ok: false, value: void 0, error: `Example input [${i}] merged input does not match original input.

Original: ${JSON.stringify(value)}

Merged: ${JSON.stringify(mergedOutput)}` };
      }
      const subsets = randomSubsets(inputSplit.length, 5);
      for (const subset of subsets) {
        const subSplits = subset.map((idx) => inputSplit[idx]);
        const merged = Functions.compileFunctionInputMerge(func, subSplits);
        if (merged === null) {
          return { ok: false, value: void 0, error: `Example input [${i}] input_merge returned null for subset [${subset.join(", ")}]` };
        }
        const mergedLen = Functions.compileFunctionOutputLength(func, merged);
        if (mergedLen !== subset.length) {
          return { ok: false, value: void 0, error: `Example input [${i}] merged subset [${subset.join(", ")}] output_length is ${mergedLen}, expected ${subset.length}` };
        }
      }
    }
  }
  const allValues = inputs.map((input) => input.value);
  const coverageResult = checkSchemaCoverage(func.input_schema, allValues, "input_schema");
  if (!coverageResult.ok) {
    return coverageResult;
  }
  const modalities = collectModalities(func.input_schema);
  if (modalities.size > 0) {
    const allCompiledTasks = inputs.flatMap((input) => input.compiledTasks);
    const found = /* @__PURE__ */ new Set();
    for (const ct of allCompiledTasks) {
      collectModalitiesFromCompiledTask(ct, found);
    }
    for (const modality of modalities) {
      if (!found.has(modality)) {
        return { ok: false, value: void 0, error: `Input schema declares "${modality}" modality but no compiled task across all example inputs contains a rich content part of that type. Add at least one example input that uses "${modality}" content.` };
      }
    }
  }
  return { ok: true, value: void 0, error: void 0 };
}
function validateTasks2(compiledTasks) {
  for (let i = 0; i < compiledTasks.length; i++) {
    const result = validateCompiledTaskContent(compiledTasks[i], i);
    if (!result.ok) return result;
  }
  return { ok: true, value: void 0, error: void 0 };
}
function validateCompiledTaskContent(ct, index) {
  if (ct === null) return { ok: true, value: void 0, error: void 0 };
  if (Array.isArray(ct)) {
    for (const sub of ct) {
      const result = validateCompiledTaskContent(sub, index);
      if (!result.ok) return result;
    }
    return { ok: true, value: void 0, error: void 0 };
  }
  if (ct.type !== "vector.completion") {
    return { ok: true, value: void 0, error: void 0 };
  }
  for (let j = 0; j < ct.messages.length; j++) {
    const msg = ct.messages[j];
    if ("content" in msg && msg.content != null && typeof msg.content === "string") {
      return {
        ok: false,
        value: void 0,
        error: `compiledTasks[${index}] messages[${j}] content must be an array of content parts, not a string`
      };
    }
  }
  for (let j = 0; j < ct.responses.length; j++) {
    if (typeof ct.responses[j] === "string") {
      return {
        ok: false,
        value: void 0,
        error: `compiledTasks[${index}] responses[${j}] must be an array of content parts, not a string`
      };
    }
  }
  return { ok: true, value: void 0, error: void 0 };
}
function validateFunctionTaskInputs(ct, inputIndex, taskIndex) {
  if (ct === null) return { ok: true, value: void 0, error: void 0 };
  if (Array.isArray(ct)) {
    for (let k = 0; k < ct.length; k++) {
      const result = validateFunctionTaskInputs(ct[k], inputIndex, taskIndex);
      if (!result.ok) return result;
    }
    return { ok: true, value: void 0, error: void 0 };
  }
  if (ct.type !== "scalar.function" && ct.type !== "vector.function") {
    return { ok: true, value: void 0, error: void 0 };
  }
  const dir = join("agent_functions", ct.repository);
  const subFn = readFunction(dir);
  if (!subFn.ok) {
    return { ok: false, value: void 0, error: `Example input [${inputIndex}] compiled task [${taskIndex}]: unable to read sub-function at ${dir}: ${subFn.error}` };
  }
  const subInputSchema = validateInputSchema(subFn.value);
  if (!subInputSchema.ok) {
    return { ok: false, value: void 0, error: `Example input [${inputIndex}] compiled task [${taskIndex}]: sub-function at ${dir} has invalid input_schema: ${subInputSchema.error}` };
  }
  const zodSchema = Functions.Expression.InputSchemaExt.toZodSchema(subInputSchema.value);
  const parsed = zodSchema.safeParse(ct.input);
  if (!parsed.success) {
    return {
      ok: false,
      value: void 0,
      error: `Example input [${inputIndex}] compiled task [${taskIndex}]: input does not match sub-function input_schema at ${dir}.

Input: ${JSON.stringify(ct.input)}

Expected schema: ${JSON.stringify(subInputSchema.value)}

Validation error: ${parsed.error.message}`
    };
  }
  return { ok: true, value: void 0, error: void 0 };
}
function checkSchemaCoverage(schema, values, path) {
  if ("anyOf" in schema) {
    for (let optIdx = 0; optIdx < schema.anyOf.length; optIdx++) {
      const option = schema.anyOf[optIdx];
      const optionZod = Functions.Expression.InputSchemaExt.toZodSchema(option);
      const matching = values.filter((v) => optionZod.safeParse(v).success);
      if (matching.length === 0) {
        return { ok: false, value: void 0, error: `${path}.anyOf[${optIdx}]: no example input matches this schema option` };
      }
      const result = checkSchemaCoverage(option, matching, `${path}.anyOf[${optIdx}]`);
      if (!result.ok) return result;
    }
  } else if (schema.type === "object") {
    const required = schema.required ?? [];
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const isRequired = required.includes(key);
      const presentValues = [];
      let absentCount = 0;
      for (const v of values) {
        if (typeof v === "object" && v !== null && !Array.isArray(v)) {
          const obj = v;
          if (key in obj) {
            presentValues.push(obj[key]);
          } else {
            absentCount++;
          }
        }
      }
      if (!isRequired) {
        if (presentValues.length === 0) {
          return { ok: false, value: void 0, error: `${path}.${key}: optional property is never present in any example input` };
        }
        if (absentCount === 0) {
          return { ok: false, value: void 0, error: `${path}.${key}: optional property is never absent in any example input` };
        }
      }
      if (presentValues.length > 0) {
        const result = checkSchemaCoverage(propSchema, presentValues, `${path}.${key}`);
        if (!result.ok) return result;
      }
    }
  } else if (schema.type === "array") {
    const effectiveMin = Math.max(0, schema.minItems ?? 0);
    const maxItems = schema.maxItems ?? null;
    const hasMin = values.some((v) => Array.isArray(v) && v.length === effectiveMin);
    if (!hasMin) {
      return { ok: false, value: void 0, error: `${path}: no example input has an array of length ${effectiveMin} (minItems)` };
    }
    if (effectiveMin <= 1 && (maxItems === null || maxItems >= 1)) {
      const hasOne = values.some((v) => Array.isArray(v) && v.length === 1);
      if (!hasOne) {
        return { ok: false, value: void 0, error: `${path}: no example input has an array of length 1` };
      }
    }
    const threshold = Math.max(3, effectiveMin);
    if (maxItems === null || maxItems > threshold) {
      const hasGreater = values.some((v) => Array.isArray(v) && v.length > threshold);
      if (!hasGreater) {
        return { ok: false, value: void 0, error: `${path}: no example input has an array of length greater than ${threshold}` };
      }
    }
    const allElements = [];
    for (const v of values) {
      if (Array.isArray(v)) {
        allElements.push(...v);
      }
    }
    if (allElements.length > 0) {
      const result = checkSchemaCoverage(schema.items, allElements, `${path}[]`);
      if (!result.ok) return result;
    }
  }
  return { ok: true, value: void 0, error: void 0 };
}
function randomSubsets(length, count) {
  if (length < 2) return [];
  const result = [];
  for (let c = 0; c < count; c++) {
    const size = 2 + Math.floor(Math.random() * (length - 2));
    const indices = Array.from({ length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    result.push(indices.slice(0, size).sort((a, b) => a - b));
  }
  return result;
}
function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return a === b;
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  if (Array.isArray(b)) return false;
  const aObj = a;
  const bObj = b;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => key in bObj && deepEqual(aObj[key], bObj[key]));
}
var MODALITY_PART_TYPES = {
  image: ["image_url"],
  audio: ["input_audio"],
  video: ["video_url", "input_video"],
  file: ["file"]
};
var ALL_MODALITIES = ["image", "audio", "video", "file"];
function collectModalities(schema) {
  const result = /* @__PURE__ */ new Set();
  collectModalitiesRecursive(schema, result);
  return result;
}
function collectModalitiesRecursive(schema, result) {
  if ("anyOf" in schema) {
    for (const option of schema.anyOf) {
      collectModalitiesRecursive(option, result);
    }
  } else if (schema.type === "object") {
    for (const propSchema of Object.values(schema.properties)) {
      collectModalitiesRecursive(propSchema, result);
    }
  } else if (schema.type === "array") {
    collectModalitiesRecursive(schema.items, result);
  } else if (ALL_MODALITIES.includes(schema.type)) {
    result.add(schema.type);
  }
}
function collectModalitiesFromCompiledTask(ct, found) {
  if (ct === null) return;
  if (Array.isArray(ct)) {
    for (const sub of ct) {
      collectModalitiesFromCompiledTask(sub, found);
    }
    return;
  }
  if (ct.type === "vector.completion") {
    collectModalitiesFromMessages(ct.messages, found);
    collectModalitiesFromResponses(ct.responses, found);
  } else {
    collectModalitiesFromInputValue(ct.input, found);
  }
}
function collectModalitiesFromMessages(messages, found) {
  for (const msg of messages) {
    if ("content" in msg && msg.content != null) {
      collectModalitiesFromRichContent(msg.content, found);
    }
  }
}
function collectModalitiesFromResponses(responses, found) {
  for (const resp of responses) {
    collectModalitiesFromRichContent(resp, found);
  }
}
function collectModalitiesFromRichContent(content, found) {
  if (typeof content === "string") return;
  for (const part of content) {
    checkPartType(part.type, found);
  }
}
function checkPartType(partType, found) {
  for (const modality of ALL_MODALITIES) {
    if (MODALITY_PART_TYPES[modality].includes(partType)) {
      found.add(modality);
    }
  }
}
function collectModalitiesFromInputValue(value, found) {
  if (typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) {
      collectModalitiesFromInputValue(item, found);
    }
    return;
  }
  if ("type" in value && typeof value.type === "string") {
    checkPartType(value.type, found);
  }
  for (const v of Object.values(value)) {
    if (v !== void 0) {
      collectModalitiesFromInputValue(v, found);
    }
  }
}
function compiledTasksEqual(a, b) {
  if (a === null) {
    return b === null;
  } else if (Array.isArray(a)) {
    return b !== null && Array.isArray(b) && a.length === b.length && a.every(
      (subTask, index) => compiledTasksEqual(subTask, b[index])
    );
  } else if (a.type === "scalar.function") {
    return b !== null && !Array.isArray(b) && b.type === "scalar.function" && b.owner === a.owner && b.repository === a.repository && b.commit === a.commit && JSON.stringify(a.input) === JSON.stringify(b.input);
  } else if (a.type === "vector.function") {
    return b !== null && !Array.isArray(b) && b.type === "vector.function" && b.owner === a.owner && b.repository === a.repository && b.commit === a.commit && JSON.stringify(a.input) === JSON.stringify(b.input);
  } else if (a.type === "vector.completion") {
    return b !== null && !Array.isArray(b) && b.type === "vector.completion" && JSON.stringify(a.messages) === JSON.stringify(b.messages) && JSON.stringify(a.responses) === JSON.stringify(b.responses) && a.tools === void 0 ? b.tools === void 0 : b.tools !== void 0 && a.tools.length === b.tools.length && a.tools.every(
      (tool30, index) => JSON.stringify(tool30) === JSON.stringify(
        b.tools[index]
      )
    );
  } else {
    return false;
  }
}

// src/messageQueue.ts
var MessageQueue = class {
  messages = [];
  waiter = null;
  onDrain;
  push(message) {
    this.messages.push(message);
    if (this.waiter) {
      const resolve = this.waiter;
      this.waiter = null;
      resolve();
    }
  }
  drain() {
    const drained = this.messages.splice(0);
    if (drained.length > 0 && this.onDrain) {
      this.onDrain(drained);
    }
    return drained;
  }
  get length() {
    return this.messages.length;
  }
  waitForMessage() {
    if (this.messages.length > 0) return Promise.resolve();
    return new Promise((resolve) => {
      this.waiter = resolve;
    });
  }
};

// src/tools/claude/toolState.ts
function formatReadList(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
function mustRead(flag, fieldName) {
  if (!flag) return `Read the ${fieldName} field before modifying it.`;
  return void 0;
}
function makeToolState(options) {
  return {
    spawnFunctionAgentsHasSpawned: false,
    editInputSchemaModalityRemovalRejected: false,
    runNetworkTestsApiBase: options.apiBase,
    runNetworkTestsApiKey: options.apiKey,
    readPlanIndex: options.readPlanIndex,
    writePlanIndex: options.writePlanIndex,
    submitApiBase: options.apiBase,
    submitApiKey: options.apiKey,
    gitUserName: options.gitUserName,
    gitUserEmail: options.gitUserEmail,
    ghToken: options.ghToken,
    minWidth: options.minWidth,
    maxWidth: options.maxWidth,
    hasReadOrWrittenSpec: false,
    hasReadOrWrittenEssay: false,
    hasReadOrWrittenEssayTasks: false,
    hasReadOrWrittenPlan: false,
    hasReadExampleFunctions: false,
    anyStepRan: false,
    hasReadType: isDefaultType(),
    hasReadDescription: isDefaultDescription(),
    hasReadInputSchema: isDefaultInputSchema(),
    hasReadInputMaps: isDefaultInputMaps(),
    hasReadTasks: isDefaultTasks(),
    hasReadOutputLength: isDefaultOutputLength(),
    hasReadInputSplit: isDefaultInputSplit(),
    hasReadInputMerge: isDefaultInputMerge(),
    hasReadExampleInputs: isDefaultExampleInputs(),
    hasReadReadme: isDefaultReadme(),
    onChildEvent: options.onChildEvent,
    messageQueue: new MessageQueue(),
    pendingAgentResults: null,
    activeChildren: /* @__PURE__ */ new Map()
  };
}

// src/claude/prepare/nameMcp.ts
function nameIsNonEmpty() {
  return existsSync("name.txt") && readFileSync("name.txt", "utf-8").trim().length > 0;
}
async function nameMcp(state, log, sessionId, name) {
  if (nameIsNonEmpty()) return sessionId;
  if (name) {
    writeName(name, state.ghToken);
    return sessionId;
  }
  const tools = [
    makeReadSpec(state),
    makeReadName(),
    makeWriteName(state),
    makeListExampleFunctions(state),
    makeReadExampleFunction(state),
    makeReadFunctionSchema()
  ];
  const mcpServer = createSdkMcpServer({ name: "name", tools });
  const reads = [];
  if (!state.hasReadOrWrittenSpec) reads.push("SPEC.md");
  if (!state.hasReadExampleFunctions) reads.push("example functions");
  const readPrefix = reads.length > 0 ? `Read ${formatReadList(reads)} to understand the context, then create` : "Create";
  sessionId = await consumeStream(
    query({
      prompt: `${readPrefix} name.txt with the function name.
**Do NOT include "objectiveai" or "function" or "scalar" or "vector" in the name.** Name it like you would name a function:
- Use all lowercase
- Use dashes (\`-\`) to separate words if there's more than one`,
      options: {
        tools: [],
        mcpServers: { name: mcpServer },
        allowedTools: ["mcp__name__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId
      }
    }),
    log,
    sessionId
  );
  let retry = 1;
  while (!nameIsNonEmpty()) {
    if (retry > 10) {
      throw new Error("name.txt is empty after name phase");
    }
    sessionId = await consumeStream(
      query({
        prompt: 'name.txt is empty after your name phase. Create name.txt with the function name.\n**Do NOT include "objectiveai" or "function" or "scalar" or "vector" in the name.** Name it like you would name a function:\n- Use all lowercase\n- Use dashes (`-`) to separate words if there\'s more than one',
        options: {
          tools: [],
          mcpServers: { name: mcpServer },
          allowedTools: ["mcp__name__*"],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId
        }
      }),
      log,
      sessionId
    );
    retry += 1;
  }
  state.anyStepRan = true;
  if (sessionId) writeSession(sessionId);
  return sessionId;
}
function makeReadEssay(state) {
  return tool("ReadEssay", "Read ESSAY.md", {}, async () => {
    state.hasReadOrWrittenEssay = true;
    return resultFromResult(readEssay());
  });
}
function makeWriteEssay(state) {
  return tool(
    "WriteEssay",
    "Write ESSAY.md",
    { content: z18.string() },
    async ({ content }) => {
      state.hasReadOrWrittenEssay = true;
      return resultFromResult(writeEssay(content));
    }
  );
}

// src/claude/prepare/essayMcp.ts
function essayIsNonEmpty() {
  return existsSync("ESSAY.md") && readFileSync("ESSAY.md", "utf-8").trim().length > 0;
}
async function essayMcp(state, log, sessionId) {
  if (essayIsNonEmpty()) return sessionId;
  const tools = [
    makeReadSpec(state),
    makeReadName(),
    makeWriteEssay(state),
    makeListExampleFunctions(state),
    makeReadExampleFunction(state),
    makeReadFunctionSchema()
  ];
  const mcpServer = createSdkMcpServer({ name: "essay", tools });
  const reads = [];
  if (!state.hasReadOrWrittenSpec) reads.push("SPEC.md");
  reads.push("name.txt");
  if (!state.hasReadExampleFunctions) reads.push("example functions");
  const readPrefix = reads.length > 0 ? `Read ${formatReadList(reads)} to understand the context. ` : "";
  const prompt = readPrefix + "Create ESSAY.md describing the ObjectiveAI Function you are building. Explore the purpose, inputs, outputs, and use-cases of the function in detail. Explore, in great detail, the various qualities, values, and sentiments that must be evaluated by the function. This essay will guide the development of the function and underpins its philosophy.";
  sessionId = await consumeStream(
    query({
      prompt,
      options: {
        tools: [],
        mcpServers: { essay: mcpServer },
        allowedTools: ["mcp__essay__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId
      }
    }),
    log,
    sessionId
  );
  let retry = 1;
  while (!essayIsNonEmpty()) {
    if (retry > 3) {
      throw new Error("ESSAY.md is empty after essay phase");
    }
    sessionId = await consumeStream(
      query({
        prompt: "ESSAY.md is empty after your essay phase. Create ESSAY.md describing the ObjectiveAI Function you are building. Explore the purpose, inputs, outputs, and use-cases of the function in detail. Explore, in great detail, the various qualities, values, and sentiments that must be evaluated by the function. This essay will guide the development of the function and underpins its philosophy.",
        options: {
          tools: [],
          mcpServers: { essay: mcpServer },
          allowedTools: ["mcp__essay__*"],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId
        }
      }),
      log,
      sessionId
    );
    retry += 1;
  }
  state.anyStepRan = true;
  if (sessionId) writeSession(sessionId);
  return sessionId;
}
function makeReadEssayTasks(state) {
  return tool(
    "ReadEssayTasks",
    "Read ESSAY_TASKS.md",
    {},
    async () => {
      state.hasReadOrWrittenEssayTasks = true;
      return resultFromResult(readEssayTasks());
    }
  );
}
function makeWriteEssayTasks(state) {
  return tool(
    "WriteEssayTasks",
    "Write ESSAY_TASKS.md",
    { content: z18.string() },
    async ({ content }) => {
      state.hasReadOrWrittenEssayTasks = true;
      return resultFromResult(writeEssayTasks(content));
    }
  );
}

// src/claude/prepare/essayTasksMcp.ts
function essayTasksIsNonEmpty() {
  return existsSync("ESSAY_TASKS.md") && readFileSync("ESSAY_TASKS.md", "utf-8").trim().length > 0;
}
async function essayTasksMcp(state, log, sessionId) {
  if (essayTasksIsNonEmpty()) return sessionId;
  const tools = [
    makeReadSpec(state),
    makeReadName(),
    makeReadEssay(state),
    makeWriteEssayTasks(state),
    makeListExampleFunctions(state),
    makeReadExampleFunction(state),
    makeReadFunctionSchema()
  ];
  const mcpServer = createSdkMcpServer({ name: "essayTasks", tools });
  const widthDesc = state.minWidth === state.maxWidth ? `exactly ${state.minWidth}` : `between ${state.minWidth} and ${state.maxWidth}`;
  const reads = [];
  if (!state.hasReadOrWrittenSpec) reads.push("SPEC.md");
  reads.push("name.txt");
  if (!state.hasReadOrWrittenEssay) reads.push("ESSAY.md");
  if (!state.hasReadExampleFunctions) reads.push("example functions");
  const readPrefix = reads.length > 0 ? `Read ${formatReadList(reads)} to understand the context, then create` : "Create";
  const prompt = `${readPrefix} ESSAY_TASKS.md listing and describing the key tasks the ObjectiveAI Function must perform in order to fulfill the quality, value, and sentiment evaluations defined within ESSAY.md. Each task is a plain language description of a task which will go into the function's \`tasks\` array. There must be ${widthDesc} tasks.`;
  sessionId = await consumeStream(
    query({
      prompt,
      options: {
        tools: [],
        mcpServers: { essayTasks: mcpServer },
        allowedTools: ["mcp__essayTasks__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId
      }
    }),
    log,
    sessionId
  );
  let retry = 1;
  while (!essayTasksIsNonEmpty()) {
    if (retry > 3) {
      throw new Error("ESSAY_TASKS.md is empty after essayTasks phase");
    }
    sessionId = await consumeStream(
      query({
        prompt: `ESSAY_TASKS.md is empty after your essayTasks phase. Create ESSAY_TASKS.md listing and describing the key tasks the ObjectiveAI Function must perform in order to fulfill the quality, value, and sentiment evaluations defined within ESSAY.md. Each task is a plain language description of a task which will go into the function's \`tasks\` array. There must be ${widthDesc} tasks.`,
        options: {
          tools: [],
          mcpServers: { essayTasks: mcpServer },
          allowedTools: ["mcp__essayTasks__*"],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId
        }
      }),
      log,
      sessionId
    );
    retry += 1;
  }
  state.anyStepRan = true;
  if (sessionId) writeSession(sessionId);
  return sessionId;
}

// src/claude/prepare/index.ts
async function runStep(state, log, sessionId, fn) {
  try {
    return await fn(sessionId);
  } catch (e) {
    if (!state.anyStepRan) {
      log("Session may be invalid, retrying without session...");
      return await fn(void 0);
    } else {
      throw e;
    }
  }
}
async function prepare(state, options) {
  const log = options.log;
  let sessionId = options.sessionId;
  log("=== Step 1: SPEC.md ===");
  sessionId = await runStep(
    state,
    log,
    sessionId,
    (sid) => specMcp(state, log, sid, options.spec)
  );
  log("=== Step 2: name.txt ===");
  sessionId = await runStep(
    state,
    log,
    sessionId,
    (sid) => nameMcp(state, log, sid, options.name)
  );
  log("=== Step 3: ESSAY.md ===");
  sessionId = await runStep(
    state,
    log,
    sessionId,
    (sid) => essayMcp(state, log, sid)
  );
  log("=== Step 4: ESSAY_TASKS.md ===");
  sessionId = await runStep(
    state,
    log,
    sessionId,
    (sid) => essayTasksMcp(state, log, sid)
  );
  return sessionId;
}
function clearDir(dir) {
  if (!existsSync(dir)) return;
  for (const file of readdirSync(dir)) {
    unlinkSync(join(dir, file));
  }
}
async function runNetworkTests(apiBase, apiKey) {
  const client = new ObjectiveAI({
    ...apiBase && { apiBase },
    ...apiKey && { apiKey }
  });
  const fnRaw = readFunction();
  if (!fnRaw.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to read function.json: ${fnRaw.error}`
    };
  }
  const funcResult = validateFunction(fnRaw.value);
  if (!funcResult.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Function validation failed: ${funcResult.error}`
    };
  }
  const func = funcResult.value;
  const buildResult = buildProfile();
  if (!buildResult.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Failed to build profile: ${buildResult.error}`
    };
  }
  const profileRaw = readProfile();
  if (!profileRaw.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to read profile.json: ${profileRaw.error}`
    };
  }
  const profileResult = validateProfile(profileRaw.value);
  if (!profileResult.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Profile validation failed: ${profileResult.error}`
    };
  }
  const profile = profileResult.value;
  const file = readExampleInputs();
  if (!file.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to read inputs.json: ${file.error}`
    };
  }
  const inputsResult = validateExampleInputs(file.value, fnRaw.value);
  if (!inputsResult.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Inputs validation failed: ${inputsResult.error}`
    };
  }
  const inputs = inputsResult.value;
  const defaultDir = join("network_tests", "default");
  const swissSystemDir = join("network_tests", "swisssystem");
  clearDir(defaultDir);
  clearDir(swissSystemDir);
  mkdirSync(defaultDir, { recursive: true });
  mkdirSync(swissSystemDir, { recursive: true });
  try {
    const promises = inputs.map(
      ({ value }) => Functions.Executions.inlineFunctionInlineProfileCreate(client, {
        input: value,
        function: func,
        profile,
        from_rng: true
      })
    );
    const results = await Promise.all(promises);
    for (let i = 0; i < inputs.length; i++) {
      const result = results[i];
      writeFileSync(join(defaultDir, `${i}.json`), JSON.stringify(result));
      if (result.error !== null) {
        return {
          ok: false,
          value: void 0,
          error: `Default strategy: execution failed for input [${i}]: ${JSON.stringify(result.error)}`
        };
      }
      if (result.tasks_errors) {
        return {
          ok: false,
          value: void 0,
          error: `Default strategy: task errors for input [${i}]`
        };
      }
    }
  } catch (e) {
    return {
      ok: false,
      value: void 0,
      error: `Default strategy: ${e.message}`
    };
  }
  if (func.type === "vector.function") {
    try {
      const promises = inputs.map(
        ({ value }) => Functions.Executions.inlineFunctionInlineProfileCreate(client, {
          input: value,
          function: func,
          profile,
          from_rng: true,
          strategy: { type: "swiss_system", pool: 2 }
        })
      );
      const results = await Promise.all(promises);
      for (let i = 0; i < inputs.length; i++) {
        const result = results[i];
        writeFileSync(
          join(swissSystemDir, `${i}.json`),
          JSON.stringify(result)
        );
        if (result.error !== null) {
          return {
            ok: false,
            value: void 0,
            error: `SwissSystem strategy: execution failed for input [${i}]: ${JSON.stringify(result.error)}`
          };
        }
        if (result.tasks_errors) {
          return {
            ok: false,
            value: void 0,
            error: `SwissSystem strategy: task errors for input [${i}]`
          };
        }
      }
    } catch (e) {
      return {
        ok: false,
        value: void 0,
        error: `SwissSystem strategy: ${e.message}`
      };
    }
  }
  return { ok: true, value: void 0, error: void 0 };
}
function readDefaultNetworkTest(index) {
  const filePath = join("network_tests", "default", `${index}.json`);
  if (!existsSync(filePath)) {
    return {
      ok: false,
      value: void 0,
      error: `File not found: ${filePath}`
    };
  }
  try {
    return {
      ok: true,
      value: JSON.parse(readFileSync(filePath, "utf-8")),
      error: void 0
    };
  } catch (e) {
    return {
      ok: false,
      value: void 0,
      error: `Failed to parse ${filePath}: ${e.message}`
    };
  }
}
function readSwissSystemNetworkTest(index) {
  const filePath = join("network_tests", "swisssystem", `${index}.json`);
  if (!existsSync(filePath)) {
    return {
      ok: false,
      value: void 0,
      error: `File not found: ${filePath}`
    };
  }
  try {
    return {
      ok: true,
      value: JSON.parse(readFileSync(filePath, "utf-8")),
      error: void 0
    };
  } catch (e) {
    return {
      ok: false,
      value: void 0,
      error: `Failed to parse ${filePath}: ${e.message}`
    };
  }
}

// src/tools/submit.ts
function ghEnv2(ghToken) {
  return { ...process.env, GH_TOKEN: ghToken };
}
function gh(args, ghToken) {
  return execSync(`gh ${args}`, { encoding: "utf-8", stdio: "pipe", env: ghEnv2(ghToken) }).trim();
}
function getUpstream() {
  try {
    return execSync("git remote get-url origin", {
      encoding: "utf-8",
      stdio: "pipe"
    }).trim();
  } catch {
    return null;
  }
}
function ensureGitHubRepo(name, description, ghToken) {
  const upstream = getUpstream();
  if (!upstream) {
    let cmd = `repo create ${name} --public --source=. --push`;
    if (description) {
      cmd += ` --description "${description.replace(/"/g, '\\"')}"`;
    }
    gh(cmd, ghToken);
  } else {
    const match = upstream.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (match) {
      const repo = `${match[1]}/${match[2]}`;
      if (description) {
        gh(
          `repo edit ${repo} --description "${description.replace(/"/g, '\\"')}"`,
          ghToken
        );
      }
    }
    execSync("git push", { stdio: "inherit", env: ghEnv2(ghToken) });
  }
}
async function submit(message, apiBase, apiKey, git, sessionId) {
  const profileBuild = buildProfile();
  if (!profileBuild.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Profile build failed: ${profileBuild.error}

Fix the function definition first.`
    };
  }
  const fnCheck = checkFunction();
  if (!fnCheck.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Function check failed: ${fnCheck.error}

Use the CheckFunction tool to see detailed errors and fix them.`
    };
  }
  const inputsCheck = checkExampleInputs();
  if (!inputsCheck.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Example inputs check failed: ${inputsCheck.error}

Use the CheckExampleInputs tool to see detailed errors and fix them.`
    };
  }
  const testsResult = await runNetworkTests(apiBase, apiKey);
  if (!testsResult.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Network tests failed: ${testsResult.error}

Use the ReadDefaultNetworkTest and ReadSwissSystemNetworkTest tools to read individual test results for more details, each ExampleInput has one.`
    };
  }
  const readmeResult = readReadme();
  if (!readmeResult.ok || !readmeResult.value.trim()) {
    return {
      ok: false,
      value: void 0,
      error: "README.md is missing or empty. Use the WriteReadme tool to create it."
    };
  }
  const descCheck = checkDescription();
  if (!descCheck.ok) {
    return {
      ok: false,
      value: void 0,
      error: `${descCheck.error}

Use the EditDescription tool to fix it.`
    };
  }
  const descResult = readDescription();
  const description = descResult.ok && typeof descResult.value === "string" ? descResult.value : "";
  const nameResult = readName();
  if (!nameResult.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to read name.txt: ${nameResult.error}`
    };
  }
  const name = nameResult.value.trim();
  if (sessionId) writeSession(sessionId);
  execSync("git add -A", { stdio: "pipe" });
  try {
    execSync("git diff --cached --quiet", { stdio: "pipe" });
  } catch {
    const commitEnv = {
      ...process.env,
      ...git?.userName && { GIT_AUTHOR_NAME: git.userName, GIT_COMMITTER_NAME: git.userName },
      ...git?.userEmail && { GIT_AUTHOR_EMAIL: git.userEmail, GIT_COMMITTER_EMAIL: git.userEmail }
    };
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      stdio: "inherit",
      env: commitEnv
    });
  }
  const ghToken = git?.ghToken ?? process.env.GH_TOKEN ?? "";
  try {
    ensureGitHubRepo(name, description, ghToken);
  } catch (e) {
    return {
      ok: false,
      value: void 0,
      error: `Git push failed: ${e.message}`
    };
  }
  const commit = execSync("git rev-parse HEAD", {
    encoding: "utf-8",
    stdio: "pipe"
  }).trim();
  return { ok: true, value: commit, error: void 0 };
}
var registered = false;
function registerSchemaRefs() {
  if (registered) return;
  registered = true;
  registerLazyRef(JsonValueSchema, "ReadJsonValueSchema");
  registerLazyRef(JsonValueExpressionSchema, "ReadJsonValueExpressionSchema");
  registerLazyRef(Functions.Expression.InputValueSchema, "ReadInputValueSchema");
  registerLazyRef(Functions.Expression.InputValueExpressionSchema, "ReadInputValueExpressionSchema");
  registerLazyRef(readInputSchemaSchema(), "ReadInputSchemaSchema");
  const scalarPropertyRefs = {
    type: "ReadTypeSchema",
    description: "ReadDescriptionSchema",
    input_schema: "ReadInputSchemaSchema",
    input_maps: "ReadInputMapsSchema",
    tasks: "ReadTasksSchema"
  };
  const vectorPropertyRefs = {
    ...scalarPropertyRefs,
    output_length: "ReadOutputLengthSchema",
    input_split: "ReadInputSplitSchema",
    input_merge: "ReadInputMergeSchema"
  };
  registerPropertyRefs(Functions.RemoteScalarFunctionSchema, scalarPropertyRefs);
  registerPropertyRefs(Functions.RemoteVectorFunctionSchema, vectorPropertyRefs);
  registerPropertyRefs(Functions.VectorCompletionTaskExpressionSchema, {
    messages: "ReadMessagesExpressionSchema",
    tools: "ReadToolsExpressionSchema",
    responses: "ReadResponsesExpressionSchema"
  });
  const functionTaskInputRef = { input: "ReadInputValueExpressionSchema" };
  registerPropertyRefs(Functions.ScalarFunctionTaskExpressionSchema, functionTaskInputRef);
  registerPropertyRefs(Functions.VectorFunctionTaskExpressionSchema, functionTaskInputRef);
  const Request3 = Chat.Completions.Request;
  registerSchemaRef(Request3.DeveloperMessageExpressionSchema, "ReadDeveloperMessageExpressionSchema");
  registerSchemaRef(Request3.SystemMessageExpressionSchema, "ReadSystemMessageExpressionSchema");
  registerSchemaRef(Request3.UserMessageExpressionSchema, "ReadUserMessageExpressionSchema");
  registerSchemaRef(Request3.ToolMessageExpressionSchema, "ReadToolMessageExpressionSchema");
  registerSchemaRef(Request3.AssistantMessageExpressionSchema, "ReadAssistantMessageExpressionSchema");
  registerSchemaRef(Request3.SimpleContentExpressionSchema, "ReadSimpleContentExpressionSchema");
  registerSchemaRef(Request3.RichContentExpressionSchema, "ReadRichContentExpressionSchema");
  registerSchemaRef(Functions.ScalarFunctionTaskExpressionSchema, "ReadScalarFunctionTaskSchema");
  registerSchemaRef(Functions.VectorFunctionTaskExpressionSchema, "ReadVectorFunctionTaskSchema");
  registerSchemaRef(Functions.VectorCompletionTaskExpressionSchema, "ReadVectorCompletionTaskSchema");
  registerSchemaRef(Request3.DeveloperMessageSchema, "ReadDeveloperMessageSchema");
  registerSchemaRef(Request3.SystemMessageSchema, "ReadSystemMessageSchema");
  registerSchemaRef(Request3.UserMessageSchema, "ReadUserMessageSchema");
  registerSchemaRef(Request3.ToolMessageSchema, "ReadToolMessageSchema");
  registerSchemaRef(Request3.AssistantMessageSchema, "ReadAssistantMessageSchema");
  registerSchemaRef(Request3.SimpleContentSchema, "ReadSimpleContentSchema");
  registerSchemaRef(Request3.RichContentSchema, "ReadRichContentSchema");
  registerSchemaRef(Functions.ScalarFunctionTaskSchema, "ReadCompiledScalarFunctionTaskSchema");
  registerSchemaRef(Functions.VectorFunctionTaskSchema, "ReadCompiledVectorFunctionTaskSchema");
  registerSchemaRef(Functions.VectorCompletionTaskSchema, "ReadCompiledVectorCompletionTaskSchema");
  const compiledFunctionTaskInputRef = { input: "ReadInputValueSchema" };
  registerPropertyRefs(Functions.ScalarFunctionTaskSchema, compiledFunctionTaskInputRef);
  registerPropertyRefs(Functions.VectorFunctionTaskSchema, compiledFunctionTaskInputRef);
}

// src/tools/expressionParams/index.ts
var expressionParams_exports = {};
__export(expressionParams_exports, {
  readInputParamSchema: () => readInputParamSchema,
  readMapParamSchema: () => readMapParamSchema,
  readOutputParamSchema: () => readOutputParamSchema
});
function readInputParamSchema() {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: void 0, error: fn.error };
  }
  const validated = validateInputSchema(fn.value);
  if (!validated.ok) {
    return {
      ok: false,
      value: void 0,
      error: `input_schema must be defined before reading the input parameter schema: ${validated.error}`
    };
  }
  const zodSchema = Functions.Expression.InputSchemaExt.toZodSchema(
    validated.value
  );
  return { ok: true, value: zodSchema, error: void 0 };
}
function readMapParamSchema() {
  return Functions.Expression.InputMapsAsParameterSchema;
}
function readOutputParamSchema() {
  return Functions.Expression.TaskOutputSchema;
}

// src/tools/claude/expressionParams.ts
function makeReadInputParamSchema(state) {
  return tool(
    "ReadInputParamSchema",
    "Read the schema for `input` available in expression context.",
    {},
    async () => {
      const result = readInputParamSchema();
      if (!result.ok) {
        return resultFromResult(result);
      }
      return textResult(formatZodSchema(result.value));
    }
  );
}
function makeReadMapParamSchema(state) {
  return tool(
    "ReadMapParamSchema",
    "Read the schema for `map` available in mapped task expression context. For a task with `map: i`, the task is compiled once per element in `input_maps[i]`. Each compiled instance receives the current element as `map`.",
    {},
    async () => textResult(formatZodSchema(readMapParamSchema()))
  );
}
function makeReadOutputParamSchema(state) {
  return tool(
    "ReadOutputParamSchema",
    "Read the schema for `output` available in task output expression context.",
    {},
    async () => textResult(formatZodSchema(readOutputParamSchema()))
  );
}
function makeReadType(state) {
  return tool("ReadType", "Read the Function's `type` field", {}, async () => {
    state.hasReadType = true;
    return resultFromResult(readType());
  });
}
function makeReadTypeSchema(state) {
  return tool(
    "ReadTypeSchema",
    "Read the schema for Function `type` field",
    {},
    async () => textResult(formatZodSchema(readTypeSchema()))
  );
}
function makeEditType(state) {
  return tool(
    "EditType",
    "Edit the Function's `type` field",
    { value: z18.string() },
    async ({ value }) => {
      const err = mustRead(state.hasReadType, "type");
      if (err) return errorResult(err);
      return resultFromResult(editType(value));
    }
  );
}
function makeCheckType(state) {
  return tool(
    "CheckType",
    "Validate the Function's `type` field",
    {},
    async () => resultFromResult(checkType())
  );
}
function makeReadDescription(state) {
  return tool(
    "ReadDescription",
    "Read the Function's `description` field",
    {},
    async () => {
      state.hasReadDescription = true;
      return resultFromResult(readDescription());
    }
  );
}
function makeReadDescriptionSchema(state) {
  return tool(
    "ReadDescriptionSchema",
    "Read the schema for Function `description` field",
    {},
    async () => textResult(formatZodSchema(readDescriptionSchema()))
  );
}
function makeEditDescription(state) {
  return tool(
    "EditDescription",
    "Edit the Function's `description` field",
    { value: z18.string() },
    async ({ value }) => {
      const err = mustRead(state.hasReadDescription, "description");
      if (err) return errorResult(err);
      return resultFromResult(editDescription(value));
    }
  );
}
function makeCheckDescription(state) {
  return tool(
    "CheckDescription",
    "Validate the Function's `description` field",
    {},
    async () => resultFromResult(checkDescription())
  );
}
function makeReadInputSchema(state) {
  return tool(
    "ReadInputSchema",
    "Read the Function's `input_schema` field",
    {},
    async () => {
      state.hasReadInputSchema = true;
      return resultFromResult(readInputSchema());
    }
  );
}
function makeReadInputSchemaSchema(state) {
  return tool(
    "ReadInputSchemaSchema",
    "Read the schema for Function `input_schema` field",
    {},
    async () => textResult(formatZodSchema(readInputSchemaSchema()))
  );
}
function makeEditInputSchema(state) {
  return tool(
    "EditInputSchema",
    "Edit the Function's `input_schema` field. If the new schema removes multimodal types present in the current schema, you must pass `dangerouslyRemoveModalities: true` \u2014 but only after re-reading SPEC.md to confirm this does not contradict it.",
    {
      value: z18.record(z18.string(), z18.unknown()),
      dangerouslyRemoveModalities: z18.boolean().optional()
    },
    async ({ value, dangerouslyRemoveModalities }) => {
      const readErr = mustRead(state.hasReadInputSchema, "input_schema");
      if (readErr) return errorResult(readErr);
      if (dangerouslyRemoveModalities) {
        if (!state.editInputSchemaModalityRemovalRejected) {
          return resultFromResult({
            ok: false,
            value: void 0,
            error: "dangerouslyRemoveModalities can only be used after a previous EditInputSchema call was rejected for removing modalities."
          });
        }
        state.editInputSchemaModalityRemovalRejected = false;
        return resultFromResult(editInputSchema(value));
      }
      const current = readInputSchema();
      if (current.ok && current.value) {
        const currentParsed = validateInputSchema({ input_schema: current.value });
        const newParsed = validateInputSchema({ input_schema: value });
        if (currentParsed.ok && newParsed.ok) {
          const oldModalities = collectModalities(currentParsed.value);
          const newModalities = collectModalities(newParsed.value);
          const removed = [];
          for (const m of oldModalities) {
            if (!newModalities.has(m)) {
              removed.push(m);
            }
          }
          if (removed.length > 0) {
            state.editInputSchemaModalityRemovalRejected = true;
            return resultFromResult({
              ok: false,
              value: void 0,
              error: `This edit would remove multimodal types: ${removed.join(", ")}. Re-read SPEC.md and confirm this does not contradict it. If SPEC.md allows removing these modalities, call EditInputSchema again with dangerouslyRemoveModalities: true.`
            });
          }
        }
      }
      state.editInputSchemaModalityRemovalRejected = false;
      return resultFromResult(editInputSchema(value));
    }
  );
}
function makeCheckInputSchema(state) {
  return tool(
    "CheckInputSchema",
    "Validate the Function's `input_schema` field",
    {},
    async () => resultFromResult(checkInputSchema())
  );
}
function makeReadInputMaps(state) {
  return tool(
    "ReadInputMaps",
    "Read the Function's `input_maps` field",
    {},
    async () => {
      state.hasReadInputMaps = true;
      return resultFromResult(readInputMaps());
    }
  );
}
function makeReadInputMapsSchema(state) {
  return tool(
    "ReadInputMapsSchema",
    "Read the schema for Function `input_maps` field",
    {},
    async () => textResult(formatZodSchema(readInputMapsSchema()))
  );
}
function makeAppendInputMap(state) {
  return tool(
    "AppendInputMap",
    "Append an input map to the Function's `input_maps` array",
    { value: z18.unknown() },
    async ({ value }) => {
      const err = mustRead(state.hasReadInputMaps, "input_maps");
      if (err) return errorResult(err);
      return resultFromResult(appendInputMap(value));
    }
  );
}
function makeDelInputMap(state) {
  return tool(
    "DelInputMap",
    "Delete an input map at a specific index from the Function's `input_maps` array",
    { index: z18.int().nonnegative() },
    async ({ index }) => {
      const err = mustRead(state.hasReadInputMaps, "input_maps");
      if (err) return errorResult(err);
      return resultFromResult(delInputMap(index));
    }
  );
}
function makeDelInputMaps(state) {
  return tool(
    "DelInputMaps",
    "Delete the Function's `input_maps` field",
    {},
    async () => {
      const err = mustRead(state.hasReadInputMaps, "input_maps");
      if (err) return errorResult(err);
      return resultFromResult(delInputMaps());
    }
  );
}
function makeCheckInputMaps(state) {
  return tool(
    "CheckInputMaps",
    "Validate the Function's `input_maps` field",
    {},
    async () => resultFromResult(checkInputMaps())
  );
}
function makeReadOutputLength(state) {
  return tool(
    "ReadOutputLength",
    "Read the Function's `output_length` field",
    {},
    async () => {
      state.hasReadOutputLength = true;
      return resultFromResult(readOutputLength());
    }
  );
}
function makeReadOutputLengthSchema(state) {
  return tool(
    "ReadOutputLengthSchema",
    "Read the schema for Function `output_length` field",
    {},
    async () => textResult(formatZodSchema(readOutputLengthSchema()))
  );
}
function makeEditOutputLength(state) {
  return tool(
    "EditOutputLength",
    "Edit the Function's `output_length` field",
    { value: z18.unknown().nullable() },
    async ({ value }) => {
      const err = mustRead(state.hasReadOutputLength, "output_length");
      if (err) return errorResult(err);
      return resultFromResult(editOutputLength(value));
    }
  );
}
function makeDelOutputLength(state) {
  return tool(
    "DelOutputLength",
    "Delete the Function's `output_length` field",
    {},
    async () => {
      const err = mustRead(state.hasReadOutputLength, "output_length");
      if (err) return errorResult(err);
      return resultFromResult(delOutputLength());
    }
  );
}
function makeCheckOutputLength(state) {
  return tool(
    "CheckOutputLength",
    "Validate the Function's `output_length` field",
    {},
    async () => resultFromResult(checkOutputLength())
  );
}
function makeReadInputSplit(state) {
  return tool(
    "ReadInputSplit",
    "Read the Function's `input_split` field",
    {},
    async () => {
      state.hasReadInputSplit = true;
      return resultFromResult(readInputSplit());
    }
  );
}
function makeReadInputSplitSchema(state) {
  return tool(
    "ReadInputSplitSchema",
    "Read the schema for Function `input_split` field. Splits the input into sub-inputs (one per output element). Array length must equal output_length. Each sub-input, when executed alone, must produce output_length=1. Used by strategies like swiss_system for parallel pool execution.",
    {},
    async () => textResult(formatZodSchema(readInputSplitSchema()))
  );
}
function makeEditInputSplit(state) {
  return tool(
    "EditInputSplit",
    "Edit the Function's `input_split` field",
    { value: z18.unknown().nullable() },
    async ({ value }) => {
      const err = mustRead(state.hasReadInputSplit, "input_split");
      if (err) return errorResult(err);
      return resultFromResult(editInputSplit(value));
    }
  );
}
function makeDelInputSplit(state) {
  return tool(
    "DelInputSplit",
    "Delete the Function's `input_split` field",
    {},
    async () => {
      const err = mustRead(state.hasReadInputSplit, "input_split");
      if (err) return errorResult(err);
      return resultFromResult(delInputSplit());
    }
  );
}
function makeCheckInputSplit(state) {
  return tool(
    "CheckInputSplit",
    "Validate the Function's `input_split` field",
    {},
    async () => resultFromResult(checkInputSplit())
  );
}
function makeReadInputMerge(state) {
  return tool(
    "ReadInputMerge",
    "Read the Function's `input_merge` field",
    {},
    async () => {
      state.hasReadInputMerge = true;
      return resultFromResult(readInputMerge());
    }
  );
}
function makeReadInputMergeSchema(state) {
  return tool(
    "ReadInputMergeSchema",
    "Read the schema for Function `input_merge` field. Recombines a variable-size, arbitrarily-ordered subset of sub-inputs (from input_split) back into a single input. Receives `input` as an array of sub-inputs. Used by strategies like swiss_system for parallel pool execution.",
    {},
    async () => textResult(formatZodSchema(readInputMergeSchema()))
  );
}
function makeEditInputMerge(state) {
  return tool(
    "EditInputMerge",
    "Edit the Function's `input_merge` field",
    { value: z18.unknown().nullable() },
    async ({ value }) => {
      const err = mustRead(state.hasReadInputMerge, "input_merge");
      if (err) return errorResult(err);
      return resultFromResult(editInputMerge(value));
    }
  );
}
function makeDelInputMerge(state) {
  return tool(
    "DelInputMerge",
    "Delete the Function's `input_merge` field",
    {},
    async () => {
      const err = mustRead(state.hasReadInputMerge, "input_merge");
      if (err) return errorResult(err);
      return resultFromResult(delInputMerge());
    }
  );
}
function makeCheckInputMerge(state) {
  return tool(
    "CheckInputMerge",
    "Validate the Function's `input_merge` field",
    {},
    async () => resultFromResult(checkInputMerge())
  );
}
function makeReadTasks(state) {
  return tool(
    "ReadTasks",
    "Read the Function's `tasks` field",
    {},
    async () => {
      state.hasReadTasks = true;
      return resultFromResult(readTasks());
    }
  );
}
function makeReadTasksSchema(state) {
  return tool(
    "ReadTasksSchema",
    "Read the schema for Function `tasks` field",
    {},
    async () => textResult(formatZodSchema(readTasksSchema()))
  );
}
function makeAppendTask(state) {
  return tool(
    "AppendTask",
    "Append a task to the Function's `tasks` array",
    { value: z18.record(z18.string(), z18.unknown()) },
    async ({ value }) => {
      const err = mustRead(state.hasReadTasks, "tasks");
      if (err) return errorResult(err);
      return resultFromResult(appendTask(value));
    }
  );
}
function makeEditTask(state) {
  return tool(
    "EditTask",
    "Replace a task at a specific index in the Function's `tasks` array",
    {
      index: z18.number().int().nonnegative(),
      value: z18.record(z18.string(), z18.unknown())
    },
    async ({ index, value }) => {
      const err = mustRead(state.hasReadTasks, "tasks");
      if (err) return errorResult(err);
      return resultFromResult(editTask(index, value));
    }
  );
}
function makeDelTask(state) {
  return tool(
    "DelTask",
    "Delete a task at a specific index from the Function's `tasks` array",
    { index: z18.int().nonnegative() },
    async ({ index }) => {
      const err = mustRead(state.hasReadTasks, "tasks");
      if (err) return errorResult(err);
      return resultFromResult(delTask(index));
    }
  );
}
function makeDelTasks(state) {
  return tool(
    "DelTasks",
    "Delete all tasks from the Function's `tasks` array",
    {},
    async () => {
      const err = mustRead(state.hasReadTasks, "tasks");
      if (err) return errorResult(err);
      return resultFromResult(delTasks());
    }
  );
}
function makeCheckTasks(state) {
  return tool(
    "CheckTasks",
    "Validate the Function's `tasks` field",
    {},
    async () => resultFromResult(checkTasks())
  );
}
function makeReadMessagesExpressionSchema(state) {
  return tool(
    "ReadMessagesExpressionSchema",
    "Read the schema for the `messages` field of a vector.completion task",
    {},
    async () => textResult(formatZodSchema(readMessagesSchema()))
  );
}
function makeReadToolsExpressionSchema(state) {
  return tool(
    "ReadToolsExpressionSchema",
    "Read the schema for the `tools` field of a vector.completion task",
    {},
    async () => textResult(formatZodSchema(readToolsSchema()))
  );
}
function makeReadResponsesExpressionSchema(state) {
  return tool(
    "ReadResponsesExpressionSchema",
    "Read the schema for the `responses` field of a vector.completion task",
    {},
    async () => textResult(formatZodSchema(readResponsesSchema()))
  );
}
function buildExampleInput(value) {
  const fnRaw = readFunction();
  if (!fnRaw.ok) return { ok: false, error: fnRaw.error };
  const funcResult = validateFunction(fnRaw.value);
  if (!funcResult.ok) return { ok: false, error: funcResult.error };
  const func = funcResult.value;
  let compiledTasks;
  try {
    compiledTasks = Functions.compileFunctionTasks(func, value);
  } catch (e) {
    return {
      ok: false,
      error: `Failed to compile tasks: ${e.message}`
    };
  }
  const outputLength = func.type === "vector.function" ? Functions.compileFunctionOutputLength(func, value) : null;
  return { ok: true, value: { value, compiledTasks, outputLength } };
}
function makeReadExampleInput(state) {
  return tool(
    "ReadExampleInput",
    "Read a single example input at a specific index from the Function's example inputs array",
    { index: z18.number().int().nonnegative() },
    async ({ index }) => {
      state.hasReadExampleInputs = true;
      return resultFromResult(readExampleInput(index));
    }
  );
}
function makeReadExampleInputs(state) {
  return tool(
    "ReadExampleInputs",
    "Read the Function's example inputs",
    {},
    async () => {
      state.hasReadExampleInputs = true;
      return resultFromResult(readExampleInputs());
    }
  );
}
function makeReadExampleInputsSchema(state) {
  return tool(
    "ReadExampleInputsSchema",
    "Read the schema for Function example inputs",
    {},
    async () => {
      const result = readExampleInputsSchema();
      if (!result.ok) {
        return resultFromResult(result);
      }
      return textResult(formatZodSchema(result.value));
    }
  );
}
function makeAppendExampleInput(state) {
  return tool(
    "AppendExampleInput",
    "Append an example input to the Function's example inputs array. Provide just the input value \u2014 compiledTasks and outputLength are computed automatically.",
    { value: Functions.Expression.InputValueSchema },
    async ({ value }) => {
      const err = mustRead(state.hasReadExampleInputs, "example inputs");
      if (err) return errorResult(err);
      const built = buildExampleInput(value);
      if (!built.ok) return errorResult(built.error);
      return resultFromResult(appendExampleInput(built.value));
    }
  );
}
function makeEditExampleInput(state) {
  return tool(
    "EditExampleInput",
    "Replace an example input at a specific index in the Function's example inputs array. Provide just the input value \u2014 compiledTasks and outputLength are computed automatically.",
    {
      index: z18.number().int().nonnegative(),
      value: Functions.Expression.InputValueSchema
    },
    async ({ index, value }) => {
      const err = mustRead(state.hasReadExampleInputs, "example inputs");
      if (err) return errorResult(err);
      const built = buildExampleInput(value);
      if (!built.ok) return errorResult(built.error);
      return resultFromResult(editExampleInput(index, built.value));
    }
  );
}
function makeDelExampleInput(state) {
  return tool(
    "DelExampleInput",
    "Delete an example input at a specific index from the Function's example inputs array",
    { index: z18.number().int().nonnegative() },
    async ({ index }) => {
      const err = mustRead(state.hasReadExampleInputs, "example inputs");
      if (err) return errorResult(err);
      return resultFromResult(delExampleInput(index));
    }
  );
}
function makeDelExampleInputs(state) {
  return tool(
    "DelExampleInputs",
    "Delete all example inputs from the Function's example inputs array",
    {},
    async () => {
      const err = mustRead(state.hasReadExampleInputs, "example inputs");
      if (err) return errorResult(err);
      return resultFromResult(delExampleInputs());
    }
  );
}
function makeCheckExampleInputs(state) {
  return tool(
    "CheckExampleInputs",
    "Validate the Function's example inputs",
    {},
    async () => resultFromResult(checkExampleInputs())
  );
}
function makeReadPlan(state) {
  return tool(
    "ReadPlan",
    "Read the plan",
    {},
    async () => {
      state.hasReadOrWrittenPlan = true;
      return resultFromResult(readPlan(state.readPlanIndex));
    }
  );
}
function makeWritePlan(state) {
  return tool(
    "WritePlan",
    "Write the plan",
    { content: z18.string() },
    async ({ content }) => {
      state.hasReadOrWrittenPlan = true;
      return resultFromResult(writePlan(state.writePlanIndex, content));
    }
  );
}
function makeRunNetworkTests(state) {
  return tool(
    "RunNetworkTests",
    "Execute the function once for each example input and write results to network_tests/",
    {},
    async () => resultFromResult(await runNetworkTests(state.runNetworkTestsApiBase, state.runNetworkTestsApiKey))
  );
}
function makeReadDefaultNetworkTest(state) {
  return tool(
    "ReadDefaultNetworkTest",
    "Read a default strategy network test result by index",
    { index: z18.number().int().nonnegative() },
    async ({ index }) => resultFromResult(readDefaultNetworkTest(index))
  );
}
function makeReadSwissSystemNetworkTest(state) {
  return tool(
    "ReadSwissSystemNetworkTest",
    "Read a swiss_system strategy network test result by index",
    { index: z18.number().int().nonnegative() },
    async ({ index }) => resultFromResult(readSwissSystemNetworkTest(index))
  );
}
function makeReadJsonValueSchema(state) {
  return tool(
    "ReadJsonValueSchema",
    "Read the schema for the JsonValue type (recursive)",
    {},
    async () => textResult(formatZodSchema(JsonValueSchema, { resolveLazy: true }))
  );
}
function makeReadJsonValueExpressionSchema(state) {
  return tool(
    "ReadJsonValueExpressionSchema",
    "Read the schema for the JsonValueExpression type (recursive, supports expressions)",
    {},
    async () => textResult(formatZodSchema(JsonValueExpressionSchema, { resolveLazy: true }))
  );
}
function makeReadInputValueSchema(state) {
  return tool(
    "ReadInputValueSchema",
    "Read the schema for the InputValue type (recursive, supports media)",
    {},
    async () => textResult(formatZodSchema(Functions.Expression.InputValueSchema, { resolveLazy: true }))
  );
}
function makeReadInputValueExpressionSchema(state) {
  return tool(
    "ReadInputValueExpressionSchema",
    "Read the schema for the InputValueExpression type (recursive, supports media and expressions)",
    {},
    async () => textResult(formatZodSchema(Functions.Expression.InputValueExpressionSchema, { resolveLazy: true }))
  );
}
var Request = Chat.Completions.Request;
function makeReadDeveloperMessageSchema(state) {
  return tool(
    "ReadDeveloperMessageSchema",
    "Read the schema for a compiled developer message (role: developer)",
    {},
    async () => textResult(formatZodSchema(Request.DeveloperMessageSchema))
  );
}
function makeReadSystemMessageSchema(state) {
  return tool(
    "ReadSystemMessageSchema",
    "Read the schema for a compiled system message (role: system)",
    {},
    async () => textResult(formatZodSchema(Request.SystemMessageSchema))
  );
}
function makeReadUserMessageSchema(state) {
  return tool(
    "ReadUserMessageSchema",
    "Read the schema for a compiled user message (role: user)",
    {},
    async () => textResult(formatZodSchema(Request.UserMessageSchema))
  );
}
function makeReadToolMessageSchema(state) {
  return tool(
    "ReadToolMessageSchema",
    "Read the schema for a compiled tool message (role: tool)",
    {},
    async () => textResult(formatZodSchema(Request.ToolMessageSchema))
  );
}
function makeReadAssistantMessageSchema(state) {
  return tool(
    "ReadAssistantMessageSchema",
    "Read the schema for a compiled assistant message (role: assistant)",
    {},
    async () => textResult(formatZodSchema(Request.AssistantMessageSchema))
  );
}
function makeReadDeveloperMessageExpressionSchema(state) {
  return tool(
    "ReadDeveloperMessageExpressionSchema",
    "Read the schema for a developer message expression (role: developer, supports $starlark/$jmespath)",
    {},
    async () => textResult(formatZodSchema(Request.DeveloperMessageExpressionSchema))
  );
}
function makeReadSystemMessageExpressionSchema(state) {
  return tool(
    "ReadSystemMessageExpressionSchema",
    "Read the schema for a system message expression (role: system, supports $starlark/$jmespath)",
    {},
    async () => textResult(formatZodSchema(Request.SystemMessageExpressionSchema))
  );
}
function makeReadUserMessageExpressionSchema(state) {
  return tool(
    "ReadUserMessageExpressionSchema",
    "Read the schema for a user message expression (role: user, supports $starlark/$jmespath)",
    {},
    async () => textResult(formatZodSchema(Request.UserMessageExpressionSchema))
  );
}
function makeReadToolMessageExpressionSchema(state) {
  return tool(
    "ReadToolMessageExpressionSchema",
    "Read the schema for a tool message expression (role: tool, supports $starlark/$jmespath)",
    {},
    async () => textResult(formatZodSchema(Request.ToolMessageExpressionSchema))
  );
}
function makeReadAssistantMessageExpressionSchema(state) {
  return tool(
    "ReadAssistantMessageExpressionSchema",
    "Read the schema for an assistant message expression (role: assistant, supports $starlark/$jmespath)",
    {},
    async () => textResult(formatZodSchema(Request.AssistantMessageExpressionSchema))
  );
}
var Request2 = Chat.Completions.Request;
function makeReadSimpleContentSchema(state) {
  return tool(
    "ReadSimpleContentSchema",
    "Read the schema for compiled SimpleContent (text-only content used by developer/system messages)",
    {},
    async () => textResult(formatZodSchema(Request2.SimpleContentSchema))
  );
}
function makeReadRichContentSchema(state) {
  return tool(
    "ReadRichContentSchema",
    "Read the schema for compiled RichContent (text, images, audio, video, files \u2014 used by user/tool/assistant messages)",
    {},
    async () => textResult(formatZodSchema(Request2.RichContentSchema))
  );
}
function makeReadSimpleContentExpressionSchema(state) {
  return tool(
    "ReadSimpleContentExpressionSchema",
    "Read the schema for SimpleContent expression (text-only content, supports $starlark/$jmespath)",
    {},
    async () => textResult(formatZodSchema(Request2.SimpleContentExpressionSchema))
  );
}
function makeReadRichContentExpressionSchema(state) {
  return tool(
    "ReadRichContentExpressionSchema",
    "Read the schema for RichContent expression (text, images, audio, video, files \u2014 supports $starlark/$jmespath)",
    {},
    async () => textResult(formatZodSchema(Request2.RichContentExpressionSchema))
  );
}
function makeReadScalarFunctionTaskSchema(state) {
  return tool(
    "ReadScalarFunctionTaskSchema",
    "Read the schema for a scalar.function task",
    {},
    async () => textResult(formatZodSchema(Functions.ScalarFunctionTaskExpressionSchema))
  );
}
function makeReadVectorFunctionTaskSchema(state) {
  return tool(
    "ReadVectorFunctionTaskSchema",
    "Read the schema for a vector.function task",
    {},
    async () => textResult(formatZodSchema(Functions.VectorFunctionTaskExpressionSchema))
  );
}
function makeReadVectorCompletionTaskSchema(state) {
  return tool(
    "ReadVectorCompletionTaskSchema",
    "Read the schema for a vector.completion task",
    {},
    async () => textResult(formatZodSchema(Functions.VectorCompletionTaskExpressionSchema))
  );
}
function makeReadCompiledScalarFunctionTaskSchema(state) {
  return tool(
    "ReadCompiledScalarFunctionTaskSchema",
    "Read the schema for a compiled scalar.function task (used in compiledTasks within ExampleInputs)",
    {},
    async () => textResult(formatZodSchema(Functions.ScalarFunctionTaskSchema))
  );
}
function makeReadCompiledVectorFunctionTaskSchema(state) {
  return tool(
    "ReadCompiledVectorFunctionTaskSchema",
    "Read the schema for a compiled vector.function task (used in compiledTasks within ExampleInputs)",
    {},
    async () => textResult(formatZodSchema(Functions.VectorFunctionTaskSchema))
  );
}
function makeReadCompiledVectorCompletionTaskSchema(state) {
  return tool(
    "ReadCompiledVectorCompletionTaskSchema",
    "Read the schema for a compiled vector.completion task (used in compiledTasks within ExampleInputs)",
    {},
    async () => textResult(formatZodSchema(Functions.VectorCompletionTaskSchema))
  );
}
function makeReadReadme(state) {
  return tool(
    "ReadReadme",
    "Read README.md",
    {},
    async () => {
      state.hasReadReadme = true;
      return resultFromResult(readReadme());
    }
  );
}
function makeWriteReadme(state) {
  return tool(
    "WriteReadme",
    "Write README.md",
    { content: z18.string() },
    async ({ content }) => {
      const err = mustRead(state.hasReadReadme, "README.md");
      if (err) return errorResult(err);
      return resultFromResult(writeReadme(content));
    }
  );
}
function makeSubmit(state) {
  return tool(
    "Submit",
    "Check function, check example inputs, run network tests, commit and push to GitHub (if all successful)",
    { message: z18.string().describe("Commit message") },
    async ({ message }) => resultFromResult(await submit(message, state.submitApiBase, state.submitApiKey, {
      userName: state.gitUserName,
      userEmail: state.gitUserEmail,
      ghToken: state.ghToken
    }))
  );
}
async function planMcp(state, log, depth, sessionId) {
  const tools = [
    makeReadSpec(state),
    makeReadName(),
    makeReadEssay(state),
    makeReadEssayTasks(state),
    makeWritePlan(state),
    makeListExampleFunctions(state),
    makeReadExampleFunction(state),
    makeReadFunctionSchema(),
    // Function
    makeReadFunction(state),
    makeCheckFunction(),
    makeReadMessagesExpressionSchema(),
    makeReadToolsExpressionSchema(),
    makeReadResponsesExpressionSchema(),
    // Expression params
    makeReadInputParamSchema(),
    makeReadMapParamSchema(),
    makeReadOutputParamSchema(),
    // Recursive type schemas (referenced by $ref in other schemas)
    makeReadJsonValueSchema(),
    makeReadJsonValueExpressionSchema(),
    makeReadInputValueSchema(),
    makeReadInputValueExpressionSchema(),
    // Message role schemas (expression variants, referenced by $ref in ReadMessagesExpressionSchema)
    makeReadDeveloperMessageExpressionSchema(),
    makeReadSystemMessageExpressionSchema(),
    makeReadUserMessageExpressionSchema(),
    makeReadToolMessageExpressionSchema(),
    makeReadAssistantMessageExpressionSchema(),
    // Message role schemas (compiled variants, referenced by $ref in ReadCompiledVectorCompletionTaskSchema)
    makeReadDeveloperMessageSchema(),
    makeReadSystemMessageSchema(),
    makeReadUserMessageSchema(),
    makeReadToolMessageSchema(),
    makeReadAssistantMessageSchema(),
    // Content schemas (expression variants, referenced by $ref in expression message schemas)
    makeReadSimpleContentExpressionSchema(),
    makeReadRichContentExpressionSchema(),
    // Content schemas (compiled variants, referenced by $ref in compiled message schemas)
    makeReadSimpleContentSchema(),
    makeReadRichContentSchema(),
    // Task type schemas (referenced by $ref in ReadTasksSchema)
    makeReadScalarFunctionTaskSchema(),
    makeReadVectorFunctionTaskSchema(),
    makeReadVectorCompletionTaskSchema(),
    // Compiled task type schemas (referenced by $ref in ReadExampleInputsSchema)
    makeReadCompiledScalarFunctionTaskSchema(),
    makeReadCompiledVectorFunctionTaskSchema(),
    makeReadCompiledVectorCompletionTaskSchema(),
    // Example inputs
    makeReadExampleInputs(state),
    makeReadExampleInputsSchema(),
    makeCheckExampleInputs(),
    // README
    makeReadReadme(state),
    // Network tests
    makeRunNetworkTests(state),
    makeReadDefaultNetworkTest(),
    makeReadSwissSystemNetworkTest()
  ];
  const mcpServer = createSdkMcpServer({ name: "plan", tools });
  const reads = [];
  if (!state.hasReadOrWrittenSpec) reads.push("SPEC.md");
  reads.push("name.txt");
  if (!state.hasReadOrWrittenEssay) reads.push("ESSAY.md");
  if (!state.hasReadOrWrittenEssayTasks) reads.push("ESSAY_TASKS.md");
  reads.push("the function type");
  if (!state.hasReadExampleFunctions) reads.push("example functions");
  const readPrefix = reads.length > 0 ? `Read ${formatReadList(reads)} to understand the context. Then write` : "Write";
  const widthDesc = state.minWidth === state.maxWidth ? `exactly ${state.minWidth}` : `between ${state.minWidth} and ${state.maxWidth}`;
  const useFunctionTasks = depth > 0;
  const taskStructure = useFunctionTasks ? `

### Task Structure
This function must use **function tasks** (type: \`scalar.function\` or \`vector.function\`). Plan ${widthDesc} sub-functions, each responsible for a distinct evaluation task from ESSAY_TASKS.md.
- Each sub-function will be spawned as a child agent
- The parent function's input schema must support deriving each sub-function's input
- Plan whether any input_maps are needed for mapped task execution
- For each sub-function, describe: what it evaluates, its input schema, whether it's scalar or vector` : `

### Task Structure
This function must use **vector completion tasks** (type: \`vector.completion\`). Plan ${widthDesc} inline vector completion tasks.
- Use \`map\` if a task needs to iterate over input items
- Each task's prompt and responses define what gets evaluated
- Responses should be phrased as potential assistant messages (e.g. if ranking dating profiles, ask "what is a good dating profile" and make each response a dating profile)
- If a task ranks items from an input array, the array items go into \`responses\`, not \`messages\``;
  const contentFormat = useFunctionTasks ? "" : `

### Message and Response Content Format
- **Messages**: Always use array-of-parts format for message \`content\`, never plain strings
  - Correct: \`{"role": "user", "content": [{"type": "text", "text": "..."}]}\`
  - Wrong: \`{"role": "user", "content": "..."}\`
- **Responses**: Always use array-of-parts format for each response, never plain strings
  - Correct: \`[[{"type": "text", "text": "good"}], [{"type": "text", "text": "bad"}]]\`
  - Wrong: \`["good", "bad"]\`
- **Never use \`str()\` on multimodal content** \u2014 pass rich content directly (or via expressions)`;
  let prompt = `${readPrefix} your implementation plan using the WritePlan tool. Include:
- The input schema structure and field descriptions
- Whether any input maps are needed for mapped task execution
- What the function definition will look like
- What expressions need to be written
- What test inputs will cover edge cases and diverse scenarios` + taskStructure + `

### Expression Language
- **Prefer Starlark** (\`{"$starlark": "..."}\`) for most expressions \u2014 it's Python-like and more readable
- Only use JMESPath (\`{"$jmespath": "..."}\`) for very simple field access expressions
- Starlark example: \`{"$starlark": "input['items'][0]"}\`
- JMESPath example: \`{"$jmespath": "input.name"}\` (simple field access only)

### Expression Context
Expressions receive a single object with these fields:
- \`input\` \u2014 Always present, the function input
- \`map\` \u2014 Present in mapped tasks, the current map element
- \`output\` \u2014 Present in task output expressions, the raw task result` + contentFormat + `

### Example Inputs
Plan for diverse test inputs (minimum 10, maximum 100):
- **Diversity in structure**: edge cases, empty arrays, single items, boundary values, missing optional fields
- **Diversity in intended output**: cover the full range of expected scores (low, medium, high)
- **Multimodal content**: if using image/video/audio/file types, use placeholder URLs for testing

### Important
- **SPEC.md is the universal source of truth** \u2014 never contradict it`;
  sessionId = await consumeStream(
    query({
      prompt,
      options: {
        tools: [],
        mcpServers: { plan: mcpServer },
        allowedTools: ["mcp__plan__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId
      }
    }),
    log,
    sessionId
  );
  state.anyStepRan = true;
  if (sessionId) writeSession(sessionId);
  return sessionId;
}
function ghEnv3(ghToken) {
  return { ...process.env, GH_TOKEN: ghToken };
}
function getGitHubOwner2(ghToken) {
  try {
    return execSync("gh api user --jq .login", {
      encoding: "utf-8",
      stdio: "pipe",
      env: ghEnv3(ghToken)
    }).trim();
  } catch {
    return null;
  }
}
function repoExists2(owner, name, ghToken) {
  try {
    execSync(`gh repo view ${owner}/${name}`, {
      stdio: "ignore",
      env: ghEnv3(ghToken)
    });
    return true;
  } catch {
    return false;
  }
}
function getCurrentDepth() {
  if (!existsSync("parameters.json")) {
    return 0;
  }
  const content = readFileSync("parameters.json", "utf-8");
  const params = JSON.parse(content);
  return params.depth ?? 0;
}
function runAgentInSubdir(name, spec, childDepth, childProcesses, opts) {
  const subdir = join("agent_functions", name);
  mkdirSync(subdir, { recursive: true });
  writeFileSync(join(subdir, "SPEC.md"), spec, "utf-8");
  return new Promise((resolve) => {
    const args = ["invent", "--name", name, "--depth", String(childDepth)];
    if (opts?.apiBase) args.push("--api-base", opts.apiBase);
    if (opts?.apiKey) args.push("--api-key", opts.apiKey);
    if (opts?.gitUserName) args.push("--git-user-name", opts.gitUserName);
    if (opts?.gitUserEmail) args.push("--git-user-email", opts.gitUserEmail);
    if (opts?.ghToken) args.push("--gh-token", opts.ghToken);
    if (opts?.minWidth) args.push("--min-width", String(opts.minWidth));
    if (opts?.maxWidth) args.push("--max-width", String(opts.maxWidth));
    const child = spawn(
      "objectiveai-function-agent",
      args,
      {
        cwd: subdir,
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
        env: {
          ...process.env,
          OBJECTIVEAI_PARENT_PID: String(process.pid),
          ...opts?.ghToken && { GH_TOKEN: opts.ghToken }
        }
      }
    );
    childProcesses.push(child);
    if (child.stdin && opts?.activeChildren) {
      opts.activeChildren.set(name, child.stdin);
    }
    opts?.onChildEvent?.({ event: "start", path: name });
    let stdoutBuffer = "";
    child.stdout?.on("data", (data) => {
      if (!opts?.onChildEvent) return;
      stdoutBuffer += data.toString();
      const lines = stdoutBuffer.split("\n");
      stdoutBuffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const evt = parseEvent(line);
        if (evt) {
          opts.onChildEvent(prefixEvent(evt, name));
        }
      }
    });
    child.stderr?.on("data", () => {
    });
    child.on("close", (code) => {
      opts?.activeChildren?.delete(name);
      if (opts?.onChildEvent && stdoutBuffer.trim()) {
        const evt = parseEvent(stdoutBuffer);
        if (evt) {
          opts.onChildEvent(prefixEvent(evt, name));
        }
      }
      opts?.onChildEvent?.({ event: "done", path: name });
      if (code !== 0) {
        resolve({
          name,
          error: `Agent exited with code ${code}. See ${subdir}/logs/ for details.`
        });
        return;
      }
      try {
        const remote = execSync("git remote get-url origin", {
          cwd: subdir,
          encoding: "utf-8"
        }).trim();
        const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
        const owner = match?.[1] ?? "unknown";
        const repository = match?.[2] ?? name;
        const commit = execSync("git rev-parse HEAD", {
          cwd: subdir,
          encoding: "utf-8"
        }).trim();
        resolve({ name, owner, repository, commit });
      } catch (err) {
        resolve({ name, error: `Failed to extract result: ${err}` });
      }
    });
    child.on("error", (err) => {
      resolve({ name, error: `Failed to spawn agent: ${err.message}` });
    });
  });
}
async function spawnFunctionAgents(params, opts) {
  if (params.length === 0) {
    return { ok: false, value: void 0, error: "params array is empty" };
  }
  const names = params.map((p) => p.name);
  const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
  if (duplicates.length > 0) {
    return {
      ok: false,
      value: void 0,
      error: `Duplicate names: ${[...new Set(duplicates)].join(", ")}`
    };
  }
  if (opts?.ghToken) {
    const owner = getGitHubOwner2(opts.ghToken);
    if (owner) {
      for (const param of params) {
        if (repoExists2(owner, param.name, opts.ghToken)) {
          return {
            ok: false,
            value: void 0,
            error: `Repository ${owner}/${param.name} already exists on GitHub. Choose a different name.`
          };
        }
      }
    }
  }
  const currentDepth = getCurrentDepth();
  const childDepth = Math.max(0, currentDepth - 1);
  const childProcesses = [];
  const killAll = () => {
    for (const child of childProcesses) {
      if (child.killed) continue;
      try {
        if (process.platform === "win32" && child.pid) {
          execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: "ignore" });
        } else {
          child.kill("SIGKILL");
        }
      } catch {
      }
    }
  };
  const onExit = () => killAll();
  const onSignal = (signal) => {
    killAll();
    process.exit(1);
  };
  const onError = () => {
    killAll();
    process.exit(1);
  };
  process.on("exit", onExit);
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);
  process.on("uncaughtException", onError);
  process.on("unhandledRejection", onError);
  const removeListeners = () => {
    process.removeListener("exit", onExit);
    process.removeListener("SIGINT", onSignal);
    process.removeListener("SIGTERM", onSignal);
    process.removeListener("uncaughtException", onError);
    process.removeListener("unhandledRejection", onError);
  };
  try {
    const results = await Promise.all(
      params.map(
        (param) => runAgentInSubdir(param.name, param.spec, childDepth, childProcesses, opts)
      )
    );
    return { ok: true, value: results, error: void 0 };
  } catch (e) {
    killAll();
    return {
      ok: false,
      value: void 0,
      error: `Spawn failed: ${e.message}`
    };
  } finally {
    killAll();
    removeListeners();
  }
}
var SpawnFunctionAgentsParamsSchema = z.array(
  z.object({
    name: z.string(),
    spec: z.string()
  })
);

// src/tools/claude/spawnFunctionAgents.ts
function makeSpawnFunctionAgents(state) {
  const opts = () => ({
    apiBase: state.submitApiBase,
    apiKey: state.submitApiKey,
    gitUserName: state.gitUserName,
    gitUserEmail: state.gitUserEmail,
    ghToken: state.ghToken,
    minWidth: state.minWidth,
    maxWidth: state.maxWidth,
    onChildEvent: state.onChildEvent,
    activeChildren: state.activeChildren
  });
  return tool(
    "SpawnFunctionAgents",
    "Spawn child function agents in parallel",
    { params: SpawnFunctionAgentsParamsSchema },
    async ({ params }) => {
      if (state.pendingAgentResults) {
        return resultFromResult({
          ok: false,
          value: void 0,
          error: "Agents are already running. Call WaitFunctionAgents to wait for results."
        });
      }
      if (state.spawnFunctionAgentsHasSpawned) {
        const owner = getGitHubOwner2(state.ghToken);
        const alreadyOnGitHub = [];
        if (owner) {
          for (const param of params) {
            if (repoExists2(owner, param.name, state.ghToken)) {
              alreadyOnGitHub.push(param.name);
            }
          }
        }
        if (alreadyOnGitHub.length > 0) {
          return resultFromResult({
            ok: false,
            value: void 0,
            error: `Cannot respawn agents that already succeeded: ${alreadyOnGitHub.join(", ")}. Only include agents that failed (no repository on GitHub).`
          });
        }
      }
      state.spawnFunctionAgentsHasSpawned = true;
      state.pendingAgentResults = spawnFunctionAgents(params, opts()).then(
        (r) => resultFromResult(r)
      );
      return textResult(
        "Agents spawned. Call WaitFunctionAgents to wait for results."
      );
    }
  );
}
function makeWaitFunctionAgents(state) {
  return tool(
    "WaitFunctionAgents",
    "Wait for running function agents to finish",
    {},
    async () => {
      if (!state.pendingAgentResults) {
        return errorResult("No agents are currently running.");
      }
      const outcome = await Promise.race([
        state.pendingAgentResults.then((r) => ({ type: "done", result: r })),
        state.messageQueue.waitForMessage().then(() => ({ type: "message" }))
      ]);
      if (outcome.type === "done") {
        state.pendingAgentResults = null;
        return outcome.result;
      }
      const messages = state.messageQueue.drain();
      return textResult(
        "Function agents are still running. Call WaitFunctionAgents again to continue waiting.\n\n" + messages.map((m) => "[USER MESSAGE]: " + m).join("\n")
      );
    }
  );
}
function listAgentFunctions() {
  const dir = "agent_functions";
  if (!existsSync(dir)) {
    return { ok: true, value: [], error: void 0 };
  }
  const entries = readdirSync(dir);
  const results = [];
  for (const entry of entries) {
    const subPath = `${dir}/${entry}`;
    if (!statSync(subPath).isDirectory() || entry.startsWith(".")) continue;
    let commit;
    try {
      commit = execSync("git rev-parse HEAD", {
        cwd: subPath,
        encoding: "utf-8",
        stdio: "pipe"
      }).trim();
    } catch {
      continue;
    }
    let owner = "";
    let repository = "";
    try {
      const remote = execSync("git remote get-url origin", {
        cwd: subPath,
        encoding: "utf-8",
        stdio: "pipe"
      }).trim();
      const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
      owner = match?.[1] ?? "";
      repository = match?.[2] ?? "";
    } catch {
    }
    results.push({ name: entry, owner, repository, commit, path: subPath });
  }
  results.sort((a, b) => a.name.localeCompare(b.name));
  return { ok: true, value: results, error: void 0 };
}
function readAgentFunction(name) {
  const subPath = `agent_functions/${name}`;
  if (!existsSync(subPath) || !statSync(subPath).isDirectory()) {
    return { ok: false, value: void 0, error: `agent_functions/${name} does not exist` };
  }
  let commit;
  try {
    commit = execSync("git rev-parse HEAD", {
      cwd: subPath,
      encoding: "utf-8",
      stdio: "pipe"
    }).trim();
  } catch {
    return { ok: false, value: void 0, error: `Failed to get commit for agent_functions/${name}` };
  }
  let owner = "";
  let repository = "";
  try {
    const remote = execSync("git remote get-url origin", {
      cwd: subPath,
      encoding: "utf-8",
      stdio: "pipe"
    }).trim();
    const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    owner = match?.[1] ?? "";
    repository = match?.[2] ?? "";
  } catch {
  }
  let functionJson = null;
  try {
    functionJson = JSON.parse(readFileSync(join(subPath, "function.json"), "utf-8"));
  } catch {
  }
  return { ok: true, value: { name, owner, repository, commit, path: subPath, functionJson }, error: void 0 };
}
function makeListAgentFunctions(state) {
  return tool(
    "ListAgentFunctions",
    "List all agent functions with their owner, repository, and commit",
    {},
    async () => resultFromResult(listAgentFunctions())
  );
}
function makeReadAgentFunction(state) {
  return tool(
    "ReadAgentFunction",
    "Read an agent function by name",
    { name: z18.string() },
    async ({ name }) => resultFromResult(readAgentFunction(name))
  );
}

// src/claude/invent/inventMcp.ts
function getCommonTools(state) {
  registerSchemaRefs();
  return [
    // Core Context
    makeReadSpec(state),
    makeReadName(),
    makeReadEssay(state),
    makeReadEssayTasks(state),
    makeReadPlan(state),
    makeListExampleFunctions(state),
    makeReadExampleFunction(state),
    makeReadFunctionSchema(),
    // Function
    makeReadFunction(state),
    makeCheckFunction(),
    makeReadType(state),
    makeReadTypeSchema(),
    makeEditType(state),
    makeCheckType(),
    makeReadDescription(state),
    makeReadDescriptionSchema(),
    makeEditDescription(state),
    makeCheckDescription(),
    makeReadInputSchema(state),
    makeReadInputSchemaSchema(),
    makeEditInputSchema(state),
    makeCheckInputSchema(),
    makeReadInputMaps(state),
    makeReadInputMapsSchema(),
    makeAppendInputMap(state),
    makeDelInputMap(state),
    makeDelInputMaps(state),
    makeCheckInputMaps(),
    makeReadOutputLength(state),
    makeReadOutputLengthSchema(),
    makeEditOutputLength(state),
    makeDelOutputLength(state),
    makeCheckOutputLength(),
    makeReadInputSplit(state),
    makeReadInputSplitSchema(),
    makeEditInputSplit(state),
    makeDelInputSplit(state),
    makeCheckInputSplit(),
    makeReadInputMerge(state),
    makeReadInputMergeSchema(),
    makeEditInputMerge(state),
    makeDelInputMerge(state),
    makeCheckInputMerge(),
    makeReadTasks(state),
    makeReadTasksSchema(),
    makeAppendTask(state),
    makeEditTask(state),
    makeDelTask(state),
    makeDelTasks(state),
    makeCheckTasks(),
    makeReadMessagesExpressionSchema(),
    makeReadToolsExpressionSchema(),
    makeReadResponsesExpressionSchema(),
    // Expression params
    makeReadInputParamSchema(),
    makeReadMapParamSchema(),
    makeReadOutputParamSchema(),
    // Recursive type schemas (referenced by $ref in other schemas)
    makeReadJsonValueSchema(),
    makeReadJsonValueExpressionSchema(),
    makeReadInputValueSchema(),
    makeReadInputValueExpressionSchema(),
    // Message role schemas (expression variants, referenced by $ref in ReadMessagesExpressionSchema)
    makeReadDeveloperMessageExpressionSchema(),
    makeReadSystemMessageExpressionSchema(),
    makeReadUserMessageExpressionSchema(),
    makeReadToolMessageExpressionSchema(),
    makeReadAssistantMessageExpressionSchema(),
    // Message role schemas (compiled variants, referenced by $ref in ReadCompiledVectorCompletionTaskSchema)
    makeReadDeveloperMessageSchema(),
    makeReadSystemMessageSchema(),
    makeReadUserMessageSchema(),
    makeReadToolMessageSchema(),
    makeReadAssistantMessageSchema(),
    // Content schemas (expression variants, referenced by $ref in expression message schemas)
    makeReadSimpleContentExpressionSchema(),
    makeReadRichContentExpressionSchema(),
    // Content schemas (compiled variants, referenced by $ref in compiled message schemas)
    makeReadSimpleContentSchema(),
    makeReadRichContentSchema(),
    // Task type schemas (referenced by $ref in ReadTasksSchema)
    makeReadScalarFunctionTaskSchema(),
    makeReadVectorFunctionTaskSchema(),
    makeReadVectorCompletionTaskSchema(),
    // Compiled task type schemas (referenced by $ref in ReadExampleInputsSchema)
    makeReadCompiledScalarFunctionTaskSchema(),
    makeReadCompiledVectorFunctionTaskSchema(),
    makeReadCompiledVectorCompletionTaskSchema(),
    // Example inputs
    makeReadExampleInput(state),
    makeReadExampleInputs(state),
    makeReadExampleInputsSchema(),
    makeAppendExampleInput(state),
    makeEditExampleInput(state),
    makeDelExampleInput(state),
    makeDelExampleInputs(state),
    makeCheckExampleInputs(),
    // README
    makeReadReadme(state),
    makeWriteReadme(state),
    // Network tests
    makeRunNetworkTests(state),
    makeReadDefaultNetworkTest(),
    makeReadSwissSystemNetworkTest(),
    // Submit
    makeSubmit(state)
  ];
}
function getFunctionTasksTools(state) {
  return [
    makeSpawnFunctionAgents(state),
    makeWaitFunctionAgents(state),
    makeListAgentFunctions(),
    makeReadAgentFunction()
  ];
}
function widthText(minWidth, maxWidth) {
  if (minWidth === maxWidth) return `exactly **${minWidth}**`;
  return `between **${minWidth}** and **${maxWidth}**`;
}
function buildReadLine(state) {
  const reads = [];
  if (!state.hasReadOrWrittenSpec) reads.push("SPEC.md");
  reads.push("name.txt");
  if (!state.hasReadOrWrittenEssay) reads.push("ESSAY.md");
  if (!state.hasReadOrWrittenEssayTasks) reads.push("ESSAY_TASKS.md");
  if (!state.hasReadOrWrittenPlan) reads.push("the plan");
  if (!state.hasReadExampleFunctions) reads.push("example functions");
  if (reads.length === 0) return "";
  return `
Read ${formatReadList(reads)} to understand the context, if needed.
`;
}
function buildFunctionTasksPrompt(state) {
  const w = widthText(state.minWidth, state.maxWidth);
  const readLine = buildReadLine(state);
  return `You are inventing a new ObjectiveAI Function. Your goal is to complete the implementation, add example inputs, ensure all tests pass, and submit the result.
${readLine}

## Phase 1: Implementation

### Task Structure

This function must use **function tasks** (type: \`scalar.function\` or \`vector.function\`). You must create ${w} sub-functions by spawning child agents.

**Before spawning**, define the parent function's input schema using EditInputSchema, and input_maps using AppendInputMap if any tasks will use mapped iteration. The sub-function specs you write must describe input schemas that are derivable from this parent input schema, so define these first.

1. Analyze ESSAY_TASKS.md and create a spec for each sub-function describing:
   - What it evaluates (purpose, not implementation details)
   - The input schema it expects
   - Whether it's scalar or vector
   - Key evaluation criteria

2. Use the SpawnFunctionAgents tool with an array of objects, each containing:
   - \`name\`: A short, descriptive name for the sub-function (used as directory name)
   - \`spec\`: The full spec text for the sub-function
   \`\`\`json
   [
     {"name": "humor-scorer", "spec": "Spec for humor scoring..."},
     {"name": "clarity-scorer", "spec": "Spec for clarity scoring..."}
   ]
   \`\`\`

3. Parse the result to get \`{name, owner, repository, commit}\` for each. Use ReadAgentFunction to read each spawned sub-function's \`function.json\`.

4. Create function tasks using AppendTask referencing those sub-functions:
   \`\`\`json
   {
     "type": "<scalar/vector>.function",
     "owner": "<owner>",
     "repository": "<repository>",
     "commit": "<commit>",
     "input": {"$starlark": "..."},
     "output": {"$starlark": "..."}
   }
   \`\`\`

5. Handle any errors in the spawn results

**Retrying Failed Sub-Functions**
If a sub-function fails (result contains \`{error: "..."}\`), call SpawnFunctionAgents again:
- Include only the failed entries and add \`"overwrite": true\` to each
- Example: \`[{"name": "clarity-scorer", "spec": "Updated spec...", "overwrite": true}]\`
- This deletes the existing \`agent_functions/clarity-scorer/\` directory and re-spawns the agent

**Reading Sub-Functions**
Use ListAgentFunctions and ReadAgentFunction to inspect spawned sub-functions.

### Function Definition
- Use the Edit* tools to define each function field
- Read the *Schema tools to understand what types are expected

### Build and Test
- Fix issues and repeat until all tests pass

## Phase 2: Verify SPEC.md Compliance

Before finalizing, verify that everything adheres to SPEC.md:
- Re-read SPEC.md carefully
- Ensure the function definition, inputs, and outputs match what SPEC.md describes
- If anything contradicts SPEC.md, fix it to match the spec
- **SPEC.md is the universal source of truth** - the final product must not contradict it

## Phase 3: Finalize

Once all tests pass and SPEC.md compliance is verified:
- Use the Submit tool with a commit message to validate, commit, and push
- If Submit fails, fix the issues it reports and try again

## Important Notes

- **SPEC.md is the universal source of truth** - never contradict it
- **No API key is needed for tests** - tests run against a local server
`;
}
function buildVectorTasksPrompt(state) {
  const w = widthText(state.minWidth, state.maxWidth);
  const readLine = buildReadLine(state);
  return `You are inventing a new ObjectiveAI Function. Your goal is to complete the implementation, add example inputs, ensure all tests pass, and submit the result.
${readLine}

## Phase 1: Implementation

### Task Structure

This function must use **vector completion tasks** (type: \`vector.completion\`). Create ${w} inline vector completion tasks using AppendTask:
- Use \`map\` if a task needs to iterate over input items
- Each task's prompt and responses define what gets evaluated
- Responses should be phrased as potential assistant messages. For example, if ranking dating profiles, don't ask "which profile is best" \u2014 instead ask "what is a good dating profile" and make each response a dating profile
- If a task is for ranking items from an input array, the array items go into \`responses\`, not \`messages\`

### Function Definition
- Use the Edit* tools to define each function field
- Read the *Schema tools to understand what types are expected

### Build and Test
- Fix issues and repeat until all tests pass

## Phase 2: Verify SPEC.md Compliance

Before finalizing, verify that everything adheres to SPEC.md:
- Re-read SPEC.md carefully
- Ensure the function definition, inputs, and outputs match what SPEC.md describes
- If anything contradicts SPEC.md, fix it to match the spec
- **SPEC.md is the universal source of truth** - the final product must not contradict it

## Phase 3: Finalize

Once all tests pass and SPEC.md compliance is verified:
- Use the Submit tool with a commit message to validate, commit, and push
- If Submit fails, fix the issues it reports and try again

## Important Notes

- **SPEC.md is the universal source of truth** - never contradict it
- **No API key is needed for tests** - tests run against a local server
`;
}
async function inventLoop(state, log, useFunctionTasks, sessionId) {
  const maxAttempts = 5;
  let attempt = 0;
  let success = false;
  let lastFailureReasons = [];
  while (attempt < maxAttempts && !success) {
    attempt++;
    log(`Invent loop attempt ${attempt}/${maxAttempts}`);
    const tools = [
      ...getCommonTools(state),
      ...useFunctionTasks ? getFunctionTasksTools(state) : []
    ];
    const mcpServer = createSdkMcpServer({ name: "invent", tools });
    let prompt;
    if (attempt === 1) {
      prompt = useFunctionTasks ? buildFunctionTasksPrompt(state) : buildVectorTasksPrompt(state);
    } else {
      prompt = `Your previous attempt failed:
${lastFailureReasons.map((r) => `- ${r}`).join("\n")}

Please try again. Remember to:
1. Use RunNetworkTests to test
2. Use Submit to validate, commit, and push
`;
    }
    const runQuery = (sid) => consumeStream(
      query({
        prompt,
        options: {
          tools: [],
          mcpServers: { invent: mcpServer },
          allowedTools: ["mcp__invent__*"],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sid
        }
      }),
      log,
      sid
    );
    try {
      sessionId = await runQuery(sessionId);
    } catch (e) {
      if (!state.anyStepRan) {
        log("Session may be invalid, retrying without session...");
        sessionId = await runQuery(void 0);
      } else {
        throw e;
      }
    }
    state.anyStepRan = true;
    log("Running submit...");
    lastFailureReasons = [];
    const submitResult = await submit(
      "submit",
      state.submitApiBase,
      state.submitApiKey,
      {
        userName: state.gitUserName,
        userEmail: state.gitUserEmail
      },
      sessionId
    );
    if (submitResult.ok) {
      success = true;
      log(`Success: Submitted commit ${submitResult.value}`);
    } else {
      lastFailureReasons.push(submitResult.error);
      log(`Submit failed: ${submitResult.error}`);
    }
  }
  if (!success) {
    throw new Error("Invent loop failed after maximum attempts.");
  }
  return sessionId;
}
async function inventMcp(state, options) {
  const log = options.log;
  const depth = options.depth;
  const useFunctionTasks = depth > 0;
  log("=== Plan ===");
  let sessionId;
  try {
    sessionId = await planMcp(state, log, depth, options.sessionId);
  } catch (e) {
    if (!state.anyStepRan) {
      log("Session may be invalid, retrying without session...");
      sessionId = await planMcp(state, log, depth, void 0);
    } else {
      throw e;
    }
  }
  log(`=== Invent Loop: Creating new function (${useFunctionTasks ? "function" : "vector"} tasks) ===`);
  await inventLoop(state, log, useFunctionTasks, sessionId);
  log("=== ObjectiveAI Function invention complete ===");
}
async function planMcp2(state, log, depth, amendment, sessionId) {
  const tools = [
    makeReadSpec(state),
    makeReadName(),
    makeReadEssay(state),
    makeReadEssayTasks(state),
    makeWritePlan(state),
    makeListExampleFunctions(state),
    makeReadExampleFunction(state),
    makeReadFunctionSchema(),
    // Function
    makeReadFunction(state),
    makeCheckFunction(),
    makeReadTasks(state),
    makeReadTasksSchema(),
    makeReadMessagesExpressionSchema(),
    makeReadToolsExpressionSchema(),
    makeReadResponsesExpressionSchema(),
    // Expression params
    makeReadInputParamSchema(),
    makeReadMapParamSchema(),
    makeReadOutputParamSchema(),
    // Recursive type schemas
    makeReadJsonValueSchema(),
    makeReadJsonValueExpressionSchema(),
    makeReadInputValueSchema(),
    makeReadInputValueExpressionSchema(),
    // Message role schemas (expression variants)
    makeReadDeveloperMessageExpressionSchema(),
    makeReadSystemMessageExpressionSchema(),
    makeReadUserMessageExpressionSchema(),
    makeReadToolMessageExpressionSchema(),
    makeReadAssistantMessageExpressionSchema(),
    // Message role schemas (compiled variants)
    makeReadDeveloperMessageSchema(),
    makeReadSystemMessageSchema(),
    makeReadUserMessageSchema(),
    makeReadToolMessageSchema(),
    makeReadAssistantMessageSchema(),
    // Content schemas (expression variants)
    makeReadSimpleContentExpressionSchema(),
    makeReadRichContentExpressionSchema(),
    // Content schemas (compiled variants)
    makeReadSimpleContentSchema(),
    makeReadRichContentSchema(),
    // Task type schemas
    makeReadScalarFunctionTaskSchema(),
    makeReadVectorFunctionTaskSchema(),
    makeReadVectorCompletionTaskSchema(),
    // Compiled task type schemas
    makeReadCompiledScalarFunctionTaskSchema(),
    makeReadCompiledVectorFunctionTaskSchema(),
    makeReadCompiledVectorCompletionTaskSchema(),
    // Example inputs
    makeReadExampleInputs(state),
    makeReadExampleInputsSchema(),
    makeCheckExampleInputs(),
    // README
    makeReadReadme(state),
    // Network tests
    makeRunNetworkTests(state),
    makeReadDefaultNetworkTest(),
    makeReadSwissSystemNetworkTest()
  ];
  const mcpServer = createSdkMcpServer({ name: "amend-plan", tools });
  const reads = [];
  if (!state.hasReadOrWrittenSpec) reads.push("SPEC.md");
  reads.push("name.txt");
  if (!state.hasReadOrWrittenEssay) reads.push("ESSAY.md");
  if (!state.hasReadOrWrittenEssayTasks) reads.push("ESSAY_TASKS.md");
  reads.push("the current function definition");
  reads.push("the current example inputs");
  if (!state.hasReadExampleFunctions) reads.push("example functions");
  const readPrefix = reads.length > 0 ? `Read ${formatReadList(reads)} to understand the current state. Then write` : "Write";
  const useFunctionTasks = depth > 0;
  const taskStructure = useFunctionTasks ? `

### Task Structure
This function uses **function tasks** (type: \`scalar.function\` or \`vector.function\`). Plan what changes are needed to the existing sub-functions and whether any new sub-functions need to be spawned or existing ones amended.
- Use AmendFunctionAgents to amend existing sub-functions
- Use SpawnFunctionAgents to create new sub-functions if needed` : `

### Task Structure
This function uses **vector completion tasks** (type: \`vector.completion\`). Plan what changes are needed to the existing tasks.
- Modify existing tasks as needed
- Add or remove tasks if the amendment requires it
- Responses should be phrased as potential assistant messages (e.g. if ranking dating profiles, ask "what is a good dating profile" and make each response a dating profile)
- If a task ranks items from an input array, the array items go into \`responses\`, not \`messages\``;
  const prompt = `You are amending an existing ObjectiveAI Function. The following amendment describes what needs to change:

## Amendment

${amendment}

${readPrefix} your amendment plan using the WritePlan tool. Include:
- What the amendment changes about the function
- Which parts of the existing function definition need to be modified
- What example inputs need to be added, modified, or removed
- Whether any expressions need to change` + taskStructure + `

### Important
- **SPEC.md (including amendments) is the universal source of truth** \u2014 the amended function must satisfy both the original spec and all amendments
- **Only implement this amendment** \u2014 previous amendments have already been applied
- **Preserve existing functionality** unless the amendment explicitly changes it
- **Minimize changes** \u2014 only modify what the amendment requires`;
  sessionId = await consumeStream(
    query({
      prompt,
      options: {
        tools: [],
        mcpServers: { "amend-plan": mcpServer },
        allowedTools: ["mcp__amend-plan__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId
      }
    }),
    log,
    sessionId
  );
  state.anyStepRan = true;
  if (sessionId) writeSession(sessionId);
  return sessionId;
}
function runAmendInSubdir(name, childProcesses, opts) {
  const subdir = join("agent_functions", name);
  return new Promise((resolve) => {
    const args = ["amend"];
    if (opts?.apiBase) args.push("--api-base", opts.apiBase);
    if (opts?.apiKey) args.push("--api-key", opts.apiKey);
    if (opts?.gitUserName) args.push("--git-user-name", opts.gitUserName);
    if (opts?.gitUserEmail) args.push("--git-user-email", opts.gitUserEmail);
    if (opts?.ghToken) args.push("--gh-token", opts.ghToken);
    if (opts?.minWidth) args.push("--min-width", String(opts.minWidth));
    if (opts?.maxWidth) args.push("--max-width", String(opts.maxWidth));
    const child = spawn(
      "objectiveai-function-agent",
      args,
      {
        cwd: subdir,
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
        env: {
          ...process.env,
          OBJECTIVEAI_PARENT_PID: String(process.pid),
          ...opts?.ghToken && { GH_TOKEN: opts.ghToken }
        }
      }
    );
    childProcesses.push(child);
    if (child.stdin && opts?.activeChildren) {
      opts.activeChildren.set(name, child.stdin);
    }
    opts?.onChildEvent?.({ event: "start", path: name });
    let stdoutBuffer = "";
    child.stdout?.on("data", (data) => {
      if (!opts?.onChildEvent) return;
      stdoutBuffer += data.toString();
      const lines = stdoutBuffer.split("\n");
      stdoutBuffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const evt = parseEvent(line);
        if (evt) {
          opts.onChildEvent(prefixEvent(evt, name));
        }
      }
    });
    child.stderr?.on("data", () => {
    });
    child.on("close", (code) => {
      opts?.activeChildren?.delete(name);
      if (opts?.onChildEvent && stdoutBuffer.trim()) {
        const evt = parseEvent(stdoutBuffer);
        if (evt) {
          opts.onChildEvent(prefixEvent(evt, name));
        }
      }
      opts?.onChildEvent?.({ event: "done", path: name });
      if (code !== 0) {
        resolve({
          name,
          error: `Agent exited with code ${code}. See ${subdir}/logs/ for details.`
        });
        return;
      }
      try {
        const remote = execSync("git remote get-url origin", {
          cwd: subdir,
          encoding: "utf-8"
        }).trim();
        const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
        const owner = match?.[1] ?? "unknown";
        const repository = match?.[2] ?? name;
        const commit = execSync("git rev-parse HEAD", {
          cwd: subdir,
          encoding: "utf-8"
        }).trim();
        resolve({ name, owner, repository, commit });
      } catch (err) {
        resolve({ name, error: `Failed to extract result: ${err}` });
      }
    });
    child.on("error", (err) => {
      resolve({ name, error: `Failed to spawn agent: ${err.message}` });
    });
  });
}
async function amendFunctionAgents(params, opts) {
  if (params.length === 0) {
    return { ok: false, value: void 0, error: "params array is empty" };
  }
  const names = params.map((p) => p.name);
  const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
  if (duplicates.length > 0) {
    return {
      ok: false,
      value: void 0,
      error: `Duplicate names: ${[...new Set(duplicates)].join(", ")}`
    };
  }
  if (opts?.ghToken) {
    const owner = getGitHubOwner2(opts.ghToken);
    if (owner) {
      const missing = [];
      for (const param of params) {
        if (!repoExists2(owner, param.name, opts.ghToken)) {
          missing.push(param.name);
        }
      }
      if (missing.length > 0) {
        return {
          ok: false,
          value: void 0,
          error: `Cannot amend agents that haven't completed invent: ${missing.join(", ")}. Repository must exist on GitHub first.`
        };
      }
    }
  }
  const originalCwd = process.cwd();
  for (const param of params) {
    const dir = join("agent_functions", param.name);
    try {
      process.chdir(dir);
      appendAmendment(param.spec);
    } finally {
      process.chdir(originalCwd);
    }
  }
  const childProcesses = [];
  const killAll = () => {
    for (const child of childProcesses) {
      if (child.killed) continue;
      try {
        if (process.platform === "win32" && child.pid) {
          execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: "ignore" });
        } else {
          child.kill("SIGKILL");
        }
      } catch {
      }
    }
  };
  const onExit = () => killAll();
  const onSignal = () => {
    killAll();
    process.exit(1);
  };
  const onError = () => {
    killAll();
    process.exit(1);
  };
  process.on("exit", onExit);
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);
  process.on("uncaughtException", onError);
  process.on("unhandledRejection", onError);
  const removeListeners = () => {
    process.removeListener("exit", onExit);
    process.removeListener("SIGINT", onSignal);
    process.removeListener("SIGTERM", onSignal);
    process.removeListener("uncaughtException", onError);
    process.removeListener("unhandledRejection", onError);
  };
  try {
    const results = await Promise.all(
      params.map(
        (param) => runAmendInSubdir(param.name, childProcesses, opts)
      )
    );
    return { ok: true, value: results, error: void 0 };
  } catch (e) {
    killAll();
    return {
      ok: false,
      value: void 0,
      error: `Amend failed: ${e.message}`
    };
  } finally {
    killAll();
    removeListeners();
  }
}
var AmendFunctionAgentsParamsSchema = z.array(
  z.object({
    name: z.string(),
    spec: z.string()
  })
);

// src/tools/claude/amendFunctionAgents.ts
function makeAmendFunctionAgents(state) {
  const opts = () => ({
    apiBase: state.submitApiBase,
    apiKey: state.submitApiKey,
    gitUserName: state.gitUserName,
    gitUserEmail: state.gitUserEmail,
    ghToken: state.ghToken,
    minWidth: state.minWidth,
    maxWidth: state.maxWidth,
    onChildEvent: state.onChildEvent,
    activeChildren: state.activeChildren
  });
  return tool(
    "AmendFunctionAgents",
    "Amend existing child function agents in parallel",
    { params: AmendFunctionAgentsParamsSchema },
    async ({ params }) => {
      if (state.pendingAgentResults) {
        return resultFromResult({
          ok: false,
          value: void 0,
          error: "Agents are already running. Call WaitFunctionAgents to wait for results."
        });
      }
      state.pendingAgentResults = amendFunctionAgents(params, opts()).then(
        (r) => resultFromResult(r)
      );
      return textResult(
        "Agents spawned. Call WaitFunctionAgents to wait for results."
      );
    }
  );
}

// src/claude/amend/amendMcp.ts
function getCommonTools2(state) {
  registerSchemaRefs();
  return [
    // Core Context
    makeReadSpec(state),
    makeReadName(),
    makeReadEssay(state),
    makeReadEssayTasks(state),
    makeReadPlan(state),
    makeListExampleFunctions(state),
    makeReadExampleFunction(state),
    makeReadFunctionSchema(),
    // Function
    makeReadFunction(state),
    makeCheckFunction(),
    makeReadType(state),
    makeReadTypeSchema(),
    makeEditType(state),
    makeCheckType(),
    makeReadDescription(state),
    makeReadDescriptionSchema(),
    makeEditDescription(state),
    makeCheckDescription(),
    makeReadInputSchema(state),
    makeReadInputSchemaSchema(),
    makeEditInputSchema(state),
    makeCheckInputSchema(),
    makeReadInputMaps(state),
    makeReadInputMapsSchema(),
    makeAppendInputMap(state),
    makeDelInputMap(state),
    makeDelInputMaps(state),
    makeCheckInputMaps(),
    makeReadOutputLength(state),
    makeReadOutputLengthSchema(),
    makeEditOutputLength(state),
    makeDelOutputLength(state),
    makeCheckOutputLength(),
    makeReadInputSplit(state),
    makeReadInputSplitSchema(),
    makeEditInputSplit(state),
    makeDelInputSplit(state),
    makeCheckInputSplit(),
    makeReadInputMerge(state),
    makeReadInputMergeSchema(),
    makeEditInputMerge(state),
    makeDelInputMerge(state),
    makeCheckInputMerge(),
    makeReadTasks(state),
    makeReadTasksSchema(),
    makeAppendTask(state),
    makeEditTask(state),
    makeDelTask(state),
    makeDelTasks(state),
    makeCheckTasks(),
    makeReadMessagesExpressionSchema(),
    makeReadToolsExpressionSchema(),
    makeReadResponsesExpressionSchema(),
    // Expression params
    makeReadInputParamSchema(),
    makeReadMapParamSchema(),
    makeReadOutputParamSchema(),
    // Recursive type schemas (referenced by $ref in other schemas)
    makeReadJsonValueSchema(),
    makeReadJsonValueExpressionSchema(),
    makeReadInputValueSchema(),
    makeReadInputValueExpressionSchema(),
    // Message role schemas (expression variants)
    makeReadDeveloperMessageExpressionSchema(),
    makeReadSystemMessageExpressionSchema(),
    makeReadUserMessageExpressionSchema(),
    makeReadToolMessageExpressionSchema(),
    makeReadAssistantMessageExpressionSchema(),
    // Message role schemas (compiled variants)
    makeReadDeveloperMessageSchema(),
    makeReadSystemMessageSchema(),
    makeReadUserMessageSchema(),
    makeReadToolMessageSchema(),
    makeReadAssistantMessageSchema(),
    // Content schemas (expression variants)
    makeReadSimpleContentExpressionSchema(),
    makeReadRichContentExpressionSchema(),
    // Content schemas (compiled variants)
    makeReadSimpleContentSchema(),
    makeReadRichContentSchema(),
    // Task type schemas
    makeReadScalarFunctionTaskSchema(),
    makeReadVectorFunctionTaskSchema(),
    makeReadVectorCompletionTaskSchema(),
    // Compiled task type schemas
    makeReadCompiledScalarFunctionTaskSchema(),
    makeReadCompiledVectorFunctionTaskSchema(),
    makeReadCompiledVectorCompletionTaskSchema(),
    // Example inputs
    makeReadExampleInput(state),
    makeReadExampleInputs(state),
    makeReadExampleInputsSchema(),
    makeAppendExampleInput(state),
    makeEditExampleInput(state),
    makeDelExampleInput(state),
    makeDelExampleInputs(state),
    makeCheckExampleInputs(),
    // README
    makeReadReadme(state),
    makeWriteReadme(state),
    // Network tests
    makeRunNetworkTests(state),
    makeReadDefaultNetworkTest(),
    makeReadSwissSystemNetworkTest(),
    // Submit
    makeSubmit(state)
  ];
}
function getFunctionTasksTools2(state) {
  return [
    makeSpawnFunctionAgents(state),
    makeAmendFunctionAgents(state),
    makeWaitFunctionAgents(state),
    makeListAgentFunctions(),
    makeReadAgentFunction()
  ];
}
function buildReadLine2(state) {
  const reads = [];
  if (!state.hasReadOrWrittenSpec) reads.push("SPEC.md (including amendments)");
  reads.push("name.txt");
  if (!state.hasReadOrWrittenEssay) reads.push("ESSAY.md");
  if (!state.hasReadOrWrittenEssayTasks) reads.push("ESSAY_TASKS.md");
  if (!state.hasReadExampleFunctions) reads.push("example functions");
  reads.push("the current function definition");
  reads.push("the current example inputs");
  if (reads.length === 0) return "";
  return `
Read ${formatReadList(reads)} to understand the current state.
`;
}
function buildAmendFunctionTasksPrompt(state, amendment) {
  const readLine = buildReadLine2(state);
  return `You are amending an existing ObjectiveAI Function. Your goal is to implement the following amendment, ensure all tests pass, and submit the result.

## Amendment

${amendment}
${readLine}

## Phase 1: Understand the Amendment

Read the current function definition, tasks, and example inputs to understand the existing implementation. Only implement the amendment above \u2014 previous amendments have already been applied.

## Phase 2: Apply Changes

### Modifying the Function Definition
- Use the Edit* tools to modify function fields as needed
- Read the *Schema tools to understand what types are expected
- Only change what the amendment requires \u2014 preserve existing functionality

### Modifying Sub-Functions
- Use **AmendFunctionAgents** to amend existing sub-functions that need changes
- Use **SpawnFunctionAgents** to create new sub-functions if the amendment requires them
- Use ListAgentFunctions and ReadAgentFunction to inspect existing sub-functions

### Updating Example Inputs
- Modify, add, or remove example inputs to match the amended function behavior
- Ensure example inputs still cover edge cases and diverse scenarios

### Build and Test
- Fix issues and repeat until all tests pass

## Phase 3: Verify Compliance

Before finalizing, verify that everything adheres to SPEC.md (including amendments):
- Re-read SPEC.md carefully
- Ensure the function definition, inputs, and outputs satisfy both the original spec and all amendments
- **SPEC.md (including amendments) is the universal source of truth**

## Phase 4: Finalize

Once all tests pass and compliance is verified:
- Use the Submit tool with a commit message to validate, commit, and push
- If Submit fails, fix the issues it reports and try again

## Important Notes

- **SPEC.md (including amendments) is the universal source of truth** \u2014 never contradict it
- **Only implement this amendment** \u2014 previous amendments have already been applied
- **Preserve existing functionality** unless the amendment explicitly changes it
- **No API key is needed for tests** \u2014 tests run against a local server
`;
}
function buildAmendVectorTasksPrompt(state, amendment) {
  const readLine = buildReadLine2(state);
  return `You are amending an existing ObjectiveAI Function. Your goal is to implement the following amendment, ensure all tests pass, and submit the result.

## Amendment

${amendment}
${readLine}

## Phase 1: Understand the Amendment

Read the current function definition, tasks, and example inputs to understand the existing implementation. Only implement the amendment above \u2014 previous amendments have already been applied.

## Phase 2: Apply Changes

### Modifying the Function Definition
- Use the Edit* tools to modify function fields as needed
- Read the *Schema tools to understand what types are expected
- Only change what the amendment requires \u2014 preserve existing functionality

### Modifying Tasks
- Edit, add, or remove vector completion tasks as needed
- Use \`map\` if a task needs to iterate over input items
- Responses should be phrased as potential assistant messages. For example, if ranking dating profiles, don't ask "which profile is best" \u2014 instead ask "what is a good dating profile" and make each response a dating profile
- If a task is for ranking items from an input array, the array items go into \`responses\`, not \`messages\`

### Updating Example Inputs
- Modify, add, or remove example inputs to match the amended function behavior
- Ensure example inputs still cover edge cases and diverse scenarios

### Build and Test
- Fix issues and repeat until all tests pass

## Phase 3: Verify Compliance

Before finalizing, verify that everything adheres to SPEC.md (including amendments):
- Re-read SPEC.md carefully
- Ensure the function definition, inputs, and outputs satisfy both the original spec and all amendments
- **SPEC.md (including amendments) is the universal source of truth**

## Phase 4: Finalize

Once all tests pass and compliance is verified:
- Use the Submit tool with a commit message to validate, commit, and push
- If Submit fails, fix the issues it reports and try again

## Important Notes

- **SPEC.md (including amendments) is the universal source of truth** \u2014 never contradict it
- **Only implement this amendment** \u2014 previous amendments have already been applied
- **Preserve existing functionality** unless the amendment explicitly changes it
- **No API key is needed for tests** \u2014 tests run against a local server
`;
}
async function amendLoop(state, log, useFunctionTasks, amendment, sessionId) {
  const maxAttempts = 5;
  let attempt = 0;
  let success = false;
  let lastFailureReasons = [];
  while (attempt < maxAttempts && !success) {
    attempt++;
    log(`Amend loop attempt ${attempt}/${maxAttempts}`);
    const tools = [
      ...getCommonTools2(state),
      ...useFunctionTasks ? getFunctionTasksTools2(state) : []
    ];
    const mcpServer = createSdkMcpServer({ name: "amend", tools });
    let prompt;
    if (attempt === 1) {
      prompt = useFunctionTasks ? buildAmendFunctionTasksPrompt(state, amendment) : buildAmendVectorTasksPrompt(state, amendment);
    } else {
      prompt = `Your previous attempt failed:
${lastFailureReasons.map((r) => `- ${r}`).join("\n")}

Please try again. Remember to:
1. Use RunNetworkTests to test
2. Use Submit to validate, commit, and push
`;
    }
    const runQuery = (sid) => consumeStream(
      query({
        prompt,
        options: {
          tools: [],
          mcpServers: { amend: mcpServer },
          allowedTools: ["mcp__amend__*"],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sid
        }
      }),
      log,
      sid
    );
    try {
      sessionId = await runQuery(sessionId);
    } catch (e) {
      if (!state.anyStepRan) {
        log("Session may be invalid, retrying without session...");
        sessionId = await runQuery(void 0);
      } else {
        throw e;
      }
    }
    state.anyStepRan = true;
    log("Running submit...");
    lastFailureReasons = [];
    const submitResult = await submit(
      "amend",
      state.submitApiBase,
      state.submitApiKey,
      {
        userName: state.gitUserName,
        userEmail: state.gitUserEmail
      },
      sessionId
    );
    if (submitResult.ok) {
      success = true;
      log(`Success: Submitted commit ${submitResult.value}`);
    } else {
      lastFailureReasons.push(submitResult.error);
      log(`Submit failed: ${submitResult.error}`);
    }
  }
  if (!success) {
    throw new Error("Amend loop failed after maximum attempts.");
  }
  return sessionId;
}
async function amendMcp(state, options, amendment) {
  const log = options.log;
  const depth = options.depth;
  const useFunctionTasks = depth > 0;
  log("=== Amend Plan ===");
  let sessionId;
  try {
    sessionId = await planMcp2(state, log, depth, amendment, options.sessionId);
  } catch (e) {
    if (!state.anyStepRan) {
      log("Session may be invalid, retrying without session...");
      sessionId = await planMcp2(state, log, depth, amendment, void 0);
    } else {
      throw e;
    }
  }
  log(`=== Amend Loop: Modifying function (${useFunctionTasks ? "function" : "vector"} tasks) ===`);
  await amendLoop(state, log, useFunctionTasks, amendment, sessionId);
  log("=== ObjectiveAI Function amendment complete ===");
}
function getNextPlanIndex() {
  const plansDir = "plans";
  let nextPlanIndex = 1;
  if (existsSync(plansDir)) {
    const files = readdirSync(plansDir);
    const planNumbers = files.filter((f) => /^\d+\.md$/.test(f)).map((f) => parseInt(f.replace(".md", ""), 10)).filter((n) => !isNaN(n));
    if (planNumbers.length > 0) {
      nextPlanIndex = Math.max(...planNumbers) + 1;
    }
  }
  return nextPlanIndex;
}

// src/dashboard.ts
var Dashboard = class {
  panels = /* @__PURE__ */ new Map();
  knownNames = /* @__PURE__ */ new Set();
  lastRenderedHeight = 0;
  maxLines;
  dirty = false;
  renderTimer = null;
  headerLines = [];
  inputBuffer = "";
  inputEnabled = false;
  /** Called when the user presses Enter with a non-empty line */
  onInputSubmit;
  constructor(maxLines = 5) {
    this.maxLines = maxLines;
    this.panels.set("", { name: "unnamed function", lines: [] });
  }
  setHeader(lines) {
    this.headerLines = lines;
  }
  enableInput() {
    this.inputEnabled = true;
    this.scheduleRender();
  }
  setRootName(name) {
    const panel = this.panels.get("");
    if (panel) panel.name = name;
    this.scheduleRender();
  }
  handleEvent(evt) {
    switch (evt.event) {
      case "start": {
        if (!this.panels.has(evt.path)) {
          this.panels.set(evt.path, { name: evt.path.split("/").pop(), lines: [] });
        }
        this.knownNames.add(evt.path.split("/").pop());
        break;
      }
      case "name": {
        const panel = this.panels.get(evt.path);
        if (panel) {
          panel.name = evt.name;
        }
        break;
      }
      case "log": {
        let panel = this.panels.get(evt.path);
        if (!panel) {
          panel = { name: evt.path, lines: [] };
          this.panels.set(evt.path, panel);
        }
        const logLines = evt.line.split("\n");
        for (const l of logLines) {
          panel.lines.push(l);
          if (panel.lines.length > this.maxLines) {
            panel.lines.shift();
          }
        }
        break;
      }
      case "done": {
        this.panels.delete(evt.path);
        this.renderNow();
        return;
      }
    }
    this.scheduleRender();
  }
  /** Process raw stdin data. Call this when stdin is in raw mode. */
  handleKeystroke(data) {
    const str = data.toString("utf-8");
    if (str.charCodeAt(0) === 27) return;
    for (const ch of str) {
      const code = ch.charCodeAt(0);
      if (code === 3) {
        this.dispose();
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        process.exit(0);
      } else if (ch === "\r" || ch === "\n") {
        const line = this.inputBuffer.trim();
        this.inputBuffer = "";
        if (line && this.onInputSubmit) {
          this.onInputSubmit(line);
        }
        this.scheduleRender();
      } else if (code === 127 || code === 8) {
        if (this.inputBuffer.length > 0) {
          this.inputBuffer = this.inputBuffer.slice(0, -1);
          this.repaintInputLine();
        }
      } else if (code >= 32) {
        this.inputBuffer += ch;
        this.repaintInputLine();
      }
    }
  }
  /** Repaint only the input line in-place (no full re-render). */
  repaintInputLine() {
    if (!this.inputEnabled) return;
    process.stdout.write(`\r\x1B[2K\x1B[2m>\x1B[0m ${this.inputBuffer}`);
  }
  scheduleRender() {
    this.dirty = true;
    if (this.renderTimer) return;
    this.renderTimer = setTimeout(() => {
      this.renderTimer = null;
      if (this.dirty) this.renderNow();
    }, 50);
  }
  /** Check if path is the last sibling among sorted non-root paths */
  isLastSibling(path, index, sortedPaths) {
    const segments = path.split("/");
    const depth = segments.length;
    const parentPrefix = depth === 1 ? "" : segments.slice(0, depth - 1).join("/");
    for (let j = index + 1; j < sortedPaths.length; j++) {
      const otherSegs = sortedPaths[j].split("/");
      if (otherSegs.length < depth) continue;
      const otherParent = depth === 1 ? "" : otherSegs.slice(0, depth - 1).join("/");
      if (otherParent === parentPrefix && otherSegs[depth - 1] !== segments[depth - 1]) {
        return false;
      }
    }
    return true;
  }
  renderNow() {
    this.dirty = false;
    const out = [];
    for (const line of this.headerLines) {
      out.push(line);
    }
    if (this.headerLines.length > 0) {
      out.push("");
    }
    const root = this.panels.get("");
    if (root) {
      out.push(`\x1B[1m=== ${root.name} ===\x1B[0m`);
      for (const l of root.lines) {
        out.push(`  ${l}`);
      }
    }
    const sortedPaths = [...this.panels.keys()].filter((p) => p !== "").sort();
    const active = [];
    for (let i = 0; i < sortedPaths.length; i++) {
      const path = sortedPaths[i];
      const panel = this.panels.get(path);
      const depth = path.split("/").length;
      const isLast = this.isLastSibling(path, i, sortedPaths);
      active.length = depth - 1;
      const sepChars = active.map((a) => a ? "\u2502 " : "  ").join("");
      out.push(sepChars.trimEnd());
      let hPfx = active.map((a) => a ? "\u2502 " : "  ").join("");
      hPfx += isLast ? "\u2514\u2500 " : "\u251C\u2500 ";
      out.push(`${hPfx}\x1B[1m${panel.name}\x1B[0m`);
      active.push(!isLast);
      const cPfx = active.map((a) => a ? "\u2502 " : "  ").join("") + " ";
      for (const l of panel.lines) {
        out.push(`${cPfx}${l}`);
      }
    }
    if (this.inputEnabled) {
      out.push("");
      out.push(`\x1B[2m>\x1B[0m ${this.inputBuffer}`);
    }
    const hasInput = this.inputEnabled;
    const output = hasInput ? out.join("\n") : out.join("\n") + "\n";
    const newHeight = hasInput ? out.length - 1 : out.length;
    if (this.lastRenderedHeight > 0) {
      process.stdout.write(`\x1B[${this.lastRenderedHeight}A\r\x1B[0J`);
    }
    process.stdout.write(output);
    this.lastRenderedHeight = newHeight;
  }
  findPathByName(name) {
    for (const [path] of this.panels) {
      if (!path) continue;
      const lastSegment = path.split("/").pop();
      if (lastSegment === name) return path;
    }
    return void 0;
  }
  isKnownName(name) {
    return this.knownNames.has(name);
  }
  dispose() {
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
      this.renderTimer = null;
    }
  }
};

// src/claude/dryrun.ts
var AGENTS = [
  {
    path: "",
    name: "yc-application-scorer",
    logs: [
      "=== Initializing workspace ===",
      "=== Preparing ===",
      "Reading SPEC.md",
      "Writing ESSAY.md",
      "=== Inventing ===",
      "Compiling function tasks",
      "Spawning 3 child agents",
      "Waiting for child agents"
    ]
  },
  {
    path: "relevance-scorer",
    name: "relevance-scorer",
    logs: [
      "=== Initializing workspace ===",
      "=== Preparing ===",
      "Reading SPEC.md",
      "=== Inventing ===",
      "Spawning 2 child agents",
      "Waiting for child agents"
    ]
  },
  {
    path: "relevance-scorer/topic-detector",
    name: "topic-detector",
    logs: [
      "=== Initializing workspace ===",
      "=== Preparing ===",
      "=== Inventing ===",
      "Compiling vector tasks",
      "Running network tests",
      "Tests passed (3/3)"
    ]
  },
  {
    path: "relevance-scorer/keyword-matcher",
    name: "keyword-matcher",
    logs: [
      "=== Initializing workspace ===",
      "=== Preparing ===",
      "=== Inventing ===",
      "Compiling vector tasks",
      "Running network tests",
      "Tests passed (2/2)"
    ]
  },
  {
    path: "quality-scorer",
    name: "quality-scorer",
    logs: [
      "=== Initializing workspace ===",
      "=== Preparing ===",
      "=== Inventing ===",
      "Spawning 1 child agent",
      "Waiting for child agents"
    ]
  },
  {
    path: "quality-scorer/grammar-checker",
    name: "grammar-checker",
    logs: [
      "=== Initializing workspace ===",
      "=== Preparing ===",
      "=== Inventing ===",
      "Compiling vector tasks",
      "Running network tests",
      "Tests passed (4/4)"
    ]
  },
  {
    path: "sentiment-analyzer",
    name: "sentiment-analyzer",
    logs: [
      "=== Initializing workspace ===",
      "=== Preparing ===",
      "=== Inventing ===",
      "Compiling vector tasks",
      "Running network tests",
      "Tests passed (5/5)",
      "Submitting to GitHub"
    ]
  }
];
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function dryrun() {
  const dashboard = new Dashboard(5);
  dashboard.setHeader(bannerLines());
  dashboard.setRootName(AGENTS[0].name);
  dashboard.enableInput();
  dashboard.onInputSubmit = (line) => {
    if (line.startsWith("@")) {
      const spaceIdx = line.indexOf(" ");
      if (spaceIdx > 1) {
        const targetName = line.substring(1, spaceIdx);
        const message = line.substring(spaceIdx + 1).trim();
        if (message) {
          const path = dashboard.findPathByName(targetName);
          if (path !== void 0) {
            dashboard.handleEvent({ event: "log", path, line: `[USER]: ${message}` });
            return;
          }
          if (dashboard.isKnownName(targetName)) return;
        }
      }
    }
    dashboard.handleEvent({ event: "log", path: "", line: `[USER]: ${line}` });
  };
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", (data) => dashboard.handleKeystroke(Buffer.from(data)));
  }
  for (const agent of AGENTS) {
    if (agent.path) {
      dashboard.handleEvent({ event: "start", path: agent.path });
      await sleep(200);
      dashboard.handleEvent({ event: "name", path: agent.path, name: agent.name });
      await sleep(100);
    }
    for (const line of agent.logs) {
      dashboard.handleEvent({ event: "log", path: agent.path, line });
      await sleep(150 + Math.random() * 200);
    }
  }
  await new Promise(() => {
  });
}

// src/claude/index.ts
function setupLogging() {
  const isChild = !!process.env.OBJECTIVEAI_PARENT_PID;
  let dashboard;
  let onChildEvent;
  let logOverride;
  if (isChild) {
    logOverride = createChildLogger();
    onChildEvent = (evt) => {
      process.stdout.write(serializeEvent(evt) + "\n");
    };
  } else if (process.stdout.isTTY) {
    dashboard = new Dashboard(5);
    logOverride = createRootLogger(dashboard);
    onChildEvent = (evt) => dashboard.handleEvent(evt);
  }
  return { isChild, dashboard, onChildEvent, logOverride };
}
function emitNameEvent(isChild, dashboard) {
  const nameResult = readName();
  if (nameResult.ok && nameResult.value) {
    const name = nameResult.value.trim();
    if (dashboard) {
      dashboard.setRootName(name);
    }
    if (isChild) {
      process.stdout.write(serializeEvent({ event: "name", path: "", name }) + "\n");
    }
  }
}
function routeForward(forward, message, activeChildren) {
  const slashIdx = forward.indexOf("/");
  const childName = slashIdx === -1 ? forward : forward.substring(0, slashIdx);
  const remaining = slashIdx === -1 ? void 0 : forward.substring(slashIdx + 1);
  const childStdin = activeChildren.get(childName);
  if (!childStdin) return;
  if (remaining) {
    childStdin.write(JSON.stringify({ forward: remaining, message }) + "\n");
  } else {
    childStdin.write(message + "\n");
  }
}
function startStdinReader(queue, activeChildren, dashboard) {
  if (!process.stdin.readable) return void 0;
  if (dashboard && process.stdin.isTTY) {
    dashboard.enableInput();
    dashboard.onInputSubmit = (line) => {
      if (line.startsWith("@")) {
        const spaceIdx = line.indexOf(" ");
        if (spaceIdx > 1) {
          const targetName = line.substring(1, spaceIdx);
          const message = line.substring(spaceIdx + 1).trim();
          if (message) {
            const path = dashboard.findPathByName(targetName);
            if (path) {
              routeForward(path, message, activeChildren);
              return;
            }
            if (dashboard.isKnownName(targetName)) return;
          }
        }
      }
      queue.push(line);
    };
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const handler = (data) => dashboard.handleKeystroke(data);
    process.stdin.on("data", handler);
    return () => {
      process.stdin.removeListener("data", handler);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.pause();
    };
  }
  const rl = createInterface({ input: process.stdin });
  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed.forward === "string" && typeof parsed.message === "string") {
        routeForward(parsed.forward, parsed.message, activeChildren);
        return;
      }
    } catch {
    }
    queue.push(trimmed);
  });
  return () => rl.close();
}
function emitDoneAndDispose(isChild, dashboard) {
  if (isChild) {
    process.stdout.write(serializeEvent({ event: "done", path: "" }) + "\n");
  }
  if (dashboard) {
    dashboard.dispose();
  }
}
async function invent(partialOptions = {}) {
  const { isChild, dashboard, onChildEvent, logOverride } = setupLogging();
  if (!isChild) {
    if (dashboard) {
      dashboard.setHeader(bannerLines());
    } else {
      printBanner();
    }
  }
  const options = makeAgentOptions({
    ...partialOptions,
    ...logOverride && { log: logOverride.log },
    onChildEvent
  });
  const nextPlanIndex = getNextPlanIndex();
  const toolState = makeToolState({
    apiBase: options.apiBase,
    apiKey: options.apiKey,
    readPlanIndex: nextPlanIndex,
    writePlanIndex: nextPlanIndex,
    gitUserName: options.gitUserName,
    gitUserEmail: options.gitUserEmail,
    ghToken: options.ghToken,
    minWidth: options.minWidth,
    maxWidth: options.maxWidth,
    onChildEvent
  });
  setMessageQueue(toolState.messageQueue);
  toolState.messageQueue.onDrain = (msgs) => msgs.forEach((m) => options.log(`[USER MESSAGE]: ${m}`));
  const closeStdin = startStdinReader(toolState.messageQueue, toolState.activeChildren, dashboard);
  options.log("=== Initializing workspace ===");
  await init(options);
  options.log("=== Preparing ===");
  const sessionId = await prepare(toolState, options);
  emitNameEvent(isChild, dashboard);
  options.log("=== Inventing ===");
  await inventMcp(toolState, { ...options, sessionId });
  closeStdin?.();
  emitDoneAndDispose(isChild, dashboard);
}
async function amend(partialOptions = {}) {
  const { isChild, dashboard, onChildEvent, logOverride } = setupLogging();
  if (!isChild) {
    if (dashboard) {
      dashboard.setHeader(bannerLines());
    } else {
      printBanner();
    }
  }
  const options = makeAgentOptions({
    ...partialOptions,
    ...logOverride && { log: logOverride.log },
    onChildEvent
  });
  const amendment = options.spec;
  if (!amendment) {
    throw new Error("Amendment spec is required. Pass spec as the first argument.");
  }
  const n = appendAmendment(amendment);
  options.log(`=== Appended AMENDMENT ${n} to SPEC.md ===`);
  const nextPlanIndex = getNextPlanIndex();
  const toolState = makeToolState({
    apiBase: options.apiBase,
    apiKey: options.apiKey,
    readPlanIndex: nextPlanIndex,
    writePlanIndex: nextPlanIndex,
    gitUserName: options.gitUserName,
    gitUserEmail: options.gitUserEmail,
    ghToken: options.ghToken,
    minWidth: options.minWidth,
    maxWidth: options.maxWidth,
    onChildEvent
  });
  setMessageQueue(toolState.messageQueue);
  toolState.messageQueue.onDrain = (msgs) => msgs.forEach((m) => options.log(`[USER MESSAGE]: ${m}`));
  const closeStdin = startStdinReader(toolState.messageQueue, toolState.activeChildren, dashboard);
  options.log("=== Initializing workspace ===");
  await init(options);
  options.log("=== Preparing ===");
  const sessionId = await prepare(toolState, options);
  emitNameEvent(isChild, dashboard);
  options.log("=== Amending ===");
  await amendMcp(toolState, { ...options, sessionId }, amendment);
  closeStdin?.();
  emitDoneAndDispose(isChild, dashboard);
}

// src/tools/index.ts
var tools_exports = {};
__export(tools_exports, {
  ExpressionParams: () => expressionParams_exports,
  Function: () => function_exports,
  Inputs: () => inputs_exports,
  Markdown: () => markdown_exports,
  Parameters: () => parameters_exports,
  Profile: () => profile_exports,
  formatZodSchema: () => formatZodSchema,
  readDefaultNetworkTest: () => readDefaultNetworkTest,
  readSwissSystemNetworkTest: () => readSwissSystemNetworkTest,
  registerLazyRef: () => registerLazyRef,
  registerPropertyRefs: () => registerPropertyRefs,
  registerSchemaRef: () => registerSchemaRef,
  runNetworkTests: () => runNetworkTests
});

export { claude_exports as Claude, ExampleInputSchema, ExampleInputsSchema, SpawnFunctionAgentsParamsSchema, tools_exports as Tools, consumeStream, createChildLogger, createFileLogger, createRootLogger, formatMessage, getLatestLogPath, init, makeAgentOptions };
