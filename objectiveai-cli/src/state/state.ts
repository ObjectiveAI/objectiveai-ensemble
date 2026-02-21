import { existsSync, mkdirSync } from "fs";
import z from "zod";
import { Parameters, ParametersSchema } from "../parameters";
import { Functions } from "objectiveai";
import { Result } from "../result";
import { BranchScalarState } from "./branchScalarState";
import { BranchVectorState } from "./branchVectorState";
import { LeafScalarState } from "./leafScalarState";
import { LeafVectorState } from "./leafVectorState";
import { Tool } from "src/tool";
import { GitHubBackend } from "../github";
import { functionsDir, inventDir } from "../dirs";

export const StateOptionsBaseSchema = z.object({
  parameters: ParametersSchema,
  inventSpec: z.string().nonempty(),
  gitHubToken: z.string().nonempty(),
  owner: z.string().nonempty(),
});
export type StateOptionsBase = z.infer<typeof StateOptionsBaseSchema>;

export const StateOptionsSchema = z.union([
  StateOptionsBaseSchema,
  StateOptionsBaseSchema.extend({
    type: z.literal("scalar.function"),
    input_schema: Functions.RemoteScalarFunctionSchema.shape.input_schema,
  }),
  StateOptionsBaseSchema.extend({
    type: z.literal("vector.function"),
    input_schema:
      Functions.QualityBranchRemoteVectorFunctionSchema.shape.input_schema,
    output_length: Functions.RemoteVectorFunctionSchema.shape.output_length,
    input_split: Functions.RemoteVectorFunctionSchema.shape.input_split,
    input_merge: Functions.RemoteVectorFunctionSchema.shape.input_merge,
  }),
]);
export type StateOptions = z.infer<typeof StateOptionsSchema>;

export class State {
  readonly parameters: Parameters;
  readonly inventSpec: string;
  readonly gitHubToken: string;
  readonly owner: string;
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
  private placeholderTaskIndices: number[] | undefined;
  private gitHubBackend: GitHubBackend;

  constructor(options: StateOptions, gitHubBackend: GitHubBackend) {
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
            options.input_schema,
          );
        } else if (options.type === "vector.function") {
          this._inner = new BranchVectorState(
            options.parameters,
            options.input_schema,
            options.output_length,
            options.input_split,
            options.input_merge,
          );
        }
      } else {
        if (options.type === "scalar.function") {
          this._inner = new LeafScalarState(options.parameters);
        } else if (options.type === "vector.function") {
          this._inner = new LeafVectorState(
            options.parameters,
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

  async setName(value: string): Promise<Result<string>> {
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
    const dir = inventDir(this.owner, value);
    if (existsSync(dir)) {
      return {
        ok: false,
        value: undefined,
        error: "Name is already taken, please use another",
      };
    }
    if (await this.gitHubBackend.repoExists(value, this.gitHubToken)) {
      return {
        ok: false,
        value: undefined,
        error: "Name is already taken, please use another",
      };
    }
    // Create the directory atomically to claim the name
    mkdirSync(functionsDir(this.owner), { recursive: true });
    try {
      mkdirSync(dir);
    } catch {
      return {
        ok: false,
        value: undefined,
        error: "Name is already taken, please use another",
      };
    }
    this.name = value;
    return { ok: true, value: "", error: undefined };
  }

  setNameTool(): Tool<{ name: z.ZodString }> {
    return {
      name: "WriteFunctionName",
      description: "Write FunctionName",
      inputSchema: { name: z.string() },
      fn: (args) => this.setName(args.name),
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

  setInventEssayTool(): Tool<{ essay: z.ZodString }> {
    return {
      name: "WriteInventEssay",
      description: "Write InventEssay",
      inputSchema: { essay: z.string() },
      fn: (args) => Promise.resolve(this.setInventEssay(args.essay)),
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

  setInventEssayTasksTool(): Tool<{ essay_tasks: z.ZodString }> {
    return {
      name: "WriteInventEssayTasks",
      description: "Write InventEssayTasks",
      inputSchema: { essay_tasks: z.string() },
      fn: (args) => Promise.resolve(this.setInventEssayTasks(args.essay_tasks)),
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

  setPlaceholderTaskIndices(indices: number[]): void {
    this.placeholderTaskIndices = indices;
  }

  setReadme(value: string): Result<string> {
    if (value.trim() === "") {
      return { ok: false, value: undefined, error: "Readme cannot be empty" };
    }
    if (this.placeholderTaskIndices && this.placeholderTaskIndices.length > 0) {
      const missing: string[] = [];
      for (const i of this.placeholderTaskIndices) {
        const template = `https://github.com/{{ .Owner }}/{{ .Task${i} }}`;
        if (!value.includes(template)) {
          missing.push(template);
        }
      }
      if (missing.length > 0) {
        return {
          ok: false,
          value: undefined,
          error: `README must include links to all sub-functions. Missing:\n${missing.join("\n")}`,
        };
      }
    }
    this.readme = value;
    return { ok: true, value: "", error: undefined };
  }

  setReadmeTool(): Tool<{ readme: z.ZodString }> {
    return {
      name: "WriteReadme",
      description: "Write Readme",
      inputSchema: { readme: z.string() },
      fn: (args) => Promise.resolve(this.setReadme(args.readme)),
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
    return { ok: true, value: "", error: undefined };
  }

  setFunctionTypeTool(): Tool<{ type: z.ZodString }> {
    return {
      name: "WriteFunctionType",
      description: "Write FunctionType",
      inputSchema: { type: z.string() },
      fn: (args) => Promise.resolve(this.setFunctionType(args.type)),
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

  setDescriptionTool(): Tool<{ description: z.ZodString }> {
    return {
      name: "WriteFunctionDescription",
      description: "Write FunctionDescription",
      inputSchema: { description: z.string() },
      fn: (args) => Promise.resolve(this.setDescription(args.description)),
    };
  }

  forceSetName(value: string): void {
    this.name = value;
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
