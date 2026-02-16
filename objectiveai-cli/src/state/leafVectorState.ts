import { Functions } from "objectiveai";
import { Result } from "../result";

export class LeafVectorState {
  private function: Partial<Functions.QualityLeafRemoteVectorFunction>;

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
      Functions.QualityLeafRemoteVectorFunctionSchema.shape.input_schema.safeParse(
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
      Functions.QualityLeafRemoteVectorFunctionSchema.shape.output_length.safeParse(
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
      Functions.QualityLeafRemoteVectorFunctionSchema.shape.input_split.safeParse(
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
      Functions.QualityLeafRemoteVectorFunctionSchema.shape.input_merge.safeParse(
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
    return {
      ok: true,
      value: JSON.stringify(this.function.tasks[index], null, 2),
      error: undefined,
    };
  }

  appendTask(value: unknown): Result<string> {
    const parsed =
      Functions.QualityVectorVectorCompletionTaskExpressionSchema.safeParse(
        value,
      );
    if (!parsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid QualityVectorVectorCompletionTaskExpressionSchema: ${parsed.error.message}`,
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
    this.function.tasks.splice(index, 1);
    return {
      ok: true,
      value: `New length: ${this.function.tasks.length}`,
      error: undefined,
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
      Functions.QualityVectorVectorCompletionTaskExpressionSchema.safeParse(
        value,
      );
    if (!parsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid QualityVectorVectorCompletionTaskExpressionSchema: ${parsed.error.message}`,
      };
    }
    this.function.tasks[index] = parsed.data;
    return {
      ok: true,
      value: "Task updated.",
      error: undefined,
    };
  }

  checkFunction(): Result<string> {
    const parsed = Functions.QualityLeafRemoteVectorFunctionSchema.safeParse({
      ...this.function,
      description: "",
    });
    if (!parsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid Function: ${parsed.error.message}`,
      };
    }
    try {
      Functions.Quality.checkLeafVectorFunction(parsed.data);
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
}
