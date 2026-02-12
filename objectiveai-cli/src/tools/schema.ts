import z from "zod";

/**
 * Converts a Zod schema to a JSON Schema string.
 *
 * Cannot use z.toJSONSchema() because some schemas (e.g. JsonValueSchema)
 * use z.lazy() with getters that create new instances on each call, causing
 * infinite recursion in Zod's built-in converter.
 *
 * Lazy schemas are emitted as $ref to the corresponding MCP tool name.
 * Use {@link registerLazyRef} to register lazy schema → tool name mappings.
 */
export function formatZodSchema(schema: z.ZodType, opts?: { resolveLazy?: boolean }): string {
  const root = convert(schema, opts?.resolveLazy ? 1 : 0, /* skipDirectRef */ true);
  return JSON.stringify(root, null, 2);
}

/**
 * Registers a lazy schema reference. When formatZodSchema encounters a lazy
 * schema (or wrapper around one) whose meta title matches the given schema's
 * meta title, it emits a $ref to the given tool name.
 *
 * The meta title is extracted from the schema's own `.meta()` call, so no
 * hard-coded type names are needed — the mapping is derived from the schema.
 */
export function registerLazyRef(schema: z.ZodType, toolName: string): void {
  const title = safeMeta(schema)?.title as string | undefined;
  if (title) {
    lazyRefs[title] = toolName;
  }
}

const lazyRefs: Record<string, string> = {};

/**
 * Registers property-level refs on a parent object schema. When
 * formatZodSchema encounters this parent, properties with registered
 * refs emit $ref instead of inlining the property's schema.
 *
 * This allows parent schemas (like a Function schema) to show compact
 * $ref entries for properties that have their own dedicated tools.
 */
export function registerPropertyRefs(
  parentSchema: z.ZodType,
  refs: Record<string, string>,
): void {
  const existing = propertyRefsBySchema.get(parentSchema);
  propertyRefsBySchema.set(
    parentSchema,
    existing ? { ...existing, ...refs } : refs,
  );
}

const propertyRefsBySchema = new WeakMap<z.ZodType, Record<string, string>>();

/**
 * Registers a direct schema-to-tool ref. When formatZodSchema encounters
 * this exact schema instance as a child, it emits $ref to the tool name.
 */
export function registerSchemaRef(schema: z.ZodType, toolName: string): void {
  schemaRefs.set(schema, toolName);
}

const schemaRefs = new WeakMap<z.ZodType, string>();

function convert(schema: z.ZodType, lazyDepth = 0, skipDirectRef = false): unknown {
  if (!skipDirectRef) {
    const directRef = schemaRefs.get(schema);
    if (directRef) return { $ref: directRef };
  }
  const def = (schema as any)._def ?? (schema as any).def;
  const type: string = def?.type ?? "unknown";

  switch (type) {
    // --- wrappers ---
    case "optional":
    case "default":
    case "prefault":
    case "readonly": {
      // Check if this wrapper has a meta title pointing to a lazy tool ref
      // (e.g. z.lazy(...).optional().meta({ title: "InputValue" }))
      const wrapperRef = lazyToolRef(schema);
      if (wrapperRef) return wrapperRef;
      return convert(def.innerType, lazyDepth);
    }
    case "nullable":
      return withDesc({ anyOf: [convert(def.innerType, lazyDepth), { type: "null" }] }, schema);
    case "pipe":
      return convert(def.out, lazyDepth);

    // --- primitives ---
    case "string":
      return withDesc({ type: "string" }, schema);
    case "number": {
      const bag = (schema as any)._zod?.bag;
      if (bag?.format === "int32" || bag?.format === "uint32" || bag?.format === "int64" || bag?.format === "uint64") {
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
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [key, prop] of Object.entries(shape)) {
        const u = unwrap(prop);
        if (propRefs?.[key]) {
          properties[key] = { $ref: propRefs[key] };
        } else {
          let converted = convert(u.inner);
          if (u.nullable) converted = { anyOf: [converted, { type: "null" }] };
          properties[key] = converted;
        }
        if (!u.optional) required.push(key);
      }
      const result: Record<string, unknown> = { type: "object", properties };
      if (required.length > 0) result.required = required;
      return withDesc(result, schema);
    }
    case "array":
      return withDesc({ type: "array", items: convert(def.element) }, schema);
    case "tuple": {
      const items = (def.items as z.ZodType[]).map((i) => convert(i));
      return withDesc({ type: "array", prefixItems: items }, schema);
    }
    case "record":
      return withDesc({ type: "object", additionalProperties: convert(def.valueType) }, schema);

    // --- set operations ---
    case "union": {
      const options = (def.options as z.ZodType[]).map((o) => convert(o));
      return withDesc({ anyOf: options }, schema);
    }
    case "intersection":
      return withDesc({ allOf: [convert(def.left), convert(def.right)] }, schema);

    // --- recursive ---
    // Never call def.getter() — some z.lazy getters create new instances per
    // call which blows the stack even with cycle detection. Emit a $ref to
    // the corresponding MCP tool name instead.
    // If lazyDepth > 0, resolve the getter once (for top-level lazy schemas
    // that need to show their inner structure).
    case "lazy": {
      if (lazyDepth > 0) {
        const inner = def.getter();
        return withDesc(convert(inner) as Record<string, unknown>, schema);
      }
      return lazyToolRef(schema) ?? withDesc({}, schema);
    }

    // --- fallback ---
    default:
      return withDesc({}, schema);
  }
}

function lazyToolRef(schema: z.ZodType): { $ref: string } | undefined {
  const meta = safeMeta(schema);
  const title = meta?.title as string | undefined;
  const toolName = title ? lazyRefs[title] : undefined;
  return toolName ? { $ref: toolName } : undefined;
}

function withDesc(obj: Record<string, unknown>, schema: z.ZodType): Record<string, unknown> {
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

function unwrap(schema: z.ZodType): { inner: z.ZodType; optional: boolean; nullable: boolean } {
  let optional = false;
  let nullable = false;
  let current = schema;
  while (true) {
    const def = (current as any)._def ?? (current as any).def;
    const t = def?.type ?? "";
    if (t === "optional") { optional = true; current = def.innerType; }
    else if (t === "nullable") { nullable = true; current = def.innerType; }
    else if (t === "default" || t === "prefault") { optional = true; current = def.innerType; }
    else break;
  }
  return { inner: current, optional, nullable };
}
