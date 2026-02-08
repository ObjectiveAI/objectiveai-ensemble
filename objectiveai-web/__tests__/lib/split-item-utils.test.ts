import { describe, it, expect } from "vitest";
import {
  removeCommonFields,
  flattenSingleField,
  simplifySplitItems,
  toDisplayItem,
  isPlainObject,
  isRichContent,
  deepEqual,
  getDisplayMode,
  type InputValue,
} from "../../lib/split-item-utils";

describe("isPlainObject", () => {
  it("returns true for plain objects", () => {
    expect(isPlainObject({ a: 1 })).toBe(true);
    expect(isPlainObject({ name: "test", count: 5 })).toBe(true);
    expect(isPlainObject({})).toBe(true);
  });

  it("returns false for arrays", () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject([1, 2, 3])).toBe(false);
  });

  it("returns false for primitives", () => {
    expect(isPlainObject("string")).toBe(false);
    expect(isPlainObject(42)).toBe(false);
    expect(isPlainObject(true)).toBe(false);
    expect(isPlainObject(null)).toBe(false);
  });

  it("returns false for rich content types", () => {
    expect(isPlainObject({ type: "image_url", image_url: { url: "..." } })).toBe(false);
    expect(isPlainObject({ type: "input_audio", input_audio: { data: "...", format: "mp3" } })).toBe(false);
    expect(isPlainObject({ type: "video_url", video_url: { url: "..." } })).toBe(false);
    expect(isPlainObject({ type: "file", file: { filename: "test.pdf" } })).toBe(false);
  });
});

describe("isRichContent", () => {
  it("returns true for image content", () => {
    expect(isRichContent({ type: "image_url", image_url: { url: "data:image/png;base64,abc" } })).toBe(true);
  });

  it("returns true for audio content", () => {
    expect(isRichContent({ type: "input_audio", input_audio: { data: "abc", format: "mp3" } })).toBe(true);
  });

  it("returns true for video content", () => {
    expect(isRichContent({ type: "video_url", video_url: { url: "data:video/mp4;base64,abc" } })).toBe(true);
    expect(isRichContent({ type: "input_video", video_url: { url: "..." } })).toBe(true);
  });

  it("returns true for file content", () => {
    expect(isRichContent({ type: "file", file: { filename: "doc.pdf", file_data: "abc" } })).toBe(true);
  });

  it("returns false for plain objects", () => {
    expect(isRichContent({ name: "test" })).toBe(false);
    expect(isRichContent({ type: "custom", data: {} })).toBe(false);
  });

  it("returns false for primitives and arrays", () => {
    expect(isRichContent("string")).toBe(false);
    expect(isRichContent(42)).toBe(false);
    expect(isRichContent([])).toBe(false);
    expect(isRichContent(null)).toBe(false);
  });
});

describe("deepEqual", () => {
  it("compares primitives", () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual("a", "a")).toBe(true);
    expect(deepEqual("a", "b")).toBe(false);
    expect(deepEqual(true, true)).toBe(true);
    expect(deepEqual(true, false)).toBe(false);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
  });

  it("compares arrays", () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([1, 2, 3], [1, 2])).toBe(false);
    expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    expect(deepEqual([], [])).toBe(true);
  });

  it("compares objects", () => {
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqual({}, {})).toBe(true);
  });

  it("compares nested structures", () => {
    expect(deepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 2] } })).toBe(true);
    expect(deepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 3] } })).toBe(false);
  });
});

describe("removeCommonFields", () => {
  it("removes fields that are identical across all items", () => {
    const input: InputValue[] = [
      { name: "Alice", org: "ACME" },
      { name: "Bob", org: "ACME" },
      { name: "Charlie", org: "ACME" },
    ];
    const result = removeCommonFields(input);
    expect(result).toEqual([
      { name: "Alice" },
      { name: "Bob" },
      { name: "Charlie" },
    ]);
  });

  it("preserves all fields when none are common", () => {
    const input: InputValue[] = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ];
    const result = removeCommonFields(input);
    expect(result).toEqual(input);
  });

  it("returns primitives unchanged", () => {
    const input: InputValue[] = ["hello", "world"];
    const result = removeCommonFields(input);
    expect(result).toEqual(input);
  });

  it("handles empty array", () => {
    const result = removeCommonFields([]);
    expect(result).toEqual([]);
  });

  it("handles nested objects with common fields", () => {
    const input: InputValue[] = [
      { id: 1, config: { type: "A", enabled: true } },
      { id: 2, config: { type: "B", enabled: true } },
    ];
    const result = removeCommonFields(input);
    // config objects are different overall, so no fields are common
    expect(result).toEqual(input);
  });

  it("removes multiple common fields", () => {
    const input: InputValue[] = [
      { category: "food", rating: 5, version: 1 },
      { category: "food", rating: 3, version: 1 },
    ];
    const result = removeCommonFields(input);
    expect(result).toEqual([
      { rating: 5 },
      { rating: 3 },
    ]);
  });

  it("preserves all fields if removing them would result in empty objects", () => {
    const input: InputValue[] = [
      { same: "value" },
      { same: "value" },
    ];
    const result = removeCommonFields(input);
    expect(result).toEqual(input);
  });

  it("handles mixed value types that are technically equal", () => {
    const input: InputValue[] = [
      { enabled: true, count: 5 },
      { enabled: true, count: 10 },
    ];
    const result = removeCommonFields(input);
    expect(result).toEqual([
      { count: 5 },
      { count: 10 },
    ]);
  });

  it("handles arrays in fields (deep equality)", () => {
    const input: InputValue[] = [
      { tags: ["a", "b"], name: "one" },
      { tags: ["a", "b"], name: "two" },
    ];
    const result = removeCommonFields(input);
    expect(result).toEqual([
      { name: "one" },
      { name: "two" },
    ]);
  });
});

describe("flattenSingleField", () => {
  it("flattens objects with single field to just values", () => {
    const input: InputValue[] = [
      { text: "hello" },
      { text: "world" },
    ];
    const result = flattenSingleField(input);
    expect(result).toEqual(["hello", "world"]);
  });

  it("returns multi-field objects unchanged", () => {
    const input: InputValue[] = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ];
    const result = flattenSingleField(input);
    expect(result).toEqual(input);
  });

  it("returns primitives unchanged", () => {
    const input: InputValue[] = [1, 2, 3];
    const result = flattenSingleField(input);
    expect(result).toEqual(input);
  });

  it("handles objects with different single keys", () => {
    const input: InputValue[] = [
      { a: 1 },
      { b: 2 },
    ];
    const result = flattenSingleField(input);
    // Keys differ, so don't flatten
    expect(result).toEqual(input);
  });

  it("handles empty array", () => {
    const result = flattenSingleField([]);
    expect(result).toEqual([]);
  });

  it("flattens nested values correctly", () => {
    const input: InputValue[] = [
      { item: { name: "A", price: 100 } },
      { item: { name: "B", price: 200 } },
    ];
    const result = flattenSingleField(input);
    expect(result).toEqual([
      { name: "A", price: 100 },
      { name: "B", price: 200 },
    ]);
  });
});

describe("simplifySplitItems", () => {
  it("combines removal and flattening", () => {
    const input: InputValue[] = [
      { text: "hello", version: 1 },
      { text: "world", version: 1 },
    ];
    const result = simplifySplitItems(input);
    // First removes "version" (common), then flattens "text"
    expect(result).toEqual(["hello", "world"]);
  });

  it("handles complex ranking scenarios", () => {
    const input: InputValue[] = [
      { item: { name: "Product A", price: 100 }, category: "electronics" },
      { item: { name: "Product B", price: 200 }, category: "electronics" },
    ];
    const result = simplifySplitItems(input);
    // Removes category (common), item has multiple fields so flattens to item value
    expect(result).toEqual([
      { name: "Product A", price: 100 },
      { name: "Product B", price: 200 },
    ]);
  });

  it("handles empty array", () => {
    const result = simplifySplitItems([]);
    expect(result).toEqual([]);
  });

  it("handles already-simple string arrays", () => {
    const input: InputValue[] = ["Option A", "Option B", "Option C"];
    const result = simplifySplitItems(input);
    expect(result).toEqual(input);
  });

  it("handles rich content items unchanged", () => {
    const input: InputValue[] = [
      { type: "image_url", image_url: { url: "data:image/png;base64,abc" } },
      { type: "image_url", image_url: { url: "data:image/png;base64,def" } },
    ];
    const result = simplifySplitItems(input);
    // Rich content is not a plain object, so returned unchanged
    expect(result).toEqual(input);
  });
});

describe("toDisplayItem", () => {
  it("handles null", () => {
    const result = toDisplayItem(null);
    expect(result).toEqual({ type: "string", value: "null" });
  });

  it("handles string primitives", () => {
    const result = toDisplayItem("hello");
    expect(result).toEqual({ type: "string", value: "hello" });
  });

  it("handles number primitives", () => {
    const result = toDisplayItem(42);
    expect(result).toEqual({ type: "number", value: 42 });
  });

  it("handles boolean primitives", () => {
    expect(toDisplayItem(true)).toEqual({ type: "boolean", value: true });
    expect(toDisplayItem(false)).toEqual({ type: "boolean", value: false });
  });

  it("handles image_url rich content", () => {
    const input: InputValue = {
      type: "image_url",
      image_url: { url: "https://example.com/image.png", detail: "high" },
    };
    const result = toDisplayItem(input);
    expect(result).toEqual({
      type: "image",
      url: "https://example.com/image.png",
      detail: "high",
    });
  });

  it("handles input_audio rich content", () => {
    const input: InputValue = {
      type: "input_audio",
      input_audio: { data: "base64data", format: "mp3" },
    };
    const result = toDisplayItem(input);
    expect(result).toEqual({
      type: "audio",
      data: "base64data",
      format: "mp3",
    });
  });

  it("handles video_url rich content", () => {
    const input: InputValue = {
      type: "video_url",
      video_url: { url: "https://example.com/video.mp4" },
    };
    const result = toDisplayItem(input);
    expect(result).toEqual({
      type: "video",
      url: "https://example.com/video.mp4",
    });
  });

  it("handles input_video rich content", () => {
    const input: InputValue = {
      type: "input_video",
      video_url: { url: "data:video/mp4;base64,abc" },
    };
    const result = toDisplayItem(input);
    expect(result).toEqual({
      type: "video",
      url: "data:video/mp4;base64,abc",
    });
  });

  it("handles file rich content", () => {
    const input: InputValue = {
      type: "file",
      file: { filename: "document.pdf", file_data: "base64data" },
    };
    const result = toDisplayItem(input);
    expect(result).toEqual({
      type: "file",
      filename: "document.pdf",
      data: "base64data",
      url: undefined,
    });
  });

  it("handles file with url", () => {
    const input: InputValue = {
      type: "file",
      file: { filename: "doc.pdf", file_url: "https://example.com/doc.pdf" },
    };
    const result = toDisplayItem(input);
    expect(result).toEqual({
      type: "file",
      filename: "doc.pdf",
      data: undefined,
      url: "https://example.com/doc.pdf",
    });
  });

  it("handles generic objects", () => {
    const input: InputValue = { name: "Test", value: 123 };
    const result = toDisplayItem(input);
    expect(result).toEqual({
      type: "object",
      value: { name: "Test", value: 123 },
    });
  });

  it("handles arrays", () => {
    const input: InputValue = [1, 2, 3];
    const result = toDisplayItem(input);
    expect(result).toEqual({
      type: "array",
      value: [1, 2, 3],
    });
  });

  it("handles arrays with single rich content part (unwraps)", () => {
    const input: InputValue = [
      { type: "image_url", image_url: { url: "data:image/png;base64,abc" } },
    ];
    const result = toDisplayItem(input);
    expect(result).toEqual({
      type: "image",
      url: "data:image/png;base64,abc",
      detail: undefined,
    });
  });
});

describe("getDisplayMode", () => {
  it("returns simple for string arrays", () => {
    expect(getDisplayMode(["a", "b", "c"])).toBe("simple");
  });

  it("returns simple for number arrays", () => {
    expect(getDisplayMode([1, 2, 3])).toBe("simple");
  });

  it("returns simple for boolean arrays", () => {
    expect(getDisplayMode([true, false, true])).toBe("simple");
  });

  it("returns media for image arrays", () => {
    const items: InputValue[] = [
      { type: "image_url", image_url: { url: "..." } },
      { type: "image_url", image_url: { url: "..." } },
    ];
    expect(getDisplayMode(items)).toBe("media");
  });

  it("returns media for mixed media types", () => {
    const items: InputValue[] = [
      { type: "image_url", image_url: { url: "..." } },
      { type: "file", file: { filename: "doc.pdf" } },
    ];
    expect(getDisplayMode(items)).toBe("media");
  });

  it("returns mixed for strings and numbers", () => {
    const items: InputValue[] = ["hello", 42];
    expect(getDisplayMode(items)).toBe("mixed");
  });

  it("returns complex for object arrays", () => {
    const items: InputValue[] = [
      { name: "A", price: 100 },
      { name: "B", price: 200 },
    ];
    expect(getDisplayMode(items)).toBe("complex");
  });

  it("returns simple for empty array", () => {
    expect(getDisplayMode([])).toBe("simple");
  });
});

// Integration tests with realistic function input scenarios
describe("realistic scenarios", () => {
  it("handles text-based ranking (is-spam style)", () => {
    // A spam detection function might split text messages for ranking
    const splitItems: InputValue[] = [
      { text: "Buy now! Limited offer!", metadata: { source: "email" } },
      { text: "Meeting at 3pm tomorrow", metadata: { source: "email" } },
      { text: "You won $1,000,000!", metadata: { source: "email" } },
    ];

    const simplified = simplifySplitItems(splitItems);
    // Removes common metadata
    expect(simplified).toEqual([
      "Buy now! Limited offer!",
      "Meeting at 3pm tomorrow",
      "You won $1,000,000!",
    ]);

    const displays = simplified.map(toDisplayItem);
    expect(displays.every((d) => d.type === "string")).toBe(true);
  });

  it("handles image ranking", () => {
    const splitItems: InputValue[] = [
      {
        type: "image_url",
        image_url: { url: "data:image/png;base64,abc", detail: "auto" },
      },
      {
        type: "image_url",
        image_url: { url: "data:image/png;base64,def", detail: "auto" },
      },
    ];

    const simplified = simplifySplitItems(splitItems);
    // Rich content items pass through unchanged
    const display = simplified.map(toDisplayItem);
    expect(display[0].type).toBe("image");
    expect(display[1].type).toBe("image");
  });

  it("handles product ranking with mixed fields", () => {
    const splitItems: InputValue[] = [
      { name: "iPhone 15", price: 999, category: "phones", inStock: true },
      { name: "Galaxy S24", price: 899, category: "phones", inStock: true },
      { name: "Pixel 8", price: 699, category: "phones", inStock: true },
    ];

    const simplified = simplifySplitItems(splitItems);
    // Removes category and inStock (both common)
    expect(simplified).toEqual([
      { name: "iPhone 15", price: 999 },
      { name: "Galaxy S24", price: 899 },
      { name: "Pixel 8", price: 699 },
    ]);

    expect(getDisplayMode(simplified)).toBe("complex");
  });

  it("handles candidate ranking with common metadata", () => {
    const splitItems: InputValue[] = [
      { candidate: "Alice", score: 0.9, job: "Engineer", round: 1 },
      { candidate: "Bob", score: 0.8, job: "Engineer", round: 1 },
      { candidate: "Charlie", score: 0.7, job: "Engineer", round: 1 },
    ];

    const simplified = simplifySplitItems(splitItems);
    // Removes job and round (common)
    expect(simplified).toEqual([
      { candidate: "Alice", score: 0.9 },
      { candidate: "Bob", score: 0.8 },
      { candidate: "Charlie", score: 0.7 },
    ]);
  });

  it("handles wrapped text items (single-field flattening)", () => {
    const splitItems: InputValue[] = [
      { response: "I agree with the proposal", metadata: { id: 1 } },
      { response: "I disagree with the proposal", metadata: { id: 2 } },
    ];

    // Different metadata, so only response gets simplified
    // But wait - metadata.id is different, so no fields are common!
    const simplified = simplifySplitItems(splitItems);
    // No common fields, no flattening possible
    expect(simplified).toEqual(splitItems);
  });

  it("handles wrapped text items with common metadata", () => {
    const splitItems: InputValue[] = [
      { response: "Yes", prompt: "Do you agree?", version: 1 },
      { response: "No", prompt: "Do you agree?", version: 1 },
      { response: "Maybe", prompt: "Do you agree?", version: 1 },
    ];

    const simplified = simplifySplitItems(splitItems);
    // Removes prompt and version (common), flattens response
    expect(simplified).toEqual(["Yes", "No", "Maybe"]);
  });
});
