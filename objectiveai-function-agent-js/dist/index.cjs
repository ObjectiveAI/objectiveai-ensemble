'use strict';

var fs = require('fs');
var path = require('path');
var objectiveai = require('objectiveai');
var claudeAgentSdk = require('@anthropic-ai/claude-agent-sdk');
var z19 = require('zod');
var child_process = require('child_process');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var z19__default = /*#__PURE__*/_interopDefault(z19);

var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/claude/index.ts
var claude_exports = {};
__export(claude_exports, {
  essayMcp: () => essayMcp,
  essayTasksMcp: () => essayTasksMcp,
  invent: () => invent,
  inventFunctionTasksMcp: () => inventFunctionTasksMcp,
  inventMcp: () => inventMcp,
  inventVectorTasksMcp: () => inventVectorTasksMcp,
  nameMcp: () => nameMcp,
  planMcp: () => planMcp,
  prepare: () => prepare,
  specMcp: () => specMcp
});
function getNextLogIndex() {
  const logsDir = "logs";
  let nextIndex = 1;
  if (fs.existsSync(logsDir)) {
    const files = fs.readdirSync(logsDir);
    const logNumbers = files.filter((f) => /^\d+\.txt$/.test(f)).map((f) => parseInt(f.replace(".txt", ""), 10)).filter((n) => !isNaN(n));
    if (logNumbers.length > 0) {
      nextIndex = Math.max(...logNumbers) + 1;
    }
  }
  return nextIndex;
}
function createFileLogger() {
  const logsDir = "logs";
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  const logIndex = getNextLogIndex();
  const logPath = `${logsDir}/${logIndex}.txt`;
  fs.writeFileSync(logPath, "");
  const log = (...args) => {
    const message = args.map((arg) => {
      if (typeof arg === "string") return arg;
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }).join(" ");
    fs.appendFileSync(logPath, message + "\n");
    console.log(...args);
  };
  return { log, logPath };
}
function getLatestLogPath() {
  const logsDir = "logs";
  if (!fs.existsSync(logsDir)) {
    return null;
  }
  const files = fs.readdirSync(logsDir);
  const logNumbers = files.filter((f) => /^\d+\.txt$/.test(f)).map((f) => parseInt(f.replace(".txt", ""), 10)).filter((n) => !isNaN(n));
  if (logNumbers.length === 0) {
    return null;
  }
  const maxIndex = Math.max(...logNumbers);
  return `${logsDir}/${maxIndex}.txt`;
}
function getFunctionPath(ref) {
  return path.join(
    "examples",
    "functions",
    ref.owner,
    ref.repository,
    ref.commit,
    "function.json"
  );
}
function getProfilePath(ref) {
  return path.join(
    "examples",
    "profiles",
    ref.owner,
    ref.repository,
    ref.commit,
    "profile.json"
  );
}
function functionExists(ref) {
  return fs.existsSync(getFunctionPath(ref));
}
function profileExists(ref) {
  return fs.existsSync(getProfilePath(ref));
}
function writeFunction(ref, data) {
  const path$1 = getFunctionPath(ref);
  fs.mkdirSync(path.dirname(path$1), { recursive: true });
  fs.writeFileSync(path$1, JSON.stringify(data, null, 2));
}
function writeProfile(ref, data) {
  const path$1 = getProfilePath(ref);
  fs.mkdirSync(path.dirname(path$1), { recursive: true });
  fs.writeFileSync(path$1, JSON.stringify(data, null, 2));
}
async function fetchFunctionRecursively(objectiveai$1, ref) {
  if (functionExists(ref)) {
    return;
  }
  const func = await objectiveai.Functions.retrieve(
    objectiveai$1,
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
      await fetchFunctionRecursively(objectiveai$1, subRef);
    }
  }
}
function isRemoteProfileTask(task) {
  return "owner" in task && "repository" in task && "commit" in task && !("tasks" in task) && !("ensemble" in task);
}
function isInlineProfileTask(task) {
  return "tasks" in task && !("ensemble" in task);
}
async function fetchProfileRecursively(objectiveai$1, ref) {
  if (profileExists(ref)) {
    return;
  }
  const profile = await objectiveai.Functions.Profiles.retrieve(
    objectiveai$1,
    ref.owner,
    ref.repository,
    ref.commit
  );
  writeProfile(ref, profile);
  async function processTaskProfiles(tasks) {
    for (const task of tasks) {
      if (isRemoteProfileTask(task)) {
        const subRef = {
          owner: task.owner,
          repository: task.repository,
          commit: task.commit
        };
        await fetchProfileRecursively(objectiveai$1, subRef);
      } else if (isInlineProfileTask(task)) {
        await processTaskProfiles(task.tasks);
      }
    }
  }
  await processTaskProfiles(profile.tasks);
}
async function fetchExamples(apiBase) {
  if (fs.existsSync(path.join("examples", "examples.json"))) {
    return;
  }
  const objectiveai$1 = new objectiveai.ObjectiveAI(apiBase ? { apiBase } : void 0);
  const { data: pairs } = await objectiveai.Functions.listPairs(objectiveai$1);
  const shuffled = pairs.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(10, shuffled.length));
  for (const pair of selected) {
    const funcRef = {
      owner: pair.function.owner,
      repository: pair.function.repository,
      commit: pair.function.commit
    };
    const profileRef = {
      owner: pair.profile.owner,
      repository: pair.profile.repository,
      commit: pair.profile.commit
    };
    await fetchFunctionRecursively(objectiveai$1, funcRef);
    await fetchProfileRecursively(objectiveai$1, profileRef);
  }
  fs.mkdirSync("examples", { recursive: true });
  fs.writeFileSync(
    path.join("examples", "examples.json"),
    JSON.stringify(selected, null, 2)
  );
}
function writeGitignore() {
  if (fs.existsSync(".gitignore")) {
    return;
  }
  fs.writeFileSync(
    ".gitignore",
    ["examples/", "agent_functions/", "networkTests/", ""].join("\n")
  );
}
async function init(options = {}) {
  writeGitignore();
  await fetchExamples(options.apiBase);
  if (!fs.existsSync("parameters.json")) {
    const parameters = {
      depth: options.depth ?? 0
    };
    fs.writeFileSync("parameters.json", JSON.stringify(parameters, null, 2));
  }
}

// src/tools/markdown/index.ts
var markdown_exports = {};
__export(markdown_exports, {
  getLatestPlanIndex: () => getLatestPlanIndex,
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
  if (!fs.existsSync("ESSAY.md")) {
    return { ok: false, value: void 0, error: "ESSAY.md is missing" };
  }
  return { ok: true, value: fs.readFileSync("ESSAY.md", "utf-8"), error: void 0 };
}
function writeEssay(content) {
  fs.writeFileSync("ESSAY.md", content);
  return { ok: true, value: void 0, error: void 0 };
}
function readEssayTasks() {
  if (!fs.existsSync("ESSAY_TASKS.md")) {
    return { ok: false, value: void 0, error: "ESSAY_TASKS.md is missing" };
  }
  return { ok: true, value: fs.readFileSync("ESSAY_TASKS.md", "utf-8"), error: void 0 };
}
function writeEssayTasks(content) {
  fs.writeFileSync("ESSAY_TASKS.md", content);
  return { ok: true, value: void 0, error: void 0 };
}
function readPlan(index) {
  const path = `plans/${index}.md`;
  if (!fs.existsSync(path)) {
    return { ok: false, value: void 0, error: `${path} is missing` };
  }
  return { ok: true, value: fs.readFileSync(path, "utf-8"), error: void 0 };
}
function writePlan(index, content) {
  fs.mkdirSync("plans", { recursive: true });
  fs.writeFileSync(`plans/${index}.md`, content);
  return { ok: true, value: void 0, error: void 0 };
}
function getLatestPlanIndex() {
  if (!fs.existsSync("plans")) {
    return { ok: false, value: void 0, error: "plans/ directory does not exist" };
  }
  const files = fs.readdirSync("plans");
  const indices = files.filter((f) => /^\d+\.md$/.test(f)).map((f) => parseInt(f.replace(".md", ""), 10)).filter((n) => !isNaN(n));
  if (indices.length === 0) {
    return { ok: false, value: void 0, error: "No plan files found" };
  }
  return { ok: true, value: Math.max(...indices), error: void 0 };
}
function readReadme() {
  if (!fs.existsSync("README.md")) {
    return { ok: false, value: void 0, error: "README.md is missing" };
  }
  return { ok: true, value: fs.readFileSync("README.md", "utf-8"), error: void 0 };
}
function writeReadme(content) {
  fs.writeFileSync("README.md", content);
  return { ok: true, value: void 0, error: void 0 };
}
function readSpec() {
  if (!fs.existsSync("SPEC.md")) {
    return { ok: false, value: void 0, error: "SPEC.md is missing" };
  }
  return { ok: true, value: fs.readFileSync("SPEC.md", "utf-8"), error: void 0 };
}
function writeSpec(content) {
  fs.writeFileSync("SPEC.md", content);
  return { ok: true, value: void 0, error: void 0 };
}

// src/tools/claude/util.ts
function textResult(text) {
  return { content: [{ type: "text", text }] };
}
function resultFromResult(result) {
  if (!result.ok) {
    return {
      content: [{ type: "text", text: result.error }],
      isError: true
    };
  }
  if (result.value === void 0) {
    return textResult("OK");
  }
  if (typeof result.value === "string") {
    return textResult(result.value);
  }
  return textResult(JSON.stringify(result.value, null, 2));
}
var ReadSpec = claudeAgentSdk.tool(
  "ReadSpec",
  "Read SPEC.md",
  {},
  async () => resultFromResult(readSpec())
);
var WriteSpec = claudeAgentSdk.tool(
  "WriteSpec",
  "Write SPEC.md",
  { content: z19__default.default.string() },
  async ({ content }) => resultFromResult(writeSpec(content))
);
function listExampleFunctions() {
  const path$1 = path.join("examples", "examples.json");
  if (!fs.existsSync(path$1)) {
    return { ok: false, value: void 0, error: "examples/examples.json does not exist" };
  }
  try {
    const content = JSON.parse(fs.readFileSync(path$1, "utf-8"));
    if (!Array.isArray(content)) {
      return { ok: false, value: void 0, error: "examples/examples.json is not an array" };
    }
    return { ok: true, value: content, error: void 0 };
  } catch (e) {
    return { ok: false, value: void 0, error: `Failed to parse examples/examples.json: ${e.message}` };
  }
}
function readExampleFunction(owner, repository, commit) {
  const path$1 = path.join("examples", "functions", owner, repository, commit, "function.json");
  if (!fs.existsSync(path$1)) {
    return { ok: false, value: void 0, error: `${path$1} does not exist` };
  }
  try {
    return { ok: true, value: JSON.parse(fs.readFileSync(path$1, "utf-8")), error: void 0 };
  } catch (e) {
    return { ok: false, value: void 0, error: `Failed to parse ${path$1}: ${e.message}` };
  }
}
var ListExampleFunctions = claudeAgentSdk.tool(
  "ListExampleFunctions",
  "List root example functions",
  {},
  async () => resultFromResult(listExampleFunctions())
);
var ReadExampleFunction = claudeAgentSdk.tool(
  "ReadExampleFunction",
  "Read an example function by owner, repository, and commit",
  {
    owner: z19__default.default.string(),
    repository: z19__default.default.string(),
    commit: z19__default.default.string()
  },
  async ({ owner, repository, commit }) => resultFromResult(readExampleFunction(owner, repository, commit))
);

// src/tools/function/index.ts
var function_exports = {};
__export(function_exports, {
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
  delInputMerge: () => delInputMerge,
  delInputSplit: () => delInputSplit,
  delOutputLength: () => delOutputLength,
  delTask: () => delTask,
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
  readOutputLength: () => readOutputLength,
  readOutputLengthSchema: () => readOutputLengthSchema,
  readTasks: () => readTasks,
  readTasksSchema: () => readTasksSchema,
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
function readFunctionSchema() {
  return objectiveai.Functions.RemoteFunctionSchema;
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
  return { ok: true, value: void 0, error: void 0 };
}
function validateFunction(fn) {
  const parsed = objectiveai.Functions.RemoteFunctionSchema.safeParse(fn);
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: void 0 };
}
function readFunction() {
  if (!fs.existsSync("function.json")) {
    return { ok: true, value: {}, error: void 0 };
  }
  let fn;
  try {
    fn = JSON.parse(fs.readFileSync("function.json", "utf-8"));
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
  if (fs.existsSync("function.json")) {
    try {
      const parsed = JSON.parse(fs.readFileSync("function.json", "utf-8"));
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
  fs.writeFileSync("function.json", JSON.stringify(ordered, null, 2));
  return { ok: true, value: void 0, error: void 0 };
}

// src/tools/function/description.ts
var DescriptionSchema = z19__default.default.string().nonempty();
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
function checkDescription() {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: void 0, error: `Unable to check description: ${fn.error}` };
  }
  const result = validateDescription(fn.value);
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
function validateDescription(fn) {
  const parsed = DescriptionSchema.safeParse(fn.description);
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
  return objectiveai.Functions.Expression.InputMapsExpressionSchema;
}
function checkInputMaps() {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to check input_maps: ${fn.error}`
    };
  }
  const result = validateInputMaps(fn.value);
  if (!result.ok) {
    return {
      ok: false,
      value: void 0,
      error: `input_maps is invalid: ${result.error}`
    };
  }
  return { ok: true, value: void 0, error: void 0 };
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
function validateInputMaps(fn) {
  const parsed = objectiveai.Functions.Expression.InputMapsExpressionSchema.safeParse(
    fn.input_maps
  );
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: void 0 };
}
var FunctionTypeSchema = z19__default.default.enum([
  ...new Set(
    objectiveai.Functions.RemoteFunctionSchema.options.map((opt) => opt.shape.type.value)
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
function checkType() {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to check type: ${fn.error}`
    };
  }
  const result = validateType(fn.value);
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
function validateType(fn) {
  const parsed = FunctionTypeSchema.safeParse(fn.type);
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: void 0 };
}

// src/tools/function/inputMerge.ts
var InputMergeSchema = objectiveai.Functions.RemoteVectorFunctionSchema.shape.input_merge;
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
function checkInputMerge() {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to check input_merge: ${fn.error}`
    };
  }
  const typeResult = validateType(fn.value);
  if (!typeResult.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to check input_merge: type is invalid: ${typeResult.error}`
    };
  }
  if (typeResult.value !== "vector.function") {
    if (fn.value.input_merge !== void 0) {
      return {
        ok: false,
        value: void 0,
        error: `input_merge must not be present for type "${typeResult.value}"`
      };
    }
    return { ok: true, value: void 0, error: void 0 };
  }
  const result = validateInputMerge(fn.value);
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
function validateInputMerge(fn) {
  const parsed = InputMergeSchema.safeParse(fn.input_merge);
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: void 0 };
}
function readInputSchema() {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: void 0, error: fn.error };
  }
  return { ok: true, value: fn.value.input_schema, error: void 0 };
}
function readInputSchemaSchema() {
  return objectiveai.Functions.Expression.InputSchemaSchema;
}
function checkInputSchema() {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to check input_schema: ${fn.error}`
    };
  }
  const result = validateInputSchema(fn.value);
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
function validateInputSchema(fn) {
  const parsed = objectiveai.Functions.Expression.InputSchemaSchema.safeParse(
    fn.input_schema
  );
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: void 0 };
}
var InputSplitSchema = objectiveai.Functions.RemoteVectorFunctionSchema.shape.input_split;
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
function checkInputSplit() {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to check input_split: ${fn.error}`
    };
  }
  const typeResult = validateType(fn.value);
  if (!typeResult.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to check input_split: type is invalid: ${typeResult.error}`
    };
  }
  if (typeResult.value !== "vector.function") {
    if (fn.value.input_split !== void 0) {
      return {
        ok: false,
        value: void 0,
        error: `input_split must not be present for type "${typeResult.value}"`
      };
    }
    return { ok: true, value: void 0, error: void 0 };
  }
  const result = validateInputSplit(fn.value);
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
function validateInputSplit(fn) {
  const parsed = InputSplitSchema.safeParse(fn.input_split);
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: void 0 };
}
var OutputLengthSchema = objectiveai.Functions.RemoteVectorFunctionSchema.shape.output_length;
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
function checkOutputLength() {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to check output_length: ${fn.error}`
    };
  }
  const typeResult = validateType(fn.value);
  if (!typeResult.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to check output_length: type is invalid: ${typeResult.error}`
    };
  }
  if (typeResult.value !== "vector.function") {
    if (fn.value.output_length !== void 0) {
      return {
        ok: false,
        value: void 0,
        error: `output_length must not be present for type "${typeResult.value}"`
      };
    }
    return { ok: true, value: void 0, error: void 0 };
  }
  const result = validateOutputLength(fn.value);
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
function validateOutputLength(fn) {
  const parsed = OutputLengthSchema.safeParse(fn.output_length);
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: void 0 };
}
var TasksSchema = objectiveai.Functions.TaskExpressionsSchema.min(1);
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
function checkTasks() {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: void 0,
      error: `Unable to check tasks: ${fn.error}`
    };
  }
  const result = validateTasks(fn.value);
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
  return editFunction({ tasks: result.value });
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
  return editFunction({ tasks: newTasks });
}
function validateTasks(fn) {
  const parsed = TasksSchema.safeParse(fn.tasks);
  if (!parsed.success) {
    return { ok: false, value: void 0, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: void 0 };
}

// src/tools/schema.ts
function formatZodSchema(schema) {
  return formatNode(schema, 0);
}
function formatNode(schema, indent) {
  const pad = "  ".repeat(indent);
  const def = schema._def ?? schema.def;
  const type = def?.type ?? "unknown";
  switch (type) {
    case "object": {
      const desc = schema.description;
      const shape = def.shape;
      const keys = Object.keys(shape);
      if (keys.length === 0) {
        const descStr = desc ? ` - ${desc}` : "";
        return `object${descStr}`;
      }
      const lines = [];
      if (desc) lines.push(`${pad}${desc}`);
      for (const key of keys) {
        const propSchema = shape[key];
        const propDesc = propSchema.description;
        const unwrapped = unwrap(propSchema);
        const innerDesc = unwrapped.inner.description;
        const displayDesc = propDesc ?? innerDesc;
        const opt = unwrapped.optional ? "?" : "";
        const nul = unwrapped.nullable ? " | null" : "";
        const typeStr = formatNode(unwrapped.inner, indent + 1);
        const descStr = displayDesc ? ` - ${displayDesc}` : "";
        lines.push(`${pad}  ${key}${opt}: ${typeStr}${nul}${descStr}`);
      }
      return `object
${lines.join("\n")}`;
    }
    case "array": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      const elementStr = formatNode(def.element, indent);
      return `${elementStr}[]${descStr}`;
    }
    case "string": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      return `string${descStr}`;
    }
    case "number": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      const bag = schema._zod?.bag;
      if (bag?.format === "int32" || bag?.format === "uint32" || bag?.format === "int64" || bag?.format === "uint64") {
        return `integer${descStr}`;
      }
      return `number${descStr}`;
    }
    case "int": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      return `integer${descStr}`;
    }
    case "boolean": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      return `boolean${descStr}`;
    }
    case "enum": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      const entries = def.entries;
      const values = Object.values(entries).map((v) => JSON.stringify(v));
      return `${values.join(" | ")}${descStr}`;
    }
    case "literal": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      const values = def.values.map((v) => JSON.stringify(v));
      return `${values.join(" | ")}${descStr}`;
    }
    case "union": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      const options = def.options;
      if (options.every(isInline)) {
        return options.map((o) => formatNode(o, indent)).join(" | ") + descStr;
      }
      const lines = [];
      if (desc) lines.push(`${pad}${desc}`);
      for (const option of options) {
        const unwrapped = unwrap(option);
        const nul = unwrapped.nullable ? " | null" : "";
        lines.push(`${pad}  | ${formatNode(unwrapped.inner, indent + 1)}${nul}`);
      }
      return `union
${lines.join("\n")}`;
    }
    case "intersection": {
      const left = formatNode(def.left, indent);
      const right = formatNode(def.right, indent);
      return `${left} & ${right}`;
    }
    case "record": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      const valueStr = formatNode(def.valueType, indent);
      return `Record<string, ${valueStr}>${descStr}`;
    }
    case "tuple": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      const items = def.items.map((item) => formatNode(item, indent));
      return `[${items.join(", ")}]${descStr}`;
    }
    case "lazy": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      const meta = schema.meta?.();
      const title = meta?.title;
      if (title) return `${title}${descStr}`;
      return `(recursive)${descStr}`;
    }
    case "optional":
      return formatNode(def.innerType, indent);
    case "nullable": {
      return `${formatNode(def.innerType, indent)} | null`;
    }
    case "default":
    case "prefault":
      return formatNode(def.innerType, indent);
    case "pipe": {
      return formatNode(def.out, indent);
    }
    case "readonly": {
      return formatNode(def.innerType, indent);
    }
    case "null": {
      return "null";
    }
    case "undefined": {
      return "undefined";
    }
    case "any": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      return `any${descStr}`;
    }
    case "unknown": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      return `unknown${descStr}`;
    }
    case "date": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      return `Date${descStr}`;
    }
    case "custom": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      return `custom${descStr}`;
    }
    default: {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      return `${type}${descStr}`;
    }
  }
}
function unwrap(schema) {
  let optional = false;
  let nullable = false;
  let current = schema;
  while (true) {
    const def = current._def ?? current.def;
    const type = def?.type ?? "";
    if (type === "optional") {
      optional = true;
      current = def.innerType;
    } else if (type === "nullable") {
      nullable = true;
      current = def.innerType;
    } else if (type === "default" || type === "prefault") {
      optional = true;
      current = def.innerType;
    } else {
      break;
    }
  }
  return { inner: current, optional, nullable };
}
function isInline(schema) {
  const def = schema._def ?? schema.def;
  def?.type ?? "";
  const unwrapped = unwrap(schema);
  const innerDef = unwrapped.inner._def ?? unwrapped.inner.def;
  const innerType = innerDef?.type ?? "";
  return ["string", "number", "int", "boolean", "literal", "null", "undefined", "any", "unknown", "date", "nan"].includes(innerType);
}

// src/tools/claude/function.ts
var ReadFunction = claudeAgentSdk.tool(
  "ReadFunction",
  "Read the full Function",
  {},
  async () => resultFromResult(readFunction())
);
var ReadFunctionSchema = claudeAgentSdk.tool(
  "ReadFunctionSchema",
  "Read the schema for Function",
  {},
  async () => textResult(formatZodSchema(readFunctionSchema()))
);
var CheckFunction = claudeAgentSdk.tool(
  "CheckFunction",
  "Validate the full Function",
  {},
  async () => resultFromResult(checkFunction())
);

// src/claude/prepare/specMcp.ts
function specIsNonEmpty() {
  return fs.existsSync("SPEC.md") && fs.readFileSync("SPEC.md", "utf-8").trim().length > 0;
}
async function specMcp(log, sessionId, spec) {
  if (spec) {
    writeSpec(spec);
    return sessionId;
  }
  if (specIsNonEmpty()) return sessionId;
  const tools = [
    ReadSpec,
    WriteSpec,
    ListExampleFunctions,
    ReadExampleFunction,
    ReadFunctionSchema
  ];
  const mcpServer = claudeAgentSdk.createSdkMcpServer({ name: "spec", tools });
  const prompt = "Read example functions to understand what ObjectiveAI Functions look like, then create SPEC.md specifying the ObjectiveAI Function to be built. Think deeply about what function to invent:\n- **Scalar Function**: For scoring (outputs a single number in [0, 1])\n- **Vector Function**: For ranking (outputs scores for multiple items that sum to ~1)\n\nBe creative and describe a function with plain language.";
  const stream = claudeAgentSdk.query({
    prompt,
    options: {
      tools: [],
      mcpServers: { spec: mcpServer },
      allowedTools: ["mcp__spec__*"],
      disallowedTools: ["AskUserQuestion"],
      permissionMode: "dontAsk",
      resume: sessionId
    }
  });
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    log(message);
  }
  let retry = 1;
  while (!specIsNonEmpty()) {
    if (retry > 3) {
      throw new Error("SPEC.md is empty after spec phase");
    }
    const stream2 = claudeAgentSdk.query({
      prompt: "SPEC.md is empty after your spec phase. Create SPEC.md specifying the ObjectiveAI Function to be built. Think deeply about what function to invent:\n- **Scalar Function**: For scoring (outputs a single number in [0, 1])\n- **Vector Function**: For ranking (outputs scores for multiple items that sum to ~1)\n\nBe creative and describe a function with plain language.",
      options: {
        tools: [],
        mcpServers: { spec: mcpServer },
        allowedTools: ["mcp__spec__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId
      }
    });
    for await (const message of stream2) {
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
      }
      log(message);
    }
    retry += 1;
  }
  return sessionId;
}
function readName() {
  if (!fs.existsSync("name.txt")) {
    return { ok: false, value: void 0, error: "name.txt is missing" };
  }
  return { ok: true, value: fs.readFileSync("name.txt", "utf-8"), error: void 0 };
}
function writeName(content) {
  fs.writeFileSync("name.txt", content);
  return { ok: true, value: void 0, error: void 0 };
}
var ReadName = claudeAgentSdk.tool(
  "ReadName",
  "Read name.txt",
  {},
  async () => resultFromResult(readName())
);
var WriteName = claudeAgentSdk.tool(
  "WriteName",
  "Write name.txt",
  { content: z19__default.default.string() },
  async ({ content }) => resultFromResult(writeName(content))
);

// src/claude/prepare/nameMcp.ts
function nameIsNonEmpty() {
  return fs.existsSync("name.txt") && fs.readFileSync("name.txt", "utf-8").trim().length > 0;
}
async function nameMcp(log, sessionId, name) {
  if (name) {
    writeName(name);
    return sessionId;
  }
  if (nameIsNonEmpty()) return sessionId;
  const tools = [
    ReadSpec,
    ReadName,
    WriteName,
    ListExampleFunctions,
    ReadExampleFunction,
    ReadFunctionSchema
  ];
  const mcpServer = claudeAgentSdk.createSdkMcpServer({ name: "name", tools });
  const stream = claudeAgentSdk.query({
    prompt: 'Read SPEC.md and example functions to understand the context, then create name.txt with the function name.\n**Do NOT include "objectiveai" or "function" or "scalar" or "vector" in the name.** Name it like you would name a function:\n- Use all lowercase\n- Use dashes (`-`) to separate words if there\'s more than one',
    options: {
      tools: [],
      mcpServers: { name: mcpServer },
      allowedTools: ["mcp__name__*"],
      disallowedTools: ["AskUserQuestion"],
      permissionMode: "dontAsk",
      resume: sessionId
    }
  });
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    log(message);
  }
  let retry = 1;
  while (!nameIsNonEmpty()) {
    if (retry > 10) {
      throw new Error("name.txt is empty after name phase");
    }
    const stream2 = claudeAgentSdk.query({
      prompt: 'name.txt is empty after your name phase. Create name.txt with the function name.\n**Do NOT include "objectiveai" or "function" or "scalar" or "vector" in the name.** Name it like you would name a function:\n- Use all lowercase\n- Use dashes (`-`) to separate words if there\'s more than one',
      options: {
        tools: [],
        mcpServers: { name: mcpServer },
        allowedTools: ["mcp__name__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId
      }
    });
    for await (const message of stream2) {
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
      }
      log(message);
    }
    retry += 1;
  }
  return sessionId;
}
var ReadEssay = claudeAgentSdk.tool(
  "ReadEssay",
  "Read ESSAY.md",
  {},
  async () => resultFromResult(readEssay())
);
var WriteEssay = claudeAgentSdk.tool(
  "WriteEssay",
  "Write ESSAY.md",
  { content: z19__default.default.string() },
  async ({ content }) => resultFromResult(writeEssay(content))
);

// src/claude/prepare/essayMcp.ts
function essayIsNonEmpty() {
  return fs.existsSync("ESSAY.md") && fs.readFileSync("ESSAY.md", "utf-8").trim().length > 0;
}
async function essayMcp(log, sessionId) {
  if (essayIsNonEmpty()) return sessionId;
  const tools = [
    ReadSpec,
    ReadName,
    ReadEssay,
    WriteEssay,
    ListExampleFunctions,
    ReadExampleFunction,
    ReadFunctionSchema
  ];
  const mcpServer = claudeAgentSdk.createSdkMcpServer({ name: "essay", tools });
  const prompt = "Read SPEC.md, name.txt, and example functions to understand the context, then create ESSAY.md describing the ObjectiveAI Function you are building. Explore the purpose, inputs, outputs, and use-cases of the function in detail. Explore, in great detail, the various qualities, values, and sentiments that must be evaluated by the function. This essay will guide the development of the function and underpins its philosophy.";
  const stream = claudeAgentSdk.query({
    prompt,
    options: {
      tools: [],
      mcpServers: { essay: mcpServer },
      allowedTools: ["mcp__essay__*"],
      disallowedTools: ["AskUserQuestion"],
      permissionMode: "dontAsk",
      resume: sessionId
    }
  });
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    log(message);
  }
  let retry = 1;
  while (!essayIsNonEmpty()) {
    if (retry > 3) {
      throw new Error("ESSAY.md is empty after essay phase");
    }
    const stream2 = claudeAgentSdk.query({
      prompt: "ESSAY.md is empty after your essay phase. Create ESSAY.md describing the ObjectiveAI Function you are building. Explore the purpose, inputs, outputs, and use-cases of the function in detail. Explore, in great detail, the various qualities, values, and sentiments that must be evaluated by the function. This essay will guide the development of the function and underpins its philosophy.",
      options: {
        tools: [],
        mcpServers: { essay: mcpServer },
        allowedTools: ["mcp__essay__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId
      }
    });
    for await (const message of stream2) {
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
      }
      log(message);
    }
    retry += 1;
  }
  return sessionId;
}
var ReadEssayTasks = claudeAgentSdk.tool(
  "ReadEssayTasks",
  "Read ESSAY_TASKS.md",
  {},
  async () => resultFromResult(readEssayTasks())
);
var WriteEssayTasks = claudeAgentSdk.tool(
  "WriteEssayTasks",
  "Write ESSAY_TASKS.md",
  { content: z19__default.default.string() },
  async ({ content }) => resultFromResult(writeEssayTasks(content))
);

// src/claude/prepare/essayTasksMcp.ts
function essayTasksIsNonEmpty() {
  return fs.existsSync("ESSAY_TASKS.md") && fs.readFileSync("ESSAY_TASKS.md", "utf-8").trim().length > 0;
}
async function essayTasksMcp(log, sessionId) {
  if (essayTasksIsNonEmpty()) return sessionId;
  const tools = [
    ReadSpec,
    ReadName,
    ReadEssay,
    ReadEssayTasks,
    WriteEssayTasks,
    ListExampleFunctions,
    ReadExampleFunction,
    ReadFunctionSchema
  ];
  const mcpServer = claudeAgentSdk.createSdkMcpServer({ name: "essayTasks", tools });
  const prompt = "Read SPEC.md, name.txt, ESSAY.md, and example functions to understand the context, then create ESSAY_TASKS.md listing and describing the key tasks the ObjectiveAI Function must perform in order to fulfill the quality, value, and sentiment evaluations defined within ESSAY.md. Each task is a plain language description of a task which will go into the function's `tasks` array.";
  const stream = claudeAgentSdk.query({
    prompt,
    options: {
      tools: [],
      mcpServers: { essayTasks: mcpServer },
      allowedTools: ["mcp__essayTasks__*"],
      disallowedTools: ["AskUserQuestion"],
      permissionMode: "dontAsk",
      resume: sessionId
    }
  });
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    log(message);
  }
  let retry = 1;
  while (!essayTasksIsNonEmpty()) {
    if (retry > 3) {
      throw new Error("ESSAY_TASKS.md is empty after essayTasks phase");
    }
    const stream2 = claudeAgentSdk.query({
      prompt: "ESSAY_TASKS.md is empty after your essayTasks phase. Create ESSAY_TASKS.md listing and describing the key tasks the ObjectiveAI Function must perform in order to fulfill the quality, value, and sentiment evaluations defined within ESSAY.md. Each task is a plain language description of a task which will go into the function's `tasks` array.",
      options: {
        tools: [],
        mcpServers: { essayTasks: mcpServer },
        allowedTools: ["mcp__essayTasks__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId
      }
    });
    for await (const message of stream2) {
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
      }
      log(message);
    }
    retry += 1;
  }
  return sessionId;
}
function makeReadPlan(index) {
  return claudeAgentSdk.tool(
    "ReadPlan",
    "Read the plan",
    {},
    async () => resultFromResult(readPlan(index))
  );
}
function makeWritePlan(index) {
  return claudeAgentSdk.tool(
    "WritePlan",
    "Write the plan",
    { content: z19__default.default.string() },
    async ({ content }) => resultFromResult(writePlan(index, content))
  );
}
claudeAgentSdk.tool(
  "GetLatestPlanIndex",
  "Get the highest existing plan index",
  {},
  async () => resultFromResult(getLatestPlanIndex())
);
function getNextPlanIndex() {
  const plansDir = "plans";
  let nextPlanIndex = 1;
  if (fs.existsSync(plansDir)) {
    const files = fs.readdirSync(plansDir);
    const planNumbers = files.filter((f) => /^\d+\.md$/.test(f)).map((f) => parseInt(f.replace(".md", ""), 10)).filter((n) => !isNaN(n));
    if (planNumbers.length > 0) {
      nextPlanIndex = Math.max(...planNumbers) + 1;
    }
  }
  return nextPlanIndex;
}
function getPlanPath(index) {
  return `plans/${index}.md`;
}

// src/claude/prepare/planMcp.ts
async function planMcp(log, sessionId) {
  const nextPlanIndex = getNextPlanIndex();
  const planPath = getPlanPath(nextPlanIndex);
  const tools = [
    ReadSpec,
    ReadName,
    ReadEssay,
    ReadEssayTasks,
    makeReadPlan(nextPlanIndex),
    makeWritePlan(nextPlanIndex),
    ListExampleFunctions,
    ReadExampleFunction,
    ReadFunctionSchema
  ];
  const mcpServer = claudeAgentSdk.createSdkMcpServer({ name: "plan", tools });
  const prompt = `Read SPEC.md, name.txt, ESSAY.md, ESSAY_TASKS.md, the function type, and example functions to understand the context. Then write your implementation plan to \`${planPath}\` (plan index ${nextPlanIndex}). Include:
- The input schema structure and field descriptions
- Whether any input maps are needed for mapped task execution
- What the function definition will look like
- What expressions need to be written
- What test inputs will cover edge cases and diverse scenarios`;
  const stream = claudeAgentSdk.query({
    prompt,
    options: {
      tools: [],
      mcpServers: { plan: mcpServer },
      allowedTools: ["mcp__plan__*"],
      disallowedTools: ["AskUserQuestion"],
      permissionMode: "dontAsk",
      resume: sessionId
    }
  });
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    log(message);
  }
  return sessionId;
}

// src/claude/prepare/index.ts
async function prepare(options = {}) {
  const log = options.log ?? createFileLogger().log;
  let sessionId = options.sessionId;
  log("=== Step 1: SPEC.md ===");
  sessionId = await specMcp(log, sessionId, options.spec);
  log("=== Step 2: name.txt ===");
  sessionId = await nameMcp(log, sessionId, options.name);
  log("=== Step 3: ESSAY.md ===");
  sessionId = await essayMcp(log, sessionId);
  log("=== Step 4: ESSAY_TASKS.md ===");
  sessionId = await essayTasksMcp(log, sessionId);
  log("=== Step 5: Plan ===");
  sessionId = await planMcp(log, sessionId);
  return sessionId;
}

// src/tools/inputs/index.ts
var inputs_exports = {};
__export(inputs_exports, {
  appendExampleInput: () => appendExampleInput,
  checkExampleInputs: () => checkExampleInputs,
  delExampleInput: () => delExampleInput,
  editExampleInput: () => editExampleInput,
  readExampleInputs: () => readExampleInputs,
  readExampleInputsSchema: () => readExampleInputsSchema,
  validateExampleInput: () => validateExampleInput,
  validateExampleInputs: () => validateExampleInputs
});
var ExampleInputSchema = z19__default.default.object({
  value: objectiveai.Functions.Expression.InputValueSchema,
  compiledTasks: objectiveai.Functions.CompiledTasksSchema,
  outputLength: z19__default.default.number().int().nonnegative().nullable().describe("Expected output length for vector functions")
});
var ExampleInputsSchema = z19__default.default.array(ExampleInputSchema).min(10).max(100).describe(
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
  if (!fs.existsSync("profile.json")) {
    return { ok: false, value: void 0, error: "profile.json is missing" };
  }
  try {
    return {
      ok: true,
      value: JSON.parse(fs.readFileSync("profile.json", "utf-8")),
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
  return objectiveai.Functions.RemoteProfileSchema;
}
function validateProfile(value) {
  const parsed = objectiveai.Functions.RemoteProfileSchema.safeParse(value);
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
  fs.writeFileSync("profile.json", JSON.stringify(profile, null, 2));
  return { ok: true, value: void 0, error: void 0 };
}

// src/tools/parameters/index.ts
var parameters_exports = {};
__export(parameters_exports, {
  checkParameters: () => checkParameters,
  readParameters: () => readParameters,
  readParametersSchema: () => readParametersSchema,
  validateParameters: () => validateParameters
});
var ParametersSchema = z19__default.default.object({
  depth: z19__default.default.number().int().nonnegative()
});
function readParameters() {
  if (!fs.existsSync("parameters.json")) {
    return { ok: true, value: { depth: 0 }, error: void 0 };
  }
  try {
    return { ok: true, value: JSON.parse(fs.readFileSync("parameters.json", "utf-8")), error: void 0 };
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
  const zodSchema = objectiveai.Functions.Expression.InputSchemaExt.toZodSchema(
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
  const zodSchema = objectiveai.Functions.Expression.InputSchemaExt.toZodSchema(inputSchemaResult.value);
  const itemSchema = ExampleInputSchema.extend({ value: zodSchema });
  let arraySchema = z19__default.default.array(itemSchema);
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
  if (!fs.existsSync("inputs.json")) {
    return { ok: true, value: [], error: void 0 };
  }
  let content;
  try {
    content = JSON.parse(fs.readFileSync("inputs.json", "utf-8"));
  } catch {
    return { ok: true, value: [], error: void 0 };
  }
  if (!Array.isArray(content)) {
    return { ok: true, value: [], error: void 0 };
  }
  return { ok: true, value: content, error: void 0 };
}
function writeExampleInputsFile(value) {
  fs.writeFileSync("inputs.json", JSON.stringify(value, null, 2));
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
  return { ok: true, value: void 0, error: void 0 };
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
  return { ok: true, value: void 0, error: void 0 };
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
    if (func.tasks.length === 0) {
      return { ok: false, value: void 0, error: "There must be at least 1 task" };
    }
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
    if (func.tasks.length < 2) {
      return { ok: false, value: void 0, error: `There must be at least 2 tasks at depth > 0, but found ${func.tasks.length}` };
    }
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
    const ctParsed = objectiveai.Functions.CompiledTasksSchema.safeParse(compiledTasks);
    if (!ctParsed.success) {
      return { ok: false, value: void 0, error: `Example input [${i}] compiledTasks schema validation failed: ${ctParsed.error.message}` };
    }
    if (!objectiveai.Functions.validateFunctionInput(func, value)) {
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
      compiledTasks = objectiveai.Functions.compileFunctionTasks(func, value);
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
  if (func.type === "vector.function") {
    for (let i = 0; i < inputs.length; i++) {
      const { value, outputLength } = inputs[i];
      const compiledOutputLength = objectiveai.Functions.compileFunctionOutputLength(func, value);
      if (compiledOutputLength === null) {
        return { ok: false, value: void 0, error: `Example input [${i}] compiled output length is null for vector function` };
      }
      if (compiledOutputLength !== outputLength) {
        return { ok: false, value: void 0, error: `Example input [${i}] compiled output length (${compiledOutputLength}) does not match expected (${outputLength})` };
      }
      if (compiledOutputLength <= 1) {
        return { ok: false, value: void 0, error: `Example input [${i}] output length must be greater than 1 for vector function, got ${compiledOutputLength}` };
      }
      const inputSplit = objectiveai.Functions.compileFunctionInputSplit(func, value);
      if (inputSplit === null) {
        return { ok: false, value: void 0, error: `Example input [${i}] input split is null for vector function` };
      }
      for (let j = 0; j < inputSplit.length; j++) {
        const compiledSplitOutputLength = objectiveai.Functions.compileFunctionOutputLength(func, inputSplit[j]);
        if (compiledSplitOutputLength !== 1) {
          return { ok: false, value: void 0, error: `Example input [${i}] split input [${j}] output length must be 1, got ${compiledSplitOutputLength}` };
        }
      }
      const mergedOutput = objectiveai.Functions.compileFunctionInputMerge(func, inputSplit);
      if (mergedOutput === null) {
        return { ok: false, value: void 0, error: `Example input [${i}] merged output is null for vector function` };
      }
      const mergedOutputLength = objectiveai.Functions.compileFunctionOutputLength(func, mergedOutput);
      if (mergedOutputLength !== outputLength) {
        return { ok: false, value: void 0, error: `Example input [${i}] merged output length (${mergedOutputLength}) does not match expected (${outputLength})` };
      }
      if (!deepEqual(mergedOutput, value)) {
        return { ok: false, value: void 0, error: `Example input [${i}] merged input does not match original input.

Original: ${JSON.stringify(value)}

Merged: ${JSON.stringify(mergedOutput)}` };
      }
    }
  }
  const allValues = inputs.map((input) => input.value);
  const coverageResult = checkSchemaCoverage(func.input_schema, allValues, "input_schema");
  if (!coverageResult.ok) {
    return coverageResult;
  }
  return { ok: true, value: void 0, error: void 0 };
}
function checkSchemaCoverage(schema, values, path) {
  if ("anyOf" in schema) {
    for (let optIdx = 0; optIdx < schema.anyOf.length; optIdx++) {
      const option = schema.anyOf[optIdx];
      const optionZod = objectiveai.Functions.Expression.InputSchemaExt.toZodSchema(option);
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
    const threshold = effectiveMin > 1 ? effectiveMin : 1;
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
      (tool23, index) => JSON.stringify(tool23) === JSON.stringify(
        b.tools[index]
      )
    );
  } else {
    return false;
  }
}
function clearDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    fs.unlinkSync(path.join(dir, file));
  }
}
async function runNetworkTests(apiBase) {
  const client = new objectiveai.ObjectiveAI(apiBase ? { apiBase } : void 0);
  const fnRaw = readFunction();
  if (!fnRaw.ok) {
    return { ok: false, value: void 0, error: `Unable to read function.json: ${fnRaw.error}` };
  }
  const funcResult = validateFunction(fnRaw.value);
  if (!funcResult.ok) {
    return { ok: false, value: void 0, error: `Function validation failed: ${funcResult.error}` };
  }
  const func = funcResult.value;
  const profileRaw = readProfile();
  if (!profileRaw.ok) {
    return { ok: false, value: void 0, error: `Unable to read profile.json: ${profileRaw.error}` };
  }
  const profileResult = validateProfile(profileRaw.value);
  if (!profileResult.ok) {
    return { ok: false, value: void 0, error: `Profile validation failed: ${profileResult.error}` };
  }
  const profile = profileResult.value;
  const file = readExampleInputs();
  if (!file.ok) {
    return { ok: false, value: void 0, error: `Unable to read inputs.json: ${file.error}` };
  }
  const inputsResult = validateExampleInputs(file.value, fnRaw.value);
  if (!inputsResult.ok) {
    return { ok: false, value: void 0, error: `Inputs validation failed: ${inputsResult.error}` };
  }
  const inputs = inputsResult.value;
  const defaultDir = path.join("networkTests", "default");
  const swissSystemDir = path.join("networkTests", "swisssystem");
  clearDir(defaultDir);
  clearDir(swissSystemDir);
  fs.mkdirSync(defaultDir, { recursive: true });
  fs.mkdirSync(swissSystemDir, { recursive: true });
  try {
    const promises = inputs.map(
      ({ value }) => objectiveai.Functions.Executions.inlineFunctionInlineProfileCreate(client, {
        input: value,
        function: func,
        profile,
        from_rng: true
      })
    );
    const results = await Promise.all(promises);
    for (let i = 0; i < inputs.length; i++) {
      const result = results[i];
      fs.writeFileSync(path.join(defaultDir, `${i}.json`), JSON.stringify(result));
      if (result.error !== null) {
        return { ok: false, value: void 0, error: `Default strategy: execution failed for input [${i}]: ${JSON.stringify(result.error)}` };
      }
      if (result.tasks_errors) {
        return { ok: false, value: void 0, error: `Default strategy: task errors for input [${i}]` };
      }
    }
  } catch (e) {
    return { ok: false, value: void 0, error: `Default strategy: ${e.message}` };
  }
  if (func.type === "vector.function") {
    try {
      const promises = inputs.map(
        ({ value }) => objectiveai.Functions.Executions.inlineFunctionInlineProfileCreate(client, {
          input: value,
          function: func,
          profile,
          from_rng: true,
          strategy: { type: "swiss_system" }
        })
      );
      const results = await Promise.all(promises);
      for (let i = 0; i < inputs.length; i++) {
        const result = results[i];
        fs.writeFileSync(path.join(swissSystemDir, `${i}.json`), JSON.stringify(result));
        if (result.error !== null) {
          return { ok: false, value: void 0, error: `SwissSystem strategy: execution failed for input [${i}]: ${JSON.stringify(result.error)}` };
        }
        if (result.tasks_errors) {
          return { ok: false, value: void 0, error: `SwissSystem strategy: task errors for input [${i}]` };
        }
      }
    } catch (e) {
      return { ok: false, value: void 0, error: `SwissSystem strategy: ${e.message}` };
    }
  }
  return { ok: true, value: void 0, error: void 0 };
}
function readDefaultNetworkTest(index) {
  const filePath = path.join("networkTests", "default", `${index}.json`);
  if (!fs.existsSync(filePath)) {
    return { ok: false, value: void 0, error: `File not found: ${filePath}` };
  }
  try {
    return { ok: true, value: JSON.parse(fs.readFileSync(filePath, "utf-8")), error: void 0 };
  } catch (e) {
    return { ok: false, value: void 0, error: `Failed to parse ${filePath}: ${e.message}` };
  }
}
function readSwissSystemNetworkTest(index) {
  const filePath = path.join("networkTests", "swisssystem", `${index}.json`);
  if (!fs.existsSync(filePath)) {
    return { ok: false, value: void 0, error: `File not found: ${filePath}` };
  }
  try {
    return { ok: true, value: JSON.parse(fs.readFileSync(filePath, "utf-8")), error: void 0 };
  } catch (e) {
    return { ok: false, value: void 0, error: `Failed to parse ${filePath}: ${e.message}` };
  }
}

// src/tools/submit.ts
function gh(args) {
  return child_process.execSync(`gh ${args}`, { encoding: "utf-8", stdio: "pipe" }).trim();
}
function getUpstream() {
  try {
    return child_process.execSync("git remote get-url origin", {
      encoding: "utf-8",
      stdio: "pipe"
    }).trim();
  } catch {
    return null;
  }
}
function ensureGitHubRepo(name, description) {
  const upstream = getUpstream();
  if (!upstream) {
    let cmd = `repo create ${name} --public --source=. --push`;
    if (description) {
      cmd += ` --description "${description.replace(/"/g, '\\"')}"`;
    }
    gh(cmd);
  } else {
    const match = upstream.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (match) {
      const repo = `${match[1]}/${match[2]}`;
      if (description) {
        gh(
          `repo edit ${repo} --description "${description.replace(/"/g, '\\"')}"`
        );
      }
    }
    child_process.execSync("git push", { stdio: "inherit" });
  }
}
async function submit(message, apiBase) {
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
  const testsResult = await runNetworkTests(apiBase);
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
  child_process.execSync("git add -A", { stdio: "pipe" });
  try {
    child_process.execSync("git diff --cached --quiet", { stdio: "pipe" });
  } catch {
    child_process.execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      stdio: "inherit"
    });
  }
  try {
    ensureGitHubRepo(name, description);
  } catch (e) {
    return {
      ok: false,
      value: void 0,
      error: `Git push failed: ${e.message}`
    };
  }
  const commit = child_process.execSync("git rev-parse HEAD", {
    encoding: "utf-8",
    stdio: "pipe"
  }).trim();
  return { ok: true, value: commit, error: void 0 };
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
  const zodSchema = objectiveai.Functions.Expression.InputSchemaExt.toZodSchema(
    validated.value
  );
  return { ok: true, value: zodSchema, error: void 0 };
}
function readMapParamSchema() {
  return objectiveai.Functions.Expression.InputMapsAsParameterSchema;
}
function readOutputParamSchema() {
  return objectiveai.Functions.Expression.TaskOutputSchema;
}

// src/tools/claude/expressionParams.ts
var ReadInputParamSchema = claudeAgentSdk.tool(
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
var ReadMapParamSchema = claudeAgentSdk.tool(
  "ReadMapParamSchema",
  "Read the schema for `map` available in mapped task expression context. A 1D array element from the 2D input maps.",
  {},
  async () => textResult(formatZodSchema(readMapParamSchema()))
);
var ReadOutputParamSchema = claudeAgentSdk.tool(
  "ReadOutputParamSchema",
  "Read the schema for `output` available in task output expression context.",
  {},
  async () => textResult(formatZodSchema(readOutputParamSchema()))
);
var ReadType = claudeAgentSdk.tool(
  "ReadType",
  "Read the Function's `type` field",
  {},
  async () => resultFromResult(readType())
);
var ReadTypeSchema = claudeAgentSdk.tool(
  "ReadTypeSchema",
  "Read the schema for Function `type` field",
  {},
  async () => textResult(formatZodSchema(readTypeSchema()))
);
var EditType = claudeAgentSdk.tool(
  "EditType",
  "Edit the Function's `type` field",
  { value: z19__default.default.string() },
  async ({ value }) => resultFromResult(editType(value))
);
var CheckType = claudeAgentSdk.tool(
  "CheckType",
  "Validate the Function's `type` field",
  {},
  async () => resultFromResult(checkType())
);
var ReadDescription = claudeAgentSdk.tool(
  "ReadDescription",
  "Read the Function's `description` field",
  {},
  async () => resultFromResult(readDescription())
);
var ReadDescriptionSchema = claudeAgentSdk.tool(
  "ReadDescriptionSchema",
  "Read the schema for Function `description` field",
  {},
  async () => textResult(formatZodSchema(readDescriptionSchema()))
);
var EditDescription = claudeAgentSdk.tool(
  "EditDescription",
  "Edit the Function's `description` field",
  { value: z19__default.default.string() },
  async ({ value }) => resultFromResult(editDescription(value))
);
var CheckDescription = claudeAgentSdk.tool(
  "CheckDescription",
  "Validate the Function's `description` field",
  {},
  async () => resultFromResult(checkDescription())
);
var ReadInputSchema = claudeAgentSdk.tool(
  "ReadInputSchema",
  "Read the Function's `input_schema` field",
  {},
  async () => resultFromResult(readInputSchema())
);
var ReadInputSchemaSchema = claudeAgentSdk.tool(
  "ReadInputSchemaSchema",
  "Read the schema for Function `input_schema` field",
  {},
  async () => textResult(formatZodSchema(readInputSchemaSchema()))
);
var EditInputSchema = claudeAgentSdk.tool(
  "EditInputSchema",
  "Edit the Function's `input_schema` field",
  { value: z19__default.default.record(z19__default.default.string(), z19__default.default.unknown()) },
  async ({ value }) => resultFromResult(editInputSchema(value))
);
var CheckInputSchema = claudeAgentSdk.tool(
  "CheckInputSchema",
  "Validate the Function's `input_schema` field",
  {},
  async () => resultFromResult(checkInputSchema())
);
var ReadInputMaps = claudeAgentSdk.tool(
  "ReadInputMaps",
  "Read the Function's `input_maps` field",
  {},
  async () => resultFromResult(readInputMaps())
);
var ReadInputMapsSchema = claudeAgentSdk.tool(
  "ReadInputMapsSchema",
  "Read the schema for Function `input_maps` field",
  {},
  async () => textResult(formatZodSchema(readInputMapsSchema()))
);
var EditInputMaps = claudeAgentSdk.tool(
  "EditInputMaps",
  "Edit the Function's `input_maps` field",
  { value: z19__default.default.unknown().nullable() },
  async ({ value }) => resultFromResult(editInputMaps(value))
);
var CheckInputMaps = claudeAgentSdk.tool(
  "CheckInputMaps",
  "Validate the Function's `input_maps` field",
  {},
  async () => resultFromResult(checkInputMaps())
);
var ReadOutputLength = claudeAgentSdk.tool(
  "ReadOutputLength",
  "Read the Function's `output_length` field",
  {},
  async () => resultFromResult(readOutputLength())
);
var ReadOutputLengthSchema = claudeAgentSdk.tool(
  "ReadOutputLengthSchema",
  "Read the schema for Function `output_length` field",
  {},
  async () => textResult(formatZodSchema(readOutputLengthSchema()))
);
var EditOutputLength = claudeAgentSdk.tool(
  "EditOutputLength",
  "Edit the Function's `output_length` field",
  { value: z19__default.default.unknown().nullable() },
  async ({ value }) => resultFromResult(editOutputLength(value))
);
var DelOutputLength = claudeAgentSdk.tool(
  "DelOutputLength",
  "Delete the Function's `output_length` field",
  {},
  async () => resultFromResult(delOutputLength())
);
var CheckOutputLength = claudeAgentSdk.tool(
  "CheckOutputLength",
  "Validate the Function's `output_length` field",
  {},
  async () => resultFromResult(checkOutputLength())
);
var ReadInputSplit = claudeAgentSdk.tool(
  "ReadInputSplit",
  "Read the Function's `input_split` field",
  {},
  async () => resultFromResult(readInputSplit())
);
var ReadInputSplitSchema = claudeAgentSdk.tool(
  "ReadInputSplitSchema",
  "Read the schema for Function `input_split` field",
  {},
  async () => textResult(formatZodSchema(readInputSplitSchema()))
);
var EditInputSplit = claudeAgentSdk.tool(
  "EditInputSplit",
  "Edit the Function's `input_split` field",
  { value: z19__default.default.unknown().nullable() },
  async ({ value }) => resultFromResult(editInputSplit(value))
);
var DelInputSplit = claudeAgentSdk.tool(
  "DelInputSplit",
  "Delete the Function's `input_split` field",
  {},
  async () => resultFromResult(delInputSplit())
);
var CheckInputSplit = claudeAgentSdk.tool(
  "CheckInputSplit",
  "Validate the Function's `input_split` field",
  {},
  async () => resultFromResult(checkInputSplit())
);
var ReadInputMerge = claudeAgentSdk.tool(
  "ReadInputMerge",
  "Read the Function's `input_merge` field",
  {},
  async () => resultFromResult(readInputMerge())
);
var ReadInputMergeSchema = claudeAgentSdk.tool(
  "ReadInputMergeSchema",
  "Read the schema for Function `input_merge` field",
  {},
  async () => textResult(formatZodSchema(readInputMergeSchema()))
);
var EditInputMerge = claudeAgentSdk.tool(
  "EditInputMerge",
  "Edit the Function's `input_merge` field",
  { value: z19__default.default.unknown().nullable() },
  async ({ value }) => resultFromResult(editInputMerge(value))
);
var DelInputMerge = claudeAgentSdk.tool(
  "DelInputMerge",
  "Delete the Function's `input_merge` field",
  {},
  async () => resultFromResult(delInputMerge())
);
var CheckInputMerge = claudeAgentSdk.tool(
  "CheckInputMerge",
  "Validate the Function's `input_merge` field",
  {},
  async () => resultFromResult(checkInputMerge())
);
var ReadTasks = claudeAgentSdk.tool(
  "ReadTasks",
  "Read the Function's `tasks` field",
  {},
  async () => resultFromResult(readTasks())
);
var ReadTasksSchema = claudeAgentSdk.tool(
  "ReadTasksSchema",
  "Read the schema for Function `tasks` field",
  {},
  async () => textResult(formatZodSchema(readTasksSchema()))
);
var AppendTask = claudeAgentSdk.tool(
  "AppendTask",
  "Append a task to the Function's `tasks` array",
  { value: z19__default.default.record(z19__default.default.string(), z19__default.default.unknown()) },
  async ({ value }) => resultFromResult(appendTask(value))
);
var EditTask = claudeAgentSdk.tool(
  "EditTask",
  "Replace a task at a specific index in the Function's `tasks` array",
  {
    index: z19__default.default.number().int().nonnegative(),
    value: z19__default.default.record(z19__default.default.string(), z19__default.default.unknown())
  },
  async ({ index, value }) => resultFromResult(editTask(index, value))
);
var DelTask = claudeAgentSdk.tool(
  "DelTask",
  "Delete a task at a specific index from the Function's `tasks` array",
  { index: z19__default.default.int().nonnegative() },
  async ({ index }) => resultFromResult(delTask(index))
);
var CheckTasks = claudeAgentSdk.tool(
  "CheckTasks",
  "Validate the Function's `tasks` field",
  {},
  async () => resultFromResult(checkTasks())
);
var ReadExampleInputs = claudeAgentSdk.tool(
  "ReadExampleInputs",
  "Read the Function's example inputs",
  {},
  async () => resultFromResult(readExampleInputs())
);
var ReadExampleInputsSchema = claudeAgentSdk.tool(
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
var AppendExampleInput = claudeAgentSdk.tool(
  "AppendExampleInput",
  "Append an example input to the Function's example inputs array",
  { value: z19__default.default.record(z19__default.default.string(), z19__default.default.unknown()) },
  async ({ value }) => resultFromResult(appendExampleInput(value))
);
var EditExampleInput = claudeAgentSdk.tool(
  "EditExampleInput",
  "Replace an example input at a specific index in the Function's example inputs array",
  {
    index: z19__default.default.number().int().nonnegative(),
    value: z19__default.default.record(z19__default.default.string(), z19__default.default.unknown())
  },
  async ({ index, value }) => resultFromResult(editExampleInput(index, value))
);
var DelExampleInput = claudeAgentSdk.tool(
  "DelExampleInput",
  "Delete an example input at a specific index from the Function's example inputs array",
  { index: z19__default.default.number().int().nonnegative() },
  async ({ index }) => resultFromResult(delExampleInput(index))
);
var CheckExampleInputs = claudeAgentSdk.tool(
  "CheckExampleInputs",
  "Validate the Function's example inputs",
  {},
  async () => resultFromResult(checkExampleInputs())
);
function makeRunNetworkTests(apiBase) {
  return claudeAgentSdk.tool(
    "RunNetworkTests",
    "Execute the function once for each example input and write results to networkTests/",
    {},
    async () => resultFromResult(await runNetworkTests(apiBase))
  );
}
var ReadDefaultNetworkTest = claudeAgentSdk.tool(
  "ReadDefaultNetworkTest",
  "Read a default strategy network test result by index",
  { index: z19__default.default.number().int().nonnegative() },
  async ({ index }) => resultFromResult(readDefaultNetworkTest(index))
);
var ReadSwissSystemNetworkTest = claudeAgentSdk.tool(
  "ReadSwissSystemNetworkTest",
  "Read a swiss_system strategy network test result by index",
  { index: z19__default.default.number().int().nonnegative() },
  async ({ index }) => resultFromResult(readSwissSystemNetworkTest(index))
);
var ReadReadme = claudeAgentSdk.tool(
  "ReadReadme",
  "Read README.md",
  {},
  async () => resultFromResult(readReadme())
);
var WriteReadme = claudeAgentSdk.tool(
  "WriteReadme",
  "Write README.md",
  { content: z19__default.default.string() },
  async ({ content }) => resultFromResult(writeReadme(content))
);
function makeSubmit(apiBase) {
  return claudeAgentSdk.tool(
    "Submit",
    "Check function, check example inputs, run network tests, commit and push to GitHub (if all successful)",
    { message: z19__default.default.string().describe("Commit message") },
    async ({ message }) => resultFromResult(await submit(message, apiBase))
  );
}
function getCurrentDepth() {
  if (!fs.existsSync("parameters.json")) {
    return 0;
  }
  const content = fs.readFileSync("parameters.json", "utf-8");
  const params = JSON.parse(content);
  return params.depth ?? 0;
}
function runAgentInSubdir(name, spec, childDepth, childProcesses) {
  const subdir = path.join("agent_functions", name);
  fs.mkdirSync(subdir, { recursive: true });
  const runnerScript = `
import { Claude } from "@objectiveai/function-agent";

async function main(): Promise<void> {
  await Claude.invent({ name: ${JSON.stringify(name)}, spec: ${JSON.stringify(spec)}, depth: ${childDepth} });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
`;
  const runnerPath = path.join(subdir, "_runner.ts");
  fs.writeFileSync(runnerPath, runnerScript);
  return new Promise((resolve) => {
    const child = child_process.spawn("npx", ["ts-node", "_runner.ts"], {
      cwd: subdir,
      stdio: ["inherit", "pipe", "pipe"],
      shell: true
    });
    childProcesses.push(child);
    child.stdout?.on("data", () => {
    });
    child.stderr?.on("data", () => {
    });
    child.on("close", (code) => {
      if (code !== 0) {
        resolve({
          name,
          error: `Agent exited with code ${code}. See ${subdir}/logs/ for details.`
        });
        return;
      }
      try {
        const remote = child_process.execSync("git remote get-url origin", {
          cwd: subdir,
          encoding: "utf-8"
        }).trim();
        const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
        const owner = match?.[1] ?? "unknown";
        const repository = match?.[2] ?? name;
        const commit = child_process.execSync("git rev-parse HEAD", {
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
async function spawnFunctionAgents(params) {
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
  for (const param of params) {
    const dir = path.join("agent_functions", param.name);
    if (param.overwrite && fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (err) {
        return {
          ok: false,
          value: void 0,
          error: `Failed to delete ${dir}: ${err}. If this error persists, make a new function with a different name instead.`
        };
      }
    }
  }
  for (const param of params) {
    const dir = path.join("agent_functions", param.name);
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      return {
        ok: false,
        value: void 0,
        error: `agent_functions/${param.name} already exists. Set "overwrite": true to replace it, or use a different name.`
      };
    }
  }
  const currentDepth = getCurrentDepth();
  const childDepth = Math.max(0, currentDepth - 1);
  const childProcesses = [];
  const killAll = () => {
    for (const child of childProcesses) {
      if (!child.killed && child.pid) {
        try {
          process.kill(child.pid);
        } catch {
        }
      }
    }
  };
  const onExit = () => killAll();
  process.on("exit", onExit);
  try {
    const results = await Promise.all(
      params.map(
        (param) => runAgentInSubdir(param.name, param.spec, childDepth, childProcesses)
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
    process.removeListener("exit", onExit);
  }
}
var SpawnFunctionAgentsParamsSchema = z19.z.array(
  z19.z.object({
    name: z19.z.string(),
    spec: z19.z.string(),
    overwrite: z19.z.boolean().optional()
  })
);

// src/tools/claude/spawnFunctionAgents.ts
var SpawnFunctionAgents = claudeAgentSdk.tool(
  "SpawnFunctionAgents",
  "Spawn child function agents in parallel",
  { params: SpawnFunctionAgentsParamsSchema },
  async ({ params }) => resultFromResult(await spawnFunctionAgents(params))
);
function listAgentFunctions() {
  const dir = "agent_functions";
  if (!fs.existsSync(dir)) {
    return { ok: true, value: [], error: void 0 };
  }
  const entries = fs.readdirSync(dir);
  const results = [];
  for (const entry of entries) {
    const subPath = `${dir}/${entry}`;
    if (!fs.statSync(subPath).isDirectory() || entry.startsWith(".")) continue;
    let commit;
    try {
      commit = child_process.execSync("git rev-parse HEAD", {
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
      const remote = child_process.execSync("git remote get-url origin", {
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
  if (!fs.existsSync(subPath) || !fs.statSync(subPath).isDirectory()) {
    return { ok: false, value: void 0, error: `agent_functions/${name} does not exist` };
  }
  let commit;
  try {
    commit = child_process.execSync("git rev-parse HEAD", {
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
    const remote = child_process.execSync("git remote get-url origin", {
      cwd: subPath,
      encoding: "utf-8",
      stdio: "pipe"
    }).trim();
    const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    owner = match?.[1] ?? "";
    repository = match?.[2] ?? "";
  } catch {
  }
  return { ok: true, value: { name, owner, repository, commit, path: subPath }, error: void 0 };
}
var ListAgentFunctions = claudeAgentSdk.tool(
  "ListAgentFunctions",
  "List all agent functions with their owner, repository, and commit",
  {},
  async () => resultFromResult(listAgentFunctions())
);
var ReadAgentFunction = claudeAgentSdk.tool(
  "ReadAgentFunction",
  "Read an agent function by name",
  { name: z19__default.default.string() },
  async ({ name }) => resultFromResult(readAgentFunction(name))
);

// src/claude/invent/inventMcp.ts
function getCommonTools(planIndex, apiBase) {
  return [
    // Core Context
    ReadSpec,
    ReadName,
    ReadEssay,
    ReadEssayTasks,
    makeReadPlan(planIndex),
    ListExampleFunctions,
    ReadExampleFunction,
    ReadFunctionSchema,
    // Function
    ReadFunction,
    CheckFunction,
    ReadType,
    ReadTypeSchema,
    EditType,
    CheckType,
    ReadDescription,
    ReadDescriptionSchema,
    EditDescription,
    CheckDescription,
    ReadInputSchema,
    ReadInputSchemaSchema,
    EditInputSchema,
    CheckInputSchema,
    ReadInputMaps,
    ReadInputMapsSchema,
    EditInputMaps,
    CheckInputMaps,
    ReadOutputLength,
    ReadOutputLengthSchema,
    EditOutputLength,
    DelOutputLength,
    CheckOutputLength,
    ReadInputSplit,
    ReadInputSplitSchema,
    EditInputSplit,
    DelInputSplit,
    CheckInputSplit,
    ReadInputMerge,
    ReadInputMergeSchema,
    EditInputMerge,
    DelInputMerge,
    CheckInputMerge,
    ReadTasks,
    ReadTasksSchema,
    AppendTask,
    EditTask,
    DelTask,
    CheckTasks,
    // Expression params
    ReadInputParamSchema,
    ReadMapParamSchema,
    ReadOutputParamSchema,
    // Example inputs
    ReadExampleInputs,
    ReadExampleInputsSchema,
    AppendExampleInput,
    EditExampleInput,
    DelExampleInput,
    CheckExampleInputs,
    // README
    ReadReadme,
    WriteReadme,
    // Network tests
    makeRunNetworkTests(apiBase),
    ReadDefaultNetworkTest,
    ReadSwissSystemNetworkTest,
    // Submit
    makeSubmit(apiBase)
  ];
}
function getFunctionTasksTools() {
  return [SpawnFunctionAgents, ListAgentFunctions, ReadAgentFunction];
}
function buildFunctionTasksPrompt() {
  return `You are inventing a new ObjectiveAI Function. Your goal is to complete the implementation, add example inputs, ensure all tests pass, and submit the result.

Read SPEC.md, name.txt, ESSAY.md, ESSAY_TASKS.md, the plan, and example functions to understand the context.

## Phase 1: Implementation

### Task Structure

This function must use **function tasks** (type: \`scalar.function\` or \`vector.function\`). You must create **at least 2 sub-functions** by spawning child agents:

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

3. Parse the result to get \`{name, owner, repository, commit}\` for each

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
- **Use Starlark expressions** (\`{"$starlark": "..."}\`) for most expressions - it's Python-like and more readable
- Only use JMESPath (\`{"$jmespath": "..."}\`) for very simple field access expressions
- Starlark example: \`{"$starlark": "input['items'][0]"}\`
- JMESPath example: \`{"$jmespath": "input.name"}\` (simple field access only)

### Expression Context
Expressions receive a single object with these fields:
- \`input\` - Always present, the function input
- \`map\` - Present in mapped tasks, the current map element
- \`output\` - Present in task output expressions, the raw task result (FunctionOutput, or array of FunctionOutputs if mapped)

### Example Inputs
- Use AppendExampleInput to add diverse test inputs (minimum 10, maximum 100)
- **Diversity in structure**: Include edge cases like empty arrays, single items, boundary values, missing optional fields, maximum lengths
- **Diversity in intended output**: Cover the full range of expected scores (low, medium, high quality inputs that should produce different outputs)
- **Multimodal content**: For fields that accept images, audio, video, or files, use bogus/placeholder string values (e.g. \`"https://example.com/image.jpg"\`). This is fine for testing - exercise the various modalities

### Build and Test
- Use RunNetworkTests to execute the function for each example input
- If tests fail, use ReadDefaultNetworkTest and ReadSwissSystemNetworkTest to read individual results
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
- **Prefer Starlark over JMESPath** - Starlark is more readable and powerful
`;
}
function buildVectorTasksPrompt() {
  return `You are inventing a new ObjectiveAI Function. Your goal is to complete the implementation, add example inputs, ensure all tests pass, and submit the result.

Read SPEC.md, name.txt, ESSAY.md, ESSAY_TASKS.md, the plan, and example functions to understand the context.

## Phase 1: Implementation

### Task Structure

This function must use **vector completion tasks** (type: \`vector.completion\`). Create 1 or more inline vector completion tasks using AppendTask:
- Use \`map\` if a task needs to iterate over input items
- Each task's prompt and responses define what gets evaluated

### Function Definition
- Use the Edit* tools to define each function field
- Read the *Schema tools to understand what types are expected
- **Use Starlark expressions** (\`{"$starlark": "..."}\`) for most expressions - it's Python-like and more readable
- Only use JMESPath (\`{"$jmespath": "..."}\`) for very simple field access expressions
- Starlark example: \`{"$starlark": "input['items'][0]"}\`
- JMESPath example: \`{"$jmespath": "input.name"}\` (simple field access only)

### Expression Context
Expressions receive a single object with these fields:
- \`input\` - Always present, the function input
- \`map\` - Present in mapped tasks, the current map element
- \`output\` - Present in task output expressions, the raw task result (VectorCompletionOutput, or array of VectorCompletionOutputs if mapped)

### Example Inputs
- Use AppendExampleInput to add diverse test inputs (minimum 10, maximum 100)
- **Diversity in structure**: Include edge cases like empty arrays, single items, boundary values, missing optional fields, maximum lengths
- **Diversity in intended output**: Cover the full range of expected scores (low, medium, high quality inputs that should produce different outputs)
- **Multimodal content**: For fields that accept images, audio, video, or files, use bogus/placeholder string values (e.g. \`"https://example.com/image.jpg"\`). This is fine for testing - exercise the various modalities

### Build and Test
- Use RunNetworkTests to execute the function for each example input
- If tests fail, use ReadDefaultNetworkTest and ReadSwissSystemNetworkTest to read individual results
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
- **Prefer Starlark over JMESPath** - Starlark is more readable and powerful
`;
}
async function inventLoop(log, useFunctionTasks, sessionId, apiBase) {
  const nextPlanIndex = getNextPlanIndex();
  const maxAttempts = 5;
  let attempt = 0;
  let success = false;
  let lastFailureReasons = [];
  while (attempt < maxAttempts && !success) {
    attempt++;
    log(`Invent loop attempt ${attempt}/${maxAttempts}`);
    const tools = [
      ...getCommonTools(nextPlanIndex, apiBase),
      ...useFunctionTasks ? getFunctionTasksTools() : []
    ];
    const mcpServer = claudeAgentSdk.createSdkMcpServer({ name: "invent", tools });
    let prompt;
    if (attempt === 1) {
      prompt = useFunctionTasks ? buildFunctionTasksPrompt() : buildVectorTasksPrompt();
    } else {
      prompt = `Your previous attempt failed:
${lastFailureReasons.map((r) => `- ${r}`).join("\n")}

Please try again. Remember to:
1. Use RunNetworkTests to test
2. Use Submit to validate, commit, and push
`;
    }
    const stream = claudeAgentSdk.query({
      prompt,
      options: {
        tools: [],
        mcpServers: { invent: mcpServer },
        allowedTools: ["mcp__invent__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId
      }
    });
    for await (const message of stream) {
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
      }
      log(message);
    }
    log("Running submit...");
    lastFailureReasons = [];
    const submitResult = await submit("submit", apiBase);
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
async function inventFunctionTasksMcp(options = {}) {
  const log = options.log ?? createFileLogger().log;
  log("=== Invent Loop: Creating new function (function tasks) ===");
  await inventLoop(log, true, options.sessionId, options.apiBase);
  log("=== ObjectiveAI Function invention complete ===");
}
async function inventVectorTasksMcp(options = {}) {
  const log = options.log ?? createFileLogger().log;
  log("=== Invent Loop: Creating new function (vector tasks) ===");
  await inventLoop(log, false, options.sessionId, options.apiBase);
  log("=== ObjectiveAI Function invention complete ===");
}
async function inventMcp(options = {}) {
  const depth = options.depth ?? 0;
  if (depth === 0) {
    await inventVectorTasksMcp(options);
  } else {
    await inventFunctionTasksMcp(options);
  }
}

// src/claude/index.ts
async function invent(options = {}) {
  const log = options.log ?? createFileLogger().log;
  log("=== Initializing workspace ===");
  await init(options);
  log("=== Preparing ===");
  const sessionId = await prepare(options);
  log("=== Inventing ===");
  await inventMcp({ ...options, sessionId });
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
  runNetworkTests: () => runNetworkTests
});

exports.Claude = claude_exports;
exports.ExampleInputSchema = ExampleInputSchema;
exports.ExampleInputsSchema = ExampleInputsSchema;
exports.SpawnFunctionAgentsParamsSchema = SpawnFunctionAgentsParamsSchema;
exports.Tools = tools_exports;
exports.createFileLogger = createFileLogger;
exports.getLatestLogPath = getLatestLogPath;
exports.init = init;
