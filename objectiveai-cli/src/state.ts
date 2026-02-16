import z from "zod";
import { Parameters, ParametersSchema } from "./parameters";
import { Functions } from "objectiveai";
import { PlaceholderTaskSpecs } from "./placeholder";
import { Result } from "./result";

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

export const StateOptionsSchema = z.object({
  parameters: ParametersSchema,
  inventSpec: z.string().nonempty(),
});
export type StateOptions = z.infer<typeof StateOptionsSchema>;

export class State {
  readonly parameters: Parameters;
  readonly inventSpec: string;
  private name: string | undefined;
  private inventEssay: string | undefined;
  private inventEssayTasks: string | undefined;
  private inventPlan: string | undefined;
  private branchScalarFunction:
    | Partial<Functions.QualityBranchRemoteScalarFunction>
    | undefined;
  private branchVectorFunction:
    | Partial<Functions.QualityBranchRemoteVectorFunction>
    | undefined;
  private leafScalarFunction:
    | Partial<Functions.QualityLeafRemoteScalarFunction>
    | undefined;
  private leafVectorFunction:
    | Partial<Functions.QualityLeafRemoteVectorFunction>
    | undefined;
  private placeholderTaskSpecs: PlaceholderTaskSpecs | undefined;
  private readme: string | undefined;

  constructor(options: StateOptions) {
    this.parameters = options.parameters;
    this.inventSpec = options.inventSpec;
  }

  getType(): "scalar.function" | "vector.function" | null {
    if (this.parameters.depth > 0) {
      if (this.branchScalarFunction !== undefined) {
        return "scalar.function";
      } else if (this.branchVectorFunction !== undefined) {
        return "vector.function";
      }
    } else {
      if (this.leafScalarFunction !== undefined) {
        return "scalar.function";
      } else if (this.leafVectorFunction !== undefined) {
        return "vector.function";
      }
    }
    return null;
  }

  setType(type: string): Result<undefined> {
    this.branchScalarFunction = undefined;
    this.branchVectorFunction = undefined;
    this.leafScalarFunction = undefined;
    this.leafVectorFunction = undefined;
    if (this.parameters.depth > 0) {
      if (type === "scalar.function") {
        this.branchScalarFunction = {
          type: "scalar.function",
        };
      } else if (type === "vector.function") {
        this.branchVectorFunction = {
          type: "vector.function",
        };
      }
    } else {
      if (type === "scalar.function") {
        this.leafScalarFunction = {
          type: "scalar.function",
        };
      } else if (type === "vector.function") {
        this.leafVectorFunction = {
          type: "vector.function",
        };
      }
    }
    return {
      ok: false,
      value: undefined,
      error: `Unsupported function type: ${type}`,
    };
  }

  getInventEssay(): string | undefined {
    return this.inventEssay;
  }

  setInventEssay(value: string): void {
    this.inventEssay = value;
  }
}

/* eslint-disable */
// @ts-nocheck
/*
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { Functions } from "objectiveai";

type FunctionFieldName = (typeof FUNCTION_FIELD_ORDER)[number];

interface Parameters {
  depth: number;
  min_width: number;
  max_width: number;
}

function readJsonFile(path: string): unknown | undefined {
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return undefined;
  }
}

function readTextFile(path: string): string | undefined {
  if (!existsSync(path)) return undefined;
  const content = readFileSync(path, "utf-8").trim();
  return content || undefined;
}

export class FunctionState {
  readonly dir: string;

  private function: Record<string, unknown>;
  private name: string | undefined;
  private spec: string | undefined;
  private essay: string | undefined;
  private essayTasks: string | undefined;
  private readme: string | undefined;
  private plan: string[];
  private session: string | undefined;
  private parameters: Parameters | undefined;

  constructor(dir: string) {
    this.dir = dir;

    // function.json
    const fn = readJsonFile(join(dir, "function.json"));
    this.function = typeof fn === "object" && fn !== null ? fn as Record<string, unknown> : {};

    // name.txt
    this.name = readTextFile(join(dir, "name.txt"));

    // SPEC.md
    this.spec = readTextFile(join(dir, "SPEC.md"));

    // ESSAY.md
    this.essay = readTextFile(join(dir, "ESSAY.md"));

    // ESSAY_TASKS.md
    this.essayTasks = readTextFile(join(dir, "ESSAY_TASKS.md"));

    // README.md
    this.readme = readTextFile(join(dir, "README.md"));

    // plans/ — always empty at init
    this.plan = [];

    // session.txt
    this.session = readTextFile(join(dir, "session.txt"));

    // parameters.json
    const params = readJsonFile(join(dir, "parameters.json"));
    this.parameters = params as Parameters | undefined;
  }

  // ---------------------------------------------------------------------------
  // write — flush all state to disk
  // ---------------------------------------------------------------------------

  write(): void {
    // function.json
    const ordered: Record<string, unknown> = {};
    for (const key of FUNCTION_FIELD_ORDER) {
      if (key in this.function) {
        ordered[key] = this.function[key];
      }
    }
    for (const key in this.function) {
      if (!(key in ordered)) {
        ordered[key] = this.function[key];
      }
    }
    writeFileSync(join(this.dir, "function.json"), JSON.stringify(ordered, null, 2));

    // name.txt
    if (this.name !== undefined) {
      writeFileSync(join(this.dir, "name.txt"), this.name);
    }

    // SPEC.md
    if (this.spec !== undefined) {
      writeFileSync(join(this.dir, "SPEC.md"), this.spec);
    }

    // ESSAY.md
    if (this.essay !== undefined) {
      writeFileSync(join(this.dir, "ESSAY.md"), this.essay);
    }

    // ESSAY_TASKS.md
    if (this.essayTasks !== undefined) {
      writeFileSync(join(this.dir, "ESSAY_TASKS.md"), this.essayTasks);
    }

    // README.md
    if (this.readme !== undefined) {
      writeFileSync(join(this.dir, "README.md"), this.readme);
    }

    // plans/
    if (this.plan.length > 0) {
      const plansDir = join(this.dir, "plans");
      mkdirSync(plansDir, { recursive: true });
      for (let i = 0; i < this.plan.length; i++) {
        writeFileSync(join(plansDir, `${i}.md`), this.plan[i]);
      }
    }

    // session.txt
    if (this.session !== undefined) {
      writeFileSync(join(this.dir, "session.txt"), this.session);
    }

    // parameters.json
    if (this.parameters !== undefined) {
      writeFileSync(join(this.dir, "parameters.json"), JSON.stringify(this.parameters, null, 2));
    }
  }

  // ---------------------------------------------------------------------------
  // function.json
  // ---------------------------------------------------------------------------

  getFunction(): Record<string, unknown> {
    return { ...this.function };
  }

  getFunctionField(field: FunctionFieldName): unknown {
    return this.function[field];
  }

  isFunctionFieldDefault(field: FunctionFieldName): boolean {
    const value = this.function[field];
    if (value === undefined) return true;
    if (field === "input_maps" || field === "tasks") {
      return Array.isArray(value) && value.length === 0;
    }
    return false;
  }

  getFunctionType(): Functions.RemoteFunctionType | undefined {
    const parsed = Functions.RemoteFunctionSchema.shape.type.safeParse(this.function.type);
    return parsed.success ? parsed.data : undefined;
  }

  setFunctionFields(fields: Partial<Record<FunctionFieldName, unknown | null>>): void {
    for (const key in fields) {
      const value = (fields as Record<string, unknown>)[key];
      if (value === null) {
        delete this.function[key];
      } else if (value !== undefined) {
        this.function[key] = value;
      }
    }
  }

  deleteFunctionField(field: FunctionFieldName): void {
    delete this.function[field];
  }

  appendFunctionArray(field: "input_maps" | "tasks", value: unknown): void {
    const arr = Array.isArray(this.function[field]) ? this.function[field] as unknown[] : [];
    arr.push(value);
    this.function[field] = arr;
  }

  setFunctionArrayAt(field: "input_maps" | "tasks", index: number, value: unknown): void {
    const arr = Array.isArray(this.function[field]) ? this.function[field] as unknown[] : [];
    if (index < 0 || index >= arr.length) {
      throw new Error(`Index ${index} out of bounds for ${field} (length ${arr.length})`);
    }
    arr[index] = value;
    this.function[field] = arr;
  }

  deleteFunctionArrayAt(field: "input_maps" | "tasks", index: number): void {
    const arr = Array.isArray(this.function[field]) ? this.function[field] as unknown[] : [];
    if (index < 0 || index >= arr.length) {
      throw new Error(`Index ${index} out of bounds for ${field} (length ${arr.length})`);
    }
    arr.splice(index, 1);
    this.function[field] = arr;
  }

  validateFunction(): string | null {
    const type = this.getFunctionType();
    let schema;
    switch (type) {
      case "scalar.function":
        schema = Functions.RemoteScalarFunctionSchema;
        break;
      case "vector.function":
        schema = Functions.RemoteVectorFunctionSchema;
        break;
      default:
        schema = Functions.RemoteFunctionSchema;
        break;
    }
    const parsed = schema.safeParse(this.function);
    return parsed.success ? null : parsed.error.message;
  }

  // ---------------------------------------------------------------------------
  // name.txt
  // ---------------------------------------------------------------------------

  getName(): string | undefined {
    return this.name;
  }

  setName(value: string): void {
    this.name = value.trim();
  }

  // ---------------------------------------------------------------------------
  // SPEC.md
  // ---------------------------------------------------------------------------

  getSpec(): string | undefined {
    return this.spec;
  }

  setSpec(value: string): void {
    this.spec = value;
  }

  appendSpecAmendment(content: string): number {
    const existing = this.spec ?? "";
    const matches = existing.match(/===AMENDMENT \d+===/g);
    const nextIndex = matches ? matches.length + 1 : 1;
    this.spec = existing + `\n===AMENDMENT ${nextIndex}===\n${content}`;
    return nextIndex;
  }

  // ---------------------------------------------------------------------------
  // ESSAY.md
  // ---------------------------------------------------------------------------

  getEssay(): string | undefined {
    return this.essay;
  }

  setEssay(value: string): void {
    this.essay = value;
  }

  // ---------------------------------------------------------------------------
  // ESSAY_TASKS.md
  // ---------------------------------------------------------------------------

  getEssayTasks(): string | undefined {
    return this.essayTasks;
  }

  setEssayTasks(value: string): void {
    this.essayTasks = value;
  }

  // ---------------------------------------------------------------------------
  // README.md
  // ---------------------------------------------------------------------------

  getReadme(): string | undefined {
    return this.readme;
  }

  setReadme(value: string): void {
    this.readme = value;
  }

  // ---------------------------------------------------------------------------
  // plans/
  // ---------------------------------------------------------------------------

  getPlan(): string[] {
    return [...this.plan];
  }

  getPlanAt(index: number): string | undefined {
    return this.plan[index];
  }

  setPlanAt(index: number, content: string): void {
    while (this.plan.length <= index) {
      this.plan.push("");
    }
    this.plan[index] = content;
  }

  getLatestPlanIndex(): number {
    return this.plan.length - 1;
  }

  // ---------------------------------------------------------------------------
  // session.txt
  // ---------------------------------------------------------------------------

  getSession(): string | undefined {
    return this.session;
  }

  setSession(value: string): void {
    this.session = value;
  }

  // ---------------------------------------------------------------------------
  // parameters.json
  // ---------------------------------------------------------------------------

  getParameters(): Parameters | undefined {
    return this.parameters;
  }

  setParameters(value: Parameters): void {
    this.parameters = value;
  }
}
*/
