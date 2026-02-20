import { describe, it, expect } from "vitest";
import { Functions } from "../../index.js";

// ── helpers ──────────────────────────────────────────────────────────

const inputExpr = { $starlark: "input" };
const contentParts = [{ type: "text" as const, text: "Hello" }];

const objectWithRequiredArraySchema = {
  type: "object",
  properties: {
    items: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 10 },
    label: { type: "string" },
  },
  required: ["items", "label"],
};

function qualityVcTask() {
  return {
    type: "vector.completion" as const,
    messages: [{ role: "user" as const, content: contentParts }],
    responses: [contentParts, contentParts],
    output: { $starlark: "output['scores'][0]" },
  };
}

function branchVector(inputSchema: unknown, tasks: unknown[], inputMaps?: unknown[]) {
  return {
    type: "vector.function",
    description: "test",
    input_schema: inputSchema,
    output_length: { $starlark: "len(input['items'])" },
    input_split: {
      $starlark:
        "[{'items': [x], 'label': input['label']} for x in input['items']]",
    },
    input_merge: {
      $starlark:
        "{'items': [x['items'][0] for x in input], 'label': input[0]['label']}",
    },
    tasks,
    ...(inputMaps !== undefined ? { input_maps: inputMaps } : {}),
  };
}

function scalarFunctionTask(map?: number) {
  return {
    type: "scalar.function",
    owner: "test",
    repository: "test",
    commit: "abc123",
    input: { $starlark: "map" },
    // Mapped scalar output is [s1, s2, ...]; normalize to sum ≈ 1 for vector parent
    output: { $starlark: "[x / sum(output) if sum(output) > 0 else 1.0 / len(output) for x in output]" },
    ...(map !== undefined ? { map } : {}),
  };
}

function vectorFunctionTask(map?: number) {
  return {
    type: "vector.function",
    owner: "test",
    repository: "test",
    commit: "abc123",
    input: inputExpr,
    output: { $starlark: "output" },
    ...(map !== undefined ? { map } : {}),
  };
}

function placeholderScalarTask(map?: number) {
  return {
    type: "placeholder.scalar.function",
    input_schema: { type: "string" },
    input: { $starlark: "map" },
    output: { $starlark: "output" },
    ...(map !== undefined ? { map } : {}),
  };
}

function placeholderVectorTask(map?: number) {
  return {
    type: "placeholder.vector.function",
    input_schema: objectWithRequiredArraySchema,
    output_length: { $starlark: "len(input['items'])" },
    input_split: {
      $starlark:
        "[{'items': [x], 'label': input['label']} for x in input['items']]",
    },
    input_merge: {
      $starlark:
        "{'items': [x['items'][0] for x in input], 'label': input[0]['label']}",
    },
    input: inputExpr,
    output: { $starlark: "output" },
    ...(map !== undefined ? { map } : {}),
  };
}

// ── tests ────────────────────────────────────────────────────────────

describe("checkBranchVectorFunction", () => {
  // wrong type
  it("rejects scalar function", () => {
    const f = {
      type: "scalar.function",
      description: "test",
      input_schema: { type: "integer", minimum: 1, maximum: 10 },
      tasks: [],
    };
    expect(() => Functions.Quality.checkBranchVectorFunction(f)).toThrow(
      /BV01/,
    );
  });

  // input schema checks
  it("rejects string input_schema", () => {
    const f = branchVector({ type: "string" }, [vectorFunctionTask()]);
    expect(() => Functions.Quality.checkBranchVectorFunction(f)).toThrow(
      /LV14/,
    );
  });

  it("rejects object without required array property", () => {
    const schema = {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    };
    const f = branchVector(schema, [vectorFunctionTask()]);
    expect(() => Functions.Quality.checkBranchVectorFunction(f)).toThrow(
      /LV13/,
    );
  });

  // task type/map constraints
  it("rejects scalar.function without map", () => {
    const f = branchVector(objectWithRequiredArraySchema, [
      scalarFunctionTask(), // missing map
      vectorFunctionTask(),
    ]);
    expect(() => Functions.Quality.checkBranchVectorFunction(f)).toThrow(
      /BV03/,
    );
  });

  it("rejects placeholder.scalar.function without map", () => {
    const f = branchVector(objectWithRequiredArraySchema, [
      placeholderScalarTask(), // missing map
      vectorFunctionTask(),
    ]);
    expect(() => Functions.Quality.checkBranchVectorFunction(f)).toThrow(
      /BV04/,
    );
  });

  it("rejects vector.function with map", () => {
    const f = branchVector(objectWithRequiredArraySchema, [
      vectorFunctionTask(0),
    ]);
    expect(() => Functions.Quality.checkBranchVectorFunction(f)).toThrow(
      /BV05/,
    );
  });

  it("rejects placeholder.vector.function with map", () => {
    const f = branchVector(objectWithRequiredArraySchema, [
      placeholderVectorTask(0),
    ]);
    expect(() => Functions.Quality.checkBranchVectorFunction(f)).toThrow(
      /BV06/,
    );
  });

  it("rejects vector.completion task", () => {
    const f = branchVector(objectWithRequiredArraySchema, [qualityVcTask()]);
    expect(() => Functions.Quality.checkBranchVectorFunction(f)).toThrow(
      /BV07/,
    );
  });

  // single task must be vector-like
  it("rejects single mapped scalar task", () => {
    const f = branchVector(
      objectWithRequiredArraySchema,
      [scalarFunctionTask(0)],
      [{ $starlark: "input['items']" }],
    );
    expect(() => Functions.Quality.checkBranchVectorFunction(f)).toThrow(
      /BV08/,
    );
  });

  // >50% mapped scalar
  it("rejects over 50% mapped scalar tasks", () => {
    const f = branchVector(
      objectWithRequiredArraySchema,
      [
        scalarFunctionTask(0),
        scalarFunctionTask(0),
        vectorFunctionTask(),
      ],
      [{ $starlark: "input['items']" }],
    );
    expect(() => Functions.Quality.checkBranchVectorFunction(f)).toThrow(
      /BV09/,
    );
  });

  // success cases
  it("accepts single vector.function", () => {
    const f = branchVector(objectWithRequiredArraySchema, [
      vectorFunctionTask(),
    ]);
    expect(() =>
      Functions.Quality.checkBranchVectorFunction(f),
    ).not.toThrow();
  });

  it("accepts single placeholder.vector.function", () => {
    const f = branchVector(objectWithRequiredArraySchema, [
      placeholderVectorTask(),
    ]);
    expect(() =>
      Functions.Quality.checkBranchVectorFunction(f),
    ).not.toThrow();
  });

  it("accepts valid 50/50 split", () => {
    const f = branchVector(
      objectWithRequiredArraySchema,
      [
        scalarFunctionTask(0),
        vectorFunctionTask(),
      ],
      [{ $starlark: "input['items']" }],
    );
    expect(() =>
      Functions.Quality.checkBranchVectorFunction(f),
    ).not.toThrow();
  });

  it("accepts valid mixed tasks", () => {
    const f = branchVector(
      objectWithRequiredArraySchema,
      [
        scalarFunctionTask(0),
        vectorFunctionTask(),
        vectorFunctionTask(),
      ],
      [{ $starlark: "input['items']" }],
    );
    expect(() =>
      Functions.Quality.checkBranchVectorFunction(f),
    ).not.toThrow();
  });

  it("accepts all unmapped vector tasks", () => {
    const f = branchVector(objectWithRequiredArraySchema, [
      vectorFunctionTask(),
      vectorFunctionTask(),
    ]);
    expect(() =>
      Functions.Quality.checkBranchVectorFunction(f),
    ).not.toThrow();
  });

  it("rejects empty tasks", () => {
    const f = branchVector(objectWithRequiredArraySchema, []);
    expect(() =>
      Functions.Quality.checkBranchVectorFunction(f),
    ).toThrow(/BV02/);
  });
});
