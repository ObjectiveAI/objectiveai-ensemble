import { Functions } from "objectiveai";
import z from "zod";
import { Result } from "../result";
import { Tool, getSchemaTools } from "../tool";
import { PlaceholderTaskSpecs } from "src/placeholder";
import { collectModalities } from "../modalities";

export class BranchScalarState {
  readonly function: Partial<Functions.QualityBranchRemoteScalarFunction>;
  private placeholderTaskSpecs?: PlaceholderTaskSpecs;
  private editInputSchemaModalityRemovalRejected = false;

  constructor() {
    this.function = {
      type: "scalar.function",
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
      Functions.QualityBranchRemoteScalarFunctionSchema.shape.input_schema.safeParse(
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

  checkFields(): Result<string> {
    const inputSchema = this.function.input_schema;
    if (!inputSchema) {
      return {
        ok: false,
        value: undefined,
        error: "FunctionInputSchema not set",
      };
    }
    try {
      Functions.Quality.checkScalarFields({
        input_schema: inputSchema,
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
    return {
      ok: true,
      value: JSON.stringify(this.function.tasks[index], null, 2),
      error: undefined,
    };
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

  appendTask(value: unknown, spec: string): Result<string> {
    const parsed =
      Functions.QualityUnmappedPlaceholderScalarFunctionTaskExpressionSchema.safeParse(
        value,
      );
    if (!parsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid QualityUnmappedPlaceholderScalarFunctionTaskExpression: ${parsed.error.message}`,
      };
    }
    if (spec.trim() === "") {
      return {
        ok: false,
        value: undefined,
        error: "Spec cannot be empty",
      };
    }
    try {
      Functions.Quality.checkScalarFields({
        input_schema: parsed.data.input_schema,
      });
    } catch (e) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid Fields in new task: ${(e as Error).message}`,
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

  appendTaskTool(): Tool<{
    task: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    spec: z.ZodString;
  }> {
    return {
      name: "AppendTask",
      description: "Append Task",
      inputSchema: {
        task: z.record(z.string(), z.unknown()),
        spec: z.string(),
      },
      fn: (args) => Promise.resolve(this.appendTask(args.task, args.spec)),
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

  editTask(index: number, value: unknown): Result<string> {
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
    const parsed =
      Functions.QualityUnmappedPlaceholderScalarFunctionTaskExpressionSchema.safeParse(
        value,
      );
    if (!parsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid QualityUnmappedPlaceholderScalarFunctionTaskExpression: ${parsed.error.message}`,
      };
    }
    this.function.tasks[index] = parsed.data;
    return {
      ok: true,
      value: "Task updated. If the task spec should change, edit it as well.",
      error: undefined,
    };
  }

  editTaskTool(): Tool<{
    index: z.ZodNumber;
    task: z.ZodRecord<z.ZodString, z.ZodUnknown>;
  }> {
    return {
      name: "EditTask",
      description: "Edit Task",
      inputSchema: {
        index: z.number(),
        task: z.record(z.string(), z.unknown()),
      },
      fn: (args) => Promise.resolve(this.editTask(args.index, args.task)),
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
    if (this.placeholderTaskSpecs) {
      this.placeholderTaskSpecs[index] = spec;
    } else {
      throw new Error(
        "placeholderTaskSpecs should be defined if there are tasks",
      );
    }
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
      fn: (args) => Promise.resolve(this.editTaskSpec(args.index, args.spec)),
    };
  }

  checkFunction(): Result<string> {
    const parsed = Functions.QualityBranchRemoteScalarFunctionSchema.safeParse({
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
      Functions.Quality.checkBranchScalarFunction(parsed.data, undefined);
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
    return getSchemaTools([
      {
        schema: Functions.QualityBranchRemoteScalarFunctionJsonSchema,
        name: "QualityBranchRemoteScalarFunction",
      },
      {
        schema: Functions.Expression.ScalarFunctionOutputJsonSchema,
        name: "ScalarFunctionOutput",
      },
    ]);
  }

  getPlaceholderTaskSpecs(): PlaceholderTaskSpecs | undefined {
    return this.placeholderTaskSpecs;
  }
}
