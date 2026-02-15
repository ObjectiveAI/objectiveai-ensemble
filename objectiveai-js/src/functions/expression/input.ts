import {
  AudioRichContentPart,
  AudioRichContentPartSchema,
  FileRichContentPart,
  FileRichContentPartSchema,
  ImageRichContentPart,
  ImageRichContentPartSchema,
  VideoRichContentPart,
  VideoRichContentPartSchema,
} from "src/chat/completions/request/message";
import z from "zod";
import { Expression, ExpressionSchema } from "./expression";

// Input Schema

export interface ObjectInputSchema {
  type: "object";
  description?: string | null;
  properties: Record<string, InputSchema>;
  required?: string[] | null;
}
export const ObjectInputSchemaSchema: z.ZodType<ObjectInputSchema> = z
  .object({
    type: z.literal("object"),
    description: z
      .string()
      .optional()
      .nullable()
      .describe("The description of the object input."),
    properties: z
      .record(
        z.string(),
        z
          .lazy(() => InputSchemaSchema)
          .meta({
            title: "InputSchema",
            recursive: true,
          }),
      )
      .describe("The properties of the object input."),
    required: z
      .array(z.string())
      .optional()
      .nullable()
      .describe("The required properties of the object input."),
  })
  .describe("An object input schema.")
  .meta({ title: "ObjectInputSchema" });
export type ObjectInputSchemaToZodSchema = z.ZodObject<
  Record<string, z.ZodOptional<z.ZodType<InputValue>> | z.ZodType<InputValue>>
>;

export namespace ObjectInputSchemaExt {
  export function toZodSchema(
    self: ObjectInputSchema,
  ): ObjectInputSchemaToZodSchema {
    const propertySchemas: Record<
      string,
      z.ZodOptional<z.ZodType<InputValue>> | z.ZodType<InputValue>
    > = {};
    const requiredSet = new Set(self.required ?? []);
    for (const key in self.properties) {
      const inner = InputSchemaExt.toZodSchema(self.properties[key]);
      propertySchemas[key] =
        self.required && requiredSet.has(key) ? inner : inner.optional();
    }
    let schema = z.object(propertySchemas);
    if (self.description) {
      schema = schema.describe(self.description);
    }
    return schema;
  }
}

export interface ArrayInputSchema {
  type: "array";
  description?: string | null;
  minItems?: number | null;
  maxItems?: number | null;
  items: InputSchema;
}
export const ArrayInputSchemaSchema: z.ZodType<ArrayInputSchema> = z
  .object({
    type: z.literal("array"),
    description: z
      .string()
      .optional()
      .nullable()
      .describe("The description of the array input."),
    minItems: z
      .uint32()
      .optional()
      .nullable()
      .describe("The minimum number of items in the array input."),
    maxItems: z
      .uint32()
      .optional()
      .nullable()
      .describe("The maximum number of items in the array input."),
    items: z
      .lazy(() => InputSchemaSchema)
      .meta({
        title: "InputSchema",
        recursive: true,
      }),
  })
  .describe("An array input schema.")
  .meta({ title: "ArrayInputSchema" });
export type ArrayInputSchemaToZodSchema = z.ZodArray<z.ZodType<InputValue>>;

export namespace ArrayInputSchemaExt {
  export function toZodSchema(
    self: ArrayInputSchema,
  ): ArrayInputSchemaToZodSchema {
    let schema = z.array(InputSchemaExt.toZodSchema(self.items));
    if (self.description) {
      schema = schema.describe(self.description);
    }
    if (self.minItems !== undefined && self.minItems !== null) {
      schema = schema.min(self.minItems);
    }
    if (self.maxItems !== undefined && self.maxItems !== null) {
      schema = schema.max(self.maxItems);
    }
    return schema;
  }
}

export const StringInputSchemaSchema = z
  .object({
    type: z.literal("string"),
    description: z
      .string()
      .optional()
      .nullable()
      .describe("The description of the string input."),
    enum: z
      .array(z.string())
      .optional()
      .nullable()
      .describe("The enumeration of allowed string values."),
  })
  .describe("A string input schema.")
  .meta({ title: "StringInputSchema" });
export type StringInputSchema = z.infer<typeof StringInputSchemaSchema>;
export type StringInputSchemaToZodSchema =
  | z.ZodString
  | z.ZodEnum<{
      [x: string]: string;
    }>;

export namespace StringInputSchemaExt {
  export function toZodSchema(
    self: StringInputSchema,
  ): StringInputSchemaToZodSchema {
    let schema = self.enum ? z.enum(self.enum) : z.string();
    if (self.description) {
      schema = schema.describe(self.description);
    }
    return schema;
  }
}

export const NumberInputSchemaSchema = z
  .object({
    type: z.literal("number"),
    description: z
      .string()
      .optional()
      .nullable()
      .describe("The description of the number input."),
    minimum: z
      .number()
      .optional()
      .nullable()
      .describe("The minimum allowed value for the number input."),
    maximum: z
      .number()
      .optional()
      .nullable()
      .describe("The maximum allowed value for the number input."),
  })
  .describe("A number input schema.")
  .meta({ title: "NumberInputSchema" });
export type NumberInputSchema = z.infer<typeof NumberInputSchemaSchema>;
export type NumberInputSchemaToZodSchema = z.ZodNumber;

export namespace NumberInputSchemaExt {
  export function toZodSchema(
    self: NumberInputSchema,
  ): NumberInputSchemaToZodSchema {
    let schema = z.number();
    if (self.description) {
      schema = schema.describe(self.description);
    }
    if (self.minimum !== undefined && self.minimum !== null) {
      schema = schema.min(self.minimum);
    }
    if (self.maximum !== undefined && self.maximum !== null) {
      schema = schema.max(self.maximum);
    }
    return schema;
  }
}

export const IntegerInputSchemaSchema = z
  .object({
    type: z.literal("integer"),
    description: z
      .string()
      .optional()
      .nullable()
      .describe("The description of the integer input."),
    minimum: z
      .uint32()
      .optional()
      .nullable()
      .describe("The minimum allowed value for the integer input."),
    maximum: z
      .uint32()
      .optional()
      .nullable()
      .describe("The maximum allowed value for the integer input."),
  })
  .describe("An integer input schema.")
  .meta({ title: "IntegerInputSchema" });
export type IntegerInputSchema = z.infer<typeof IntegerInputSchemaSchema>;
export type IntegerInputSchemaToZodSchema = z.ZodInt;

export namespace IntegerInputSchemaExt {
  export function toZodSchema(
    self: IntegerInputSchema,
  ): IntegerInputSchemaToZodSchema {
    let schema = z.int();
    if (self.description) {
      schema = schema.describe(self.description);
    }
    if (self.minimum !== undefined && self.minimum !== null) {
      schema = schema.min(self.minimum);
    }
    if (self.maximum !== undefined && self.maximum !== null) {
      schema = schema.max(self.maximum);
    }
    return schema;
  }
}

export const BooleanInputSchemaSchema = z
  .object({
    type: z.literal("boolean"),
    description: z
      .string()
      .optional()
      .nullable()
      .describe("The description of the boolean input."),
  })
  .describe("A boolean input schema.")
  .meta({ title: "BooleanInputSchema" });
export type BooleanInputSchema = z.infer<typeof BooleanInputSchemaSchema>;
export type BooleanInputSchemaToZodSchema = z.ZodBoolean;

export namespace BooleanInputSchemaExt {
  export function toZodSchema(
    self: BooleanInputSchema,
  ): BooleanInputSchemaToZodSchema {
    if (self.description) {
      return z.boolean().describe(self.description);
    } else {
      return z.boolean();
    }
  }
}

export const ImageInputSchemaSchema = z
  .object({
    type: z.literal("image"),
    description: z
      .string()
      .optional()
      .nullable()
      .describe("The description of the image input."),
  })
  .describe("An image input schema.")
  .meta({ title: "ImageInputSchema" });
export type ImageInputSchema = z.infer<typeof ImageInputSchemaSchema>;
export type ImageInputSchemaToZodSchema = typeof ImageRichContentPartSchema;

export namespace ImageInputSchemaExt {
  export function toZodSchema(
    self: ImageInputSchema,
  ): ImageInputSchemaToZodSchema {
    let schema = ImageRichContentPartSchema;
    if (self.description) {
      schema = schema.describe(self.description);
    }
    return schema;
  }
}

export const AudioInputSchemaSchema = z
  .object({
    type: z.literal("audio"),
    description: z
      .string()
      .optional()
      .nullable()
      .describe("The description of the audio input."),
  })
  .describe("An audio input schema.")
  .meta({ title: "AudioInputSchema" });
export type AudioInputSchema = z.infer<typeof AudioInputSchemaSchema>;
export type AudioInputSchemaToZodSchema = typeof AudioRichContentPartSchema;

export namespace AudioInputSchemaExt {
  export function toZodSchema(
    self: AudioInputSchema,
  ): AudioInputSchemaToZodSchema {
    let schema = AudioRichContentPartSchema;
    if (self.description) {
      schema = schema.describe(self.description);
    }
    return schema;
  }
}

export const VideoInputSchemaSchema = z
  .object({
    type: z.literal("video"),
    description: z
      .string()
      .optional()
      .nullable()
      .describe("The description of the video input."),
  })
  .describe("A video input schema.")
  .meta({ title: "VideoInputSchema" });
export type VideoInputSchema = z.infer<typeof VideoInputSchemaSchema>;
export type VideoInputSchemaToZodSchema = typeof VideoRichContentPartSchema;

export namespace VideoInputSchemaExt {
  export function toZodSchema(
    self: VideoInputSchema,
  ): VideoInputSchemaToZodSchema {
    let schema = VideoRichContentPartSchema;
    if (self.description) {
      schema = schema.describe(self.description);
    }
    return schema;
  }
}

export const FileInputSchemaSchema = z
  .object({
    type: z.literal("file"),
    description: z
      .string()
      .optional()
      .nullable()
      .describe("The description of the file input."),
  })
  .describe("A file input schema.")
  .meta({ title: "FileInputSchema" });
export type FileInputSchema = z.infer<typeof FileInputSchemaSchema>;
export type FileInputSchemaToZodSchema = typeof FileRichContentPartSchema;

export namespace FileInputSchemaExt {
  export function toZodSchema(
    self: FileInputSchema,
  ): FileInputSchemaToZodSchema {
    let schema = FileRichContentPartSchema;
    if (self.description) {
      schema = schema.describe(self.description);
    }
    return schema;
  }
}

export interface AnyOfInputSchema {
  anyOf: InputSchema[];
}
export const AnyOfInputSchemaSchema: z.ZodType<AnyOfInputSchema> = z
  .object({
    anyOf: z
      .array(
        z
          .lazy(() => InputSchemaSchema)
          .meta({
            title: "InputSchema",
            recursive: true,
          }),
      )
      .describe("The possible schemas that the input can match."),
  })
  .describe("A union of schemas - input must match at least one.")
  .meta({ title: "AnyOfInputSchema" });
export type AnyOfInputSchemaToZodSchema = z.ZodUnion<z.ZodType<InputValue>[]>;

export namespace AnyOfInputSchemaExt {
  export function toZodSchema(
    self: AnyOfInputSchema,
  ): AnyOfInputSchemaToZodSchema {
    return z.union(
      self.anyOf.map((schema) => InputSchemaExt.toZodSchema(schema)),
    );
  }
}

export const InputSchemaSchema = z
  .union([
    ObjectInputSchemaSchema,
    ArrayInputSchemaSchema,
    StringInputSchemaSchema,
    NumberInputSchemaSchema,
    IntegerInputSchemaSchema,
    BooleanInputSchemaSchema,
    ImageInputSchemaSchema,
    AudioInputSchemaSchema,
    VideoInputSchemaSchema,
    FileInputSchemaSchema,
    AnyOfInputSchemaSchema,
  ])
  .describe("An input schema defining the structure of function inputs.")
  .meta({ title: "InputSchema" });
export type InputSchema = z.infer<typeof InputSchemaSchema>;

export const QualityVectorFunctionObjectInputSchemaSchema =
  ObjectInputSchemaSchema.describe(
    ObjectInputSchemaSchema.description! +
      " At least one property must be a required array.",
  );

export const QualityVectorFunctionInputSchemaSchema = z
  .union([
    ArrayInputSchemaSchema,
    QualityVectorFunctionObjectInputSchemaSchema,
  ])
  .describe(
    "Input schema for a vector function. Must be an array or an object with at least one required array property.",
  );

export type InputSchemaToZodSchema =
  | ObjectInputSchemaToZodSchema
  | ArrayInputSchemaToZodSchema
  | StringInputSchemaToZodSchema
  | NumberInputSchemaToZodSchema
  | IntegerInputSchemaToZodSchema
  | BooleanInputSchemaToZodSchema
  | ImageInputSchemaToZodSchema
  | AudioInputSchemaToZodSchema
  | VideoInputSchemaToZodSchema
  | FileInputSchemaToZodSchema
  | AnyOfInputSchemaToZodSchema;

export namespace InputSchemaExt {
  export function toZodSchema(self: InputSchema): InputSchemaToZodSchema {
    if ("anyOf" in self) {
      return AnyOfInputSchemaExt.toZodSchema(self);
    } else if (self.type === "object") {
      return ObjectInputSchemaExt.toZodSchema(self);
    } else if (self.type === "array") {
      return ArrayInputSchemaExt.toZodSchema(self);
    } else if (self.type === "string") {
      return StringInputSchemaExt.toZodSchema(self);
    } else if (self.type === "number") {
      return NumberInputSchemaExt.toZodSchema(self);
    } else if (self.type === "integer") {
      return IntegerInputSchemaExt.toZodSchema(self);
    } else if (self.type === "boolean") {
      return BooleanInputSchemaExt.toZodSchema(self);
    } else if (self.type === "image") {
      return ImageInputSchemaExt.toZodSchema(self);
    } else if (self.type === "audio") {
      return AudioInputSchemaExt.toZodSchema(self);
    } else if (self.type === "video") {
      return VideoInputSchemaExt.toZodSchema(self);
    } else if (self.type === "file") {
      return FileInputSchemaExt.toZodSchema(self);
    } else {
      throw new Error(`Unsupported input schema type: ${(self as any).type}`);
    }
  }
}

// Input Value

export type InputValue =
  | ImageRichContentPart
  | AudioRichContentPart
  | VideoRichContentPart
  | FileRichContentPart
  | { [key: string]: InputValue | undefined }
  | InputValue[]
  | string
  | number
  | boolean;
export const InputValueSchema: z.ZodType<InputValue> = z
  .union([
    ImageRichContentPartSchema,
    AudioRichContentPartSchema,
    VideoRichContentPartSchema,
    FileRichContentPartSchema,
    z.record(
      z.string(),
      z
        .lazy(() => InputValueSchema)
        .optional()
        .meta({
          title: "InputValue",
          recursive: true,
        }),
    ),
    z.array(
      z
        .lazy(() => InputValueSchema)
        .meta({
          title: "InputValue",
          recursive: true,
        }),
    ),
    z.string(),
    z.number(),
    z.boolean(),
  ])
  .describe("A value provided as input to a function.")
  .meta({ title: "InputValue" });

export type InputValueExpression =
  | ImageRichContentPart
  | AudioRichContentPart
  | VideoRichContentPart
  | FileRichContentPart
  | { [key: string]: InputValueExpression }
  | InputValueExpression[]
  | string
  | number
  | boolean
  | Expression;
export const InputValueExpressionSchema: z.ZodType<InputValueExpression> = z
  .union([
    ImageRichContentPartSchema,
    AudioRichContentPartSchema,
    VideoRichContentPartSchema,
    FileRichContentPartSchema,
    z.record(
      z.string(),
      z
        .lazy(() => InputValueExpressionSchema)
        .meta({
          title: "InputValueExpression",
          recursive: true,
        }),
    ),
    z.array(
      z
        .lazy(() => InputValueExpressionSchema)
        .meta({
          title: "InputValueExpression",
          recursive: true,
        }),
    ),
    z.string(),
    z.number(),
    z.boolean(),
    ExpressionSchema.describe(
      "An expression which evaluates to an input value. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(InputValueSchema.description!)
  .meta({ title: "InputValueExpression" });

// Input Maps

export const InputMapExpressionsSchema = z
  .array(
    ExpressionSchema.describe(
      "An expression evaluating to a 1D array of Inputs. This becomes one sub-array in the input maps, referenced by its position index. Receives: `input`.",
    ),
  )
  .describe(
    "A list of expressions, each evaluating to a 1D array of Inputs. The i-th expression produces the i-th sub-array.",
  );
export type InputMapExpressions = z.infer<typeof InputMapExpressionsSchema>;

export const InputMapsExpressionSchema = z
  .union([
    ExpressionSchema.describe(
      "A single expression evaluating to a 2D array (array of arrays) of Inputs. Each inner array is a separate sub-array that mapped tasks can reference by index. Receives: `input`.",
    ),
    InputMapExpressionsSchema,
  ])
  .describe(
    "Defines arrays used by mapped tasks. A task with `map: i` references the i-th sub-array. " +
      "The task is compiled once per element in that sub-array, producing multiple task instances. " +
      "If the sub-array is empty, no task instances are produced (effectively skipping the task). " +
      "Each compiled instance's expressions receive the current element as `map`. " +
      "Receives: `input`.",
  );
export type InputMapsExpression = z.infer<typeof InputMapsExpressionSchema>;

export const QualityInputMapsExpressionSchema =
  InputMapExpressionsSchema.describe(InputMapsExpressionSchema.description!);
export type QualityInputMapsExpression = z.infer<
  typeof QualityInputMapsExpressionSchema
>;
