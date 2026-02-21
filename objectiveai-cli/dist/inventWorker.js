import { parentPort } from 'worker_threads';
import { basename, relative, join } from 'path';
import { existsSync, mkdirSync, rmSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import z3 from 'zod';
import { Functions, listRefDependencies, getJsonSchema } from 'objectiveai';
import { randomUUID } from 'crypto';
import { homedir } from 'os';
import { tool, createSdkMcpServer, query } from '@anthropic-ai/claude-agent-sdk';
import { execSync } from 'child_process';

// src/worker/inventWorker.ts
var ParametersBaseSchema = z3.object({
  branchMinWidth: z3.int().positive().describe("The minimum number of tasks for branch functions."),
  branchMaxWidth: z3.int().positive().describe("The maximum number of tasks for branch functions."),
  leafMinWidth: z3.int().positive().describe("The minimum number of tasks for leaf functions."),
  leafMaxWidth: z3.int().positive().describe("The maximum number of tasks for leaf functions.")
});
ParametersBaseSchema.extend({
  depth: z3.int().positive().describe("The depth of this function. All tasks will be sub-functions.")
});
ParametersBaseSchema.extend({
  depth: z3.literal(0).describe(
    "The depth of this function. All tasks will be Vector Completions."
  )
});
var ParametersSchema = ParametersBaseSchema.extend({
  depth: z3.int().nonnegative().describe(
    "The depth of this function. If depth > 0, then all tasks will be sub-functions. If depth = 0, then all tasks will be Vector Completions."
  )
});
var DefaultParameters = {
  depth: 0,
  branchMinWidth: 3,
  branchMaxWidth: 6,
  leafMinWidth: 5,
  leafMaxWidth: 10
};
z3.object({
  depth: z3.int().nonnegative().optional(),
  branchMinWidth: z3.int().positive().optional(),
  branchMaxWidth: z3.int().positive().optional(),
  branchWidth: z3.int().positive().optional(),
  leafMinWidth: z3.int().positive().optional(),
  leafMaxWidth: z3.int().positive().optional(),
  leafWidth: z3.int().positive().optional(),
  minWidth: z3.int().positive().optional(),
  maxWidth: z3.int().positive().optional(),
  width: z3.int().positive().optional()
});
function buildParameters(builder = {}) {
  const depth = builder.depth ?? DefaultParameters.depth;
  let branchMinWidth = builder.branchMinWidth ?? builder.branchWidth ?? builder.minWidth ?? builder.width ?? DefaultParameters.branchMinWidth;
  let branchMaxWidth = builder.branchMaxWidth ?? builder.branchWidth ?? builder.maxWidth ?? builder.width ?? DefaultParameters.branchMaxWidth;
  if (branchMinWidth > branchMaxWidth) {
    branchMinWidth = branchMaxWidth;
  }
  let leafMinWidth = builder.leafMinWidth ?? builder.leafWidth ?? builder.minWidth ?? builder.width ?? DefaultParameters.leafMinWidth;
  let leafMaxWidth = builder.leafMaxWidth ?? builder.leafWidth ?? builder.maxWidth ?? builder.width ?? DefaultParameters.leafMaxWidth;
  if (leafMinWidth > leafMaxWidth) {
    leafMinWidth = leafMaxWidth;
  }
  return {
    depth,
    branchMinWidth,
    branchMaxWidth,
    leafMinWidth,
    leafMaxWidth
  };
}
function getSchemaTools(schemas) {
  const seen = /* @__PURE__ */ new Set();
  const tools = [];
  const addTool = (name, schema) => {
    const toolName = `Read${name}Schema`;
    if (seen.has(toolName)) return;
    seen.add(toolName);
    tools.push({
      name: toolName,
      description: toolName.replace("Read", "Read "),
      inputSchema: {},
      fn: () => Promise.resolve({
        ok: true,
        value: JSON.stringify(schema, null, 2),
        error: void 0
      })
    });
  };
  for (const { schema, name } of schemas) {
    addTool(name, schema);
    for (const ref of listRefDependencies(schema)) {
      const refSchema = getJsonSchema(ref);
      if (!refSchema) throw new Error(`Missing JSON schema for ref: ${ref}`);
      addTool(ref, refSchema);
    }
  }
  return tools;
}

// src/modalities.ts
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

// src/state/branchScalarState.ts
var BranchScalarState = class {
  parameters;
  function;
  placeholderTaskSpecs;
  editInputSchemaModalityRemovalRejected = false;
  constructor(parameters, inputSchema) {
    this.parameters = parameters;
    this.function = {
      type: "scalar.function",
      input_schema: inputSchema
    };
  }
  getInputSchema() {
    if (this.function.input_schema) {
      return {
        ok: true,
        value: JSON.stringify(this.function.input_schema, null, 2),
        error: void 0
      };
    } else {
      return {
        ok: false,
        value: void 0,
        error: "FunctionInputSchema not set"
      };
    }
  }
  getInputSchemaTool() {
    return {
      name: "ReadFunctionInputSchema",
      description: "Read FunctionInputSchema",
      inputSchema: {},
      fn: () => Promise.resolve(this.getInputSchema())
    };
  }
  setInputSchema(value, dangerouslyRemoveModalities) {
    const parsed = Functions.QualityBranchRemoteScalarFunctionSchema.shape.input_schema.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid FunctionInputSchema: ${parsed.error.message}`
      };
    }
    if (dangerouslyRemoveModalities) {
      if (!this.editInputSchemaModalityRemovalRejected) {
        return {
          ok: false,
          value: void 0,
          error: "dangerouslyRemoveModalities can only be used after a previous WriteFunctionInputSchema call was rejected for removing modalities."
        };
      }
      this.editInputSchemaModalityRemovalRejected = false;
      this.function.input_schema = parsed.data;
      return { ok: true, value: "", error: void 0 };
    }
    if (this.function.input_schema && parsed.data) {
      const oldModalities = collectModalities(this.function.input_schema);
      const newModalities = collectModalities(parsed.data);
      const removed = [];
      for (const m of oldModalities) {
        if (!newModalities.has(m)) removed.push(m);
      }
      if (removed.length > 0) {
        this.editInputSchemaModalityRemovalRejected = true;
        return {
          ok: false,
          value: void 0,
          error: `This edit would remove multimodal types: ${removed.join(", ")}. Re-read the InventSpec and confirm this does not contradict it. If the spec allows removing these modalities, call WriteFunctionInputSchema again with dangerouslyRemoveModalities: true.`
        };
      }
    }
    this.editInputSchemaModalityRemovalRejected = false;
    this.function.input_schema = parsed.data;
    return { ok: true, value: "", error: void 0 };
  }
  setInputSchemaTool() {
    return {
      name: "WriteFunctionInputSchema",
      description: "Write FunctionInputSchema",
      inputSchema: {
        input_schema: z3.record(z3.string(), z3.unknown()),
        dangerouslyRemoveModalities: z3.boolean().optional()
      },
      fn: (args) => Promise.resolve(
        this.setInputSchema(
          args.input_schema,
          args.dangerouslyRemoveModalities
        )
      )
    };
  }
  checkFields() {
    const inputSchema = this.function.input_schema;
    if (!inputSchema) {
      return {
        ok: false,
        value: void 0,
        error: "FunctionInputSchema not set"
      };
    }
    try {
      Functions.Quality.checkScalarFields({
        input_schema: inputSchema
      });
    } catch (e) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Fields: ${e}`
      };
    }
    return {
      ok: true,
      value: "Fields are valid",
      error: void 0
    };
  }
  checkFieldsTool() {
    return {
      name: "CheckFields",
      description: "Check Fields",
      inputSchema: {},
      fn: () => Promise.resolve(this.checkFields())
    };
  }
  getTasksLength() {
    return {
      ok: true,
      value: String(this.function.tasks?.length ?? 0),
      error: void 0
    };
  }
  getTasksLengthTool() {
    return {
      name: "ReadTasksLength",
      description: "Read TasksLength",
      inputSchema: {},
      fn: () => Promise.resolve(this.getTasksLength())
    };
  }
  getTask(index) {
    if (!this.function.tasks || index < 0 || index >= this.function.tasks.length) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    return {
      ok: true,
      value: JSON.stringify(this.function.tasks[index], null, 2),
      error: void 0
    };
  }
  getTaskTool() {
    return {
      name: "ReadTask",
      description: "Read Task",
      inputSchema: { index: z3.number() },
      fn: (args) => Promise.resolve(this.getTask(args.index))
    };
  }
  getTaskSpec(index) {
    if (!this.placeholderTaskSpecs || index < 0 || index >= this.placeholderTaskSpecs.length) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    const entry = this.placeholderTaskSpecs[index];
    if (entry === null) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    return {
      ok: true,
      value: entry.spec,
      error: void 0
    };
  }
  getTaskSpecTool() {
    return {
      name: "ReadTaskSpec",
      description: "Read TaskSpec",
      inputSchema: { index: z3.number() },
      fn: (args) => Promise.resolve(this.getTaskSpec(args.index))
    };
  }
  appendTask(value, spec) {
    const parsed = Functions.QualityUnmappedPlaceholderScalarFunctionTaskExpressionSchema.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid QualityUnmappedPlaceholderScalarFunctionTaskExpression: ${parsed.error.message}`
      };
    }
    if (spec.trim() === "") {
      return {
        ok: false,
        value: void 0,
        error: "Spec cannot be empty"
      };
    }
    try {
      Functions.Quality.checkScalarFields({
        input_schema: parsed.data.input_schema
      });
    } catch (e) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Fields in new task: ${e}`
      };
    }
    if (this.function.tasks) {
      this.function.tasks.push(parsed.data);
    } else {
      this.function.tasks = [parsed.data];
    }
    const entry = { spec, token: randomUUID() };
    if (this.placeholderTaskSpecs) {
      this.placeholderTaskSpecs.push(entry);
    } else {
      this.placeholderTaskSpecs = [entry];
    }
    return {
      ok: true,
      value: `New length: ${this.function.tasks.length}`,
      error: void 0
    };
  }
  appendTaskTool() {
    return {
      name: "AppendTask",
      description: "Append Task",
      inputSchema: {
        spec: z3.string(),
        task: z3.record(z3.string(), z3.unknown())
      },
      fn: (args) => Promise.resolve(this.appendTask(args.task, args.spec))
    };
  }
  deleteTask(index) {
    if (!this.function.tasks || index < 0 || index >= this.function.tasks.length) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    this.function.tasks.splice(index, 1);
    this.placeholderTaskSpecs?.splice(index, 1);
    return {
      ok: true,
      value: `New length: ${this.function.tasks.length}`,
      error: void 0
    };
  }
  deleteTaskTool() {
    return {
      name: "DeleteTask",
      description: "Delete Task",
      inputSchema: { index: z3.number() },
      fn: (args) => Promise.resolve(this.deleteTask(args.index))
    };
  }
  editTask(index, value) {
    if (!this.function.tasks || index < 0 || index >= this.function.tasks.length) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    const parsed = Functions.QualityUnmappedPlaceholderScalarFunctionTaskExpressionSchema.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid QualityUnmappedPlaceholderScalarFunctionTaskExpression: ${parsed.error.message}`
      };
    }
    this.function.tasks[index] = parsed.data;
    return {
      ok: true,
      value: "Task updated. If the task spec should change, edit it as well.",
      error: void 0
    };
  }
  editTaskTool() {
    return {
      name: "EditTask",
      description: "Edit Task",
      inputSchema: {
        index: z3.number(),
        task: z3.record(z3.string(), z3.unknown())
      },
      fn: (args) => Promise.resolve(this.editTask(args.index, args.task))
    };
  }
  editTaskSpec(index, spec) {
    if (!this.function.tasks || index < 0 || index >= this.function.tasks.length) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    if (spec.trim() === "") {
      return {
        ok: false,
        value: void 0,
        error: "Spec cannot be empty"
      };
    }
    if (!this.placeholderTaskSpecs) {
      throw new Error(
        "placeholderTaskSpecs should be defined if there are tasks"
      );
    }
    const existing = this.placeholderTaskSpecs[index];
    if (existing === null) {
      throw new Error("Cannot edit spec of a null entry");
    }
    existing.spec = spec;
    return {
      ok: true,
      value: "Task spec updated. If the task should change, edit it as well.",
      error: void 0
    };
  }
  editTaskSpecTool() {
    return {
      name: "EditTaskSpec",
      description: "Edit TaskSpec",
      inputSchema: { index: z3.number(), spec: z3.string() },
      fn: (args) => Promise.resolve(this.editTaskSpec(args.index, args.spec))
    };
  }
  checkFunction() {
    const parsed = Functions.QualityBranchRemoteScalarFunctionSchema.safeParse({
      ...this.function,
      description: this.function.description || "description"
    });
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Function: ${parsed.error.message}`
      };
    }
    if (parsed.data.tasks.length < this.parameters.branchMinWidth || parsed.data.tasks.length > this.parameters.branchMaxWidth) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Function: Number of tasks must be between ${this.parameters.branchMinWidth} and ${this.parameters.branchMaxWidth}`
      };
    }
    try {
      Functions.Quality.checkBranchScalarFunction(parsed.data, void 0);
    } catch (e) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Function: ${e}`
      };
    }
    return {
      ok: true,
      value: "Function is valid",
      error: void 0
    };
  }
  checkFunctionTool() {
    return {
      name: "CheckFunction",
      description: "Check Function",
      inputSchema: {},
      fn: () => Promise.resolve(this.checkFunction())
    };
  }
  getSchemaTools() {
    return getSchemaTools([
      {
        schema: Functions.QualityBranchRemoteScalarFunctionJsonSchema,
        name: "QualityBranchRemoteScalarFunction"
      },
      {
        schema: Functions.Expression.ScalarFunctionOutputJsonSchema,
        name: "ScalarFunctionOutput"
      }
    ]);
  }
  getPlaceholderTaskSpecs() {
    return this.placeholderTaskSpecs;
  }
};
var BranchVectorState = class {
  parameters;
  function;
  placeholderTaskSpecs;
  editInputSchemaModalityRemovalRejected = false;
  constructor(parameters, inputSchema, outputLength, inputSplit, inputMerge) {
    this.parameters = parameters;
    this.function = {
      type: "vector.function",
      input_schema: inputSchema,
      output_length: outputLength,
      input_split: inputSplit,
      input_merge: inputMerge
    };
  }
  getInputSchema() {
    if (this.function.input_schema) {
      return {
        ok: true,
        value: JSON.stringify(this.function.input_schema, null, 2),
        error: void 0
      };
    } else {
      return {
        ok: false,
        value: void 0,
        error: "FunctionInputSchema not set"
      };
    }
  }
  getInputSchemaTool() {
    return {
      name: "ReadFunctionInputSchema",
      description: "Read FunctionInputSchema",
      inputSchema: {},
      fn: () => Promise.resolve(this.getInputSchema())
    };
  }
  setInputSchema(value, dangerouslyRemoveModalities) {
    const parsed = Functions.QualityBranchRemoteVectorFunctionSchema.shape.input_schema.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid FunctionInputSchema: ${parsed.error.message}`
      };
    }
    if (dangerouslyRemoveModalities) {
      if (!this.editInputSchemaModalityRemovalRejected) {
        return {
          ok: false,
          value: void 0,
          error: "dangerouslyRemoveModalities can only be used after a previous WriteFunctionInputSchema call was rejected for removing modalities."
        };
      }
      this.editInputSchemaModalityRemovalRejected = false;
      this.function.input_schema = parsed.data;
      return { ok: true, value: "", error: void 0 };
    }
    if (this.function.input_schema && parsed.data) {
      const oldModalities = collectModalities(this.function.input_schema);
      const newModalities = collectModalities(parsed.data);
      const removed = [];
      for (const m of oldModalities) {
        if (!newModalities.has(m)) removed.push(m);
      }
      if (removed.length > 0) {
        this.editInputSchemaModalityRemovalRejected = true;
        return {
          ok: false,
          value: void 0,
          error: `This edit would remove multimodal types: ${removed.join(", ")}. Re-read the InventSpec and confirm this does not contradict it. If the spec allows removing these modalities, call WriteFunctionInputSchema again with dangerouslyRemoveModalities: true.`
        };
      }
    }
    this.editInputSchemaModalityRemovalRejected = false;
    this.function.input_schema = parsed.data;
    return { ok: true, value: "", error: void 0 };
  }
  setInputSchemaTool() {
    return {
      name: "WriteFunctionInputSchema",
      description: "Write FunctionInputSchema",
      inputSchema: {
        input_schema: z3.record(z3.string(), z3.unknown()),
        dangerouslyRemoveModalities: z3.boolean().optional()
      },
      fn: (args) => Promise.resolve(
        this.setInputSchema(
          args.input_schema,
          args.dangerouslyRemoveModalities
        )
      )
    };
  }
  getOutputLength() {
    if (this.function.output_length !== void 0) {
      return {
        ok: true,
        value: JSON.stringify(this.function.output_length, null, 2),
        error: void 0
      };
    } else {
      return {
        ok: false,
        value: void 0,
        error: "FunctionOutputLength not set"
      };
    }
  }
  getOutputLengthTool() {
    return {
      name: "ReadFunctionOutputLength",
      description: "Read FunctionOutputLength",
      inputSchema: {},
      fn: () => Promise.resolve(this.getOutputLength())
    };
  }
  setOutputLength(value) {
    const parsed = Functions.QualityBranchRemoteVectorFunctionSchema.shape.output_length.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid FunctionOutputLength: ${parsed.error.message}`
      };
    }
    this.function.output_length = parsed.data;
    return {
      ok: true,
      value: "",
      error: void 0
    };
  }
  setOutputLengthTool() {
    return {
      name: "WriteFunctionOutputLength",
      description: "Write FunctionOutputLength",
      inputSchema: { output_length: z3.unknown() },
      fn: (args) => Promise.resolve(this.setOutputLength(args.output_length))
    };
  }
  getInputSplit() {
    if (this.function.input_split) {
      return {
        ok: true,
        value: JSON.stringify(this.function.input_split, null, 2),
        error: void 0
      };
    } else {
      return {
        ok: false,
        value: void 0,
        error: "FunctionInputSplit not set"
      };
    }
  }
  getInputSplitTool() {
    return {
      name: "ReadFunctionInputSplit",
      description: "Read FunctionInputSplit",
      inputSchema: {},
      fn: () => Promise.resolve(this.getInputSplit())
    };
  }
  setInputSplit(value) {
    const parsed = Functions.QualityBranchRemoteVectorFunctionSchema.shape.input_split.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid FunctionInputSplit: ${parsed.error.message}`
      };
    }
    this.function.input_split = parsed.data;
    return {
      ok: true,
      value: "",
      error: void 0
    };
  }
  setInputSplitTool() {
    return {
      name: "WriteFunctionInputSplit",
      description: "Write FunctionInputSplit",
      inputSchema: { input_split: z3.unknown() },
      fn: (args) => Promise.resolve(this.setInputSplit(args.input_split))
    };
  }
  getInputMerge() {
    if (this.function.input_merge) {
      return {
        ok: true,
        value: JSON.stringify(this.function.input_merge, null, 2),
        error: void 0
      };
    } else {
      return {
        ok: false,
        value: void 0,
        error: "FunctionInputMerge not set"
      };
    }
  }
  getInputMergeTool() {
    return {
      name: "ReadFunctionInputMerge",
      description: "Read FunctionInputMerge",
      inputSchema: {},
      fn: () => Promise.resolve(this.getInputMerge())
    };
  }
  setInputMerge(value) {
    const parsed = Functions.QualityBranchRemoteVectorFunctionSchema.shape.input_merge.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid FunctionInputMerge: ${parsed.error.message}`
      };
    }
    this.function.input_merge = parsed.data;
    return {
      ok: true,
      value: "",
      error: void 0
    };
  }
  setInputMergeTool() {
    return {
      name: "WriteFunctionInputMerge",
      description: "Write FunctionInputMerge",
      inputSchema: { input_merge: z3.unknown() },
      fn: (args) => Promise.resolve(this.setInputMerge(args.input_merge))
    };
  }
  checkFields() {
    const inputSchema = this.function.input_schema;
    const outputLength = this.function.output_length;
    const inputSplit = this.function.input_split;
    const inputMerge = this.function.input_merge;
    if (!inputSchema) {
      return {
        ok: false,
        value: void 0,
        error: "FunctionInputSchema not set"
      };
    }
    if (outputLength === void 0) {
      return {
        ok: false,
        value: void 0,
        error: "FunctionOutputLength not set"
      };
    }
    if (!inputSplit) {
      return {
        ok: false,
        value: void 0,
        error: "FunctionInputSplit not set"
      };
    }
    if (!inputMerge) {
      return {
        ok: false,
        value: void 0,
        error: "FunctionInputMerge not set"
      };
    }
    try {
      Functions.Quality.checkVectorFields({
        input_schema: inputSchema,
        output_length: outputLength,
        input_split: inputSplit,
        input_merge: inputMerge
      });
    } catch (e) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Fields: ${e}`
      };
    }
    return {
      ok: true,
      value: "Fields are valid",
      error: void 0
    };
  }
  checkFieldsTool() {
    return {
      name: "CheckFields",
      description: "Check Fields",
      inputSchema: {},
      fn: () => Promise.resolve(this.checkFields())
    };
  }
  getTasksLength() {
    return {
      ok: true,
      value: String(this.function.tasks?.length ?? 0),
      error: void 0
    };
  }
  getTasksLengthTool() {
    return {
      name: "ReadTasksLength",
      description: "Read TasksLength",
      inputSchema: {},
      fn: () => Promise.resolve(this.getTasksLength())
    };
  }
  getTask(index) {
    if (!this.function.tasks || index < 0 || index >= this.function.tasks.length) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    const task = this.function.tasks[index];
    let inputMap;
    if (task.map !== void 0) {
      inputMap = this.function.input_maps?.[task.map];
    } else {
      inputMap = void 0;
    }
    if (inputMap) {
      return {
        ok: true,
        value: JSON.stringify({ task, input_map: inputMap }, null, 2),
        error: void 0
      };
    } else {
      return {
        ok: true,
        value: JSON.stringify({ task }, null, 2),
        error: void 0
      };
    }
  }
  getTaskTool() {
    return {
      name: "ReadTask",
      description: "Read Task",
      inputSchema: { index: z3.number() },
      fn: (args) => Promise.resolve(this.getTask(args.index))
    };
  }
  getTaskSpec(index) {
    if (!this.placeholderTaskSpecs || index < 0 || index >= this.placeholderTaskSpecs.length) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    const entry = this.placeholderTaskSpecs[index];
    if (entry === null) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    return {
      ok: true,
      value: entry.spec,
      error: void 0
    };
  }
  getTaskSpecTool() {
    return {
      name: "ReadTaskSpec",
      description: "Read TaskSpec",
      inputSchema: { index: z3.number() },
      fn: (args) => Promise.resolve(this.getTaskSpec(args.index))
    };
  }
  appendVectorTask(value, spec) {
    const parsed = Functions.QualityUnmappedPlaceholderVectorFunctionTaskExpressionSchema.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid QualityUnmappedPlaceholderVectorFunctionTaskExpression: ${parsed.error.message}`
      };
    }
    if (spec.trim() === "") {
      return {
        ok: false,
        value: void 0,
        error: "Spec cannot be empty"
      };
    }
    try {
      Functions.Quality.checkVectorFields({
        input_schema: parsed.data.input_schema,
        output_length: parsed.data.output_length,
        input_split: parsed.data.input_split,
        input_merge: parsed.data.input_merge
      });
    } catch (e) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Fields in new task: ${e}`
      };
    }
    if (this.function.tasks) {
      this.function.tasks.push(parsed.data);
    } else {
      this.function.tasks = [parsed.data];
    }
    const entry = { spec, token: randomUUID() };
    if (this.placeholderTaskSpecs) {
      this.placeholderTaskSpecs.push(entry);
    } else {
      this.placeholderTaskSpecs = [entry];
    }
    return {
      ok: true,
      value: `New length: ${this.function.tasks.length}`,
      error: void 0
    };
  }
  appendVectorTaskTool() {
    return {
      name: "AppendVectorTask",
      description: "Append VectorTask",
      inputSchema: {
        spec: z3.string(),
        task: z3.record(z3.string(), z3.unknown())
      },
      fn: (args) => Promise.resolve(this.appendVectorTask(args.task, args.spec))
    };
  }
  appendScalarTask(value, inputMap, spec) {
    const parsed = Functions.QualityMappedPlaceholderScalarFunctionTaskExpressionSchema.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid QualityMappedPlaceholderScalarFunctionTaskExpression: ${parsed.error.message}`
      };
    }
    parsed.data.map = this.function.input_maps ? this.function.input_maps.length : 0;
    if (spec.trim() === "") {
      return {
        ok: false,
        value: void 0,
        error: "Spec cannot be empty"
      };
    }
    const inputMapParsed = Functions.Expression.ExpressionSchema.safeParse(inputMap);
    if (!inputMapParsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid InputMap Expression: ${inputMapParsed.error.message}`
      };
    }
    try {
      Functions.Quality.checkScalarFields({
        input_schema: parsed.data.input_schema
      });
    } catch (e) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Fields in new task: ${e}`
      };
    }
    if (this.function.tasks) {
      this.function.tasks.push(parsed.data);
    } else {
      this.function.tasks = [parsed.data];
    }
    const entry = { spec, token: randomUUID() };
    if (this.placeholderTaskSpecs) {
      this.placeholderTaskSpecs.push(entry);
    } else {
      this.placeholderTaskSpecs = [entry];
    }
    if (this.function.input_maps) {
      this.function.input_maps.push(inputMapParsed.data);
    } else {
      this.function.input_maps = [inputMapParsed.data];
    }
    return {
      ok: true,
      value: `New length: ${this.function.tasks.length}`,
      error: void 0
    };
  }
  appendScalarTaskTool() {
    return {
      name: "AppendScalarTask",
      description: "Append ScalarTask",
      inputSchema: {
        spec: z3.string(),
        task: z3.record(z3.string(), z3.unknown()),
        input_map: z3.unknown()
      },
      fn: (args) => Promise.resolve(
        this.appendScalarTask(args.task, args.input_map, args.spec)
      )
    };
  }
  deleteTask(index) {
    if (!this.function.tasks || index < 0 || index >= this.function.tasks.length) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    const task = this.function.tasks[index];
    if (task.map !== void 0) {
      for (let i = index + 1; i < this.function.tasks.length; i++) {
        const t = this.function.tasks[i];
        if (t.map !== void 0) {
          t.map -= 1;
        }
      }
      this.function.input_maps?.splice(task.map, 1);
    }
    this.function.tasks.splice(index, 1);
    this.placeholderTaskSpecs?.splice(index, 1);
    return {
      ok: true,
      value: `New length: ${this.function.tasks.length}`,
      error: void 0
    };
  }
  deleteTaskTool() {
    return {
      name: "DeleteTask",
      description: "Delete Task",
      inputSchema: { index: z3.number() },
      fn: (args) => Promise.resolve(this.deleteTask(args.index))
    };
  }
  editVectorTask(index, value) {
    if (!this.function.tasks || index < 0 || index >= this.function.tasks.length) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    const existing = this.function.tasks[index];
    if (existing.map !== void 0) {
      return {
        ok: false,
        value: void 0,
        error: "Existing task is not UnmappedVector"
      };
    }
    const parsed = Functions.QualityUnmappedPlaceholderVectorFunctionTaskExpressionSchema.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid QualityUnmappedPlaceholderVectorFunctionTaskExpression: ${parsed.error.message}`
      };
    }
    this.function.tasks[index] = parsed.data;
    return {
      ok: true,
      value: "Task updated. If the task spec should change, edit it as well.",
      error: void 0
    };
  }
  editVectorTaskTool() {
    return {
      name: "EditVectorTask",
      description: "Edit VectorTask",
      inputSchema: {
        index: z3.number(),
        task: z3.record(z3.string(), z3.unknown())
      },
      fn: (args) => Promise.resolve(this.editVectorTask(args.index, args.task))
    };
  }
  editScalarTask(index, value, inputMap) {
    if (!this.function.tasks || index < 0 || index >= this.function.tasks.length) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    const existing = this.function.tasks[index];
    if (existing.map === void 0) {
      return {
        ok: false,
        value: void 0,
        error: "Existing task is not MappedScalar"
      };
    }
    const parsed = Functions.QualityMappedPlaceholderScalarFunctionTaskExpressionSchema.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid QualityMappedPlaceholderScalarFunctionTaskExpression: ${parsed.error.message}`
      };
    }
    const inputMapParsed = Functions.Expression.ExpressionSchema.safeParse(inputMap);
    if (!inputMapParsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid InputMap Expression: ${inputMapParsed.error.message}`
      };
    }
    parsed.data.map = existing.map;
    this.function.input_maps[existing.map] = inputMapParsed.data;
    this.function.tasks[index] = parsed.data;
    return {
      ok: true,
      value: "Task updated. If the task spec should change, edit it as well.",
      error: void 0
    };
  }
  editScalarTaskTool() {
    return {
      name: "EditScalarTask",
      description: "Edit ScalarTask",
      inputSchema: {
        index: z3.number(),
        task: z3.record(z3.string(), z3.unknown()),
        input_map: z3.unknown()
      },
      fn: (args) => Promise.resolve(
        this.editScalarTask(args.index, args.task, args.input_map)
      )
    };
  }
  editTaskSpec(index, spec) {
    if (!this.function.tasks || index < 0 || index >= this.function.tasks.length) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    if (spec.trim() === "") {
      return {
        ok: false,
        value: void 0,
        error: "Spec cannot be empty"
      };
    }
    if (!this.placeholderTaskSpecs) {
      throw new Error(
        "placeholderTaskSpecs should be defined if there are tasks"
      );
    }
    const existing = this.placeholderTaskSpecs[index];
    if (existing === null) {
      throw new Error("Cannot edit spec of a null entry");
    }
    existing.spec = spec;
    return {
      ok: true,
      value: "Task spec updated. If the task should change, edit it as well.",
      error: void 0
    };
  }
  editTaskSpecTool() {
    return {
      name: "EditTaskSpec",
      description: "Edit TaskSpec",
      inputSchema: { index: z3.number(), spec: z3.string() },
      fn: (args) => Promise.resolve(this.editTaskSpec(args.index, args.spec))
    };
  }
  checkFunction() {
    const parsed = Functions.QualityBranchRemoteVectorFunctionSchema.safeParse({
      ...this.function,
      description: this.function.description || "description"
    });
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Function: ${parsed.error.message}`
      };
    }
    if (parsed.data.tasks.length < this.parameters.branchMinWidth || parsed.data.tasks.length > this.parameters.branchMaxWidth) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Function: Number of tasks must be between ${this.parameters.branchMinWidth} and ${this.parameters.branchMaxWidth}`
      };
    }
    try {
      Functions.Quality.checkBranchVectorFunction(parsed.data, void 0);
    } catch (e) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Function: ${e}`
      };
    }
    return {
      ok: true,
      value: "Function is valid",
      error: void 0
    };
  }
  checkFunctionTool() {
    return {
      name: "CheckFunction",
      description: "Check Function",
      inputSchema: {},
      fn: () => Promise.resolve(this.checkFunction())
    };
  }
  getSchemaTools() {
    return getSchemaTools([
      {
        schema: Functions.QualityBranchRemoteVectorFunctionJsonSchema,
        name: "QualityBranchRemoteVectorFunction"
      },
      {
        schema: Functions.Expression.InputMapsAsParameterJsonSchema,
        name: "InputMapsAsParameter"
      },
      {
        schema: Functions.Expression.VectorFunctionOutputJsonSchema,
        name: "VectorFunctionOutput"
      },
      {
        schema: Functions.Expression.MapScalarFunctionOutputJsonSchema,
        name: "MapScalarFunctionOutput"
      }
    ]);
  }
  getPlaceholderTaskSpecs() {
    return this.placeholderTaskSpecs;
  }
};
var LeafScalarState = class {
  parameters;
  function;
  editInputSchemaModalityRemovalRejected = false;
  constructor(parameters, inputSchema) {
    this.parameters = parameters;
    this.function = {
      type: "scalar.function",
      input_schema: inputSchema
    };
  }
  getInputSchema() {
    if (this.function.input_schema) {
      return {
        ok: true,
        value: JSON.stringify(this.function.input_schema, null, 2),
        error: void 0
      };
    } else {
      return {
        ok: false,
        value: void 0,
        error: "FunctionInputSchema not set"
      };
    }
  }
  getInputSchemaTool() {
    return {
      name: "ReadFunctionInputSchema",
      description: "Read FunctionInputSchema",
      inputSchema: {},
      fn: () => Promise.resolve(this.getInputSchema())
    };
  }
  setInputSchema(value, dangerouslyRemoveModalities) {
    const parsed = Functions.QualityLeafRemoteScalarFunctionSchema.shape.input_schema.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid FunctionInputSchema: ${parsed.error.message}`
      };
    }
    if (dangerouslyRemoveModalities) {
      if (!this.editInputSchemaModalityRemovalRejected) {
        return {
          ok: false,
          value: void 0,
          error: "dangerouslyRemoveModalities can only be used after a previous WriteFunctionInputSchema call was rejected for removing modalities."
        };
      }
      this.editInputSchemaModalityRemovalRejected = false;
      this.function.input_schema = parsed.data;
      return { ok: true, value: "", error: void 0 };
    }
    if (this.function.input_schema && parsed.data) {
      const oldModalities = collectModalities(this.function.input_schema);
      const newModalities = collectModalities(parsed.data);
      const removed = [];
      for (const m of oldModalities) {
        if (!newModalities.has(m)) removed.push(m);
      }
      if (removed.length > 0) {
        this.editInputSchemaModalityRemovalRejected = true;
        return {
          ok: false,
          value: void 0,
          error: `This edit would remove multimodal types: ${removed.join(", ")}. Re-read the InventSpec and confirm this does not contradict it. If the spec allows removing these modalities, call WriteFunctionInputSchema again with dangerouslyRemoveModalities: true.`
        };
      }
    }
    this.editInputSchemaModalityRemovalRejected = false;
    this.function.input_schema = parsed.data;
    return { ok: true, value: "", error: void 0 };
  }
  setInputSchemaTool() {
    return {
      name: "WriteFunctionInputSchema",
      description: "Write FunctionInputSchema",
      inputSchema: {
        input_schema: z3.record(z3.string(), z3.unknown()),
        dangerouslyRemoveModalities: z3.boolean().optional()
      },
      fn: (args) => Promise.resolve(
        this.setInputSchema(
          args.input_schema,
          args.dangerouslyRemoveModalities
        )
      )
    };
  }
  checkFields() {
    const inputSchema = this.function.input_schema;
    if (!inputSchema) {
      return {
        ok: false,
        value: void 0,
        error: "FunctionInputSchema not set"
      };
    }
    try {
      Functions.Quality.checkScalarFields({
        input_schema: inputSchema
      });
    } catch (e) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Fields: ${e}`
      };
    }
    return {
      ok: true,
      value: "Fields are valid",
      error: void 0
    };
  }
  checkFieldsTool() {
    return {
      name: "CheckFields",
      description: "Check Fields",
      inputSchema: {},
      fn: () => Promise.resolve(this.checkFields())
    };
  }
  getTasksLength() {
    return {
      ok: true,
      value: String(this.function.tasks?.length ?? 0),
      error: void 0
    };
  }
  getTasksLengthTool() {
    return {
      name: "ReadTasksLength",
      description: "Read TasksLength",
      inputSchema: {},
      fn: () => Promise.resolve(this.getTasksLength())
    };
  }
  getTask(index) {
    if (!this.function.tasks || index < 0 || index >= this.function.tasks.length) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    return {
      ok: true,
      value: JSON.stringify(this.function.tasks[index], null, 2),
      error: void 0
    };
  }
  getTaskTool() {
    return {
      name: "ReadTask",
      description: "Read Task",
      inputSchema: { index: z3.number() },
      fn: (args) => Promise.resolve(this.getTask(args.index))
    };
  }
  appendTask(value) {
    const parsed = Functions.QualityScalarVectorCompletionTaskExpressionSchema.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid QualityScalarVectorCompletionTaskExpression: ${parsed.error.message}`
      };
    }
    if (this.function.tasks) {
      this.function.tasks.push(parsed.data);
    } else {
      this.function.tasks = [parsed.data];
    }
    return {
      ok: true,
      value: `New length: ${this.function.tasks.length}`,
      error: void 0
    };
  }
  appendTaskTool() {
    return {
      name: "AppendTask",
      description: "Append Task",
      inputSchema: { task: z3.record(z3.string(), z3.unknown()) },
      fn: (args) => Promise.resolve(this.appendTask(args.task))
    };
  }
  deleteTask(index) {
    if (!this.function.tasks || index < 0 || index >= this.function.tasks.length) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    this.function.tasks.splice(index, 1);
    return {
      ok: true,
      value: `New length: ${this.function.tasks.length}`,
      error: void 0
    };
  }
  deleteTaskTool() {
    return {
      name: "DeleteTask",
      description: "Delete Task",
      inputSchema: { index: z3.number() },
      fn: (args) => Promise.resolve(this.deleteTask(args.index))
    };
  }
  editTask(index, value) {
    if (!this.function.tasks || index < 0 || index >= this.function.tasks.length) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    const parsed = Functions.QualityScalarVectorCompletionTaskExpressionSchema.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid QualityScalarVectorCompletionTaskExpression: ${parsed.error.message}`
      };
    }
    this.function.tasks[index] = parsed.data;
    return {
      ok: true,
      value: "Task updated.",
      error: void 0
    };
  }
  editTaskTool() {
    return {
      name: "EditTask",
      description: "Edit Task",
      inputSchema: {
        index: z3.number(),
        task: z3.record(z3.string(), z3.unknown())
      },
      fn: (args) => Promise.resolve(this.editTask(args.index, args.task))
    };
  }
  checkFunction() {
    const parsed = Functions.QualityLeafRemoteScalarFunctionSchema.safeParse({
      ...this.function,
      description: this.function.description || "description"
    });
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Function: ${parsed.error.message}`
      };
    }
    if (parsed.data.tasks.length < this.parameters.leafMinWidth || parsed.data.tasks.length > this.parameters.leafMaxWidth) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Function: Number of tasks must be between ${this.parameters.leafMinWidth} and ${this.parameters.leafMaxWidth}`
      };
    }
    try {
      Functions.Quality.checkLeafScalarFunction(parsed.data);
    } catch (e) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Function: ${e}`
      };
    }
    return {
      ok: true,
      value: "Function is valid",
      error: void 0
    };
  }
  checkFunctionTool() {
    return {
      name: "CheckFunction",
      description: "Check Function",
      inputSchema: {},
      fn: () => Promise.resolve(this.checkFunction())
    };
  }
  getSchemaTools() {
    return getSchemaTools([
      {
        schema: Functions.QualityLeafRemoteScalarFunctionJsonSchema,
        name: "QualityLeafRemoteScalarFunction"
      },
      {
        schema: Functions.Expression.VectorCompletionOutputJsonSchema,
        name: "VectorCompletionOutput"
      }
    ]);
  }
};
var LeafVectorState = class {
  parameters;
  function;
  editInputSchemaModalityRemovalRejected = false;
  constructor(parameters, inputSchema, outputLength, inputSplit, inputMerge) {
    this.parameters = parameters;
    this.function = {
      type: "vector.function",
      input_schema: inputSchema,
      output_length: outputLength,
      input_split: inputSplit,
      input_merge: inputMerge
    };
  }
  getInputSchema() {
    if (this.function.input_schema) {
      return {
        ok: true,
        value: JSON.stringify(this.function.input_schema, null, 2),
        error: void 0
      };
    } else {
      return {
        ok: false,
        value: void 0,
        error: "FunctionInputSchema not set"
      };
    }
  }
  getInputSchemaTool() {
    return {
      name: "ReadFunctionInputSchema",
      description: "Read FunctionInputSchema",
      inputSchema: {},
      fn: () => Promise.resolve(this.getInputSchema())
    };
  }
  setInputSchema(value, dangerouslyRemoveModalities) {
    const parsed = Functions.QualityLeafRemoteVectorFunctionSchema.shape.input_schema.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid FunctionInputSchema: ${parsed.error.message}`
      };
    }
    if (dangerouslyRemoveModalities) {
      if (!this.editInputSchemaModalityRemovalRejected) {
        return {
          ok: false,
          value: void 0,
          error: "dangerouslyRemoveModalities can only be used after a previous WriteFunctionInputSchema call was rejected for removing modalities."
        };
      }
      this.editInputSchemaModalityRemovalRejected = false;
      this.function.input_schema = parsed.data;
      return { ok: true, value: "", error: void 0 };
    }
    if (this.function.input_schema && parsed.data) {
      const oldModalities = collectModalities(this.function.input_schema);
      const newModalities = collectModalities(parsed.data);
      const removed = [];
      for (const m of oldModalities) {
        if (!newModalities.has(m)) removed.push(m);
      }
      if (removed.length > 0) {
        this.editInputSchemaModalityRemovalRejected = true;
        return {
          ok: false,
          value: void 0,
          error: `This edit would remove multimodal types: ${removed.join(", ")}. Re-read the InventSpec and confirm this does not contradict it. If the spec allows removing these modalities, call WriteFunctionInputSchema again with dangerouslyRemoveModalities: true.`
        };
      }
    }
    this.editInputSchemaModalityRemovalRejected = false;
    this.function.input_schema = parsed.data;
    return { ok: true, value: "", error: void 0 };
  }
  setInputSchemaTool() {
    return {
      name: "WriteFunctionInputSchema",
      description: "Write FunctionInputSchema",
      inputSchema: {
        input_schema: z3.record(z3.string(), z3.unknown()),
        dangerouslyRemoveModalities: z3.boolean().optional()
      },
      fn: (args) => Promise.resolve(
        this.setInputSchema(
          args.input_schema,
          args.dangerouslyRemoveModalities
        )
      )
    };
  }
  getOutputLength() {
    if (this.function.output_length !== void 0) {
      return {
        ok: true,
        value: JSON.stringify(this.function.output_length, null, 2),
        error: void 0
      };
    } else {
      return {
        ok: false,
        value: void 0,
        error: "FunctionOutputLength not set"
      };
    }
  }
  getOutputLengthTool() {
    return {
      name: "ReadFunctionOutputLength",
      description: "Read FunctionOutputLength",
      inputSchema: {},
      fn: () => Promise.resolve(this.getOutputLength())
    };
  }
  setOutputLength(value) {
    const parsed = Functions.QualityLeafRemoteVectorFunctionSchema.shape.output_length.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid FunctionOutputLength: ${parsed.error.message}`
      };
    }
    this.function.output_length = parsed.data;
    return {
      ok: true,
      value: "",
      error: void 0
    };
  }
  setOutputLengthTool() {
    return {
      name: "WriteFunctionOutputLength",
      description: "Write FunctionOutputLength",
      inputSchema: { output_length: z3.unknown() },
      fn: (args) => Promise.resolve(this.setOutputLength(args.output_length))
    };
  }
  getInputSplit() {
    if (this.function.input_split) {
      return {
        ok: true,
        value: JSON.stringify(this.function.input_split, null, 2),
        error: void 0
      };
    } else {
      return {
        ok: false,
        value: void 0,
        error: "FunctionInputSplit not set"
      };
    }
  }
  getInputSplitTool() {
    return {
      name: "ReadFunctionInputSplit",
      description: "Read FunctionInputSplit",
      inputSchema: {},
      fn: () => Promise.resolve(this.getInputSplit())
    };
  }
  setInputSplit(value) {
    const parsed = Functions.QualityLeafRemoteVectorFunctionSchema.shape.input_split.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid FunctionInputSplit: ${parsed.error.message}`
      };
    }
    this.function.input_split = parsed.data;
    return {
      ok: true,
      value: "",
      error: void 0
    };
  }
  setInputSplitTool() {
    return {
      name: "WriteFunctionInputSplit",
      description: "Write FunctionInputSplit",
      inputSchema: { input_split: z3.unknown() },
      fn: (args) => Promise.resolve(this.setInputSplit(args.input_split))
    };
  }
  getInputMerge() {
    if (this.function.input_merge) {
      return {
        ok: true,
        value: JSON.stringify(this.function.input_merge, null, 2),
        error: void 0
      };
    } else {
      return {
        ok: false,
        value: void 0,
        error: "FunctionInputMerge not set"
      };
    }
  }
  getInputMergeTool() {
    return {
      name: "ReadFunctionInputMerge",
      description: "Read FunctionInputMerge",
      inputSchema: {},
      fn: () => Promise.resolve(this.getInputMerge())
    };
  }
  setInputMerge(value) {
    const parsed = Functions.QualityLeafRemoteVectorFunctionSchema.shape.input_merge.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid FunctionInputMerge: ${parsed.error.message}`
      };
    }
    this.function.input_merge = parsed.data;
    return {
      ok: true,
      value: "",
      error: void 0
    };
  }
  setInputMergeTool() {
    return {
      name: "WriteFunctionInputMerge",
      description: "Write FunctionInputMerge",
      inputSchema: { input_merge: z3.unknown() },
      fn: (args) => Promise.resolve(this.setInputMerge(args.input_merge))
    };
  }
  checkFields() {
    const inputSchema = this.function.input_schema;
    const outputLength = this.function.output_length;
    const inputSplit = this.function.input_split;
    const inputMerge = this.function.input_merge;
    if (!inputSchema) {
      return {
        ok: false,
        value: void 0,
        error: "FunctionInputSchema not set"
      };
    }
    if (outputLength === void 0) {
      return {
        ok: false,
        value: void 0,
        error: "FunctionOutputLength not set"
      };
    }
    if (!inputSplit) {
      return {
        ok: false,
        value: void 0,
        error: "FunctionInputSplit not set"
      };
    }
    if (!inputMerge) {
      return {
        ok: false,
        value: void 0,
        error: "FunctionInputMerge not set"
      };
    }
    try {
      Functions.Quality.checkVectorFields({
        input_schema: inputSchema,
        output_length: outputLength,
        input_split: inputSplit,
        input_merge: inputMerge
      });
    } catch (e) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Fields: ${e}`
      };
    }
    return {
      ok: true,
      value: "Fields are valid",
      error: void 0
    };
  }
  checkFieldsTool() {
    return {
      name: "CheckFields",
      description: "Check Fields",
      inputSchema: {},
      fn: () => Promise.resolve(this.checkFields())
    };
  }
  getTasksLength() {
    return {
      ok: true,
      value: String(this.function.tasks?.length ?? 0),
      error: void 0
    };
  }
  getTasksLengthTool() {
    return {
      name: "ReadTasksLength",
      description: "Read TasksLength",
      inputSchema: {},
      fn: () => Promise.resolve(this.getTasksLength())
    };
  }
  getTask(index) {
    if (!this.function.tasks || index < 0 || index >= this.function.tasks.length) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    return {
      ok: true,
      value: JSON.stringify(this.function.tasks[index], null, 2),
      error: void 0
    };
  }
  getTaskTool() {
    return {
      name: "ReadTask",
      description: "Read Task",
      inputSchema: { index: z3.number() },
      fn: (args) => Promise.resolve(this.getTask(args.index))
    };
  }
  appendTask(value) {
    const parsed = Functions.QualityVectorVectorCompletionTaskExpressionSchema.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid QualityVectorVectorCompletionTaskExpression: ${parsed.error.message}`
      };
    }
    if (this.function.tasks) {
      this.function.tasks.push(parsed.data);
    } else {
      this.function.tasks = [parsed.data];
    }
    return {
      ok: true,
      value: `New length: ${this.function.tasks.length}`,
      error: void 0
    };
  }
  appendTaskTool() {
    return {
      name: "AppendTask",
      description: "Append Task",
      inputSchema: { task: z3.record(z3.string(), z3.unknown()) },
      fn: (args) => Promise.resolve(this.appendTask(args.task))
    };
  }
  deleteTask(index) {
    if (!this.function.tasks || index < 0 || index >= this.function.tasks.length) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    this.function.tasks.splice(index, 1);
    return {
      ok: true,
      value: `New length: ${this.function.tasks.length}`,
      error: void 0
    };
  }
  deleteTaskTool() {
    return {
      name: "DeleteTask",
      description: "Delete Task",
      inputSchema: { index: z3.number() },
      fn: (args) => Promise.resolve(this.deleteTask(args.index))
    };
  }
  editTask(index, value) {
    if (!this.function.tasks || index < 0 || index >= this.function.tasks.length) {
      return {
        ok: false,
        value: void 0,
        error: "Invalid index"
      };
    }
    const parsed = Functions.QualityVectorVectorCompletionTaskExpressionSchema.safeParse(
      value
    );
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid QualityVectorVectorCompletionTaskExpression: ${parsed.error.message}`
      };
    }
    this.function.tasks[index] = parsed.data;
    return {
      ok: true,
      value: "Task updated.",
      error: void 0
    };
  }
  editTaskTool() {
    return {
      name: "EditTask",
      description: "Edit Task",
      inputSchema: {
        index: z3.number(),
        task: z3.record(z3.string(), z3.unknown())
      },
      fn: (args) => Promise.resolve(this.editTask(args.index, args.task))
    };
  }
  checkFunction() {
    const parsed = Functions.QualityLeafRemoteVectorFunctionSchema.safeParse({
      ...this.function,
      description: this.function.description || "description"
    });
    if (!parsed.success) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Function: ${parsed.error.message}`
      };
    }
    if (parsed.data.tasks.length < this.parameters.leafMinWidth || parsed.data.tasks.length > this.parameters.leafMaxWidth) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Function: Number of tasks must be between ${this.parameters.leafMinWidth} and ${this.parameters.leafMaxWidth}`
      };
    }
    try {
      Functions.Quality.checkLeafVectorFunction(parsed.data);
    } catch (e) {
      return {
        ok: false,
        value: void 0,
        error: `Invalid Function: ${e}`
      };
    }
    return {
      ok: true,
      value: "Function is valid",
      error: void 0
    };
  }
  checkFunctionTool() {
    return {
      name: "CheckFunction",
      description: "Check Function",
      inputSchema: {},
      fn: () => Promise.resolve(this.checkFunction())
    };
  }
  getSchemaTools() {
    return getSchemaTools([
      {
        schema: Functions.QualityLeafRemoteVectorFunctionJsonSchema,
        name: "QualityLeafRemoteVectorFunction"
      },
      {
        schema: Functions.Expression.VectorCompletionOutputJsonSchema,
        name: "VectorCompletionOutput"
      }
    ]);
  }
};
function functionsDir(owner) {
  return join(homedir(), ".objectiveai", "functions", owner);
}
function inventDir(owner, name) {
  return join(functionsDir(owner), name);
}

// src/state/state.ts
var StateOptionsBaseSchema = z3.object({
  parameters: ParametersSchema,
  inventSpec: z3.string().nonempty(),
  gitHubToken: z3.string().nonempty(),
  owner: z3.string().nonempty()
});
z3.union([
  StateOptionsBaseSchema,
  StateOptionsBaseSchema.extend({
    type: z3.literal("scalar.function"),
    input_schema: Functions.RemoteScalarFunctionSchema.shape.input_schema
  }),
  StateOptionsBaseSchema.extend({
    type: z3.literal("vector.function"),
    input_schema: Functions.QualityBranchRemoteVectorFunctionSchema.shape.input_schema,
    output_length: Functions.RemoteVectorFunctionSchema.shape.output_length,
    input_split: Functions.RemoteVectorFunctionSchema.shape.input_split,
    input_merge: Functions.RemoteVectorFunctionSchema.shape.input_merge
  })
]);
var State = class {
  parameters;
  inventSpec;
  gitHubToken;
  owner;
  name;
  inventEssay;
  inventEssayTasks;
  _inner;
  readme;
  placeholderTaskIndices;
  gitHubBackend;
  constructor(options, gitHubBackend) {
    this.parameters = options.parameters;
    this.inventSpec = options.inventSpec;
    this.gitHubToken = options.gitHubToken;
    this.owner = options.owner;
    this.gitHubBackend = gitHubBackend;
    if ("type" in options) {
      if (options.parameters.depth > 0) {
        if (options.type === "scalar.function") {
          this._inner = new BranchScalarState(
            options.parameters,
            options.input_schema
          );
        } else if (options.type === "vector.function") {
          this._inner = new BranchVectorState(
            options.parameters,
            options.input_schema,
            options.output_length,
            options.input_split,
            options.input_merge
          );
        }
      } else {
        if (options.type === "scalar.function") {
          this._inner = new LeafScalarState(
            options.parameters,
            options.input_schema
          );
        } else if (options.type === "vector.function") {
          this._inner = new LeafVectorState(
            options.parameters,
            options.input_schema,
            options.output_length,
            options.input_split,
            options.input_merge
          );
        }
      }
    }
  }
  getInventSpec() {
    return { ok: true, value: this.inventSpec, error: void 0 };
  }
  getInventSpecTool() {
    return {
      name: "ReadInventSpec",
      description: "Read InventSpec",
      inputSchema: {},
      fn: () => Promise.resolve(this.getInventSpec())
    };
  }
  getName() {
    if (this.name === void 0) {
      return { ok: false, value: void 0, error: "FunctionName not set" };
    }
    return { ok: true, value: this.name, error: void 0 };
  }
  getNameTool() {
    return {
      name: "ReadFunctionName",
      description: "Read FunctionName",
      inputSchema: {},
      fn: () => Promise.resolve(this.getName())
    };
  }
  async setName(value) {
    if (value.trim() === "") {
      return {
        ok: false,
        value: void 0,
        error: "FunctionName cannot be empty"
      };
    }
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value)) {
      return {
        ok: false,
        value: void 0,
        error: "FunctionName must be lowercase alphanumeric with dashes, cannot start or end with a dash"
      };
    }
    if (new TextEncoder().encode(value).length > 100) {
      return {
        ok: false,
        value: void 0,
        error: "FunctionName exceeds maximum of 100 bytes"
      };
    }
    const dir = inventDir(this.owner, value);
    if (existsSync(dir)) {
      return {
        ok: false,
        value: void 0,
        error: "Name is already taken, please use another"
      };
    }
    if (await this.gitHubBackend.repoExists(value, this.gitHubToken)) {
      return {
        ok: false,
        value: void 0,
        error: "Name is already taken, please use another"
      };
    }
    mkdirSync(functionsDir(this.owner), { recursive: true });
    try {
      mkdirSync(dir);
    } catch {
      return {
        ok: false,
        value: void 0,
        error: "Name is already taken, please use another"
      };
    }
    this.name = value;
    return { ok: true, value: "", error: void 0 };
  }
  setNameTool() {
    return {
      name: "WriteFunctionName",
      description: "Write FunctionName",
      inputSchema: { name: z3.string() },
      fn: (args) => this.setName(args.name)
    };
  }
  getInventEssay() {
    if (this.inventEssay === void 0) {
      return { ok: false, value: void 0, error: "InventEssay not set" };
    }
    return { ok: true, value: this.inventEssay, error: void 0 };
  }
  getInventEssayTool() {
    return {
      name: "ReadInventEssay",
      description: "Read InventEssay",
      inputSchema: {},
      fn: () => Promise.resolve(this.getInventEssay())
    };
  }
  setInventEssay(value) {
    if (value.trim() === "") {
      return {
        ok: false,
        value: void 0,
        error: "InventEssay cannot be empty"
      };
    }
    this.inventEssay = value;
    return { ok: true, value: "", error: void 0 };
  }
  setInventEssayTool() {
    return {
      name: "WriteInventEssay",
      description: "Write InventEssay",
      inputSchema: { essay: z3.string() },
      fn: (args) => Promise.resolve(this.setInventEssay(args.essay))
    };
  }
  getInventEssayTasks() {
    if (this.inventEssayTasks === void 0) {
      return {
        ok: false,
        value: void 0,
        error: "InventEssayTasks not set"
      };
    }
    return { ok: true, value: this.inventEssayTasks, error: void 0 };
  }
  getInventEssayTasksTool() {
    return {
      name: "ReadInventEssayTasks",
      description: "Read InventEssayTasks",
      inputSchema: {},
      fn: () => Promise.resolve(this.getInventEssayTasks())
    };
  }
  setInventEssayTasks(value) {
    if (value.trim() === "") {
      return {
        ok: false,
        value: void 0,
        error: "InventEssayTasks cannot be empty"
      };
    }
    this.inventEssayTasks = value;
    return { ok: true, value: "", error: void 0 };
  }
  setInventEssayTasksTool() {
    return {
      name: "WriteInventEssayTasks",
      description: "Write InventEssayTasks",
      inputSchema: { essay_tasks: z3.string() },
      fn: (args) => Promise.resolve(this.setInventEssayTasks(args.essay_tasks))
    };
  }
  getReadme() {
    if (this.readme === void 0) {
      return { ok: false, value: void 0, error: "Readme not set" };
    }
    return { ok: true, value: this.readme, error: void 0 };
  }
  getReadmeTool() {
    return {
      name: "ReadReadme",
      description: "Read Readme",
      inputSchema: {},
      fn: () => Promise.resolve(this.getReadme())
    };
  }
  setPlaceholderTaskIndices(indices) {
    this.placeholderTaskIndices = indices;
  }
  setReadme(value) {
    if (value.trim() === "") {
      return { ok: false, value: void 0, error: "Readme cannot be empty" };
    }
    if (this.placeholderTaskIndices && this.placeholderTaskIndices.length > 0) {
      const missing = [];
      for (const i of this.placeholderTaskIndices) {
        const template = `https://github.com/{{ .Owner }}/{{ .Task${i} }}`;
        if (!value.includes(template)) {
          missing.push(template);
        }
      }
      if (missing.length > 0) {
        return {
          ok: false,
          value: void 0,
          error: `README must include links to all sub-functions. Missing:
${missing.join("\n")}`
        };
      }
    }
    this.readme = value;
    return { ok: true, value: "", error: void 0 };
  }
  setReadmeTool() {
    return {
      name: "WriteReadme",
      description: "Write Readme",
      inputSchema: { readme: z3.string() },
      fn: (args) => Promise.resolve(this.setReadme(args.readme))
    };
  }
  getFunctionType() {
    if (!this.inner) {
      return {
        ok: false,
        value: void 0,
        error: "FunctionType not set"
      };
    } else if (this.inner instanceof BranchScalarState || this.inner instanceof LeafScalarState) {
      return {
        ok: true,
        value: "scalar.function",
        error: void 0
      };
    } else if (this.inner instanceof BranchVectorState || this.inner instanceof LeafVectorState) {
      return {
        ok: true,
        value: "vector.function",
        error: void 0
      };
    } else {
      throw new Error("Invalid inner state");
    }
  }
  getFunctionTypeTool() {
    return {
      name: "ReadFunctionType",
      description: "Read FunctionType",
      inputSchema: {},
      fn: () => Promise.resolve(this.getFunctionType())
    };
  }
  setFunctionType(value) {
    if (value === "scalar.function") {
      if (this.parameters.depth > 0) {
        this._inner = new BranchScalarState(this.parameters);
      } else {
        this._inner = new LeafScalarState(this.parameters);
      }
    } else if (value === "vector.function") {
      if (this.parameters.depth > 0) {
        this._inner = new BranchVectorState(this.parameters);
      } else {
        this._inner = new LeafVectorState(this.parameters);
      }
    } else {
      throw new Error("Invalid FunctionType");
    }
    return { ok: true, value: "", error: void 0 };
  }
  setFunctionTypeTool() {
    return {
      name: "WriteFunctionType",
      description: "Write FunctionType",
      inputSchema: { type: z3.string() },
      fn: (args) => Promise.resolve(this.setFunctionType(args.type))
    };
  }
  getDescription() {
    if (!this._inner) {
      return { ok: false, value: void 0, error: "Function type not set" };
    }
    if (this._inner.function.description) {
      return {
        ok: true,
        value: this._inner.function.description,
        error: void 0
      };
    }
    return { ok: false, value: void 0, error: "Description not set" };
  }
  getDescriptionTool() {
    return {
      name: "ReadFunctionDescription",
      description: "Read FunctionDescription",
      inputSchema: {},
      fn: () => Promise.resolve(this.getDescription())
    };
  }
  setDescription(value) {
    if (!this._inner) {
      return { ok: false, value: void 0, error: "Function type not set" };
    }
    if (value.trim() === "") {
      return {
        ok: false,
        value: void 0,
        error: "Description cannot be empty"
      };
    }
    const byteLength = new TextEncoder().encode(value).length;
    if (byteLength > 350) {
      return {
        ok: false,
        value: void 0,
        error: `Description is ${byteLength} bytes, exceeds maximum of 350 bytes`
      };
    }
    this._inner.function.description = value;
    return { ok: true, value: "", error: void 0 };
  }
  setDescriptionTool() {
    return {
      name: "WriteFunctionDescription",
      description: "Write FunctionDescription",
      inputSchema: { description: z3.string() },
      fn: (args) => Promise.resolve(this.setDescription(args.description))
    };
  }
  forceSetName(value) {
    this.name = value;
  }
  get inner() {
    return this._inner;
  }
};
function readConfigFile(dir) {
  try {
    const raw = readFileSync(join(dir, ".objectiveai", "config.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return void 0;
  }
}
function getValue(env, key, deserialize) {
  if (env)
    return env;
  const project = readConfigFile(process.cwd());
  if (project?.[key] !== void 0)
    return project[key];
  const user = readConfigFile(homedir());
  if (user?.[key] !== void 0) return user[key];
  return null;
}
function getGitHubToken() {
  return getValue(process.env.OBJECTIVEAI_GITHUB_TOKEN, "gitHubToken");
}
function getGitAuthorName() {
  return getValue(process.env.OBJECTIVEAI_GIT_AUTHOR_NAME, "gitAuthorName");
}
function getGitAuthorEmail() {
  return getValue(process.env.OBJECTIVEAI_GIT_AUTHOR_EMAIL, "gitAuthorEmail");
}
function getAgentUpstream() {
  const raw = getValue(process.env.OBJECTIVEAI_AGENT, "agent");
  if (raw === null) return null;
  const parsed = AgentUpstreamSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data;
}
function getAgentMockConfig() {
  const raw = getValue(
    process.env.OBJECTIVEAI_AGENT_MOCK_NOTIFICATION_DELAY_MS,
    "agentMockNotificationDelayMs"
  );
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return { notificationDelayMs: n };
}
var CLAUDE_MODELS = ["opus", "sonnet", "haiku"];
function parseClaudeModel(value) {
  if (typeof value === "string" && CLAUDE_MODELS.includes(value)) {
    return value;
  }
  return void 0;
}
function getAgentClaudeConfig() {
  const config = {
    ...readConfigFile(homedir()) ?? {},
    ...readConfigFile(process.cwd()) ?? {}
  };
  return {
    typeModel: parseClaudeModel(config.agentClaudeTypeModel),
    nameModel: parseClaudeModel(config.agentClaudeNameModel),
    essayModel: parseClaudeModel(config.agentClaudeEssayModel),
    fieldsModel: parseClaudeModel(config.agentClaudeFieldsModel),
    essayTasksModel: parseClaudeModel(config.agentClaudeEssayTasksModel),
    bodyModel: parseClaudeModel(config.agentClaudeBodyModel),
    descriptionModel: parseClaudeModel(config.agentClaudeDescriptionModel)
  };
}

// src/agent/mock.ts
var MOCK_OWNER = "mock";
var MOCK_COMMIT = "mock";
function getMockVariant(type, depth) {
  const tier = depth > 0 ? "branch" : "leaf";
  const kind = type === "vector.function" ? "vector" : "scalar";
  return `mock-${tier}-${kind}`;
}
function getNextMockName(type, depth) {
  const variant = getMockVariant(type, depth);
  const dir = functionsDir(MOCK_OWNER);
  const pattern = new RegExp(`^${variant}-(\\d+)$`);
  let max = 0;
  try {
    for (const entry of readdirSync(dir)) {
      const match = entry.match(pattern);
      if (match) max = Math.max(max, parseInt(match[1], 10));
    }
  } catch {
  }
  return `${variant}-${max + 1}`;
}
function stripMockSuffix(repository) {
  return repository.replace(/-\d+$/, "");
}
var MOCK_LEAF_SCALAR = {
  type: "scalar.function",
  description: "Mock leaf scalar function",
  input_schema: {
    type: "object",
    properties: { text: { type: "string" } },
    required: ["text"]
  },
  tasks: [
    {
      type: "vector.completion",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: { $starlark: "'Rate: ' + input['text']" }
            }
          ]
        }
      ],
      responses: [
        [{ type: "text", text: "Good" }],
        [{ type: "text", text: "Bad" }]
      ],
      output: { $starlark: "output['scores'][0]" }
    }
  ]
};
var MOCK_LEAF_VECTOR = {
  type: "vector.function",
  description: "Mock leaf vector function",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        minItems: 2,
        items: {
          type: "object",
          properties: { text: { type: "string" } },
          required: ["text"]
        }
      }
    },
    required: ["items"]
  },
  output_length: { $starlark: "len(input['items'])" },
  input_split: {
    $starlark: "[{'items': [item]} for item in input['items']]"
  },
  input_merge: {
    $starlark: "{'items': [item for sub in input for item in sub['items']]}"
  },
  tasks: [
    {
      type: "vector.completion",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: { $starlark: "'Rank: ' + str(input['items'])" }
            }
          ]
        }
      ],
      responses: {
        $starlark: "[[{'type': 'text', 'text': item['text']}] for item in input['items']]"
      },
      output: { $starlark: "output['scores']" }
    }
  ]
};
var MOCK_BRANCH_SCALAR = {
  type: "scalar.function",
  description: "Mock branch scalar function",
  input_schema: {
    type: "object",
    properties: { text: { type: "string" } },
    required: ["text"]
  },
  tasks: [
    {
      type: "placeholder.scalar.function",
      input_schema: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"]
      },
      input: { $starlark: "input" },
      output: { $starlark: "output" }
    }
  ]
};
var MOCK_BRANCH_VECTOR = {
  type: "vector.function",
  description: "Mock branch vector function",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        minItems: 2,
        items: {
          type: "object",
          properties: { text: { type: "string" } },
          required: ["text"]
        }
      }
    },
    required: ["items"]
  },
  output_length: { $starlark: "len(input['items'])" },
  input_split: {
    $starlark: "[{'items': [item]} for item in input['items']]"
  },
  input_merge: {
    $starlark: "{'items': [item for sub in input for item in sub['items']]}"
  },
  tasks: [
    {
      type: "placeholder.vector.function",
      input_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            minItems: 2,
            items: {
              type: "object",
              properties: { text: { type: "string" } },
              required: ["text"]
            }
          }
        },
        required: ["items"]
      },
      output_length: { $starlark: "len(input['items'])" },
      input_split: {
        $starlark: "[{'items': [item]} for item in input['items']]"
      },
      input_merge: {
        $starlark: "{'items': [item for sub in input for item in sub['items']]}"
      },
      input: { $starlark: "input" },
      output: { $starlark: "output" }
    }
  ]
};
var MOCK_FUNCTIONS = {
  "mock-leaf-scalar": MOCK_LEAF_SCALAR,
  "mock-leaf-vector": MOCK_LEAF_VECTOR,
  "mock-branch-scalar": MOCK_BRANCH_SCALAR,
  "mock-branch-vector": MOCK_BRANCH_VECTOR
};
function findTool(step, name) {
  return step.tools.find((t) => t.name === name);
}
async function* callTool(tool2, args, wait) {
  const result = await tool2.fn(args);
  if (result.ok) {
    yield { role: "tool", name: tool2.name };
  } else {
    yield { role: "tool", name: tool2.name, error: result.error };
  }
  await wait();
}
function mock() {
  const { notificationDelayMs = 100 } = getAgentMockConfig() || {};
  const wait = () => new Promise((resolve) => {
    const jitter = notificationDelayMs * (0.5 + Math.random());
    setTimeout(resolve, jitter);
  });
  const agent = async function* (step, _state, parameters) {
    const typeTool = findTool(step, "WriteFunctionType");
    if (typeTool) {
      const type = Math.random() < 0.5 ? "scalar.function" : "vector.function";
      yield { role: "assistant", content: `Setting function type to ${type}` };
      await wait();
      yield* callTool(typeTool, { type }, wait);
      return void 0;
    }
    const nameTool = findTool(step, "WriteFunctionName");
    if (nameTool) {
      const readTypeTool = findTool(step, "ReadFunctionType");
      let type = "scalar.function";
      if (readTypeTool) {
        const result = await readTypeTool.fn({});
        if (result.ok)
          type = result.value;
      }
      for (; ; ) {
        const name = getNextMockName(type, parameters.depth);
        yield {
          role: "assistant",
          content: `Setting function name to "${name}"`
        };
        await wait();
        const result = await nameTool.fn({ name });
        if (result.ok) {
          yield { role: "tool", name: nameTool.name };
          await wait();
          break;
        }
        yield { role: "tool", name: nameTool.name, error: result.error };
        await wait();
      }
      return void 0;
    }
    const essayTool = findTool(step, "WriteInventEssay");
    if (essayTool) {
      yield { role: "assistant", content: "Writing essay" };
      await wait();
      yield* callTool(
        essayTool,
        {
          essay: "This function evaluates quality by examining multiple aspects of the input. Each task assesses a different dimension."
        },
        wait
      );
      yield {
        role: "assistant",
        content: "I've written the essay describing the function's approach.\nIt covers the key evaluation dimensions:\n- Quality assessment\n- Clarity scoring\n- Relevance matching"
      };
      await wait();
      return void 0;
    }
    const inputSchemaTool = findTool(step, "WriteFunctionInputSchema");
    const checkFieldsTool = findTool(step, "CheckFields");
    if (inputSchemaTool && checkFieldsTool) {
      const isVector = !!findTool(step, "WriteFunctionOutputLength");
      yield { role: "assistant", content: "Setting input schema" };
      await wait();
      if (isVector) {
        yield* callTool(
          inputSchemaTool,
          {
            input_schema: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  minItems: 2,
                  items: {
                    type: "object",
                    properties: { text: { type: "string" } },
                    required: ["text"]
                  }
                }
              },
              required: ["items"]
            }
          },
          wait
        );
        const outputLengthTool = findTool(step, "WriteFunctionOutputLength");
        yield* callTool(
          outputLengthTool,
          { output_length: { $starlark: "len(input['items'])" } },
          wait
        );
        const inputSplitTool = findTool(step, "WriteFunctionInputSplit");
        yield* callTool(
          inputSplitTool,
          {
            input_split: {
              $starlark: "[{'items': [item]} for item in input['items']]"
            }
          },
          wait
        );
        const inputMergeTool = findTool(step, "WriteFunctionInputMerge");
        yield* callTool(
          inputMergeTool,
          {
            input_merge: {
              $starlark: "{'items': [item for sub in input for item in sub['items']]}"
            }
          },
          wait
        );
      } else {
        yield* callTool(
          inputSchemaTool,
          {
            input_schema: {
              type: "object",
              properties: { text: { type: "string" } },
              required: ["text"]
            }
          },
          wait
        );
      }
      yield { role: "assistant", content: "Checking fields" };
      await wait();
      yield* callTool(checkFieldsTool, {}, wait);
      return void 0;
    }
    const essayTasksTool = findTool(step, "WriteInventEssayTasks");
    if (essayTasksTool) {
      yield { role: "assistant", content: "Writing essay tasks" };
      await wait();
      yield* callTool(
        essayTasksTool,
        {
          essay_tasks: "Task 1: Evaluate overall quality.\nTask 2: Evaluate clarity.\nTask 3: Evaluate relevance."
        },
        wait
      );
      return void 0;
    }
    const checkFunctionTool = findTool(step, "CheckFunction");
    if (checkFunctionTool) {
      const appendVectorTask = findTool(step, "AppendVectorTask");
      const appendTask = findTool(step, "AppendTask");
      let taskNum = 0;
      for (; ; ) {
        yield { role: "assistant", content: `Creating task ${taskNum}` };
        await wait();
        if (appendVectorTask) {
          yield* callTool(
            appendVectorTask,
            {
              spec: `Evaluate aspect ${taskNum}`,
              task: {
                type: "placeholder.vector.function",
                input_schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      minItems: 2,
                      items: {
                        type: "object",
                        properties: { text: { type: "string" } },
                        required: ["text"]
                      }
                    }
                  },
                  required: ["items"]
                },
                output_length: { $starlark: "len(input['items'])" },
                input_split: {
                  $starlark: "[{'items': [item]} for item in input['items']]"
                },
                input_merge: {
                  $starlark: "{'items': [item for sub in input for item in sub['items']]}"
                },
                input: { $starlark: "input" },
                output: { $starlark: "output" }
              }
            },
            wait
          );
        } else if (appendTask && findTool(step, "ReadTaskSpec")) {
          yield* callTool(
            appendTask,
            {
              spec: `Evaluate aspect ${taskNum}`,
              task: {
                type: "placeholder.scalar.function",
                input_schema: {
                  type: "object",
                  properties: { text: { type: "string" } },
                  required: ["text"]
                },
                input: { $starlark: "input" },
                output: { $starlark: "output" }
              }
            },
            wait
          );
        } else if (appendTask) {
          const isVector = !!findTool(step, "ReadFunctionOutputLength");
          if (isVector) {
            yield* callTool(
              appendTask,
              {
                task: {
                  type: "vector.completion",
                  messages: [
                    {
                      role: "user",
                      content: [
                        {
                          type: "text",
                          text: {
                            $starlark: `'Evaluate aspect ${taskNum}: ' + str(input['items'])`
                          }
                        }
                      ]
                    }
                  ],
                  responses: {
                    $starlark: "[[{'type': 'text', 'text': item['text']}] for item in input['items']]"
                  },
                  output: { $starlark: "output['scores']" }
                }
              },
              wait
            );
          } else {
            yield* callTool(
              appendTask,
              {
                task: {
                  type: "vector.completion",
                  messages: [
                    {
                      role: "user",
                      content: [
                        {
                          type: "text",
                          text: {
                            $starlark: `'Evaluate aspect ${taskNum} of: ' + input['text']`
                          }
                        }
                      ]
                    }
                  ],
                  responses: [
                    [{ type: "text", text: "Excellent" }],
                    [{ type: "text", text: "Good" }],
                    [{ type: "text", text: "Poor" }]
                  ],
                  output: {
                    $starlark: "output['scores'][0] * 1.0 + output['scores'][1] * 0.5 + output['scores'][2] * 0.0"
                  }
                }
              },
              wait
            );
          }
        }
        taskNum++;
        yield { role: "assistant", content: "Checking function" };
        await wait();
        const result = await checkFunctionTool.fn({});
        if (result.ok) {
          yield { role: "tool", name: checkFunctionTool.name };
          await wait();
          yield {
            role: "assistant",
            content: "Function validation passed successfully.\nAll tasks compile correctly and produce valid outputs.\nThe function is ready for deployment."
          };
          await wait();
          return void 0;
        }
        yield {
          role: "tool",
          name: checkFunctionTool.name,
          error: result.error
        };
        await wait();
      }
    }
    const descTool = findTool(step, "WriteFunctionDescription");
    const readmeTool = findTool(step, "WriteReadme");
    if (descTool && readmeTool) {
      yield { role: "assistant", content: "Writing description and README" };
      await wait();
      yield* callTool(
        descTool,
        {
          description: "A mock function that evaluates quality, clarity, and relevance."
        },
        wait
      );
      const isBranch = !!findTool(step, "ReadTaskSpec");
      let readmeContent = "# Mock Function\n\nEvaluates quality, clarity, and relevance.";
      if (isBranch) {
        const tasksLengthTool = findTool(step, "ReadTasksLength");
        let taskCount = 1;
        if (tasksLengthTool) {
          const result = await tasksLengthTool.fn({});
          if (result.ok) taskCount = parseInt(result.value, 10) || 1;
        }
        readmeContent += "\n\n## Sub-functions\n";
        for (let i = 0; i < taskCount; i++) {
          readmeContent += `
- https://github.com/{{ .Owner }}/{{ .Task${i} }}`;
        }
      }
      yield* callTool(readmeTool, { readme: readmeContent }, wait);
      return void 0;
    }
    throw new Error(
      `Mock agent: unrecognized step with tools: ${step.tools.map((t) => t.name).join(", ")}`
    );
  };
  const github = {
    pushInitial: async () => {
    },
    pushFinal: async () => {
    },
    getOwnerRepositoryCommit: async (dir) => {
      const paramsPath = join(dir, "parameters.json");
      if (!existsSync(paramsPath)) return null;
      const name = basename(dir);
      if (!name) return null;
      return { owner: MOCK_OWNER, repository: name, commit: MOCK_COMMIT };
    },
    fetchRemoteFunctions: async (refs) => {
      const entries = Array.from(refs);
      const record = {};
      for (const { owner, repository, commit: commit2 } of entries) {
        const key = `${owner}/${repository}/${commit2}`;
        const variant = stripMockSuffix(repository);
        const fn = MOCK_FUNCTIONS[variant];
        if (!fn) return null;
        record[key] = fn;
      }
      return record;
    },
    repoExists: () => Promise.resolve(false),
    getAuthenticatedUser: async () => MOCK_OWNER
  };
  return [agent, github];
}
process.setMaxListeners(0);
function resultToCallToolResult(result) {
  if (!result.ok) {
    return { content: [{ type: "text", text: result.error }], isError: true };
  }
  return { content: [{ type: "text", text: result.value ?? "OK" }] };
}
var STEP_TO_CONFIG_KEY = {
  type: "typeModel",
  name: "nameModel",
  essay: "essayModel",
  fields: "fieldsModel",
  essay_tasks: "essayTasksModel",
  body: "bodyModel",
  description: "descriptionModel"
};
var CLAUDE_MODEL_TO_QUERY = {
  opus: "default",
  sonnet: "sonnet",
  haiku: "haiku"
};
function claude() {
  const agent = async function* (step, state, _parameters) {
    const notifications = [];
    const sdkTools = step.tools.map(
      (t) => tool(t.name, t.description, t.inputSchema, async (args) => {
        const result = await t.fn(args);
        notifications.push(
          result.ok ? { role: "tool", name: t.name } : { role: "tool", name: t.name, error: result.error }
        );
        return resultToCallToolResult(result);
      })
    );
    const mcpServer = createSdkMcpServer({
      name: "invent",
      tools: sdkTools
    });
    const claudeConfig = getAgentClaudeConfig();
    const configKey = STEP_TO_CONFIG_KEY[step.stepName];
    const claudeModel = claudeConfig[configKey];
    const stream = query({
      prompt: step.prompt,
      options: {
        mcpServers: { invent: mcpServer },
        allowedTools: ["mcp__invent__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: state?.sessionId,
        ...claudeModel ? { model: CLAUDE_MODEL_TO_QUERY[claudeModel] } : {}
      }
    });
    let sessionId = state?.sessionId;
    const onUncaughtException = (err) => {
      if (err?.code === "ERR_STREAM_WRITE_AFTER_END") {
        return;
      }
      throw err;
    };
    process.on("uncaughtException", onUncaughtException);
    try {
      for await (const message of stream) {
        while (notifications.length > 0) {
          yield notifications.shift();
        }
        if (message.type === "system" && message.subtype === "init") {
          sessionId = message.session_id;
        }
        if (message.type === "assistant") {
          const parts = [];
          for (const block of message.message.content) {
            if (block.type === "text") {
              const text = block.text.trim();
              if (text) parts.push(text);
            }
          }
          if (parts.length > 0) {
            yield { role: "assistant", content: parts.join("\n") };
          }
        }
      }
    } finally {
      process.removeListener("uncaughtException", onUncaughtException);
    }
    while (notifications.length > 0) {
      yield notifications.shift();
    }
    return { sessionId };
  };
  return [agent, null];
}

// src/agent/index.ts
var MockAgentUpstreamSchema = z3.literal("mock");
var ClaudeAgentUpstreamSchema = z3.literal("claude");
var AgentUpstreamSchema = z3.union([
  MockAgentUpstreamSchema,
  ClaudeAgentUpstreamSchema
]);
z3.union([
  z3.literal("type"),
  z3.literal("name"),
  z3.literal("essay"),
  z3.literal("fields"),
  z3.literal("essay_tasks"),
  z3.literal("body"),
  z3.literal("description")
]);
async function runAgentStep(agent, step, parameters, isDone, maxRetries, onNotification2, state) {
  let lastError;
  for (let i = 0; i <= maxRetries; i++) {
    const retryPrompt = lastError != null ? step.prompt + `

The following error occurred: ${lastError}

Please try again.` : step.prompt;
    try {
      state = await runAgentStepOne(
        agent,
        { ...step, prompt: retryPrompt },
        parameters,
        onNotification2,
        state
      );
    } catch (err) {
      onNotification2({
        role: "assistant",
        content: `Agent crashed: ${err instanceof Error ? err.message : err}`
      });
      lastError = err instanceof Error ? err.message : String(err);
      continue;
    }
    const result = isDone();
    if (result.ok) return state;
    lastError = result.error;
  }
  throw new Error(
    `Agent step failed after ${maxRetries} retries: ${lastError}`
  );
}
async function runAgentStepOne(agent, step, parameters, onNotification2, state) {
  const generator = agent(step, state, parameters);
  while (true) {
    const { done, value } = await generator.next();
    if (done) {
      return value;
    }
    onNotification2(value);
  }
}
function getAgentStepFn(agentUpstream) {
  if (agentUpstream === "mock") {
    return mock();
  } else if (agentUpstream === "claude") {
    return claude();
  } else {
    const _exhaustiveCheck = agentUpstream;
    return _exhaustiveCheck;
  }
}
var PlaceholderTaskSpecEntrySchema = z3.object({
  spec: z3.string().nonempty(),
  token: z3.string().nonempty()
});
var PlaceholderTaskSpecsSchema = z3.array(
  z3.union([PlaceholderTaskSpecEntrySchema, z3.null()])
);

// src/ext.ts
var CliFunctionExt;
((CliFunctionExt2) => {
  function* remoteChildren(self) {
    for (const task of self.tasks) {
      if (task.type === "scalar.function" || task.type === "vector.function") {
        const { owner, repository, commit: commit2 } = task;
        yield { owner, repository, commit: commit2 };
      }
    }
  }
  CliFunctionExt2.remoteChildren = remoteChildren;
})(CliFunctionExt || (CliFunctionExt = {}));

// src/fs.ts
z3.object({
  parameters: ParametersSchema,
  name: z3.string().nonempty(),
  function: z3.discriminatedUnion("type", [
    z3.object({
      type: z3.literal("branch.scalar.function"),
      function: Functions.QualityBranchRemoteScalarFunctionSchema
    }),
    z3.object({
      type: z3.literal("branch.vector.function"),
      function: Functions.QualityBranchRemoteVectorFunctionSchema
    }),
    z3.object({
      type: z3.literal("leaf.scalar.function"),
      function: Functions.QualityLeafRemoteScalarFunctionSchema
    }),
    z3.object({
      type: z3.literal("leaf.vector.function"),
      function: Functions.QualityLeafRemoteVectorFunctionSchema
    })
  ]),
  placeholderTaskSpecs: PlaceholderTaskSpecsSchema.optional()
});
function readTextFromFilesystem(path) {
  try {
    if (!existsSync(path)) return null;
    const content = readFileSync(path, "utf-8").trim();
    return content || null;
  } catch {
    return null;
  }
}
function readJsonFromFilesystem(path) {
  try {
    const text = readTextFromFilesystem(path);
    if (text === null) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}
function readParametersFromFilesystem(path) {
  const json = readJsonFromFilesystem(join(path, "parameters.json"));
  if (json === null) return null;
  const result = ParametersSchema.safeParse(json);
  if (!result.success) return null;
  return result.data;
}
function readFunctionFromFilesystem(path) {
  const json = readJsonFromFilesystem(join(path, "function.json"));
  if (json === null) return null;
  const result = Functions.RemoteFunctionSchema.safeParse(json);
  if (!result.success) return null;
  return result.data;
}
function readPlaceholderTaskSpecsFromFilesystem(path) {
  const json = readJsonFromFilesystem(
    join(path, "placeholder_task_specs.json")
  );
  if (json === null) return null;
  const result = PlaceholderTaskSpecsSchema.safeParse(json);
  if (!result.success) return null;
  return result.data;
}
async function readQualityFunctionFromFilesystem(dir, githubBackend) {
  const parameters = readParametersFromFilesystem(dir);
  if (parameters === null) return null;
  const name = basename(dir);
  if (!name) return null;
  const fn = readFunctionFromFilesystem(dir);
  if (fn === null) return null;
  if (parameters.depth > 0) {
    const placeholderTaskSpecs = readPlaceholderTaskSpecsFromFilesystem(dir);
    for (let i = 0; i < fn.tasks.length; i++) {
      const task = fn.tasks[i];
      if (task.type === "placeholder.scalar.function" || task.type === "placeholder.vector.function") {
        if (placeholderTaskSpecs === null || placeholderTaskSpecs[i] === null || placeholderTaskSpecs[i] === void 0) {
          return null;
        }
      }
    }
    if (fn.type === "scalar.function") {
      const parsed = Functions.QualityBranchRemoteScalarFunctionSchema.safeParse(fn);
      if (!parsed.success) return null;
      const children = await githubBackend.fetchRemoteFunctions(
        CliFunctionExt.remoteChildren(parsed.data)
      );
      if (children === null) return null;
      try {
        Functions.Quality.checkBranchScalarFunction(parsed.data, children);
      } catch {
        return null;
      }
      return {
        parameters,
        name,
        function: { type: "branch.scalar.function", function: parsed.data },
        placeholderTaskSpecs: placeholderTaskSpecs ?? void 0
      };
    } else if (fn.type === "vector.function") {
      const parsed = Functions.QualityBranchRemoteVectorFunctionSchema.safeParse(fn);
      if (!parsed.success) return null;
      const children = await githubBackend.fetchRemoteFunctions(
        CliFunctionExt.remoteChildren(parsed.data)
      );
      if (children === null) return null;
      try {
        Functions.Quality.checkBranchVectorFunction(parsed.data, children);
      } catch {
        return null;
      }
      return {
        parameters,
        name,
        function: { type: "branch.vector.function", function: parsed.data },
        placeholderTaskSpecs: placeholderTaskSpecs ?? void 0
      };
    }
  } else {
    if (fn.type === "scalar.function") {
      const parsed = Functions.QualityLeafRemoteScalarFunctionSchema.safeParse(fn);
      if (!parsed.success) return null;
      try {
        Functions.Quality.checkLeafScalarFunction(parsed.data);
      } catch {
        return null;
      }
      return {
        parameters,
        name,
        function: { type: "leaf.scalar.function", function: parsed.data }
      };
    } else if (fn.type === "vector.function") {
      const parsed = Functions.QualityLeafRemoteVectorFunctionSchema.safeParse(fn);
      if (!parsed.success) return null;
      try {
        Functions.Quality.checkLeafVectorFunction(parsed.data);
      } catch {
        return null;
      }
      return {
        parameters,
        name,
        function: { type: "leaf.vector.function", function: parsed.data }
      };
    }
  }
  return null;
}
function writeParentTokenToFilesystem(dir, token) {
  writeTextToFilesystem(join(dir, "parent.txt"), token);
}
function readParentTokenFromFilesystem(dir) {
  return readTextFromFilesystem(join(dir, "parent.txt"));
}
function findChildByToken(owner, token) {
  const ownerDir = functionsDir(owner);
  if (!existsSync(ownerDir)) return null;
  let entries;
  try {
    entries = readdirSync(ownerDir);
  } catch {
    return null;
  }
  for (const entry of entries) {
    const childDir = join(ownerDir, entry);
    const childToken = readParentTokenFromFilesystem(childDir);
    if (childToken === token) return childDir;
  }
  return null;
}
function writeTextToFilesystem(path, content) {
  writeFileSync(path, content, "utf-8");
}
function writeJsonToFilesystem(path, data) {
  writeTextToFilesystem(path, JSON.stringify(data, null, 2));
}
function writeParametersToFilesystem(dir, parameters) {
  writeJsonToFilesystem(join(dir, "parameters.json"), parameters);
}
function writeFunctionToFilesystem(dir, fn) {
  writeJsonToFilesystem(join(dir, "function.json"), fn);
}
function writeInventSpecToFilesystem(dir, spec) {
  writeTextToFilesystem(join(dir, "INVENT_SPEC.md"), spec);
}
function writeInventEssayToFilesystem(dir, essay) {
  writeTextToFilesystem(join(dir, "INVENT_ESSAY.md"), essay);
}
function writeInventEssayTasksToFilesystem(dir, essayTasks) {
  writeTextToFilesystem(join(dir, "INVENT_ESSAY_TASKS.md"), essayTasks);
}
function readReadmeFromFilesystem(dir) {
  return readTextFromFilesystem(join(dir, "README.md"));
}
function writeReadmeToFilesystem(dir, readme) {
  writeTextToFilesystem(join(dir, "README.md"), readme);
}
function writePlaceholderTaskSpecsToFilesystem(dir, specs) {
  writeJsonToFilesystem(join(dir, "placeholder_task_specs.json"), specs);
}
function writeGitignoreToFilesystem(dir) {
  const content = [
    "# Ignore everything",
    "*",
    "",
    "# Allow specific files",
    "!.gitignore",
    "!parent.txt",
    "!parameters.json",
    "!function.json",
    "!INVENT_SPEC.md",
    "!INVENT_ESSAY.md",
    "!INVENT_ESSAY_TASKS.md",
    "!README.md",
    "!placeholder_task_specs.json",
    ""
  ].join("\n");
  writeTextToFilesystem(join(dir, ".gitignore"), content);
}
function writeInitialStateToFilesystem(dir, parameters) {
  mkdirSync(dir, { recursive: true });
  writeParametersToFilesystem(dir, parameters);
  writeGitignoreToFilesystem(dir);
}
function writeFinalStateToFilesystem(dir, state, parameters) {
  writeInitialStateToFilesystem(dir, parameters);
  const inner = state.inner;
  if (!inner) throw new Error("Inner state not set");
  writeFunctionToFilesystem(dir, inner.function);
  writeInventSpecToFilesystem(dir, state.inventSpec);
  const essay = state.getInventEssay();
  if (essay.ok) writeInventEssayToFilesystem(dir, essay.value);
  const essayTasks = state.getInventEssayTasks();
  if (essayTasks.ok) writeInventEssayTasksToFilesystem(dir, essayTasks.value);
  const readme = state.getReadme();
  if (readme.ok) writeReadmeToFilesystem(dir, readme.value);
  if (inner instanceof BranchScalarState || inner instanceof BranchVectorState) {
    const specs = inner.getPlaceholderTaskSpecs();
    if (specs) writePlaceholderTaskSpecsToFilesystem(dir, specs);
  }
}
var execOpts = { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] };
function getRepoRoot(dir) {
  try {
    const root = execSync("git rev-parse --show-toplevel", {
      ...execOpts,
      cwd: dir
    }).trim();
    return root || null;
  } catch {
    return null;
  }
}
function getRemoteUrl(dir) {
  try {
    const url = execSync("git remote get-url origin", {
      ...execOpts,
      cwd: dir
    }).trim();
    return url || null;
  } catch {
    return null;
  }
}
function parseGitHubRemote(url) {
  const httpsMatch = url.match(/github\.com\/([^/]+)\/([^/.]+)/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repository: httpsMatch[2] };
  }
  const sshMatch = url.match(/github\.com:([^/]+)\/([^/.]+)/);
  if (sshMatch) {
    return { owner: sshMatch[1], repository: sshMatch[2] };
  }
  return null;
}
function getLatestCommitForPath(repoRoot, relativePath) {
  try {
    const sha = execSync(`git log -1 --format=%H -- "${relativePath}"`, {
      ...execOpts,
      cwd: repoRoot
    }).trim();
    return sha || null;
  } catch {
    return null;
  }
}
function hasUncommittedChanges(repoRoot, relativePath) {
  try {
    const output = execSync(`git status --porcelain -- "${relativePath}"`, {
      ...execOpts,
      cwd: repoRoot
    }).trim();
    return output.length > 0;
  } catch {
    return true;
  }
}
function isDirty(dir) {
  try {
    const output = execSync("git status --porcelain", {
      ...execOpts,
      cwd: dir
    }).trim();
    return output.length > 0;
  } catch {
    return true;
  }
}
function removeGitDir(dir) {
  rmSync(join(dir, ".git"), { recursive: true, force: true });
}
function initRepo(dir) {
  execSync("git init", { ...execOpts, cwd: dir });
}
function addAll(dir) {
  execSync("git add -A", { ...execOpts, cwd: dir });
}
function commit(dir, message, authorName, authorEmail) {
  execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
    ...execOpts,
    cwd: dir,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: authorName,
      GIT_COMMITTER_NAME: authorName,
      GIT_AUTHOR_EMAIL: authorEmail,
      GIT_COMMITTER_EMAIL: authorEmail
    }
  });
}
function addRemote(dir, url) {
  execSync(`git remote add origin ${url}`, { ...execOpts, cwd: dir });
}
function push(dir, gitHubToken) {
  execSync(
    `git -c "url.https://x-access-token:${gitHubToken}@github.com/.insteadOf=https://github.com/" push -u origin main`,
    { ...execOpts, cwd: dir }
  );
}

// src/github.ts
var DefaultGitHubBackend = {
  pushInitial,
  pushFinal,
  getOwnerRepositoryCommit,
  fetchRemoteFunctions,
  repoExists,
  getAuthenticatedUser
};
var fetchRemoteFunctionCache = /* @__PURE__ */ new Map();
function fetchRemoteFunction(owner, repository, commit2) {
  const key = `${owner}/${repository}/${commit2}`;
  const cached = fetchRemoteFunctionCache.get(key);
  if (cached) {
    return cached;
  }
  const promise = (async () => {
    const url = `https://raw.githubusercontent.com/${owner}/${repository}/${commit2}/function.json`;
    const response = await fetch(url);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching ${url}`);
    }
    let json;
    try {
      json = await response.json();
    } catch {
      return null;
    }
    const result = Functions.RemoteFunctionSchema.safeParse(json);
    if (!result.success) {
      return null;
    }
    return result.data;
  })();
  fetchRemoteFunctionCache.set(key, promise);
  return promise;
}
async function fetchRemoteFunctions(refs) {
  const entries = Array.from(refs);
  const results = await Promise.all(
    entries.map(
      ({ owner, repository, commit: commit2 }) => fetchRemoteFunction(owner, repository, commit2)
    )
  );
  const record = {};
  for (let i = 0; i < entries.length; i++) {
    const result = results[i];
    if (result === null) {
      return null;
    }
    const { owner, repository, commit: commit2 } = entries[i];
    record[`${owner}/${repository}/${commit2}`] = result;
  }
  return record;
}
async function repoExists(name, gitHubToken) {
  try {
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${gitHubToken}`,
        Accept: "application/vnd.github.v3+json"
      }
    });
    if (!userRes.ok) return false;
    const user = await userRes.json();
    const res = await fetch(
      `https://api.github.com/repos/${user.login}/${name}`,
      {
        headers: {
          Authorization: `Bearer ${gitHubToken}`,
          Accept: "application/vnd.github.v3+json"
        }
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}
async function commitExistsOnRemote(owner, repository, sha, gitHubToken) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repository}/commits/${sha}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${gitHubToken}`
      }
    });
    return response.ok;
  } catch {
    return false;
  }
}
async function getOwnerRepositoryCommit(dir, gitHubToken) {
  const repoRoot = getRepoRoot(dir);
  if (!repoRoot) return null;
  const remoteUrl = getRemoteUrl(repoRoot);
  if (!remoteUrl) return null;
  const parsed = parseGitHubRemote(remoteUrl);
  if (!parsed) return null;
  const relativePath = relative(repoRoot, dir).replace(/\\/g, "/") || ".";
  if (hasUncommittedChanges(repoRoot, relativePath + "/function.json")) {
    return null;
  }
  const localCommit = getLatestCommitForPath(repoRoot, relativePath);
  if (!localCommit) return null;
  const exists = await commitExistsOnRemote(
    parsed.owner,
    parsed.repository,
    localCommit,
    gitHubToken
  );
  if (!exists) return null;
  return {
    owner: parsed.owner,
    repository: parsed.repository,
    commit: localCommit
  };
}
async function pushInitial(options) {
  const { dir, name, gitHubToken, gitAuthorName, gitAuthorEmail, message } = options;
  removeGitDir(dir);
  initRepo(dir);
  addAll(dir);
  commit(dir, message, gitAuthorName, gitAuthorEmail);
  const res = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gitHubToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, visibility: "public" })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Failed to create repo ${name}: HTTP ${res.status} ${body}`
    );
  }
  const repo = await res.json();
  const owner = repo.owner.login;
  const repository = repo.name;
  addRemote(dir, `https://github.com/${owner}/${repository}.git`);
  push(dir, gitHubToken);
}
var authenticatedUserCache = /* @__PURE__ */ new Map();
function getAuthenticatedUser(gitHubToken) {
  const cached = authenticatedUserCache.get(gitHubToken);
  if (cached) return cached;
  const promise = (async () => {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${gitHubToken}`,
        Accept: "application/vnd.github.v3+json"
      }
    });
    if (!res.ok) {
      throw new Error(`Failed to get authenticated user: HTTP ${res.status}`);
    }
    const user = await res.json();
    return user.login;
  })();
  authenticatedUserCache.set(gitHubToken, promise);
  return promise;
}
async function pushFinal(options) {
  const {
    dir,
    gitHubToken,
    gitAuthorName,
    gitAuthorEmail,
    message,
    description
  } = options;
  const repoRoot = getRepoRoot(dir);
  if (!repoRoot) throw new Error("Git repository not initialized");
  const remoteUrl = getRemoteUrl(repoRoot);
  if (!remoteUrl) throw new Error("No remote origin set");
  const parsed = parseGitHubRemote(remoteUrl);
  if (!parsed) throw new Error("Remote is not a GitHub repository");
  const { owner, repository } = parsed;
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repository}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${gitHubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ description })
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Failed to update repo ${owner}/${repository}: HTTP ${res.status} ${body}`
    );
  }
  addAll(dir);
  commit(dir, message, gitAuthorName, gitAuthorEmail);
  push(dir, gitHubToken);
}

// src/invent/steps/1_type.ts
function stepType(state, agent, onNotification2, agentState, maxRetries = 5) {
  if (state.getFunctionType().ok) {
    return Promise.resolve(agentState);
  }
  return runAgentStep(
    agent,
    {
      stepName: "type",
      prompt: 'You are an inventor creating a new ObjectiveAI Function. ObjectiveAI Functions are for ranking multiple input items ("vector.function"), or for scoring a single input item ("scalar.function"). Select the appropriate type based on InventSpec and what the expected input is.',
      tools: [
        state.getInventSpecTool(),
        state.setFunctionTypeTool()
      ]
    },
    state.parameters,
    () => state.getFunctionType(),
    maxRetries,
    onNotification2,
    agentState
  );
}

// src/invent/steps/2_name.ts
function stepName(state, agent, onNotification2, agentState, maxRetries = 5) {
  if (state.getName().ok) {
    return Promise.resolve(agentState);
  }
  return runAgentStep(
    agent,
    {
      stepName: "name",
      prompt: 'Select a name for your ObjectiveAI Function. Do not include "ObjectiveAI" or "Function" in the name. Name it how you would name a function in code. Use all lowercase and separate words with dashes.',
      tools: [
        state.getInventSpecTool(),
        state.getFunctionTypeTool(),
        state.setNameTool()
      ]
    },
    state.parameters,
    () => state.getName(),
    maxRetries,
    onNotification2,
    agentState
  );
}

// src/invent/steps/3_essay.ts
function stepEssay(state, agent, onNotification2, agentState, maxRetries = 5) {
  const inner = state.inner;
  if (!inner) throw new Error("Function type not set");
  const isVector = inner instanceof BranchVectorState || inner instanceof LeafVectorState;
  const minWidth = state.parameters.depth > 0 ? state.parameters.branchMinWidth : state.parameters.leafMinWidth;
  const maxWidth = state.parameters.depth > 0 ? state.parameters.branchMaxWidth : state.parameters.leafMaxWidth;
  const tasksStr = minWidth === maxWidth ? `${minWidth}` : `between ${minWidth} and ${maxWidth}`;
  if (isVector) {
    return runAgentStep(
      agent,
      {
        stepName: "essay",
        prompt: `Write a non-technical essay describing the Vector Function you are building. Explore the purpose, inputs, and use-cases of the function in detail. Explore the qualities and values that must be evaluated in order to properly rank items relative to one another. There should be ${tasksStr} qualities or values. This essay will guide the development of the Vector Function and underpins its philosophy.`,
        tools: [
          state.getInventSpecTool(),
          state.getFunctionTypeTool(),
          state.getNameTool(),
          state.setInventEssayTool()
        ]
      },
      state.parameters,
      () => state.getInventEssay(),
      maxRetries,
      onNotification2,
      agentState
    );
  } else {
    return runAgentStep(
      agent,
      {
        stepName: "essay",
        prompt: `Write a non-technical essay describing the Scalar Function you are building. Explore the purpose, input, and use-cases of the function in detail. Explore the qualities and values that must be evaluated for the input. There should be ${tasksStr} qualities or values. This essay will guide the development of the Scalar Function and underpins its philosophy.`,
        tools: [
          state.getInventSpecTool(),
          state.getFunctionTypeTool(),
          state.getNameTool(),
          state.setInventEssayTool()
        ]
      },
      state.parameters,
      () => state.getInventEssay(),
      maxRetries,
      onNotification2,
      agentState
    );
  }
}

// src/invent/steps/4_fields.ts
function stepFields(state, agent, onNotification2, agentState, maxRetries = 5) {
  const inner = state.inner;
  if (!inner) throw new Error("Function type not set");
  if (inner.checkFields().ok) {
    return Promise.resolve(agentState);
  }
  const isVector = inner instanceof BranchVectorState || inner instanceof LeafVectorState;
  if (isVector) {
    return runAgentStep(
      agent,
      {
        stepName: "fields",
        prompt: "Create the InputSchema for your Vector Function. Ensure that it adheres to the specifications outlined in your InventSpec and is consistent with the qualities and values described in your essay. Read the QualityVectorFunctionInputSchema for guidance on what a valid input schema looks like. Next, create an OutputLength Starlark Expression. This expression is provided with an `input` matching the InputSchema and should evaluate to the number of items being ranked. Next, create an InputSplit Starlark Expression. This expression is provided with the same `input` and should evaluate to an array of valid inputs, which, on their own, are valid inputs to the function. So, if the input is an array, the InputSplit expression should convert it into an array of 1-length arrays. Or, if the input is an object with at least 1 array field, the InputSplit expression should convert it into an array of objects with the field containing rankable items being 1-length arrays. Finally, create an InputMerge Starlark Expression. This expression is provided with an `input` which is an array of valid inputs. This expression should re-combine the provided inputs back into the original input format. Use `CheckFields` to validate your schema and expressions prior to finishing.",
        tools: [
          state.getInventSpecTool(),
          state.getFunctionTypeTool(),
          state.getNameTool(),
          state.getInventEssayTool(),
          inner.setInputSchemaTool(),
          inner.setOutputLengthTool(),
          inner.setInputMergeTool(),
          inner.setInputSplitTool(),
          inner.checkFieldsTool(),
          inner.getInputSchemaTool(),
          inner.getOutputLengthTool(),
          inner.getInputMergeTool(),
          inner.getInputSplitTool(),
          ...inner.getSchemaTools()
        ]
      },
      state.parameters,
      () => inner.checkFields(),
      maxRetries,
      onNotification2,
      agentState
    );
  } else {
    return runAgentStep(
      agent,
      {
        stepName: "fields",
        prompt: "Create the InputSchema for your Scalar Function. Ensure that it adheres to the specifications outlined in your InventSpec and is consistent with the essay you wrote describing your function. Read the InputSchemaSchema for guidance on what a valid input schema looks like. Use `CheckFields` to validate your schema prior to finishing.",
        tools: [
          state.getInventSpecTool(),
          state.getFunctionTypeTool(),
          state.getNameTool(),
          state.getInventEssayTool(),
          inner.setInputSchemaTool(),
          inner.checkFieldsTool(),
          inner.getInputSchemaTool(),
          ...inner.getSchemaTools()
        ]
      },
      state.parameters,
      () => inner.checkFields(),
      maxRetries,
      onNotification2,
      agentState
    );
  }
}

// src/invent/steps/5_essayTasks.ts
function stepEssayTasks(state, agent, onNotification2, agentState, maxRetries = 5) {
  const inner = state.inner;
  if (!inner) throw new Error("Function type not set");
  const minWidth = state.parameters.depth > 0 ? state.parameters.branchMinWidth : state.parameters.leafMinWidth;
  const maxWidth = state.parameters.depth > 0 ? state.parameters.branchMaxWidth : state.parameters.leafMaxWidth;
  const tasksStr = minWidth === maxWidth ? `${minWidth}` : `between ${minWidth} and ${maxWidth}`;
  return runAgentStep(
    agent,
    {
      stepName: "essay_tasks",
      prompt: `Write EssayTasks listing and describing the key tasks the Function must perform in order to fulfill the quality and value evaluations defined within the essay.  Each task is a non-technical plain language description of a task which will go into the function's \`tasks\` array. There should be ${tasksStr} tasks.`,
      tools: [
        state.getInventSpecTool(),
        state.getFunctionTypeTool(),
        state.getNameTool(),
        state.getInventEssayTool(),
        inner.getInputSchemaTool(),
        state.setInventEssayTasksTool()
      ]
    },
    state.parameters,
    () => state.getInventEssayTasks(),
    maxRetries,
    onNotification2,
    agentState
  );
}

// src/invent/steps/6_body.ts
function stepBody(state, agent, onNotification2, agentState, maxRetries = 5) {
  const inner = state.inner;
  if (!inner) throw new Error("Function type not set");
  const minWidth = state.parameters.depth > 0 ? state.parameters.branchMinWidth : state.parameters.leafMinWidth;
  const maxWidth = state.parameters.depth > 0 ? state.parameters.branchMaxWidth : state.parameters.leafMaxWidth;
  const tasksStr = minWidth === maxWidth ? `${minWidth}` : `between ${minWidth} and ${maxWidth}`;
  if (inner instanceof BranchVectorState) {
    return runAgentStep(
      agent,
      {
        stepName: "body",
        prompt: `Create the Tasks for your Vector Function.

## Task Structure

Create ${tasksStr} placeholder tasks based on your EssayTasks. Each task defines a sub-function which will be automatically invented after you finish. Some tasks may have the same \`input_schema\` as the parent, and some may contain only a subset so as to evaluate a specific aspect of the input.
You can mix two types of placeholder tasks:
- **Unmapped vector tasks** (\`placeholder.vector.function\`): Ranks the input items provided to the task relative to each other. Use \`AppendVectorTask\` to create these.
- **Mapped scalar tasks** (\`placeholder.scalar.function\` with \`map\`): Iterate over input items via \`input_maps\` and score each one individually. Use \`AppendScalarTask\` to create these.

**Constraints:**
- At most 50% of tasks can be mapped scalar tasks

**TaskSpec:**
- First, write a detailed \`spec\` for the task, describing what the sub-function should evaluate. This is a plain language description that will guide the child agent inventing the sub-function.` + (state.parameters.depth > 1 ? " The sub-function will also have its own sub-functions. The spec should include any instructions that should also be propagated down to the child agent's own child agents, if any are needed.\n\n" : "\n\n") + "**Vector Task Guidelines:**\n- After creating the InputSchema for the task, create an OutputLength Starlark Expression. This expression is provided with an `input` matching the task's InputSchema and should evaluate to the number of items being ranked.\n- Then, create an InputSplit Starlark Expression. This expression is provided with the same `input` and should evaluate to an array of valid inputs, which, on their own, are valid inputs to the task. So, if the input is an array, the InputSplit expression should convert it into an array of 1-length arrays. Or, if the input is an object with at least 1 array field, the InputSplit expression should convert it into an array of objects with the field containing rankable items being 1-length arrays.\n- Finally, create an InputMerge Starlark Expression. This expression is provided with an `input` which is an array of valid inputs to the task. This expression should re-combine the provided inputs back into the original input format for the task.\n\n**Mapped Scalar Task Guidelines:**\n- Define an InputMap Starlark Expression which converts the parent input into an array of items to be individually scored.\n\n**Task Guidelines:**\n- `skip` expressions conditionally skip tasks for certain conditions. This is typically used to skip tasks which evaluate some optional field on the parent input.\n- `input` expressions derive the task input from the parent input.\n- `output` expressions transform the raw sub-function output into an output which would be a valid output for the parent function. Typically, for vector tasks, just yield the sub-function output directly. Typically, for mapped scalar tasks, just L1-normalize the sub-function scores to make them sum to 1.\n\n## Expression Context\n\n- `input` \u2014 always present, the function input, or the task input, depending\n- `map` \u2014 present in mapped scalar tasks, the current element from input_maps\n- `output` \u2014 present in task output expressions, the raw sub-function result\n\n## Finishing\n\n1. Use CheckFunction to validate \u2014 fix any errors and retry until it passes\n2. Re-read the InventSpec. It is the universal source of truth \u2014 never contradict it.",
        tools: [
          state.getInventSpecTool(),
          state.getFunctionTypeTool(),
          state.getNameTool(),
          state.getInventEssayTool(),
          inner.getInputSchemaTool(),
          inner.getOutputLengthTool(),
          inner.getInputSplitTool(),
          inner.getInputMergeTool(),
          state.getInventEssayTasksTool(),
          inner.appendVectorTaskTool(),
          inner.appendScalarTaskTool(),
          inner.deleteTaskTool(),
          inner.editVectorTaskTool(),
          inner.editScalarTaskTool(),
          inner.editTaskSpecTool(),
          inner.checkFunctionTool(),
          inner.getTasksLengthTool(),
          inner.getTaskTool(),
          inner.getTaskSpecTool(),
          ...inner.getSchemaTools()
        ]
      },
      state.parameters,
      () => inner.checkFunction(),
      maxRetries,
      onNotification2,
      agentState
    );
  } else if (inner instanceof BranchScalarState) {
    return runAgentStep(
      agent,
      {
        stepName: "body",
        prompt: `Create the Tasks for your Scalar Function.

## Task Structure

Create ${tasksStr} placeholder tasks based on your EssayTasks. Each task defines a sub-function which will be automatically invented after you finish. Some tasks may have the same \`input_schema\` as the parent, and some may contain only a subset so as to evaluate a specific aspect of the input.

**TaskSpec:**
- First, write a detailed \`spec\` for the task, describing what the sub-function should evaluate. This is a plain language description that will guide the child agent inventing the sub-function.` + (state.parameters.depth > 1 ? " The sub-function will also have its own sub-functions. The spec should include any instructions that should also be propagated down to the child agent's own child agents, if any are needed.\n\n" : "\n\n") + "**Task Guidelines:**\n- `skip` expressions conditionally skip tasks for certain conditions. This is typically used to skip tasks which evaluate some optional field on the parent input.\n- `input` expressions derive the task input from the parent input.\n- `output` expressions transform the raw sub-function output into an output which would be a valid output for the parent function. Typically, just re-yield the sub-function output directly.\n\n## Expression Context\n\n- `input` \u2014 always present, the function input, or the task input, depending\n- `output` \u2014 present in task output expressions, the raw sub-function result\n\n## Finishing\n\n1. Use CheckFunction to validate \u2014 fix any errors and retry until it passes\n2. Re-read the InventSpec. It is the universal source of truth \u2014 never contradict it.",
        tools: [
          state.getInventSpecTool(),
          state.getFunctionTypeTool(),
          state.getNameTool(),
          state.getInventEssayTool(),
          inner.getInputSchemaTool(),
          state.getInventEssayTasksTool(),
          inner.appendTaskTool(),
          inner.deleteTaskTool(),
          inner.editTaskTool(),
          inner.editTaskSpecTool(),
          inner.checkFunctionTool(),
          inner.getTasksLengthTool(),
          inner.getTaskTool(),
          inner.getTaskSpecTool(),
          ...inner.getSchemaTools()
        ]
      },
      state.parameters,
      () => inner.checkFunction(),
      maxRetries,
      onNotification2,
      agentState
    );
  } else if (inner instanceof LeafVectorState) {
    return runAgentStep(
      agent,
      {
        stepName: "body",
        prompt: `Create the Tasks for your Vector Function.

## Task Structure

Create ${tasksStr} vector completion tasks based on your EssayTasks. Each task defines a prompt for an LLM as well as possible responses for the assistant to reply with. The ObjectiveAI system will return a vector of scores evaluating which response the LLM is most likely to reply with. These probabilities form the fundamental basis for how the Function ranks items.

### Messages

\`messages\` is a prompt comprising the conversation thus far. Each message contains a role, and an array of content parts. Typically, messages will be a single user message. Sometimes, it is a fixed message. Other times, it contains context from the input. But it never contains the items to be ranked.

### Responses

\`responses\` is an array of potential responses the LLM could reply with. Each response is an array of content parts.

## Structure

Be clever in how you structure \`messages\` and \`responses\`. Do not ask the LLM to directly evaluate items. Instead, make the items into real responses that an assistant would actually reply with in a conversation. For messages, do not structure it like 'Which item is best?' Instead, structure it like 'What would a good item look like?' and make the responses the items being ranked. If ranking search results, for example, the message would be the search query, and the responses would be the search results as-is. If ranking dating profiles, for example, the message would be 'Generate the profile of someone I should date' and the responses would be the profiles.

### Multimodal Content

Multimodal content parts can be used in both \`messages\` and \`responses\`. Put contextual multimodal content in \`messages\`, and put multimodal content which is being ranked into \`responses\`. Never use \`str()\` on multimodal content \u2014 this breaks the system, and makes it unintelligible to the LLM, ruining the rankings.

### Key Design Principles

- Some tasks may rank a subset of the parent input. Other tasks may rank the entire parent input. Some tasks may contain partial context, and others may contain full context. Tasks should not be identical to each other. They should vary - be creative in how they vary, feel free to use multiple messages in some cases.
- \`output\` expressions transform the raw vector completion output into an output which would be a valid output for the parent function. Typically, just re-yield the scores from the vector completion output directly.
- \`skip\` expressions conditionally skip tasks for certain conditions. This is typically used to skip tasks which use some optional field(s) on the parent input.
- Ensure that each task ranks items in the same order. This is critical for the ObjectiveAI system to be able to combine the rankings from different tasks together into a single ranking.

### Expression Context

- \`input\` \u2014 always present, the function input
- \`output\` \u2014 present in task output expressions; for vector completion tasks this is a VectorCompletionOutput

## Finishing

1. Use CheckFunction to validate \u2014 fix any errors and retry until it passes
2. Re-read the InventSpec. It is the universal source of truth \u2014 never contradict it.`,
        tools: [
          state.getInventSpecTool(),
          state.getFunctionTypeTool(),
          state.getNameTool(),
          state.getInventEssayTool(),
          inner.getInputSchemaTool(),
          inner.getOutputLengthTool(),
          inner.getInputSplitTool(),
          inner.getInputMergeTool(),
          state.getInventEssayTasksTool(),
          inner.appendTaskTool(),
          inner.deleteTaskTool(),
          inner.editTaskTool(),
          inner.checkFunctionTool(),
          inner.getTasksLengthTool(),
          inner.getTaskTool(),
          ...inner.getSchemaTools()
        ]
      },
      state.parameters,
      () => inner.checkFunction(),
      maxRetries,
      onNotification2,
      agentState
    );
  } else if (inner instanceof LeafScalarState) {
    return runAgentStep(
      agent,
      {
        stepName: "body",
        prompt: `Create the Tasks for your Scalar Function.

## Task Structure

Create ${tasksStr} vector completion tasks based on your EssayTasks. Each task defines a prompt for an LLM as well as possible responses for the assistant to reply with. The ObjectiveAI system will return a vector of scores evaluating which response the LLM is most likely to reply with. These probabilities form the fundamental basis for how the Function scores the input.

### Messages

\`messages\` is a prompt comprising the conversation thus far. Each message contains a role, and an array of content parts. Typically, messages will be a single user message. It contains context from the input.

### Responses

\`responses\` is an array of potential responses the LLM could reply with. Each response is an array of content parts. Typically, the responses are fixed potential replies that the assistant could reply with. Sometimes, they contain context from the input, sometimes the same content across all responses, but the responses are never all identical to each other.

## Structure

Be clever in how you structure \`messages\` and \`responses\`. Do not ask the LLM to directly score the input. Instead, make the input into real responses that an assistant would actually reply with in a conversation. For example, if asking for the quality of a joke, the message could be 'How funny is this joke: {joke}?' and the responses could be 'hilarious', 'pretty funny', and 'not funny at all'.

Each response should correspond to some score. These scores should be normalized such that an equalized response vector (e.g. [0.33,0.33,0.33]) would yield a final score of 0.5.

### Multimodal Content

Multimodal content parts can be used in both \`messages\` and \`responses\`. Typically, it goes into \`messages\`, but sometimes it can go into \`responses\`. Never use \`str()\` on multimodal content \u2014 this breaks the system, and makes it unintelligible to the LLM, ruining the scores.

### Key Design Principles

- Some tasks may score a subset of the parent input. Other tasks may score the entire parent input. Some tasks may contain partial context, and others may contain full context.
- Tasks should not be identical to each other. They should vary - be creative in how they vary, feel free to use multiple messages in some cases.
- \`output\` expressions transform the raw vector completion output into a scalar score in [0, 1] for the parent function. Typically, just multiply the score for each response by its corresponding score value, and then sum these together to get a final score in [0, 1].
- \`skip\` expressions conditionally skip tasks for certain conditions. This is typically used to skip tasks which use some optional field(s) on the parent input.

### Expression Context

- \`input\` \u2014 always present, the function input
- \`output\` \u2014 present in task output expressions; for vector completion tasks this is a VectorCompletionOutput

## Finishing

1. Use CheckFunction to validate \u2014 fix any errors and retry until it passes
2. Re-read the InventSpec. It is the universal source of truth \u2014 never contradict it.`,
        tools: [
          state.getInventSpecTool(),
          state.getFunctionTypeTool(),
          state.getNameTool(),
          state.getInventEssayTool(),
          inner.getInputSchemaTool(),
          state.getInventEssayTasksTool(),
          inner.appendTaskTool(),
          inner.deleteTaskTool(),
          inner.editTaskTool(),
          inner.checkFunctionTool(),
          inner.getTasksLengthTool(),
          inner.getTaskTool(),
          ...inner.getSchemaTools()
        ]
      },
      state.parameters,
      () => inner.checkFunction(),
      maxRetries,
      onNotification2,
      agentState
    );
  } else {
    throw new Error("Unknown function type");
  }
}

// src/invent/steps/7_description.ts
function stepDescription(state, agent, onNotification2, agentState, maxRetries = 5) {
  const inner = state.inner;
  if (!inner) throw new Error("Function type not set");
  const isBranch = inner instanceof BranchVectorState || inner instanceof BranchScalarState;
  if (isBranch) {
    const tasks = inner.function.tasks ?? [];
    const indices = [];
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (t.type === "placeholder.scalar.function" || t.type === "placeholder.vector.function") {
        indices.push(i);
      }
    }
    state.setPlaceholderTaskIndices(indices);
  }
  let prompt = "First, create a 1-paragraph description of the Function you've invented. Then, create a comprehensive README for the Function, describing its input, output, use-cases, and what all it evaluates.";
  if (isBranch) {
    const tasks = inner.function.tasks ?? [];
    const templateLines = [];
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (t.type === "placeholder.scalar.function" || t.type === "placeholder.vector.function") {
        templateLines.push(`https://github.com/{{ .Owner }}/{{ .Task${i} }}`);
      }
    }
    if (templateLines.length > 0) {
      prompt += "\n\nYour README must include a link to each sub-function using the following template format:\n" + templateLines.join("\n") + "\nThese templates will be automatically replaced with the actual repository URLs after the sub-functions are invented.\nYou may also use {{ .Owner }} and {{ .TaskN }} anywhere else in the README and they will all be automatically replaced.";
    }
  }
  return runAgentStep(
    agent,
    {
      stepName: "description",
      prompt,
      tools: [
        state.getInventSpecTool(),
        state.getFunctionTypeTool(),
        state.getNameTool(),
        state.getInventEssayTool(),
        inner.getInputSchemaTool(),
        state.getInventEssayTasksTool(),
        inner.getTasksLengthTool(),
        inner.getTaskTool(),
        ...isBranch ? [inner.getTaskSpecTool()] : [],
        state.setDescriptionTool(),
        state.setReadmeTool()
      ]
    },
    state.parameters,
    () => {
      const desc = state.getDescription();
      if (!desc.ok) return desc;
      return state.getReadme();
    },
    maxRetries,
    onNotification2,
    agentState
  );
}

// src/invent/index.ts
async function invent(onNotification2, options, continuation) {
  const [agent, gitHubBackend] = continuation ? [continuation.agent, continuation.gitHubBackend] : (() => {
    const [agent2, gitHubBackend2] = getAgentStepFn(
      getAgentUpstream() ?? (() => {
        throw new Error("Agent required");
      })()
    );
    return [agent2, gitHubBackend2 ?? DefaultGitHubBackend];
  })();
  const gitHubToken = continuation ? continuation.gitHubToken : getGitHubToken() ?? (() => {
    throw new Error("GitHubToken required");
  })();
  const gitAuthorName = continuation ? continuation.gitAuthorName : getGitAuthorName() ?? (() => {
    throw new Error("GitAuthorName required");
  })();
  const gitAuthorEmail = continuation ? continuation.gitAuthorEmail : getGitAuthorEmail() ?? (() => {
    throw new Error("GitAuthorEmail required");
  })();
  const path = continuation?.path ?? [];
  const parentToken = continuation?.parentToken;
  const owner = await gitHubBackend.getAuthenticatedUser(gitHubToken);
  let dir = null;
  if ("name" in options) {
    dir = inventDir(owner, options.name);
  } else if (parentToken) {
    dir = findChildByToken(owner, parentToken);
  }
  let qualityFn;
  try {
    let state;
    let agentState;
    if (dir === null) {
      if ("name" in options) {
        throw new Error(
          `Function directory not found for name: ${options.name}`
        );
      }
      const result = await stage1(
        owner,
        options,
        parentToken,
        path,
        onNotification2,
        agent,
        gitHubBackend,
        gitHubToken,
        gitAuthorName,
        gitAuthorEmail
      );
      dir = result.dir;
      state = result.state;
      agentState = result.agentState;
      if (result.reThrow) throw result.reThrow;
    }
    qualityFn = await readQualityFunctionFromFilesystem(dir, gitHubBackend);
    if (!qualityFn) {
      if (!state) {
        if ("name" in options) {
          throw new Error(
            `Function at ${dir} is not a quality function and cannot be resumed without inventSpec`
          );
        }
        state = new State(
          {
            parameters: buildParameters(options.parameters),
            inventSpec: options.inventSpec,
            gitHubToken,
            owner,
            ..."type" in options ? {
              type: options.type,
              ...options.type === "vector.function" ? {
                input_schema: options.input_schema,
                output_length: options.output_length,
                input_split: options.input_split,
                input_merge: options.input_merge
              } : { input_schema: options.input_schema }
            } : {}
          },
          gitHubBackend
        );
        state.forceSetName(basename(dir));
      }
      await stage2(
        dir,
        state,
        agentState,
        path,
        onNotification2,
        agent,
        gitHubBackend,
        gitHubToken,
        gitAuthorName,
        gitAuthorEmail
      );
      qualityFn = await readQualityFunctionFromFilesystem(dir, gitHubBackend);
      if (!qualityFn) {
        throw new Error("stage2 failed to produce quality function");
      }
    }
  } catch (err) {
    if (dir !== null) {
      const name = basename(dir);
      const message = err instanceof Error ? err.message : "Unknown error";
      onNotification2({
        path,
        name,
        message: { role: "done", error: message }
      });
    }
    throw err;
  }
  const hasChildren = qualityFn.placeholderTaskSpecs?.some((s) => s !== null) ?? false;
  onNotification2({
    path,
    name: qualityFn.name,
    message: hasChildren ? { role: "waiting" } : { role: "done" }
  });
  const unreplacedReasons = await stage3(
    dir,
    owner,
    qualityFn,
    path,
    onNotification2,
    agent,
    gitHubBackend,
    gitHubToken,
    gitAuthorName,
    gitAuthorEmail
  );
  if (hasChildren) {
    const fn = qualityFn.function.type === "branch.scalar.function" || qualityFn.function.type === "branch.vector.function" ? qualityFn.function.function : void 0;
    const tasks = fn?.tasks ?? [];
    const remainingPlaceholders = tasks.filter(
      (t) => t.type === "placeholder.scalar.function" || t.type === "placeholder.vector.function"
    ).length;
    onNotification2({
      path,
      name: qualityFn.name,
      message: {
        role: "done",
        functionTasks: tasks.length - remainingPlaceholders,
        placeholderTasks: remainingPlaceholders,
        error: unreplacedReasons.length > 0 ? unreplacedReasons.join("\n") : void 0
      }
    });
  }
}
async function stage1(owner, options, parentToken, path, onNotification2, agent, gitHubBackend, gitHubToken, gitAuthorName, gitAuthorEmail) {
  const {
    parameters: parametersBuilder,
    inventSpec,
    ...stateOptions
  } = options;
  const parameters = buildParameters(parametersBuilder);
  const state = new State(
    {
      parameters,
      inventSpec,
      gitHubToken,
      owner,
      ...stateOptions
    },
    gitHubBackend
  );
  const boundOnNotification = (message) => onNotification2({ path, message });
  let agentState = await stepType(state, agent, boundOnNotification);
  agentState = await stepName(state, agent, boundOnNotification, agentState);
  const name = state.getName().value;
  const dir = inventDir(owner, name);
  writeInitialStateToFilesystem(dir, parameters);
  if (parentToken) {
    writeParentTokenToFilesystem(dir, parentToken);
  }
  let reThrow;
  try {
    await gitHubBackend.pushInitial({
      dir,
      name,
      gitHubToken,
      gitAuthorName,
      gitAuthorEmail,
      message: "initial commit"
    });
  } catch (err) {
    reThrow = err;
  }
  return { dir, state, agentState, reThrow };
}
async function stage2(dir, state, agentState, path, onNotification2, agent, gitHubBackend, gitHubToken, gitAuthorName, gitAuthorEmail) {
  const name = state.getName().value;
  const boundOnNotification = (message) => onNotification2({ path, name, message });
  agentState = await stepEssay(state, agent, boundOnNotification, agentState);
  agentState = await stepFields(state, agent, boundOnNotification, agentState);
  agentState = await stepEssayTasks(
    state,
    agent,
    boundOnNotification,
    agentState
  );
  agentState = await stepBody(state, agent, boundOnNotification, agentState);
  agentState = await stepDescription(
    state,
    agent,
    boundOnNotification,
    agentState
  );
  writeFinalStateToFilesystem(dir, state, state.parameters);
  await ensureRemote(dir, name, gitHubToken);
  await gitHubBackend.pushFinal({
    dir,
    gitHubToken,
    gitAuthorName,
    gitAuthorEmail,
    message: `implement ${name}`,
    description: state.getDescription().value
  });
}
async function ensureRemote(dir, name, gitHubToken) {
  const repoRoot = getRepoRoot(dir);
  if (!repoRoot) return;
  if (getRemoteUrl(repoRoot)) return;
  const res = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gitHubToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, visibility: "public" })
  });
  if (res.ok) {
    const repo = await res.json();
    addRemote(dir, `https://github.com/${repo.owner.login}/${repo.name}.git`);
  } else if (res.status === 422) {
    const user = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${gitHubToken}`,
        Accept: "application/vnd.github.v3+json"
      }
    });
    if (user.ok) {
      const { login } = await user.json();
      addRemote(dir, `https://github.com/${login}/${name}.git`);
    }
  }
}
async function stage3(dir, owner, qualityFn, path, onNotification2, agent, gitHubBackend, gitHubToken, gitAuthorName, gitAuthorEmail) {
  if (isDirty(dir)) {
    await ensureRemote(dir, qualityFn.name, gitHubToken);
    await gitHubBackend.pushFinal({
      dir,
      gitHubToken,
      gitAuthorName,
      gitAuthorEmail,
      message: `update ${qualityFn.name}`,
      description: qualityFn.function.function.description ?? ""
    });
  }
  if (qualityFn.function.type !== "branch.scalar.function" && qualityFn.function.type !== "branch.vector.function") {
    return [];
  }
  const specs = qualityFn.placeholderTaskSpecs;
  if (!specs) return [];
  const subParameters = {
    ...qualityFn.parameters,
    depth: qualityFn.parameters.depth - 1
  };
  const tasks = qualityFn.function.function.tasks;
  const subInvents = [];
  for (let i = 0; i < tasks.length; i++) {
    const entry = specs[i];
    if (entry === null || entry === void 0) continue;
    const task = tasks[i];
    const childPath = [...path, i];
    if (task.type === "placeholder.vector.function") {
      subInvents.push(
        invent(
          onNotification2,
          {
            inventSpec: entry.spec,
            parameters: subParameters,
            type: "vector.function",
            input_schema: task.input_schema,
            output_length: task.output_length,
            input_split: task.input_split,
            input_merge: task.input_merge
          },
          {
            parentToken: entry.token,
            path: childPath,
            agent,
            gitHubBackend,
            gitHubToken,
            gitAuthorName,
            gitAuthorEmail
          }
        )
      );
    } else if (task.type === "placeholder.scalar.function") {
      subInvents.push(
        invent(
          onNotification2,
          {
            inventSpec: entry.spec,
            parameters: subParameters,
            type: "scalar.function",
            input_schema: task.input_schema
          },
          {
            parentToken: entry.token,
            path: childPath,
            agent,
            gitHubBackend,
            gitHubToken,
            gitAuthorName,
            gitAuthorEmail
          }
        )
      );
    }
  }
  const errors = [];
  const results = await Promise.allSettled(subInvents);
  for (const result of results) {
    if (result.status === "rejected") errors.push(result.reason);
  }
  let replaced = false;
  const unreplacedReasons = [];
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task.type !== "placeholder.scalar.function" && task.type !== "placeholder.vector.function") {
      continue;
    }
    const entry = specs[i];
    if (entry === null || entry === void 0) continue;
    const childDir = findChildByToken(owner, entry.token);
    if (!childDir) {
      unreplacedReasons.push(`task ${i}: child directory not found`);
      continue;
    }
    const subQualityFn = await readQualityFunctionFromFilesystem(
      childDir,
      gitHubBackend
    );
    if (!subQualityFn) {
      unreplacedReasons.push(`task ${i}: not a valid quality function`);
      continue;
    }
    if (hasPlaceholderTasks(subQualityFn.function.function)) {
      unreplacedReasons.push(`task ${i}: still has unresolved placeholders`);
      continue;
    }
    const orc = await gitHubBackend.getOwnerRepositoryCommit(childDir, gitHubToken);
    if (!orc) {
      unreplacedReasons.push(`task ${i}: could not resolve repository commit`);
      continue;
    }
    replacePlaceholderTask(tasks, i, task, orc);
    replaced = true;
  }
  if (replaced) {
    writeFunctionToFilesystem(
      dir,
      qualityFn.function.function
    );
    let readme = readReadmeFromFilesystem(dir);
    if (readme) {
      let readmeChanged = false;
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        if (task.type !== "scalar.function" && task.type !== "vector.function") {
          continue;
        }
        if (!("owner" in task) || !("repository" in task)) continue;
        const taskOwner = task.owner;
        const taskRepo = task.repository;
        const templateTask = `{{ .Task${i} }}`;
        const templateOwner = `{{ .Owner }}`;
        if (readme.includes(templateTask)) {
          readme = readme.split(templateTask).join(taskRepo);
          readmeChanged = true;
        }
        if (readmeChanged && readme.includes(templateOwner)) {
          readme = readme.split(templateOwner).join(taskOwner);
        }
      }
      if (readmeChanged) {
        writeReadmeToFilesystem(dir, readme);
      }
    }
    await ensureRemote(dir, qualityFn.name, gitHubToken);
    await gitHubBackend.pushFinal({
      dir,
      gitHubToken,
      gitAuthorName,
      gitAuthorEmail,
      message: `update ${qualityFn.name}`,
      description: qualityFn.function.function.description ?? ""
    });
  }
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) throw new AggregateError(errors);
  return unreplacedReasons;
}
function hasPlaceholderTasks(fn) {
  return fn.tasks.some(
    (t) => t.type === "placeholder.scalar.function" || t.type === "placeholder.vector.function"
  );
}
function replacePlaceholderTask(tasks, index, placeholder, orc) {
  if (placeholder.type === "placeholder.scalar.function") {
    tasks[index] = {
      type: "scalar.function",
      owner: orc.owner,
      repository: orc.repository,
      commit: orc.commit,
      skip: placeholder.skip,
      map: placeholder.map,
      input: placeholder.input,
      output: placeholder.output
    };
  } else if (placeholder.type === "placeholder.vector.function") {
    tasks[index] = {
      type: "vector.function",
      owner: orc.owner,
      repository: orc.repository,
      commit: orc.commit,
      skip: placeholder.skip,
      map: placeholder.map,
      input: placeholder.input,
      output: placeholder.output
    };
  }
}

// src/worker/inventWorker.ts
function post(msg) {
  parentPort.postMessage(msg);
}
function onNotification(notification) {
  post({ type: "notification", notification });
}
parentPort.on("message", async (msg) => {
  try {
    if (msg.type === "invent") {
      await invent(onNotification, msg.options);
    } else if (msg.type === "inventPlaceholders") {
      await invent(onNotification, { name: msg.name });
    }
    post({ type: "done" });
  } catch (err) {
    post({
      type: "error",
      message: err instanceof Error ? err.message : String(err)
    });
  }
});
