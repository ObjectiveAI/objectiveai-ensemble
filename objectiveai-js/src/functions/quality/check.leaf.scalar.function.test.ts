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

function leafScalar(
  tasks: unknown[],
  inputMaps?: unknown,
) {
  return {
    type: "scalar.function",
    description: "test",
    input_schema: { type: "string" },
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

describe("checkLeafScalarFunction", () => {
  // wrong type
  it("rejects vector function", () => {
    const f = {
      type: "vector.function",
      description: "test",
      input_schema: {
        type: "array",
        items: { type: "string" },
        minItems: 2,
      },
      output_length: { $starlark: "len(input)" },
      input_split: { $starlark: "[[x] for x in input]" },
      input_merge: { $starlark: "[x[0] for x in input]" },
      tasks: [],
    };
    expect(() => Functions.Quality.checkLeafScalarFunction(f)).toThrow(
      /Expected scalar function/,
    );
  });

  // input_maps
  it("rejects input_maps", () => {
    const f = leafScalar([qualityVcTask()], [{ $starlark: "input" }]);
    expect(() => Functions.Quality.checkLeafScalarFunction(f)).toThrow(
      /must not have input_maps/,
    );
  });

  // map on vc task
  it("rejects vc task with map", () => {
    const task = { ...qualityVcTask(), map: 0 };
    const f = leafScalar([task]);
    expect(() => Functions.Quality.checkLeafScalarFunction(f)).toThrow(
      /must not have map/,
    );
  });

  // wrong task types
  it("rejects scalar.function task", () => {
    const f = leafScalar([scalarFunctionTask()]);
    expect(() => Functions.Quality.checkLeafScalarFunction(f)).toThrow(
      /found scalar\.function/,
    );
  });

  it("rejects vector.function task", () => {
    const f = leafScalar([vectorFunctionTask()]);
    expect(() => Functions.Quality.checkLeafScalarFunction(f)).toThrow(
      /found vector\.function/,
    );
  });

  it("rejects placeholder.scalar.function task", () => {
    const f = leafScalar([placeholderScalarTask()]);
    expect(() => Functions.Quality.checkLeafScalarFunction(f)).toThrow(
      /found placeholder\.scalar\.function/,
    );
  });

  it("rejects placeholder.vector.function task", () => {
    const f = leafScalar([placeholderVectorTask()]);
    expect(() => Functions.Quality.checkLeafScalarFunction(f)).toThrow(
      /found placeholder\.vector\.function/,
    );
  });

  // message/response content checks
  it("rejects empty messages", () => {
    const task = { ...qualityVcTask(), messages: [] };
    const f = leafScalar([task]);
    expect(() => Functions.Quality.checkLeafScalarFunction(f)).toThrow(
      /at least 1 message/,
    );
  });

  it("rejects one response", () => {
    const task = { ...qualityVcTask(), responses: [contentParts] };
    const f = leafScalar([task]);
    expect(() => Functions.Quality.checkLeafScalarFunction(f)).toThrow(
      /at least 2 responses/,
    );
  });

  it("rejects plain string response", () => {
    const task = { ...qualityVcTask(), responses: ["bad", contentParts] };
    const f = leafScalar([task]);
    expect(() => Functions.Quality.checkLeafScalarFunction(f)).toThrow(
      /response must be an array of content parts/,
    );
  });

  it("rejects plain string user message content", () => {
    const task = {
      ...qualityVcTask(),
      messages: [{ role: "user", content: "bad" }],
    };
    const f = leafScalar([task]);
    expect(() => Functions.Quality.checkLeafScalarFunction(f)).toThrow(
      /content must be an array/,
    );
  });

  it("rejects plain string developer message content", () => {
    const task = {
      ...qualityVcTask(),
      messages: [{ role: "developer", content: "bad" }],
    };
    const f = leafScalar([task]);
    expect(() => Functions.Quality.checkLeafScalarFunction(f)).toThrow(
      /content must be an array/,
    );
  });

  it("rejects plain string system message content", () => {
    const task = {
      ...qualityVcTask(),
      messages: [{ role: "system", content: "bad" }],
    };
    const f = leafScalar([task]);
    expect(() => Functions.Quality.checkLeafScalarFunction(f)).toThrow(
      /content must be an array/,
    );
  });

  // success cases
  it("accepts valid single task", () => {
    const f = leafScalar([qualityVcTask()]);
    expect(() => Functions.Quality.checkLeafScalarFunction(f)).not.toThrow();
  });

  it("accepts valid multiple tasks", () => {
    const f = leafScalar([qualityVcTask(), qualityVcTask(), qualityVcTask()]);
    expect(() => Functions.Quality.checkLeafScalarFunction(f)).not.toThrow();
  });

  it("rejects empty tasks", () => {
    const f = leafScalar([]);
    expect(() => Functions.Quality.checkLeafScalarFunction(f)).toThrow(
      /at least one task/,
    );
  });

  it("accepts expression messages (skips content check)", () => {
    const task = {
      type: "vector.completion",
      messages: { $starlark: "input['messages']" },
      responses: { $starlark: "input['responses']" },
      output: outputExpr,
    };
    const f = leafScalar([task]);
    expect(() => Functions.Quality.checkLeafScalarFunction(f)).not.toThrow();
  });
});
