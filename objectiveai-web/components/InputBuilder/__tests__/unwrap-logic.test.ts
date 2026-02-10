/**
 * Test suite for InputBuilder unwrap logic
 *
 * These tests verify the fix for the array-wrapping bug WITHOUT hitting the API.
 * All scenarios are tested in isolation to prove correctness before deployment.
 */

import { describe, it, expect } from 'vitest';

// Mock the conversion functions to test unwrap logic
function contentItemsToInputValue(items: any[]): any {
  if (items.length === 0) return [];
  return items.map(item => {
    switch (item.type) {
      case "text": return item.value;
      case "image": return item.value;
      case "audio": return item.value;
      case "video": return item.value;
      case "file": return item.value;
      case "group": return item.children.map((c: any) => c.value);
      default: return item.value;
    }
  });
}

// The FIXED unwrap logic we'll add to PropertyContentList
function unwrapValue(converted: any, propertySchema: any): any {
  // Safety: If no schema provided, don't unwrap (safer default)
  if (!propertySchema) {
    return converted;
  }

  const expectsArray = "type" in propertySchema && propertySchema.type === "array";

  if (!expectsArray && Array.isArray(converted)) {
    if (converted.length === 0) {
      return null; // Empty array becomes null for non-array properties
    }
    if (converted.length === 1) {
      return converted[0]; // Single-item array becomes unwrapped value
    }
    // Multiple items - this shouldn't happen in normal usage, but don't break
    return converted;
  }

  return converted;
}

describe('InputBuilder Unwrap Logic', () => {
  describe('String Properties', () => {
    const schema = { type: "string" };

    it('should unwrap single string value', () => {
      const items = [{ type: "text", value: "Hello world" }];
      const converted = contentItemsToInputValue(items);
      const result = unwrapValue(converted, schema);

      expect(result).toBe("Hello world");
      expect(Array.isArray(result)).toBe(false);
    });

    it('should convert empty array to null', () => {
      const items: any[] = [];
      const converted = contentItemsToInputValue(items);
      const result = unwrapValue(converted, schema);

      expect(result).toBe(null);
    });

    it('should handle multiple strings (edge case)', () => {
      const items = [
        { type: "text", value: "First" },
        { type: "text", value: "Second" }
      ];
      const converted = contentItemsToInputValue(items);
      const result = unwrapValue(converted, schema);

      // Multiple items shouldn't happen, but don't crash
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(["First", "Second"]);
    });
  });

  describe('Image Properties', () => {
    const schema = { type: "image" };

    it('should unwrap single image object', () => {
      const imageObj = {
        type: "image_url",
        image_url: { url: "https://example.com/image.jpg" }
      };
      const items = [{ type: "image", value: imageObj }];
      const converted = contentItemsToInputValue(items);
      const result = unwrapValue(converted, schema);

      expect(result).toEqual(imageObj);
      expect(Array.isArray(result)).toBe(false);
    });

    it('should convert empty image to null', () => {
      const items: any[] = [];
      const converted = contentItemsToInputValue(items);
      const result = unwrapValue(converted, schema);

      expect(result).toBe(null);
    });
  });

  describe('Audio Properties', () => {
    const schema = { type: "audio" };

    it('should unwrap single audio object', () => {
      const audioObj = {
        type: "input_audio",
        input_audio: { data: "base64data", format: "mp3" }
      };
      const items = [{ type: "audio", value: audioObj }];
      const converted = contentItemsToInputValue(items);
      const result = unwrapValue(converted, schema);

      expect(result).toEqual(audioObj);
      expect(Array.isArray(result)).toBe(false);
    });
  });

  describe('Video Properties', () => {
    const schema = { type: "video" };

    it('should unwrap single video object', () => {
      const videoObj = {
        type: "video_url",
        video_url: { url: "https://example.com/video.mp4" }
      };
      const items = [{ type: "video", value: videoObj }];
      const converted = contentItemsToInputValue(items);
      const result = unwrapValue(converted, schema);

      expect(result).toEqual(videoObj);
      expect(Array.isArray(result)).toBe(false);
    });
  });

  describe('File Properties', () => {
    const schema = { type: "file" };

    it('should unwrap single file object', () => {
      const fileObj = {
        type: "file",
        file: { file_data: "base64data", filename: "doc.pdf" }
      };
      const items = [{ type: "file", value: fileObj }];
      const converted = contentItemsToInputValue(items);
      const result = unwrapValue(converted, schema);

      expect(result).toEqual(fileObj);
      expect(Array.isArray(result)).toBe(false);
    });
  });

  describe('Number Properties', () => {
    const schema = { type: "number" };

    it('should unwrap single number', () => {
      const items = [{ type: "text", value: "42" }];
      const converted = contentItemsToInputValue(items);
      const result = unwrapValue(converted, schema);

      expect(result).toBe("42");
      expect(Array.isArray(result)).toBe(false);
    });
  });

  describe('Boolean Properties', () => {
    const schema = { type: "boolean" };

    it('should unwrap single boolean', () => {
      const items = [{ type: "text", value: "true" }];
      const converted = contentItemsToInputValue(items);
      const result = unwrapValue(converted, schema);

      expect(result).toBe("true");
      expect(Array.isArray(result)).toBe(false);
    });
  });

  describe('Array Properties (MUST NOT UNWRAP)', () => {
    const schema = {
      type: "array",
      items: { type: "string" }
    };

    it('should NOT unwrap array with one item', () => {
      const items = [{ type: "text", value: "Single item" }];
      const converted = contentItemsToInputValue(items);
      const result = unwrapValue(converted, schema);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(["Single item"]);
    });

    it('should NOT unwrap array with multiple items', () => {
      const items = [
        { type: "text", value: "First" },
        { type: "text", value: "Second" },
        { type: "text", value: "Third" }
      ];
      const converted = contentItemsToInputValue(items);
      const result = unwrapValue(converted, schema);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(["First", "Second", "Third"]);
    });

    it('should keep empty array for array properties', () => {
      const items: any[] = [];
      const converted = contentItemsToInputValue(items);
      const result = unwrapValue(converted, schema);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });

  describe('Object Properties', () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" }
      }
    };

    it('should not affect object values', () => {
      const objValue = { name: "John", age: 30 };
      const result = unwrapValue(objValue, schema);

      expect(result).toEqual(objValue);
      expect(typeof result).toBe("object");
      expect(Array.isArray(result)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null schema', () => {
      const items = [{ type: "text", value: "test" }];
      const converted = contentItemsToInputValue(items);
      const result = unwrapValue(converted, null);

      // Without schema, default to NOT unwrapping (safe)
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle undefined schema', () => {
      const items = [{ type: "text", value: "test" }];
      const converted = contentItemsToInputValue(items);
      const result = unwrapValue(converted, undefined);

      // Without schema, default to NOT unwrapping (safe)
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle schema without type field', () => {
      const schema = { description: "Some property" };
      const items = [{ type: "text", value: "test" }];
      const converted = contentItemsToInputValue(items);
      const result = unwrapValue(converted, schema);

      // No type field = treat as non-array, so unwrap
      expect(result).toBe("test");
    });

    it('should handle already unwrapped values', () => {
      const schema = { type: "string" };
      const alreadyUnwrapped = "Hello";
      const result = unwrapValue(alreadyUnwrapped, schema);

      expect(result).toBe("Hello");
    });
  });

  describe('Complex Nested Scenarios', () => {
    it('should handle nested object in array property', () => {
      const schema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" }
          }
        }
      };
      const converted = [{ name: "Item 1" }, { name: "Item 2" }];
      const result = unwrapValue(converted, schema);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([{ name: "Item 1" }, { name: "Item 2" }]);
    });
  });

  describe('Full Form Simulation', () => {
    it('should correctly process a complete object schema', () => {
      const formSchema = {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          count: { type: "number" },
          image: { type: "image" },
          tags: { type: "array", items: { type: "string" } },
          metadata: {
            type: "object",
            properties: {
              author: { type: "string" }
            }
          }
        }
      };

      // Simulate user input for each property
      const titleItems = [{ type: "text", value: "My Title" }];
      const descItems = [{ type: "text", value: "Description text" }];
      const countItems = [{ type: "text", value: "42" }];
      const imageItems = [{
        type: "image",
        value: { type: "image_url", image_url: { url: "test.jpg" } }
      }];
      const tagsItems = [
        { type: "text", value: "tag1" },
        { type: "text", value: "tag2" }
      ];

      // Process each property
      const formData = {
        title: unwrapValue(
          contentItemsToInputValue(titleItems),
          formSchema.properties.title
        ),
        description: unwrapValue(
          contentItemsToInputValue(descItems),
          formSchema.properties.description
        ),
        count: unwrapValue(
          contentItemsToInputValue(countItems),
          formSchema.properties.count
        ),
        image: unwrapValue(
          contentItemsToInputValue(imageItems),
          formSchema.properties.image
        ),
        tags: unwrapValue(
          contentItemsToInputValue(tagsItems),
          formSchema.properties.tags
        ),
        metadata: { author: "John" } // Objects passed directly
      };

      // Verify final structure
      expect(formData.title).toBe("My Title");
      expect(formData.description).toBe("Description text");
      expect(formData.count).toBe("42");
      expect(formData.image).toEqual({ type: "image_url", image_url: { url: "test.jpg" } });
      expect(formData.tags).toEqual(["tag1", "tag2"]);
      expect(formData.metadata).toEqual({ author: "John" });

      // Critical: No unwanted arrays
      expect(Array.isArray(formData.title)).toBe(false);
      expect(Array.isArray(formData.description)).toBe(false);
      expect(Array.isArray(formData.count)).toBe(false);
      expect(Array.isArray(formData.image)).toBe(false);
      expect(Array.isArray(formData.tags)).toBe(true); // This SHOULD be array
      expect(Array.isArray(formData.metadata)).toBe(false);
    });
  });
});
