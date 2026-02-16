import { Functions } from "objectiveai";
import { Result } from "../result";
import { PlaceholderTaskSpecs } from "src/placeholder";

export class BranchScalarState {
  private function: Partial<Functions.QualityBranchRemoteScalarFunction>;
  private placeholderTaskSpecs?: PlaceholderTaskSpecs;

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

  setInputSchema(value: unknown): Result<string> {
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
    this.function.input_schema = parsed.data;
    return {
      ok: true,
      value: "",
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

  appendTask(value: unknown, spec: string): Result<string> {
    const parsed =
      Functions.QualityUnmappedPlaceholderScalarFunctionTaskExpressionSchema.safeParse(
        value,
      );
    if (!parsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid QualityUnmappedPlaceholderScalarFunctionTaskExpressionSchema: ${parsed.error.message}`,
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
    if (this.placeholderTaskSpecs) {
      this.placeholderTaskSpecs.splice(index, 1);
    }
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
      Functions.QualityUnmappedPlaceholderScalarFunctionTaskExpressionSchema.safeParse(
        value,
      );
    if (!parsed.success) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid QualityUnmappedPlaceholderScalarFunctionTaskExpressionSchema: ${parsed.error.message}`,
      };
    }
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

  checkFunction(): Result<string> {
    const parsed = Functions.QualityBranchRemoteScalarFunctionSchema.safeParse({
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
}
