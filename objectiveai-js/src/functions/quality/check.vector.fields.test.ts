import { describe, it, expect } from "vitest";
import { Functions } from "../../index.js";

// ── helpers ──────────────────────────────────────────────────────────

const arrayOfStringsSchema = {
  type: "array",
  items: { type: "string" },
  minItems: 2,
  maxItems: 5,
};

const objectWithItemsSchema = {
  type: "object",
  properties: {
    items: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
    label: { type: "string" },
  },
  required: ["items", "label"],
};

function validArrayFields() {
  return {
    input_schema: arrayOfStringsSchema,
    output_length: { $starlark: "len(input)" },
    input_split: { $starlark: "[[x] for x in input]" },
    input_merge: { $starlark: "[x[0] for x in input]" },
  };
}

function validObjectFields() {
  return {
    input_schema: objectWithItemsSchema,
    output_length: { $starlark: "len(input['items'])" },
    input_split: {
      $starlark:
        "[{'items': [x], 'label': input['label']} for x in input['items']]",
    },
    input_merge: {
      $starlark:
        "{'items': [x['items'][0] for x in input], 'label': input[0]['label']}",
    },
  };
}

// ── success tests ────────────────────────────────────────────────────

describe("checkVectorFields", () => {
  it("accepts valid array schema", () => {
    expect(() => Functions.Quality.checkVectorFields(validArrayFields())).not.toThrow();
  });

  it("accepts valid object schema", () => {
    expect(() => Functions.Quality.checkVectorFields(validObjectFields())).not.toThrow();
  });

  it("accepts valid integer array schema", () => {
    const fields = {
      input_schema: {
        type: "array",
        items: { type: "integer", minimum: 1, maximum: 100 },
        minItems: 2,
        maxItems: 5,
      },
      output_length: { $starlark: "len(input)" },
      input_split: { $starlark: "[[x] for x in input]" },
      input_merge: { $starlark: "[x[0] for x in input]" },
    };
    expect(() => Functions.Quality.checkVectorFields(fields)).not.toThrow();
  });

  // ── error tests ──────────────────────────────────────────────────

  it("rejects bad output_length expression", () => {
    const fields = {
      ...validArrayFields(),
      output_length: { $starlark: "undefined_var" },
    };
    expect(() => Functions.Quality.checkVectorFields(fields)).toThrow(
      /VF01/,
    );
  });

  it("rejects output_length returning wrong type", () => {
    const fields = {
      ...validArrayFields(),
      output_length: { $starlark: "'not_a_number'" },
    };
    expect(() => Functions.Quality.checkVectorFields(fields)).toThrow(
      /VF01/,
    );
  });

  it("rejects bad input_split expression", () => {
    const fields = {
      ...validArrayFields(),
      input_split: { $starlark: "undefined_var" },
    };
    expect(() => Functions.Quality.checkVectorFields(fields)).toThrow(
      /VF04/,
    );
  });

  it("rejects input_split length mismatch", () => {
    const fields = {
      ...validArrayFields(),
      input_split: { $starlark: "[input[0:1], input[1:2]]" },
    };
    expect(() => Functions.Quality.checkVectorFields(fields)).toThrow(
      /VF06/,
    );
  });

  it("rejects split elements with output_length != 1", () => {
    const fields = {
      input_schema: {
        type: "array",
        items: { type: "string" },
        minItems: 2,
        maxItems: 4,
      },
      output_length: { $starlark: "len(input)" },
      input_split: { $starlark: "[[x, x] for x in input]" },
      input_merge: { $starlark: "[x[0] for x in input]" },
    };
    expect(() => Functions.Quality.checkVectorFields(fields)).toThrow(
      /VF09/,
    );
  });

  it("rejects bad input_merge expression", () => {
    const fields = {
      ...validArrayFields(),
      input_merge: { $starlark: "undefined_var" },
    };
    expect(() => Functions.Quality.checkVectorFields(fields)).toThrow(
      /VF10/,
    );
  });
});
