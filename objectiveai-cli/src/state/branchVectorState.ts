import { Functions } from "objectiveai";
import z from "zod";
import { Result } from "../result";
import { Tool, getSchemaTools } from "../tool";
import { PlaceholderTaskSpecs } from "src/placeholder";
import { collectModalities } from "../modalities";

export class BranchVectorState {
  readonly function: Partial<Functions.QualityBranchRemoteVectorFunction>;
  private placeholderTaskSpecs?: PlaceholderTaskSpecs;
  private editInputSchemaModalityRemovalRejected = false;

  constructor(
    outputLength?: Functions.RemoteVectorFunction["output_length"],
    inputSplit?: Functions.RemoteVectorFunction["input_split"],
    inputMerge?: Functions.RemoteVectorFunction["input_merge"],
  ) {
    this.function = {
      type: "vector.function",
      output_length: outputLength,
      input_split: inputSplit,
      input_merge: inputMerge,
    };
  }

  getInputSchema(): Result<string> {
    if (this.function.input_schema) {
      return {
        ok: true,
        value: JSON.stringify(this.function.input_schema, null, 2),
        error: undefined,
      };
    } else {
      return {
        ok: false,
        value: undefined,
        error: "FunctionInputSchema not set",
      };
    }
  }

  getInputSchemaTool(): Tool<{}> {
    return {
      name: "ReadFunctionInputSchema",
      description: "Read FunctionInputSchema",
      inputSchema: {},
      fn: () => Promise.resolve(this.getInputSchema()),
    };
  }

  setInputSchema(
    value: unknown,
    dangerouslyRemoveModalities?: boolean,
  ): Result<string> {
    const parsed =
      Functions.QualityBranchRemoteVectorFunctionSchema.shape.input_schema.safeParse(
        value,
      );
    if (!parsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid FunctionInputSchema: ${parsed.error.message}`,
      };
    }

    if (dangerouslyRemoveModalities) {
      if (!this.editInputSchemaModalityRemovalRejected) {
        return {
          ok: false,
          value: undefined,
          error:
            "dangerouslyRemoveModalities can only be used after a previous WriteFunctionInputSchema call was rejected for removing modalities.",
        };
      }
      this.editInputSchemaModalityRemovalRejected = false;
      this.function.input_schema = parsed.data;
      return { ok: true, value: "", error: undefined };
    }

    if (this.function.input_schema && parsed.data) {
      const oldModalities = collectModalities(this.function.input_schema);
      const newModalities = collectModalities(parsed.data);
      const removed: string[] = [];
      for (const m of oldModalities) {
        if (!newModalities.has(m)) removed.push(m);
      }
      if (removed.length > 0) {
        this.editInputSchemaModalityRemovalRejected = true;
        return {
          ok: false,
          value: undefined,
          error:
            `This edit would remove multimodal types: ${removed.join(", ")}. ` +
            `Re-read the InventSpec and confirm this does not contradict it. ` +
            `If the spec allows removing these modalities, call WriteFunctionInputSchema again with dangerouslyRemoveModalities: true.`,
        };
      }
    }

    this.editInputSchemaModalityRemovalRejected = false;
    this.function.input_schema = parsed.data;
    return { ok: true, value: "", error: undefined };
  }

  setInputSchemaTool(): Tool<{
    input_schema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    dangerouslyRemoveModalities: z.ZodOptional<z.ZodBoolean>;
  }> {
    return {
      name: "WriteFunctionInputSchema",
      description: "Write FunctionInputSchema",
      inputSchema: {
        input_schema: z.record(z.string(), z.unknown()),
        dangerouslyRemoveModalities: z.boolean().optional(),
      },
      fn: (args) =>
        Promise.resolve(
          this.setInputSchema(
            args.input_schema,
            args.dangerouslyRemoveModalities,
          ),
        ),
    };
  }

  getOutputLength(): Result<string> {
    if (this.function.output_length !== undefined) {
      return {
        ok: true,
        value: JSON.stringify(this.function.output_length, null, 2),
        error: undefined,
      };
    } else {
      return {
        ok: false,
        value: undefined,
        error: "FunctionOutputLength not set",
      };
    }
  }

  getOutputLengthTool(): Tool<{}> {
    return {
      name: "ReadFunctionOutputLength",
      description: "Read FunctionOutputLength",
      inputSchema: {},
      fn: () => Promise.resolve(this.getOutputLength()),
    };
  }

  setOutputLength(value: unknown): Result<string> {
    const parsed =
      Functions.QualityBranchRemoteVectorFunctionSchema.shape.output_length.safeParse(
        value,
      );
    if (!parsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid FunctionOutputLength: ${parsed.error.message}`,
      };
    }
    this.function.output_length = parsed.data;
    return {
      ok: true,
      value: "",
      error: undefined,
    };
  }

  setOutputLengthTool(): Tool<{ output_length: z.ZodUnknown }> {
    return {
      name: "WriteFunctionOutputLength",
      description: "Write FunctionOutputLength",
      inputSchema: { output_length: z.unknown() },
      fn: (args) =>
        Promise.resolve(this.setOutputLength(args.output_length)),
    };
  }

  getInputSplit(): Result<string> {
    if (this.function.input_split) {
      return {
        ok: true,
        value: JSON.stringify(this.function.input_split, null, 2),
        error: undefined,
      };
    } else {
      return {
        ok: false,
        value: undefined,
        error: "FunctionInputSplit not set",
      };
    }
  }

  getInputSplitTool(): Tool<{}> {
    return {
      name: "ReadFunctionInputSplit",
      description: "Read FunctionInputSplit",
      inputSchema: {},
      fn: () => Promise.resolve(this.getInputSplit()),
    };
  }

  setInputSplit(value: unknown): Result<string> {
    const parsed =
      Functions.QualityBranchRemoteVectorFunctionSchema.shape.input_split.safeParse(
        value,
      );
    if (!parsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid FunctionInputSplit: ${parsed.error.message}`,
      };
    }
    this.function.input_split = parsed.data;
    return {
      ok: true,
      value: "",
      error: undefined,
    };
  }

  setInputSplitTool(): Tool<{ input_split: z.ZodUnknown }> {
    return {
      name: "WriteFunctionInputSplit",
      description: "Write FunctionInputSplit",
      inputSchema: { input_split: z.unknown() },
      fn: (args) => Promise.resolve(this.setInputSplit(args.input_split)),
    };
  }

  getInputMerge(): Result<string> {
    if (this.function.input_merge) {
      return {
        ok: true,
        value: JSON.stringify(this.function.input_merge, null, 2),
        error: undefined,
      };
    } else {
      return {
        ok: false,
        value: undefined,
        error: "FunctionInputMerge not set",
      };
    }
  }

  getInputMergeTool(): Tool<{}> {
    return {
      name: "ReadFunctionInputMerge",
      description: "Read FunctionInputMerge",
      inputSchema: {},
      fn: () => Promise.resolve(this.getInputMerge()),
    };
  }

  setInputMerge(value: unknown): Result<string> {
    const parsed =
      Functions.QualityBranchRemoteVectorFunctionSchema.shape.input_merge.safeParse(
        value,
      );
    if (!parsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid FunctionInputMerge: ${parsed.error.message}`,
      };
    }
    this.function.input_merge = parsed.data;
    return {
      ok: true,
      value: "",
      error: undefined,
    };
  }

  setInputMergeTool(): Tool<{ input_merge: z.ZodUnknown }> {
    return {
      name: "WriteFunctionInputMerge",
      description: "Write FunctionInputMerge",
      inputSchema: { input_merge: z.unknown() },
      fn: (args) => Promise.resolve(this.setInputMerge(args.input_merge)),
    };
  }

  checkFields(): Result<string> {
    const inputSchema = this.function.input_schema;
    const outputLength = this.function.output_length;
    const inputSplit = this.function.input_split;
    const inputMerge = this.function.input_merge;
    if (!inputSchema) {
      return {
        ok: false,
        value: undefined,
        error: "FunctionInputSchema not set",
      };
    }
    if (outputLength === undefined) {
      return {
        ok: false,
        value: undefined,
        error: "FunctionOutputLength not set",
      };
    }
    if (!inputSplit) {
      return {
        ok: false,
        value: undefined,
        error: "FunctionInputSplit not set",
      };
    }
    if (!inputMerge) {
      return {
        ok: false,
        value: undefined,
        error: "FunctionInputMerge not set",
      };
    }
    try {
      Functions.Quality.checkVectorFields({
        input_schema: inputSchema,
        output_length: outputLength,
        input_split: inputSplit,
        input_merge: inputMerge,
      });
    } catch (e) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid Fields: ${(e as Error).message}`,
      };
    }
    return {
      ok: true,
      value: "Fields are valid",
      error: undefined,
    };
  }

  checkFieldsTool(): Tool<{}> {
    return {
      name: "CheckFields",
      description: "Check Fields",
      inputSchema: {},
      fn: () => Promise.resolve(this.checkFields()),
    };
  }

  getTasksLength(): Result<string> {
    return {
      ok: true,
      value: String(this.function.tasks?.length ?? 0),
      error: undefined,
    };
  }

  getTasksLengthTool(): Tool<{}> {
    return {
      name: "ReadTasksLength",
      description: "Read TasksLength",
      inputSchema: {},
      fn: () => Promise.resolve(this.getTasksLength()),
    };
  }

  getTask(index: number): Result<string> {
    if (
      !this.function.tasks ||
      index < 0 ||
      index >= this.function.tasks.length
    ) {
      return {
        ok: false,
        value: undefined,
        error: "Invalid index",
      };
    }
    const task = this.function.tasks[index];
    let inputMap;
    if (task.map !== undefined) {
      inputMap = this.function.input_maps?.[task.map];
    } else {
      inputMap = undefined;
    }
    if (inputMap) {
      return {
        ok: true,
        value: JSON.stringify({ task, input_map: inputMap }, null, 2),
        error: undefined,
      };
    } else {
      return {
        ok: true,
        value: JSON.stringify({ task }, null, 2),
        error: undefined,
      };
    }
  }

  getTaskTool(): Tool<{ index: z.ZodNumber }> {
    return {
      name: "ReadTask",
      description: "Read Task",
      inputSchema: { index: z.number() },
      fn: (args) => Promise.resolve(this.getTask(args.index)),
    };
  }

  getTaskSpec(index: number): Result<string> {
    if (
      !this.placeholderTaskSpecs ||
      index < 0 ||
      index >= this.placeholderTaskSpecs.length
    ) {
      return {
        ok: false,
        value: undefined,
        error: "Invalid index",
      };
    }
    const value = this.placeholderTaskSpecs[index];
    if (value === null || value.trim() === "") {
      return {
        ok: false,
        value: undefined,
        error: "Invalid index",
      };
    }
    return {
      ok: true,
      value,
      error: undefined,
    };
  }

  getTaskSpecTool(): Tool<{ index: z.ZodNumber }> {
    return {
      name: "ReadTaskSpec",
      description: "Read TaskSpec",
      inputSchema: { index: z.number() },
      fn: (args) => Promise.resolve(this.getTaskSpec(args.index)),
    };
  }

  appendVectorTask(value: unknown, spec: string): Result<string> {
    const parsed =
      Functions.QualityUnmappedPlaceholderVectorFunctionTaskExpressionSchema.safeParse(
        value,
      );
    if (!parsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid QualityUnmappedPlaceholderVectorFunctionTaskExpression: ${parsed.error.message}`,
      };
    }
    if (spec.trim() === "") {
      return {
        ok: false,
        value: undefined,
        error: "Spec cannot be empty",
      };
    }
    if (this.function.tasks) {
      this.function.tasks.push(parsed.data);
    } else {
      this.function.tasks = [parsed.data];
    }
    if (this.placeholderTaskSpecs) {
      this.placeholderTaskSpecs.push(spec);
    } else {
      this.placeholderTaskSpecs = [spec];
    }
    return {
      ok: true,
      value: `New length: ${this.function.tasks.length}`,
      error: undefined,
    };
  }

  appendVectorTaskTool(): Tool<{
    task: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    spec: z.ZodString;
  }> {
    return {
      name: "AppendVectorTask",
      description: "Append VectorTask",
      inputSchema: {
        task: z.record(z.string(), z.unknown()),
        spec: z.string(),
      },
      fn: (args) =>
        Promise.resolve(this.appendVectorTask(args.task, args.spec)),
    };
  }

  appendScalarTask(
    value: unknown,
    inputMap: unknown,
    spec: string,
  ): Result<string> {
    const parsed =
      Functions.QualityMappedPlaceholderScalarFunctionTaskExpressionSchema.safeParse(
        value,
      );
    if (!parsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid QualityMappedPlaceholderScalarFunctionTaskExpression: ${parsed.error.message}`,
      };
    }

    // Just discard what the assistant put for this and make it work always
    parsed.data.map = this.function.input_maps
      ? this.function.input_maps.length
      : 0;

    if (spec.trim() === "") {
      return {
        ok: false,
        value: undefined,
        error: "Spec cannot be empty",
      };
    }
    const inputMapParsed =
      Functions.Expression.ExpressionSchema.safeParse(inputMap);
    if (!inputMapParsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid InputMap Expression: ${inputMapParsed.error.message}`,
      };
    }
    if (this.function.tasks) {
      this.function.tasks.push(parsed.data);
    } else {
      this.function.tasks = [parsed.data];
    }
    if (this.placeholderTaskSpecs) {
      this.placeholderTaskSpecs.push(spec);
    } else {
      this.placeholderTaskSpecs = [spec];
    }
    if (this.function.input_maps) {
      this.function.input_maps.push(inputMapParsed.data);
    } else {
      this.function.input_maps = [inputMapParsed.data];
    }
    return {
      ok: true,
      value: `New length: ${this.function.tasks.length}`,
      error: undefined,
    };
  }

  appendScalarTaskTool(): Tool<{
    task: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    input_map: z.ZodUnknown;
    spec: z.ZodString;
  }> {
    return {
      name: "AppendScalarTask",
      description: "Append ScalarTask",
      inputSchema: {
        task: z.record(z.string(), z.unknown()),
        input_map: z.unknown(),
        spec: z.string(),
      },
      fn: (args) =>
        Promise.resolve(
          this.appendScalarTask(args.task, args.input_map, args.spec),
        ),
    };
  }

  deleteTask(index: number): Result<string> {
    if (
      !this.function.tasks ||
      index < 0 ||
      index >= this.function.tasks.length
    ) {
      return {
        ok: false,
        value: undefined,
        error: "Invalid index",
      };
    }
    const task = this.function.tasks[index];
    if (task.map !== undefined) {
      for (let i = index + 1; i < this.function.tasks.length; i++) {
        const t = this.function.tasks[i];
        if (t.map !== undefined) {
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
      error: undefined,
    };
  }

  deleteTaskTool(): Tool<{ index: z.ZodNumber }> {
    return {
      name: "DeleteTask",
      description: "Delete Task",
      inputSchema: { index: z.number() },
      fn: (args) => Promise.resolve(this.deleteTask(args.index)),
    };
  }

  editVectorTask(index: number, value: unknown): Result<string> {
    if (
      !this.function.tasks ||
      index < 0 ||
      index >= this.function.tasks.length
    ) {
      return {
        ok: false,
        value: undefined,
        error: "Invalid index",
      };
    }
    const existing = this.function.tasks[index];
    if (existing.map !== undefined) {
      return {
        ok: false,
        value: undefined,
        error: "Existing task is not UnmappedVector",
      };
    }
    const parsed =
      Functions.QualityUnmappedPlaceholderVectorFunctionTaskExpressionSchema.safeParse(
        value,
      );
    if (!parsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid QualityUnmappedPlaceholderVectorFunctionTaskExpression: ${parsed.error.message}`,
      };
    }
    this.function.tasks[index] = parsed.data;
    return {
      ok: true,
      value: "Task updated. If the task spec should change, edit it as well.",
      error: undefined,
    };
  }

  editVectorTaskTool(): Tool<{
    index: z.ZodNumber;
    task: z.ZodRecord<z.ZodString, z.ZodUnknown>;
  }> {
    return {
      name: "EditVectorTask",
      description: "Edit VectorTask",
      inputSchema: {
        index: z.number(),
        task: z.record(z.string(), z.unknown()),
      },
      fn: (args) =>
        Promise.resolve(this.editVectorTask(args.index, args.task)),
    };
  }

  editScalarTask(
    index: number,
    value: unknown,
    inputMap: unknown,
  ): Result<string> {
    if (
      !this.function.tasks ||
      index < 0 ||
      index >= this.function.tasks.length
    ) {
      return {
        ok: false,
        value: undefined,
        error: "Invalid index",
      };
    }
    const existing = this.function.tasks[index];
    if (existing.map === undefined) {
      return {
        ok: false,
        value: undefined,
        error: "Existing task is not MappedScalar",
      };
    }
    const parsed =
      Functions.QualityMappedPlaceholderScalarFunctionTaskExpressionSchema.safeParse(
        value,
      );
    if (!parsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid QualityMappedPlaceholderScalarFunctionTaskExpression: ${parsed.error.message}`,
      };
    }
    const inputMapParsed =
      Functions.Expression.ExpressionSchema.safeParse(inputMap);
    if (!inputMapParsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid InputMap Expression: ${inputMapParsed.error.message}`,
      };
    }
    parsed.data.map = existing.map;
    this.function.input_maps![existing.map] = inputMapParsed.data;
    this.function.tasks[index] = parsed.data;
    return {
      ok: true,
      value: "Task updated. If the task spec should change, edit it as well.",
      error: undefined,
    };
  }

  editScalarTaskTool(): Tool<{
    index: z.ZodNumber;
    task: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    input_map: z.ZodUnknown;
  }> {
    return {
      name: "EditScalarTask",
      description: "Edit ScalarTask",
      inputSchema: {
        index: z.number(),
        task: z.record(z.string(), z.unknown()),
        input_map: z.unknown(),
      },
      fn: (args) =>
        Promise.resolve(
          this.editScalarTask(args.index, args.task, args.input_map),
        ),
    };
  }

  editTaskSpec(index: number, spec: string): Result<string> {
    if (
      !this.function.tasks ||
      index < 0 ||
      index >= this.function.tasks.length
    ) {
      return {
        ok: false,
        value: undefined,
        error: "Invalid index",
      };
    }
    if (spec.trim() === "") {
      return {
        ok: false,
        value: undefined,
        error: "Spec cannot be empty",
      };
    }
    this.placeholderTaskSpecs![index] = spec;
    return {
      ok: true,
      value: "Task spec updated. If the task should change, edit it as well.",
      error: undefined,
    };
  }

  editTaskSpecTool(): Tool<{ index: z.ZodNumber; spec: z.ZodString }> {
    return {
      name: "EditTaskSpec",
      description: "Edit TaskSpec",
      inputSchema: { index: z.number(), spec: z.string() },
      fn: (args) =>
        Promise.resolve(this.editTaskSpec(args.index, args.spec)),
    };
  }

  checkFunction(): Result<string> {
    const parsed = Functions.QualityBranchRemoteVectorFunctionSchema.safeParse({
      ...this.function,
      description: this.function.description || "description",
    });
    if (!parsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid Function: ${parsed.error.message}`,
      };
    }
    try {
      Functions.Quality.checkBranchVectorFunction(parsed.data, undefined);
    } catch (e) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid Function: ${(e as Error).message}`,
      };
    }
    return {
      ok: true,
      value: "Function is valid",
      error: undefined,
    };
  }

  checkFunctionTool(): Tool<{}> {
    return {
      name: "CheckFunction",
      description: "Check Function",
      inputSchema: {},
      fn: () => Promise.resolve(this.checkFunction()),
    };
  }

  getSchemaTools(): Tool<{}>[] {
    return getSchemaTools(
      Functions.QualityBranchRemoteVectorFunctionJsonSchema,
      "QualityBranchRemoteVectorFunction",
    );
  }

  getPlaceholderTaskSpecs(): PlaceholderTaskSpecs | undefined {
    return this.placeholderTaskSpecs;
  }
}
