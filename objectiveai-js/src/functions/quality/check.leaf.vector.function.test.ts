import { describe, it, expect } from "vitest";
import { Functions } from "../../index.js";

// ── helpers ──────────────────────────────────────────────────────────

const outputExpr = { $starlark: "output['scores']" };
const inputExpr = { $starlark: "input" };
const contentParts = [{ type: "text" as const, text: "Hello" }];

/** VC task valid for vector functions: expression responses, input-referencing messages. */
function qualityVcTask() {
  return {
    type: "vector.completion" as const,
    messages: [
      {
        role: "user" as const,
        content: [{ type: "text" as const, text: { $starlark: "str(input)" } }],
      },
    ],
    responses: { $starlark: "[[{'type': 'text', 'text': x}] for x in input]" },
    output: outputExpr,
  };
}

const arrayOfStringsSchema = {
  type: "array",
  items: { type: "string" },
  minItems: 2,
  maxItems: 10,
};

const objectWithRequiredArraySchema = {
  type: "object",
  properties: {
    items: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 10 },
    label: { type: "string" },
  },
  required: ["items", "label"],
};

function leafVector(inputSchema: unknown, tasks: unknown[]) {
  return {
    type: "vector.function",
    description: "test",
    input_schema: inputSchema,
    output_length: { $starlark: "len(input)" },
    input_split: { $starlark: "[[x] for x in input]" },
    input_merge: { $starlark: "[x[0] for x in input]" },
    tasks,
  };
}

function leafVectorObj(inputSchema: unknown, tasks: unknown[]) {
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
  };
}

function qualityVcTaskObj() {
  return {
    type: "vector.completion" as const,
    messages: [
      {
        role: "user" as const,
        content: [{ type: "text" as const, text: { $starlark: "str(input)" } }],
      },
    ],
    responses: { $starlark: "[[{'type': 'text', 'text': x}] for x in input['items']]" },
    output: outputExpr,
  };
}

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

function placeholderScalarTask() {
  return {
    type: "placeholder.scalar.function",
    input_schema: { type: "integer", minimum: 1, maximum: 10 },
    input: inputExpr,
    output: { $starlark: "output" },
  };
}

function placeholderVectorTask() {
  return {
    type: "placeholder.vector.function",
    input_schema: arrayOfStringsSchema,
    output_length: { $starlark: "len(input)" },
    input_split: { $starlark: "[[x] for x in input]" },
    input_merge: { $starlark: "[x[0] for x in input]" },
    input: inputExpr,
    output: { $starlark: "output" },
  };
}

// ── tests ────────────────────────────────────────────────────────────

describe("checkLeafVectorFunction", () => {
  // wrong type
  it("rejects scalar function", () => {
    const f = {
      type: "scalar.function",
      description: "test",
      input_schema: { type: "string" },
      tasks: [],
    };
    expect(() => Functions.Quality.checkLeafVectorFunction(f)).toThrow(
      /Expected vector function/,
    );
  });

  // input schema checks
  it("rejects string input_schema", () => {
    const f = leafVector({ type: "string" }, []);
    expect(() => Functions.Quality.checkLeafVectorFunction(f)).toThrow(
      /must be an array, or an object/,
    );
  });

  it("rejects object without required array property", () => {
    const schema = {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    };
    const f = leafVector(schema, []);
    expect(() => Functions.Quality.checkLeafVectorFunction(f)).toThrow(
      /must be an array, or an object/,
    );
  });

  // wrong task types
  it("rejects scalar.function task", () => {
    const f = leafVector(arrayOfStringsSchema, [scalarFunctionTask()]);
    expect(() => Functions.Quality.checkLeafVectorFunction(f)).toThrow(
      /found scalar\.function/,
    );
  });

  it("rejects vector.function task", () => {
    const f = leafVector(arrayOfStringsSchema, [vectorFunctionTask()]);
    expect(() => Functions.Quality.checkLeafVectorFunction(f)).toThrow(
      /found vector\.function/,
    );
  });

  it("rejects placeholder.scalar.function task", () => {
    const f = leafVector(arrayOfStringsSchema, [placeholderScalarTask()]);
    expect(() => Functions.Quality.checkLeafVectorFunction(f)).toThrow(
      /found placeholder\.scalar\.function/,
    );
  });

  it("rejects placeholder.vector.function task", () => {
    const f = leafVector(arrayOfStringsSchema, [placeholderVectorTask()]);
    expect(() => Functions.Quality.checkLeafVectorFunction(f)).toThrow(
      /found placeholder\.vector\.function/,
    );
  });

  // map on vc task
  it("rejects vc task with map", () => {
    const task = { ...qualityVcTask(), map: 0 };
    const f = leafVector(arrayOfStringsSchema, [task]);
    expect(() => Functions.Quality.checkLeafVectorFunction(f)).toThrow(
      /must not have map/,
    );
  });

  // vector function responses must be an expression
  it("rejects fixed array responses", () => {
    const task = {
      type: "vector.completion" as const,
      messages: [{ role: "user" as const, content: contentParts }],
      responses: [contentParts, contentParts],
      output: outputExpr,
    };
    const f = leafVector(arrayOfStringsSchema, [task]);
    expect(() => Functions.Quality.checkLeafVectorFunction(f)).toThrow(
      /vector function responses must be a single expression/,
    );
  });

  // success cases
  it("accepts valid array schema", () => {
    const f = leafVector(arrayOfStringsSchema, [qualityVcTask()]);
    expect(() => Functions.Quality.checkLeafVectorFunction(f)).not.toThrow();
  });

  it("accepts valid object with required array", () => {
    const f = leafVectorObj(objectWithRequiredArraySchema, [qualityVcTaskObj()]);
    expect(() => Functions.Quality.checkLeafVectorFunction(f)).not.toThrow();
  });

  it("accepts multiple tasks", () => {
    const f = leafVector(arrayOfStringsSchema, [
      qualityVcTask(),
      qualityVcTask(),
    ]);
    expect(() => Functions.Quality.checkLeafVectorFunction(f)).not.toThrow();
  });

  it("rejects empty tasks", () => {
    const f = leafVector(arrayOfStringsSchema, []);
    expect(() => Functions.Quality.checkLeafVectorFunction(f)).toThrow(
      /at least one task/,
    );
  });
});
