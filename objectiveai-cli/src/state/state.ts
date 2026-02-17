import z from "zod";
import { Parameters, ParametersSchema } from "../parameters";
import { Functions } from "objectiveai";
import { Result } from "../result";
import { BranchScalarState } from "./branchScalarState";
import { BranchVectorState } from "./branchVectorState";
import { LeafScalarState } from "./leafScalarState";
import { LeafVectorState } from "./leafVectorState";
import { Tool } from "src/tool";

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

  getInventSpec(): Result<string> {
    return { ok: true, value: this.inventSpec, error: undefined };
  }

  getInventSpecTool(): Tool<{}> {
    return {
      name: "ReadInventSpec",
      description: "Read InventSpec",
      inputSchema: {},
      fn: () => Promise.resolve(this.getInventSpec()),
    };
  }

  getName(): Result<string> {
    if (this.name === undefined) {
      return { ok: false, value: undefined, error: "FunctionName not set" };
    }
    return { ok: true, value: this.name, error: undefined };
  }

  getNameTool(): Tool<{}> {
    return {
      name: "ReadFunctionName",
      description: "Read FunctionName",
      inputSchema: {},
      fn: () => Promise.resolve(this.getName()),
    };
  }

  setName(value: string): Result<string> {
    if (value.trim() === "") {
      return {
        ok: false,
        value: undefined,
        error: "FunctionName cannot be empty",
      };
    }
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value)) {
      return {
        ok: false,
        value: undefined,
        error:
          "FunctionName must be lowercase alphanumeric with dashes, cannot start or end with a dash",
      };
    }
    if (new TextEncoder().encode(value).length > 100) {
      return {
        ok: false,
        value: undefined,
        error: "FunctionName exceeds maximum of 100 bytes",
      };
    }
    this.name = value;
    return { ok: true, value: "", error: undefined };
  }

  setNameTool(): Tool<{ content: z.ZodString }> {
    return {
      name: "WriteFunctionName",
      description: "Write FunctionName",
      inputSchema: { content: z.string() },
      fn: (args) => Promise.resolve(this.setName(args.content)),
    };
  }

  getInventEssay(): Result<string> {
    if (this.inventEssay === undefined) {
      return { ok: false, value: undefined, error: "InventEssay not set" };
    }
    return { ok: true, value: this.inventEssay, error: undefined };
  }

  getInventEssayTool(): Tool<{}> {
    return {
      name: "ReadInventEssay",
      description: "Read InventEssay",
      inputSchema: {},
      fn: () => Promise.resolve(this.getInventEssay()),
    };
  }

  setInventEssay(value: string): Result<string> {
    if (value.trim() === "") {
      return {
        ok: false,
        value: undefined,
        error: "InventEssay cannot be empty",
      };
    }
    this.inventEssay = value;
    return { ok: true, value: "", error: undefined };
  }

  setInventEssayTool(): Tool<{ content: z.ZodString }> {
    return {
      name: "WriteInventEssay",
      description: "Write InventEssay",
      inputSchema: { content: z.string() },
      fn: (args) => Promise.resolve(this.setInventEssay(args.content)),
    };
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

  getInventEssayTasksTool(): Tool<{}> {
    return {
      name: "ReadInventEssayTasks",
      description: "Read InventEssayTasks",
      inputSchema: {},
      fn: () => Promise.resolve(this.getInventEssayTasks()),
    };
  }

  setInventEssayTasks(value: string): Result<string> {
    if (value.trim() === "") {
      return {
        ok: false,
        value: undefined,
        error: "InventEssayTasks cannot be empty",
      };
    }
    this.inventEssayTasks = value;
    return { ok: true, value: "", error: undefined };
  }

  setInventEssayTasksTool(): Tool<{ content: z.ZodString }> {
    return {
      name: "WriteInventEssayTasks",
      description: "Write InventEssayTasks",
      inputSchema: { content: z.string() },
      fn: (args) => Promise.resolve(this.setInventEssayTasks(args.content)),
    };
  }

  getReadme(): Result<string> {
    if (this.readme === undefined) {
      return { ok: false, value: undefined, error: "Readme not set" };
    }
    return { ok: true, value: this.readme, error: undefined };
  }

  getReadmeTool(): Tool<{}> {
    return {
      name: "ReadReadme",
      description: "Read Readme",
      inputSchema: {},
      fn: () => Promise.resolve(this.getReadme()),
    };
  }

  setReadme(value: string): Result<string> {
    if (value.trim() === "") {
      return { ok: false, value: undefined, error: "Readme cannot be empty" };
    }
    this.readme = value;
    return { ok: true, value: "", error: undefined };
  }

  setReadmeTool(): Tool<{ content: z.ZodString }> {
    return {
      name: "WriteReadme",
      description: "Write Readme",
      inputSchema: { content: z.string() },
      fn: (args) => Promise.resolve(this.setReadme(args.content)),
    };
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

  getFunctionTypeTool(): Tool<{}> {
    return {
      name: "ReadFunctionType",
      description: "Read FunctionType",
      inputSchema: {},
      fn: () => Promise.resolve(this.getFunctionType()),
    };
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
    return { ok: true, value: "", error: undefined };
  }

  setFunctionTypeTool(): Tool<{ content: z.ZodString }> {
    return {
      name: "WriteFunctionType",
      description: "Write FunctionType",
      inputSchema: { content: z.string() },
      fn: (args) => Promise.resolve(this.setFunctionType(args.content)),
    };
  }

  getDescription(): Result<string> {
    if (!this._inner) {
      return { ok: false, value: undefined, error: "Function type not set" };
    }
    if (this._inner.function.description) {
      return {
        ok: true,
        value: this._inner.function.description,
        error: undefined,
      };
    }
    return { ok: false, value: undefined, error: "Description not set" };
  }

  getDescriptionTool(): Tool<{}> {
    return {
      name: "ReadFunctionDescription",
      description: "Read FunctionDescription",
      inputSchema: {},
      fn: () => Promise.resolve(this.getDescription()),
    };
  }

  setDescription(value: string): Result<string> {
    if (!this._inner) {
      return { ok: false, value: undefined, error: "Function type not set" };
    }
    if (value.trim() === "") {
      return {
        ok: false,
        value: undefined,
        error: "Description cannot be empty",
      };
    }
    const byteLength = new TextEncoder().encode(value).length;
    if (byteLength > 350) {
      return {
        ok: false,
        value: undefined,
        error: `Description is ${byteLength} bytes, exceeds maximum of 350 bytes`,
      };
    }
    this._inner.function.description = value;
    return { ok: true, value: "", error: undefined };
  }

  setDescriptionTool(): Tool<{ content: z.ZodString }> {
    return {
      name: "WriteFunctionDescription",
      description: "Write FunctionDescription",
      inputSchema: { content: z.string() },
      fn: (args) => Promise.resolve(this.setDescription(args.content)),
    };
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
