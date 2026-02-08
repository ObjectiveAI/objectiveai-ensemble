import { describe, it, expect } from "vitest";
import { validateValue, getErrorsForPath, hasErrors, getErrorMessage } from "../validation";
import type { ValidationError } from "../types";
import {
  simpleStringSchema,
  stringEnumSchema,
  numberWithConstraintsSchema,
  integerSchema,
  booleanSchema,
  simpleObjectSchema,
  nestedObjectSchema,
  simpleArraySchema,
  arrayOfObjectsSchema,
  imageSchema,
  audioSchema,
  videoSchema,
  fileSchema,
  stringOrNumberSchema,
  complexFunctionInputSchema,
} from "./testSchemas";

describe("validateValue", () => {
  describe("required validation", () => {
    it("returns error for null required field", () => {
      const errors = validateValue(simpleStringSchema, null, "field", true);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        path: "field",
        type: "required",
      });
    });

    it("returns error for undefined required field", () => {
      const errors = validateValue(simpleStringSchema, undefined, "field", true);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("required");
    });

    it("returns error for empty string required field", () => {
      const errors = validateValue(simpleStringSchema, "", "field", true);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("required");
    });

    it("passes for non-empty required field", () => {
      const errors = validateValue(simpleStringSchema, "hello", "field", true);
      expect(errors).toHaveLength(0);
    });

    it("passes for null optional field", () => {
      const errors = validateValue(simpleStringSchema, null, "field", false);
      expect(errors).toHaveLength(0);
    });
  });

  describe("string validation", () => {
    it("validates string type", () => {
      const errors = validateValue(simpleStringSchema, 123, "field", false);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("type");
    });

    it("passes for valid string", () => {
      const errors = validateValue(simpleStringSchema, "hello", "field", false);
      expect(errors).toHaveLength(0);
    });

    it("validates enum constraint", () => {
      const errors = validateValue(stringEnumSchema, "invalid", "field", false);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("constraint");
      expect(errors[0].message).toContain("option1");
    });

    it("passes for valid enum value", () => {
      const errors = validateValue(stringEnumSchema, "option2", "field", false);
      expect(errors).toHaveLength(0);
    });
  });

  describe("number validation", () => {
    it("validates number type", () => {
      const errors = validateValue(numberWithConstraintsSchema, "not a number", "field", false);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("type");
    });

    it("validates minimum constraint", () => {
      const errors = validateValue(numberWithConstraintsSchema, -5, "field", false);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("constraint");
      expect(errors[0].message).toContain("0");
    });

    it("validates maximum constraint", () => {
      const errors = validateValue(numberWithConstraintsSchema, 150, "field", false);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("constraint");
      expect(errors[0].message).toContain("100");
    });

    it("passes for valid number within range", () => {
      const errors = validateValue(numberWithConstraintsSchema, 50, "field", false);
      expect(errors).toHaveLength(0);
    });

    it("passes for edge values (min and max)", () => {
      expect(validateValue(numberWithConstraintsSchema, 0, "field", false)).toHaveLength(0);
      expect(validateValue(numberWithConstraintsSchema, 100, "field", false)).toHaveLength(0);
    });
  });

  describe("integer validation", () => {
    it("validates integer type (rejects floats)", () => {
      const errors = validateValue(integerSchema, 5.5, "field", false);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("type");
    });

    it("passes for valid integer", () => {
      const errors = validateValue(integerSchema, 5, "field", false);
      expect(errors).toHaveLength(0);
    });

    it("validates integer range constraints", () => {
      expect(validateValue(integerSchema, 0, "field", false)).toHaveLength(1);
      expect(validateValue(integerSchema, 15, "field", false)).toHaveLength(1);
    });
  });

  describe("boolean validation", () => {
    it("validates boolean type", () => {
      const errors = validateValue(booleanSchema, "true", "field", false);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("type");
    });

    it("passes for true", () => {
      const errors = validateValue(booleanSchema, true, "field", false);
      expect(errors).toHaveLength(0);
    });

    it("passes for false", () => {
      const errors = validateValue(booleanSchema, false, "field", false);
      expect(errors).toHaveLength(0);
    });
  });

  describe("object validation", () => {
    it("validates object type", () => {
      const errors = validateValue(simpleObjectSchema, "not an object", "obj", false);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("type");
    });

    it("validates required properties", () => {
      const errors = validateValue(simpleObjectSchema, { age: 25 }, "", false);
      expect(errors).toHaveLength(1);
      expect(errors[0].path).toBe("name");
      expect(errors[0].type).toBe("required");
    });

    it("validates property types", () => {
      const errors = validateValue(
        simpleObjectSchema,
        { name: "Alice", age: "not a number" },
        "",
        false
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].path).toBe("age");
      expect(errors[0].type).toBe("type");
    });

    it("passes for valid object", () => {
      const errors = validateValue(
        simpleObjectSchema,
        { name: "Alice", age: 25, active: true },
        "",
        false
      );
      expect(errors).toHaveLength(0);
    });

    it("validates deeply nested objects", () => {
      const errors = validateValue(
        nestedObjectSchema,
        { user: { profile: { bio: "Hello" } } },
        "",
        false
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].path).toBe("user.profile.name");
      expect(errors[0].type).toBe("required");
    });
  });

  describe("array validation", () => {
    it("validates array type", () => {
      const errors = validateValue(simpleArraySchema, "not an array", "arr", false);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("type");
    });

    it("validates minItems constraint", () => {
      const errors = validateValue(simpleArraySchema, [], "arr", false);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("constraint");
      expect(errors[0].message).toContain("1");
    });

    it("validates maxItems constraint", () => {
      const errors = validateValue(
        simpleArraySchema,
        ["a", "b", "c", "d", "e", "f"],
        "arr",
        false
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("constraint");
      expect(errors[0].message).toContain("5");
    });

    it("validates item types", () => {
      const errors = validateValue(simpleArraySchema, ["a", 123, "c"], "arr", false);
      expect(errors).toHaveLength(1);
      expect(errors[0].path).toBe("arr[1]");
      expect(errors[0].type).toBe("type");
    });

    it("passes for valid array", () => {
      const errors = validateValue(simpleArraySchema, ["a", "b", "c"], "arr", false);
      expect(errors).toHaveLength(0);
    });

    it("validates array of objects", () => {
      const errors = validateValue(
        arrayOfObjectsSchema,
        [{ completed: true }],
        "arr",
        false
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].path).toBe("arr[0].title");
    });
  });

  describe("media type validation", () => {
    it("validates image type structure", () => {
      const errors = validateValue(imageSchema, { url: "image.png" }, "field", false);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("type");
    });

    it("passes for valid image", () => {
      const errors = validateValue(
        imageSchema,
        { type: "image_url", image_url: { url: "data:image/png;base64,abc" } },
        "field",
        false
      );
      expect(errors).toHaveLength(0);
    });

    it("validates audio type structure", () => {
      const errors = validateValue(audioSchema, { data: "abc" }, "field", false);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("type");
    });

    it("passes for valid audio", () => {
      const errors = validateValue(
        audioSchema,
        { type: "input_audio", input_audio: { data: "abc", format: "mp3" } },
        "field",
        false
      );
      expect(errors).toHaveLength(0);
    });

    it("validates video type structure", () => {
      const errors = validateValue(videoSchema, { url: "video.mp4" }, "field", false);
      expect(errors).toHaveLength(1);
    });

    it("passes for valid video", () => {
      const errors = validateValue(
        videoSchema,
        { type: "video_url", video_url: { url: "data:video/mp4;base64,abc" } },
        "field",
        false
      );
      expect(errors).toHaveLength(0);
    });

    it("validates file type structure", () => {
      const errors = validateValue(fileSchema, { filename: "doc.pdf" }, "field", false);
      expect(errors).toHaveLength(1);
    });

    it("passes for valid file", () => {
      const errors = validateValue(
        fileSchema,
        { type: "file", file: { filename: "doc.pdf", file_data: "abc" } },
        "field",
        false
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe("anyOf validation", () => {
    it("passes if value matches first schema", () => {
      const errors = validateValue(stringOrNumberSchema, "hello", "field", false);
      expect(errors).toHaveLength(0);
    });

    it("passes if value matches second schema", () => {
      const errors = validateValue(stringOrNumberSchema, 42, "field", false);
      expect(errors).toHaveLength(0);
    });

    it("fails if value matches no schema", () => {
      const errors = validateValue(stringOrNumberSchema, true, "field", false);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("type");
      expect(errors[0].message).toContain("any allowed type");
    });
  });

  describe("complex schema validation", () => {
    it("validates complexFunctionInputSchema with valid data", () => {
      const validData = {
        prompt: "Evaluate these items",
        contentItems: ["item1", "item2"],
        options: {
          strict: true,
          threshold: 0.5,
          categories: ["quality", "relevance"],
        },
      };
      const errors = validateValue(complexFunctionInputSchema, validData, "", false);
      expect(errors).toHaveLength(0);
    });

    it("returns multiple errors for invalid complex data", () => {
      const invalidData = {
        prompt: "", // Empty required field
        contentItems: ["only one"], // minItems: 2
        options: {
          threshold: 1.5, // maximum: 1
        },
      };
      const errors = validateValue(complexFunctionInputSchema, invalidData, "", true);
      expect(errors.length).toBeGreaterThan(1);
    });

    it("validates mixed content items in contentItems", () => {
      const dataWithMixedContent = {
        prompt: "Test",
        contentItems: [
          "text item",
          { type: "image_url", image_url: { url: "data:image/png;base64,abc" } },
        ],
      };
      const errors = validateValue(complexFunctionInputSchema, dataWithMixedContent, "", false);
      expect(errors).toHaveLength(0);
    });
  });
});

describe("getErrorsForPath", () => {
  const errors: ValidationError[] = [
    { path: "name", message: "Required", type: "required" },
    { path: "user.email", message: "Invalid", type: "type" },
    { path: "user.profile.name", message: "Required", type: "required" },
    { path: "items[0].title", message: "Required", type: "required" },
    { path: "items[1].title", message: "Required", type: "required" },
  ];

  it("returns errors for exact path", () => {
    const result = getErrorsForPath(errors, "name");
    expect(result).toHaveLength(1);
  });

  it("returns errors for path and children (dot notation)", () => {
    const result = getErrorsForPath(errors, "user");
    expect(result).toHaveLength(2);
  });

  it("returns errors for path and children (bracket notation)", () => {
    const result = getErrorsForPath(errors, "items");
    expect(result).toHaveLength(2);
  });

  it("returns all errors for empty path", () => {
    const result = getErrorsForPath(errors, "");
    expect(result).toHaveLength(5);
  });
});

describe("hasErrors", () => {
  const errors: ValidationError[] = [
    { path: "name", message: "Required", type: "required" },
  ];

  it("returns true for path with errors", () => {
    expect(hasErrors(errors, "name")).toBe(true);
  });

  it("returns false for path without errors", () => {
    expect(hasErrors(errors, "email")).toBe(false);
  });
});

describe("getErrorMessage", () => {
  const errors: ValidationError[] = [
    { path: "name", message: "This field is required", type: "required" },
    { path: "name", message: "Must be at least 2 characters", type: "constraint" },
  ];

  it("returns first error message for path", () => {
    expect(getErrorMessage(errors, "name")).toBe("This field is required");
  });

  it("returns undefined for path without errors", () => {
    expect(getErrorMessage(errors, "email")).toBeUndefined();
  });
});
