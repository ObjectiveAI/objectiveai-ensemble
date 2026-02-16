import z from "zod";
import { Parameters, ParametersSchema } from "../parameters";
import { Functions } from "objectiveai";
import { Result } from "../result";
import { BranchScalarState } from "./branchScalarState";
import { BranchVectorState } from "./branchVectorState";
import { LeafScalarState } from "./leafScalarState";
import { LeafVectorState } from "./leafVectorState";

const FUNCTION_FIELD_ORDER = [
  "type",
  "description",
  "input_schema",
  "input_maps",
  "tasks",
  "output_length",
  "input_split",
  "input_merge",
] as const;

export const StateOptionsBaseSchema = z.object({
  parameters: ParametersSchema,
  inventSpec: z.string().nonempty(),
});
export type StateOptionsBase = z.infer<typeof StateOptionsBaseSchema>;

export const StateOptionsSchema = z.union([
  StateOptionsBaseSchema,
  StateOptionsBaseSchema.extend({
    type: z.literal("scalar.function"),
  }),
  StateOptionsBaseSchema.extend({
    type: z.literal("vector.function"),
    output_length: Functions.RemoteVectorFunctionSchema.shape.output_length,
    input_split: Functions.RemoteVectorFunctionSchema.shape.input_split,
    input_merge: Functions.RemoteVectorFunctionSchema.shape.input_merge,
  }),
]);
export type StateOptions = z.infer<typeof StateOptionsSchema>;

export class State {
  readonly parameters: Parameters;
  readonly inventSpec: string;
  private name: string | undefined;
  private inventEssay: string | undefined;
  private inventEssayTasks: string | undefined;
  private inventPlan: string | undefined;
  private _inner:
    | BranchScalarState
    | BranchVectorState
    | LeafScalarState
    | LeafVectorState
    | undefined;
  private readme: string | undefined;

  constructor(options: StateOptions) {
    this.parameters = options.parameters;
    this.inventSpec = options.inventSpec;
    if ("type" in options) {
      if (options.parameters.depth > 0) {
        if (options.type === "scalar.function") {
          this._inner = new BranchScalarState();
        } else if (options.type === "vector.function") {
          this._inner = new BranchVectorState(
            options.output_length,
            options.input_split,
            options.input_merge,
          );
        }
      } else {
        if (options.type === "scalar.function") {
          this._inner = new LeafScalarState();
        } else if (options.type === "vector.function") {
          this._inner = new LeafVectorState(
            options.output_length,
            options.input_split,
            options.input_merge,
          );
        }
      }
    }
  }

  getName(): Result<string> {
    if (this.name === undefined) {
      return { ok: false, value: undefined, error: "Name not set" };
    }
    return { ok: true, value: this.name, error: undefined };
  }

  setName(value: string): Result<undefined> {
    if (value.trim() === "") {
      return { ok: false, value: undefined, error: "Name cannot be empty" };
    }
    this.name = value;
    return { ok: true, value: undefined, error: undefined };
  }

  getInventEssay(): Result<string> {
    if (this.inventEssay === undefined) {
      return { ok: false, value: undefined, error: "InventEssay not set" };
    }
    return { ok: true, value: this.inventEssay, error: undefined };
  }

  setInventEssay(value: string): Result<undefined> {
    if (value.trim() === "") {
      return {
        ok: false,
        value: undefined,
        error: "InventEssay cannot be empty",
      };
    }
    this.inventEssay = value;
    return { ok: true, value: undefined, error: undefined };
  }

  getInventEssayTasks(): Result<string> {
    if (this.inventEssayTasks === undefined) {
      return {
        ok: false,
        value: undefined,
        error: "InventEssayTasks not set",
      };
    }
    return { ok: true, value: this.inventEssayTasks, error: undefined };
  }

  setInventEssayTasks(value: string): Result<undefined> {
    if (value.trim() === "") {
      return {
        ok: false,
        value: undefined,
        error: "InventEssayTasks cannot be empty",
      };
    }
    this.inventEssayTasks = value;
    return { ok: true, value: undefined, error: undefined };
  }

  getInventPlan(): Result<string> {
    if (this.inventPlan === undefined) {
      return { ok: false, value: undefined, error: "InventPlan not set" };
    }
    return { ok: true, value: this.inventPlan, error: undefined };
  }

  setInventPlan(value: string): Result<undefined> {
    if (value.trim() === "") {
      return {
        ok: false,
        value: undefined,
        error: "InventPlan cannot be empty",
      };
    }
    this.inventPlan = value;
    return { ok: true, value: undefined, error: undefined };
  }

  getReadme(): Result<string> {
    if (this.readme === undefined) {
      return { ok: false, value: undefined, error: "Readme not set" };
    }
    return { ok: true, value: this.readme, error: undefined };
  }

  setReadme(value: string): Result<undefined> {
    if (value.trim() === "") {
      return { ok: false, value: undefined, error: "Readme cannot be empty" };
    }
    this.readme = value;
    return { ok: true, value: undefined, error: undefined };
  }

  getFunctionType(): Result<"scalar.function" | "vector.function"> {
    if (!this.inner) {
      return {
        ok: false,
        value: undefined,
        error: "FunctionType not set",
      };
    } else if (
      this.inner instanceof BranchScalarState ||
      this.inner instanceof LeafScalarState
    ) {
      return {
        ok: true,
        value: "scalar.function",
        error: undefined,
      };
    } else if (
      this.inner instanceof BranchVectorState ||
      this.inner instanceof LeafVectorState
    ) {
      return {
        ok: true,
        value: "vector.function",
        error: undefined,
      };
    } else {
      throw new Error("Invalid inner state");
    }
  }

  setFunctionType(value: string): Result<string> {
    if (value === "scalar.function") {
      if (this.parameters.depth > 0) {
        this._inner = new BranchScalarState();
      } else {
        this._inner = new LeafScalarState();
      }
    } else if (value === "vector.function") {
      if (this.parameters.depth > 0) {
        this._inner = new BranchVectorState();
      } else {
        this._inner = new LeafVectorState();
      }
    } else {
      throw new Error("Invalid FunctionType");
    }
    return { ok: true, value: "FunctionType set", error: undefined };
  }

  get inner():
    | BranchScalarState
    | BranchVectorState
    | LeafScalarState
    | LeafVectorState
    | undefined {
    return this._inner;
  }
}
