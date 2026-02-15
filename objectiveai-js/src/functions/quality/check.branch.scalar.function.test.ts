import { describe, it, expect } from "vitest";
import { Functions } from "../../index.js";

// ── helpers ──────────────────────────────────────────────────────────

const outputExpr = { $starlark: "output['scores'][0]" };
const inputExpr = { $starlark: "input" };
const contentParts = [{ type: "text" as const, text: "Hello" }];

function qualityVcTask() {
  return {
    type: "vector.completion" as const,
    messages: [{ role: "user" as const, content: contentParts }],
    responses: [contentParts, contentParts],
    output: outputExpr,
  };
}

function branchScalar(tasks: unknown[], inputMaps?: unknown) {
  return {
    type: "scalar.function",
    description: "test",
    input_schema: { type: "integer", minimum: 1, maximum: 10 },
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
    input: inputExpr,
    output: outputExpr,
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
    output: outputExpr,
    ...(map !== undefined ? { map } : {}),
  };
}

function placeholderScalarTask(map?: number) {
  return {
    type: "placeholder.scalar.function",
    input_schema: { type: "integer", minimum: 1, maximum: 10 },
    input: inputExpr,
    output: outputExpr,
    ...(map !== undefined ? { map } : {}),
  };
}

function placeholderVectorTask(map?: number) {
  return {
    type: "placeholder.vector.function",
    input_schema: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 10,
    },
    output_length: { $starlark: "len(input)" },
    input_split: { $starlark: "[[x] for x in input]" },
    input_merge: { $starlark: "[x[0] for x in input]" },
    input: inputExpr,
    output: outputExpr,
    ...(map !== undefined ? { map } : {}),
  };
}

// ── tests ────────────────────────────────────────────────────────────

describe("checkBranchScalarFunction", () => {
  // wrong type
  it("rejects vector function", () => {
    const f = {
      type: "vector.function",
      description: "test",
      input_schema: {
        type: "object",
        properties: {
          items: { type: "array", items: { type: "string" } },
        },
        required: ["items"],
      },
      output_length: { $starlark: "len(input['items'])" },
      input_split: {
        $starlark: "[{'items': [x]} for x in input['items']]",
      },
      input_merge: {
        $starlark: "{'items': [x['items'][0] for x in input]}",
      },
      tasks: [],
    };
    expect(() => Functions.Quality.checkBranchScalarFunction(f)).toThrow(
      /Expected scalar function/,
    );
  });

  // input_maps
  it("rejects input_maps", () => {
    const f = branchScalar(
      [scalarFunctionTask()],
      [{ $starlark: "input" }],
    );
    expect(() => Functions.Quality.checkBranchScalarFunction(f)).toThrow(
      /must not have input_maps/,
    );
  });

  // map on tasks
  it("rejects scalar.function task with map", () => {
    const f = branchScalar([scalarFunctionTask(0)]);
    expect(() => Functions.Quality.checkBranchScalarFunction(f)).toThrow(
      /must not have map/,
    );
  });

  it("rejects placeholder.scalar.function task with map", () => {
    const f = branchScalar([placeholderScalarTask(0)]);
    expect(() => Functions.Quality.checkBranchScalarFunction(f)).toThrow(
      /must not have map/,
    );
  });

  // wrong task types
  it("rejects vector.function task", () => {
    const f = branchScalar([vectorFunctionTask()]);
    expect(() => Functions.Quality.checkBranchScalarFunction(f)).toThrow(
      /found vector\.function/,
    );
  });

  it("rejects placeholder.vector.function task", () => {
    const f = branchScalar([placeholderVectorTask()]);
    expect(() => Functions.Quality.checkBranchScalarFunction(f)).toThrow(
      /found placeholder\.vector\.function/,
    );
  });

  it("rejects vector.completion task", () => {
    const f = branchScalar([qualityVcTask()]);
    expect(() => Functions.Quality.checkBranchScalarFunction(f)).toThrow(
      /must not contain vector\.completion/,
    );
  });

  // success cases
  it("accepts valid single scalar.function", () => {
    const f = branchScalar([scalarFunctionTask()]);
    expect(() => Functions.Quality.checkBranchScalarFunction(f)).not.toThrow();
  });

  it("accepts valid single placeholder.scalar.function", () => {
    const f = branchScalar([placeholderScalarTask()]);
    expect(() => Functions.Quality.checkBranchScalarFunction(f)).not.toThrow();
  });

  it("accepts valid multiple tasks", () => {
    const f = branchScalar([scalarFunctionTask(), placeholderScalarTask()]);
    expect(() => Functions.Quality.checkBranchScalarFunction(f)).not.toThrow();
  });

  it("rejects empty tasks", () => {
    const f = branchScalar([]);
    expect(() => Functions.Quality.checkBranchScalarFunction(f)).toThrow(
      /at least one task/,
    );
  });
});
