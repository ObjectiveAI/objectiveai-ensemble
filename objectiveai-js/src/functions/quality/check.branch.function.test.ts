import { describe, it, expect } from "vitest";
import { Functions } from "../../index.js";

// ── helpers ──────────────────────────────────────────────────────────

const inputExpr = { $starlark: "input" };

function scalarFunctionTask() {
  return {
    type: "scalar.function",
    owner: "test",
    repository: "test",
    commit: "abc123",
    input: inputExpr,
    output: { $starlark: "output" },
  };
}

function vectorFunctionTask() {
  return {
    type: "vector.function",
    owner: "test",
    repository: "test",
    commit: "abc123",
    input: inputExpr,
    output: { $starlark: "output" },
  };
}

const objectWithRequiredArraySchema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 10,
    },
    label: { type: "string" },
  },
  required: ["items", "label"],
};

// ── tests ────────────────────────────────────────────────────────────

describe("checkBranchFunction", () => {
  it("routes scalar correctly (accepts valid branch scalar)", () => {
    const f = {
      type: "scalar.function",
      description: "test",
      input_schema: { type: "integer", minimum: 1, maximum: 10 },
      tasks: [scalarFunctionTask()],
    };
    expect(() => Functions.Quality.checkBranchFunction(f as any)).not.toThrow();
  });

  it("routes vector correctly (accepts valid branch vector)", () => {
    const f = {
      type: "vector.function",
      description: "test",
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
      tasks: [vectorFunctionTask()],
    };
    expect(() => Functions.Quality.checkBranchFunction(f as any)).not.toThrow();
  });

  it("routes scalar and catches scalar-specific errors", () => {
    const f = {
      type: "scalar.function",
      description: "test",
      input_schema: { type: "integer", minimum: 1, maximum: 10 },
      input_maps: [{ $starlark: "input" }],
      tasks: [scalarFunctionTask()],
    };
    expect(() => Functions.Quality.checkBranchFunction(f as any)).toThrow(
      /must not have input_maps/,
    );
  });

  it("routes vector and catches vector-specific errors", () => {
    const f = {
      type: "vector.function",
      description: "test",
      input_schema: { type: "string" }, // invalid for vector
      output_length: { $starlark: "1" },
      input_split: { $starlark: "[input]" },
      input_merge: { $starlark: "input[0]" },
      tasks: [],
    };
    expect(() => Functions.Quality.checkBranchFunction(f as any)).toThrow(
      /must be an array, or an object/,
    );
  });
});
