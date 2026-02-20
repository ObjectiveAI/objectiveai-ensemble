import z from "zod";

// --- JSON Schema Zod type ---

/**
 * Zod schema describing the JSON Schema objects returned by {@link convert}.
 * Recursive (a JSON Schema can contain nested JSON Schemas).
 */
export const JSONSchemaSchema: z.ZodType<JSONSchema> = z
  .lazy(() =>
    z
      .object({
        $ref: z.string().optional(),
        type: z
          .enum([
            "string",
            "number",
            "integer",
            "boolean",
            "null",
            "object",
            "array",
          ])
          .optional(),
        description: z.string().optional(),
        format: z.string().optional(),
        enum: z.array(z.unknown()).optional(),
        const: z.unknown().optional(),
        properties: z.record(z.string(), JSONSchemaSchema).optional(),
        required: z.array(z.string()).optional(),
        items: JSONSchemaSchema.optional(),
        prefixItems: z.array(JSONSchemaSchema).optional(),
        additionalProperties: JSONSchemaSchema.optional(),
        anyOf: z.array(JSONSchemaSchema).optional(),
        allOf: z.array(JSONSchemaSchema).optional(),
      })
      .passthrough(),
  )
  .meta({ title: "JSONSchema" });

export type JSONSchema = {
  $ref?: string;
  type?:
    | "string"
    | "number"
    | "integer"
    | "boolean"
    | "null"
    | "object"
    | "array";
  description?: string;
  format?: string;
  enum?: unknown[];
  const?: unknown;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  prefixItems?: JSONSchema[];
  additionalProperties?: JSONSchema;
  anyOf?: JSONSchema[];
  allOf?: JSONSchema[];
  [key: string]: unknown;
};

// --- Registration constants ---

/**
 * List of lazy schema titles that should emit $ref instead of inlining.
 */
const lazyRefs: string[] = [
  "JsonValue",
  "JsonValueExpression",
  "InputValue",
  "InputValueExpression",
  "InputSchema",
  "TaskProfile",
  "JSONSchema",
];

/**
 * List of schema titles that should emit $ref instead of inlining.
 */
const schemaRefs: string[] = [
  "JsonValue",
  "JsonValueExpression",
  "InputValue",
  "InputValueExpression",
  "InputSchema",
  "TaskProfile",
  "JSONSchema",
  "Message",
  "QualityMessage",
  "MessageExpression",
  "QualityMessageExpression",
  "DeveloperMessage",
  "DeveloperMessageExpression",
  "SystemMessage",
  "SystemMessageExpression",
  "UserMessage",
  "UserMessageExpression",
  "ToolMessage",
  "ToolMessageExpression",
  "AssistantMessage",
  "AssistantMessageExpression",
  "QualityDeveloperMessageExpression",
  "QualitySystemMessageExpression",
  "QualityUserMessageExpression",
  "QualityToolMessageExpression",
  "QualityAssistantMessageExpression",
  "SimpleContentPart",
  "SimpleContentPartExpression",
  "RichContentPart",
  "RichContentPartExpression",
  "TextRichContentPart",
  "TextRichContentPartExpression",
  "ImageRichContentPart",
  "ImageRichContentPartExpression",
  "AudioRichContentPart",
  "AudioRichContentPartExpressionSchema",
  "VideoRichContentPart",
  "VideoRichContentPartExpressionSchema",
  "FileRichContentPart",
  "FileRichContentPartExpressionSchema",
  "EnsembleLlmBase",
  "EnsembleLlm",
  "EnsembleBase",
  "Ensemble",
  "ResponseFormat",
  "Tool",
  "ToolExpression",
  "AssistantMessageToolCall",
  "InlineScalarFunction",
  "InlineVectorFunction",
  "RemoteScalarFunction",
  "RemoteVectorFunction",
  "QualityLeafRemoteScalarFunction",
  "QualityLeafRemoteVectorFunction",
  "QualityBranchRemoteScalarFunction",
  "QualityBranchRemoteVectorFunction",
  "Expression",
  "ScalarFunctionTaskExpression",
  "VectorFunctionTaskExpression",
  "VectorCompletionTaskExpression",
  "PlaceholderScalarFunctionTaskExpression",
  "PlaceholderVectorFunctionTaskExpression",
  "QualityScalarVectorCompletionTaskExpression",
  "QualityVectorVectorCompletionTaskExpression",
  "QualityUnmappedScalarFunctionTaskExpression",
  "QualityUnmappedPlaceholderScalarFunctionTaskExpression",
  "QualityMappedScalarFunctionTaskExpression",
  "QualityMappedPlaceholderScalarFunctionTaskExpression",
  "QualityUnmappedVectorFunctionTaskExpression",
  "QualityUnmappedPlaceholderVectorFunctionTaskExpression",
  "Task",
  "TaskExpression",
  "ScalarFunctionTask",
  "VectorFunctionTask",
  "VectorCompletionTask",
  "PlaceholderScalarFunctionTask",
  "PlaceholderVectorFunctionTask",
  "FunctionExecutionStrategy",
  "FunctionExecutionReasoning",
  "EnsembleLlmReasoning",
  "EnsembleLlmProvider",
  "CompletionProvider",
  "QualityVectorFunctionInputSchema",
];

const propertyRefsBySchema = new WeakMap<z.ZodType, Record<string, string>>();

// --- Conversion ---

/**
 * Converts a Zod schema to a JSON Schema object.
 *
 * Cannot use z.toJSONSchema() because some schemas (e.g. JsonValueSchema)
 * use z.lazy() with getters that create new instances on each call, causing
 * infinite recursion in Zod's built-in converter.
 *
 * Lazy schemas are resolved one layer deep by default. Beyond that, they are
 * emitted as $ref to the corresponding tool name (if registered in
 * {@link lazyRefs}) or as an empty schema.
 */
export function convert(
  schema: z.ZodType,
  lazyDepth = 1,
  skipDirectRef = true,
): JSONSchema {
  if (!skipDirectRef) {
    const title = schema.meta?.()?.title as string | undefined;
    if (title && schemaRefs.includes(title)) {
      const result: JSONSchema = { $ref: title };
      const d = safeDesc(schema);
      if (d) result.description = d;
      return result;
    }
  }
  const def = (schema as any)._def ?? (schema as any).def;
  const type: string = def?.type ?? "unknown";

  switch (type) {
    // --- wrappers ---
    case "optional":
    case "default":
    case "prefault":
    case "readonly": {
      const wrapperRef = lazyToolRef(schema);
      if (wrapperRef) return wrapperRef;
      return convert(def.innerType, lazyDepth, false);
    }
    case "nullable":
      return withDesc(
        { anyOf: [convert(def.innerType, lazyDepth, false), { type: "null" }] },
        schema,
      );
    case "pipe":
      return convert(def.out, lazyDepth, false);

    // --- primitives ---
    case "string":
      return withDesc({ type: "string" }, schema);
    case "number": {
      const bag = (schema as any)._zod?.bag;
      if (
        bag?.format === "int32" ||
        bag?.format === "uint32" ||
        bag?.format === "int64" ||
        bag?.format === "uint64"
      ) {
        return withDesc({ type: "integer" }, schema);
      }
      return withDesc({ type: "number" }, schema);
    }
    case "int":
      return withDesc({ type: "integer" }, schema);
    case "boolean":
      return withDesc({ type: "boolean" }, schema);
    case "null":
      return { type: "null" };
    case "undefined":
      return {};
    case "any":
    case "unknown":
      return withDesc({}, schema);
    case "date":
      return withDesc({ type: "string", format: "date-time" }, schema);

    // --- enums & literals ---
    case "enum":
      return withDesc({ enum: Object.values(def.entries) }, schema);
    case "literal": {
      const values = def.values as unknown[];
      if (values.length === 1) return withDesc({ const: values[0] }, schema);
      return withDesc({ enum: values }, schema);
    }

    // --- composites ---
    case "object": {
      const shape = def.shape as Record<string, z.ZodType>;
      const propRefs = propertyRefsBySchema.get(schema);
      const properties: Record<string, JSONSchema> = {};
      const required: string[] = [];
      for (const [key, prop] of Object.entries(shape)) {
        const u = unwrap(prop);
        if (propRefs?.[key]) {
          properties[key] = { $ref: propRefs[key] };
        } else {
          let converted = convert(u.inner, lazyDepth, false);
          if (u.nullable) converted = { anyOf: [converted, { type: "null" }] };
          if (u.description) converted.description = u.description;
          properties[key] = converted;
        }
        if (!u.optional) required.push(key);
      }
      const result: JSONSchema = { type: "object", properties };
      if (required.length > 0) result.required = required;
      return withDesc(result, schema);
    }
    case "array":
      return withDesc(
        { type: "array", items: convert(def.element, lazyDepth, false) },
        schema,
      );
    case "tuple": {
      const items = (def.items as z.ZodType[]).map((i: z.ZodType) =>
        convert(i, lazyDepth, false),
      );
      return withDesc({ type: "array", prefixItems: items }, schema);
    }
    case "record":
      return withDesc(
        {
          type: "object",
          additionalProperties: convert(def.valueType, lazyDepth, false),
        },
        schema,
      );

    // --- set operations ---
    case "union": {
      const options = (def.options as z.ZodType[]).map((o: z.ZodType) =>
        convert(o, lazyDepth, false),
      );
      return withDesc({ anyOf: options }, schema);
    }
    case "intersection":
      return withDesc(
        {
          allOf: [
            convert(def.left, lazyDepth, false),
            convert(def.right, lazyDepth, false),
          ],
        },
        schema,
      );

    // --- recursive ---
    case "lazy": {
      // Check for registration first to avoid calling getter on recursive schemas
      const ref = lazyToolRef(schema);
      if (ref) return ref;

      if (lazyDepth > 0) {
        const inner = def.getter();
        return withDesc(
          convert(inner, lazyDepth - 1, false) as JSONSchema,
          schema,
        );
      }
      return withDesc({}, schema);
    }

    // --- fallback ---
    default:
      return withDesc({}, schema);
  }
}

// --- Helpers ---

function lazyToolRef(schema: z.ZodType): { $ref: string } | undefined {
  const meta = safeMeta(schema);
  const title = meta?.title as string | undefined;
  if (title && lazyRefs.includes(title)) {
    return { $ref: title };
  }
  return undefined;
}

function withDesc(obj: JSONSchema, schema: z.ZodType): JSONSchema {
  const d = safeDesc(schema);
  if (d) obj.description = d;
  return obj;
}

function safeDesc(schema: z.ZodType): string | undefined {
  try {
    return schema.description;
  } catch {
    return undefined;
  }
}

function safeMeta(schema: z.ZodType): Record<string, unknown> | undefined {
  try {
    return schema.meta?.() as Record<string, unknown> | undefined;
  } catch {
    return undefined;
  }
}

function unwrap(schema: z.ZodType): {
  inner: z.ZodType;
  optional: boolean;
  nullable: boolean;
  description: string | undefined;
} {
  let optional = false;
  let nullable = false;
  let description: string | undefined;
  let current = schema;
  while (true) {
    const def = (current as any)._def ?? (current as any).def;
    const t = def?.type ?? "";
    if (t === "optional") {
      // Capture description from wrapper layers only (overrides base schema desc)
      const d = safeDesc(current);
      if (d) description = d;
      optional = true;
      current = def.innerType;
    } else if (t === "nullable") {
      const d = safeDesc(current);
      if (d) description = d;
      nullable = true;
      current = def.innerType;
    } else if (t === "default" || t === "prefault") {
      const d = safeDesc(current);
      if (d) description = d;
      optional = true;
      current = def.innerType;
    } else break;
  }
  return { inner: current, optional, nullable, description };
}

// --- Self-referential JsonSchema export ---

export const JSONSchemaJsonSchema: JSONSchema = convert(JSONSchemaSchema);
