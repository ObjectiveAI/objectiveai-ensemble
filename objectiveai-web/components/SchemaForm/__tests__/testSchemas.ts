/**
 * Test fixtures for SchemaForm tests.
 *
 * Provides a variety of schemas for testing different scenarios.
 */

import type { InputSchema } from "../types";

// ============================================================================
// Simple Schemas
// ============================================================================

export const simpleStringSchema: InputSchema = {
  type: "string",
  description: "A simple text field",
};

export const stringEnumSchema: InputSchema = {
  type: "string",
  enum: ["option1", "option2", "option3"],
};

export const numberWithConstraintsSchema: InputSchema = {
  type: "number",
  minimum: 0,
  maximum: 100,
  description: "A percentage value",
};

export const integerSchema: InputSchema = {
  type: "integer",
  minimum: 1,
  maximum: 10,
};

export const booleanSchema: InputSchema = {
  type: "boolean",
  description: "Enable feature",
};

// ============================================================================
// Object Schemas
// ============================================================================

export const simpleObjectSchema: InputSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "integer", minimum: 0 },
    active: { type: "boolean" },
  },
  required: ["name"],
};

export const nestedObjectSchema: InputSchema = {
  type: "object",
  properties: {
    user: {
      type: "object",
      properties: {
        profile: {
          type: "object",
          properties: {
            name: { type: "string" },
            bio: { type: "string" },
          },
          required: ["name"],
        },
      },
    },
  },
};

export const objectWithAllTypesSchema: InputSchema = {
  type: "object",
  properties: {
    text: { type: "string" },
    count: { type: "integer" },
    score: { type: "number" },
    enabled: { type: "boolean" },
    avatar: { type: "image" },
    voiceMemo: { type: "audio" },
    clip: { type: "video" },
    document: { type: "file" },
  },
  required: ["text"],
};

// ============================================================================
// Array Schemas
// ============================================================================

export const simpleArraySchema: InputSchema = {
  type: "array",
  items: { type: "string" },
  minItems: 1,
  maxItems: 5,
};

export const arrayOfObjectsSchema: InputSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      title: { type: "string" },
      completed: { type: "boolean" },
    },
    required: ["title"],
  },
};

export const nestedArraySchema: InputSchema = {
  type: "array",
  items: {
    type: "array",
    items: { type: "string" },
  },
};

// Deep nesting: list of list of list of images
export const tripleNestedImageArraySchema: InputSchema = {
  type: "array",
  items: {
    type: "array",
    items: {
      type: "array",
      items: { type: "image" },
    },
  },
};

// ============================================================================
// Media Schemas
// ============================================================================

export const imageSchema: InputSchema = {
  type: "image",
  description: "Upload a profile picture",
};

export const audioSchema: InputSchema = {
  type: "audio",
  description: "Record or upload audio",
};

export const videoSchema: InputSchema = {
  type: "video",
  description: "Upload a video file",
};

export const fileSchema: InputSchema = {
  type: "file",
  description: "Attach any document",
};

// ============================================================================
// AnyOf (Union) Schemas
// ============================================================================

export const stringOrNumberSchema: InputSchema = {
  anyOf: [{ type: "string" }, { type: "number" }],
};

export const textOrImageSchema: InputSchema = {
  anyOf: [
    { type: "string", description: "Text content" },
    { type: "image", description: "Image content" },
  ],
};

export const complexAnyOfSchema: InputSchema = {
  anyOf: [
    {
      type: "object",
      description: "Text message",
      properties: {
        type: { type: "string", enum: ["text"] },
        content: { type: "string" },
      },
      required: ["type", "content"],
    },
    {
      type: "object",
      description: "Image message",
      properties: {
        type: { type: "string", enum: ["image"] },
        image: { type: "image" },
      },
      required: ["type", "image"],
    },
  ],
};

// ============================================================================
// Complex Real-World Schemas
// ============================================================================

// Mimics ObjectiveAI function inputs
export const complexFunctionInputSchema: InputSchema = {
  type: "object",
  properties: {
    prompt: { type: "string", description: "The evaluation prompt" },
    contentItems: {
      type: "array",
      description: "Items to evaluate",
      items: {
        anyOf: [{ type: "string" }, { type: "image" }, { type: "file" }],
      },
      minItems: 2,
    },
    options: {
      type: "object",
      properties: {
        strict: { type: "boolean" },
        threshold: { type: "number", minimum: 0, maximum: 1 },
        categories: {
          type: "array",
          items: {
            type: "string",
            enum: ["quality", "relevance", "safety"],
          },
        },
      },
    },
  },
  required: ["prompt", "contentItems"],
};

// E-commerce product schema
export const productSchema: InputSchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Product name" },
    description: { type: "string", description: "Product description" },
    price: { type: "number", minimum: 0, description: "Price in USD" },
    quantity: { type: "integer", minimum: 0, description: "Stock quantity" },
    inStock: { type: "boolean" },
    images: {
      type: "array",
      items: { type: "image" },
      minItems: 1,
      maxItems: 10,
    },
    categories: {
      type: "array",
      items: {
        type: "string",
        enum: ["electronics", "clothing", "home", "toys", "other"],
      },
    },
  },
  required: ["name", "price", "inStock"],
};

// Survey form schema
export const surveySchema: InputSchema = {
  type: "object",
  properties: {
    respondent: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        age: { type: "integer", minimum: 18, maximum: 120 },
      },
      required: ["name", "email"],
    },
    responses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          questionId: { type: "integer" },
          answer: {
            anyOf: [
              { type: "string", description: "Text answer" },
              { type: "integer", description: "Rating (1-5)" },
              { type: "boolean", description: "Yes/No" },
            ],
          },
        },
        required: ["questionId", "answer"],
      },
      minItems: 1,
    },
    attachments: {
      type: "array",
      items: { type: "file" },
      maxItems: 5,
    },
  },
  required: ["respondent", "responses"],
};
