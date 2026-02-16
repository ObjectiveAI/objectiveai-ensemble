import { Functions } from "objectiveai";
import { Result } from "../result";
import { PlaceholderTaskSpecs } from "src/placeholder";

export class BranchVectorState {
  readonly function: Partial<Functions.QualityBranchRemoteVectorFunction>;
  private placeholderTaskSpecs?: PlaceholderTaskSpecs;

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

  setInputSchema(value: unknown): Result<string> {
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
    this.function.input_schema = parsed.data;
    return {
      ok: true,
      value: "",
      error: undefined,
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

  appendVectorTask(value: unknown, spec: string): Result<string> {
    const parsed =
      Functions.QualityUnmappedPlaceholderVectorFunctionTaskExpressionSchema.safeParse(
        value,
      );
    if (!parsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid QualityUnmappedPlaceholderVectorFunctionTaskExpressionSchema: ${parsed.error.message}`,
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
        error: `Invalid QualityMappedPlaceholderScalarFunctionTaskExpressionSchema: ${parsed.error.message}`,
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
        error: `Invalid QualityUnmappedPlaceholderVectorFunctionTaskExpressionSchema: ${parsed.error.message}`,
      };
    }
    this.function.tasks[index] = parsed.data;
    return {
      ok: true,
      value: "Task updated. If the task spec should change, edit it as well.",
      error: undefined,
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
        error: `Invalid QualityMappedPlaceholderScalarFunctionTaskExpressionSchema: ${parsed.error.message}`,
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

  checkFunction(): Result<string> {
    const parsed = Functions.QualityBranchRemoteVectorFunctionSchema.safeParse({
      ...this.function,
      description: this.function.description || "",
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

  getPlaceholderTaskSpecs(): PlaceholderTaskSpecs | undefined {
    return this.placeholderTaskSpecs;
  }
}
