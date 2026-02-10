/**
 * Fixture schemas for testing rich media inputs
 * Based on ObjectiveAI InputSchema format
 */

import type { InputSchema } from "../../types";

/**
 * Single media field schemas
 */
export const imageSchema: InputSchema = {
  type: "image",
  description: "Upload a product photo",
};

export const audioSchema: InputSchema = {
  type: "audio",
  description: "Upload an audio file",
};

export const videoSchema: InputSchema = {
  type: "video",
  description: "Upload a video file",
};

export const fileSchema: InputSchema = {
  type: "file",
  description: "Upload a document",
};

/**
 * Object schema with multiple media fields
 */
export const multiMediaObjectSchema: InputSchema = {
  type: "object",
  properties: {
    image: {
      type: "image",
      description: "Product image",
    },
    audio: {
      type: "audio",
      description: "Audio description",
    },
    video: {
      type: "video",
      description: "Demo video",
    },
    document: {
      type: "file",
      description: "Additional documentation",
    },
    description: {
      type: "string",
      description: "Text description",
    },
  },
  required: ["image", "description"],
};

/**
 * Object schema with only required media
 */
export const requiredImageSchema: InputSchema = {
  type: "object",
  properties: {
    photo: {
      type: "image",
      description: "Required photo",
    },
    caption: {
      type: "string",
      description: "Optional caption",
    },
  },
  required: ["photo"],
};

/**
 * Array of images schema
 */
export const imageArraySchema: InputSchema = {
  type: "array",
  items: {
    type: "image",
    description: "Gallery image",
  },
  minItems: 1,
  maxItems: 5,
  description: "Product gallery (1-5 images)",
};

/**
 * Array of files schema
 */
export const fileArraySchema: InputSchema = {
  type: "array",
  items: {
    type: "file",
    description: "Supporting document",
  },
  minItems: 0,
  maxItems: 3,
  description: "Upload up to 3 documents",
};

/**
 * Nested schema with media in object arrays
 */
export const nestedMediaSchema: InputSchema = {
  type: "object",
  properties: {
    product: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Product name",
        },
        images: {
          type: "array",
          items: {
            type: "image",
          },
          minItems: 1,
          maxItems: 3,
        },
        specs: {
          type: "file",
          description: "Technical specifications PDF",
        },
      },
      required: ["name", "images"],
    },
  },
  required: ["product"],
};

/**
 * Schema with mixed media and primitives
 */
export const mixedSchema: InputSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Title",
    },
    thumbnail: {
      type: "image",
      description: "Thumbnail image",
    },
    priority: {
      type: "integer",
      description: "Priority (1-10)",
      minimum: 1,
      maximum: 10,
    },
    published: {
      type: "boolean",
      description: "Is published?",
    },
    attachments: {
      type: "array",
      items: {
        type: "file",
      },
      maxItems: 2,
    },
  },
  required: ["title", "thumbnail"],
};

/**
 * Schema with optional media fields
 */
export const optionalMediaSchema: InputSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "Name",
    },
    avatar: {
      type: "image",
      description: "Optional avatar",
    },
    voiceNote: {
      type: "audio",
      description: "Optional voice note",
    },
  },
  required: ["name"],
};

/**
 * Schema for testing AnyOf with media
 */
export const anyOfMediaSchema: InputSchema = {
  anyOf: [
    {
      type: "object",
      properties: {
        type: { const: "image" },
        content: { type: "image" },
      },
      required: ["type", "content"],
    },
    {
      type: "object",
      properties: {
        type: { const: "text" },
        content: { type: "string" },
      },
      required: ["type", "content"],
    },
  ],
};

/**
 * Schema with deeply nested media
 */
export const deeplyNestedMediaSchema: InputSchema = {
  type: "object",
  properties: {
    level1: {
      type: "object",
      properties: {
        level2: {
          type: "object",
          properties: {
            level3: {
              type: "object",
              properties: {
                deepImage: {
                  type: "image",
                  description: "Deeply nested image",
                },
              },
            },
          },
        },
      },
    },
  },
};

/**
 * Real-world example: Product listing schema
 */
export const productListingSchema: InputSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Product title",
    },
    description: {
      type: "string",
      description: "Product description",
    },
    price: {
      type: "number",
      description: "Price in USD",
      minimum: 0,
    },
    mainImage: {
      type: "image",
      description: "Main product image",
    },
    gallery: {
      type: "array",
      items: {
        type: "image",
      },
      minItems: 0,
      maxItems: 4,
      description: "Additional images",
    },
    video: {
      type: "video",
      description: "Product demo video (optional)",
    },
    manual: {
      type: "file",
      description: "User manual PDF (optional)",
    },
  },
  required: ["title", "description", "price", "mainImage"],
};

/**
 * Real-world example: Job application schema
 */
export const jobApplicationSchema: InputSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "Full name",
    },
    email: {
      type: "string",
      description: "Email address",
    },
    resume: {
      type: "file",
      description: "Resume (PDF)",
    },
    coverLetter: {
      type: "file",
      description: "Cover letter (optional)",
    },
    photo: {
      type: "image",
      description: "Headshot (optional)",
    },
    portfolio: {
      type: "array",
      items: {
        type: "file",
      },
      maxItems: 3,
      description: "Portfolio samples (max 3)",
    },
  },
  required: ["name", "email", "resume"],
};
