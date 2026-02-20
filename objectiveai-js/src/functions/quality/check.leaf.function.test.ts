import { describe, it, expect } from "vitest";
import { Functions } from "../../index.js";

// ── helpers ──────────────────────────────────────────────────────────

const scalarOutputExpr = { $starlark: "output['scores'][0]" };
const vectorOutputExpr = { $starlark: "output['scores']" };
const contentParts = [{ type: "text" as const, text: "Hello" }];

/** Scalar-valid VC task: input-referencing messages, fixed content-part responses. */
function scalarVcTask() {
  return {
    type: "vector.completion" as const,
    messages: [
      {
        role: "user" as const,
        content: [{ type: "text" as const, text: { $starlark: "str(input)" } }],
      },
    ],
    responses: [contentParts, contentParts],
    output: scalarOutputExpr,
  };
}

/** Vector-valid VC task: input-referencing messages, expression responses. */
function vectorVcTask() {
  return {
    type: "vector.completion" as const,
    messages: [
      {
        role: "user" as const,
        content: [{ type: "text" as const, text: { $starlark: "str(input)" } }],
      },
    ],
    responses: { $starlark: "[[{'type': 'text', 'text': x}] for x in input]" },
    output: vectorOutputExpr,
  };
}

// ── tests ────────────────────────────────────────────────────────────

describe("checkLeafFunction", () => {
  it("routes scalar correctly (accepts valid leaf scalar)", () => {
    const f = {
      type: "scalar.function",
      description: "test",
      input_schema: { type: "string" },
      tasks: [scalarVcTask()],
    };
    expect(() => Functions.Quality.checkLeafFunction(f)).not.toThrow();
  });

  it("routes vector correctly (accepts valid leaf vector)", () => {
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
      tasks: [vectorVcTask()],
    };
    expect(() => Functions.Quality.checkLeafFunction(f)).not.toThrow();
  });

  it("routes scalar and catches scalar-specific errors", () => {
    const f = {
      type: "scalar.function",
      description: "test",
      input_schema: { type: "string" },
      input_maps: [{ $starlark: "input" }],
      tasks: [scalarVcTask()],
    };
    expect(() => Functions.Quality.checkLeafFunction(f)).toThrow(
      /LS02/,
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
    expect(() => Functions.Quality.checkLeafFunction(f)).toThrow(
      /LV14/,
    );
  });
});
