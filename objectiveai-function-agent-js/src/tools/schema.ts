import z from "zod";

export function formatZodSchema(schema: z.ZodType): string {
  return formatNode(schema, 0);
}

function formatNode(schema: z.ZodType, indent: number): string {
  const pad = "  ".repeat(indent);
  const def = (schema as any)._def ?? (schema as any).def;
  const type: string = def?.type ?? "unknown";

  switch (type) {
    case "object": {
      const desc = schema.description;
      const shape = def.shape as Record<string, z.ZodType>;
      const keys = Object.keys(shape);
      if (keys.length === 0) {
        const descStr = desc ? ` - ${desc}` : "";
        return `object${descStr}`;
      }
      const lines: string[] = [];
      if (desc) lines.push(`${pad}${desc}`);
      for (const key of keys) {
        const propSchema = shape[key];
        const propDesc = propSchema.description;
        const unwrapped = unwrap(propSchema);
        const innerDesc = unwrapped.inner.description;
        const displayDesc = propDesc ?? innerDesc;
        const opt = unwrapped.optional ? "?" : "";
        const nul = unwrapped.nullable ? " | null" : "";
        const typeStr = formatNode(unwrapped.inner, indent + 1);
        const descStr = displayDesc ? ` - ${displayDesc}` : "";
        lines.push(`${pad}  ${key}${opt}: ${typeStr}${nul}${descStr}`);
      }
      return `object\n${lines.join("\n")}`;
    }
    case "array": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      const elementStr = formatNode(def.element, indent);
      return `${elementStr}[]${descStr}`;
    }
    case "string": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      return `string${descStr}`;
    }
    case "number": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      const bag = (schema as any)._zod?.bag;
      if (bag?.format === "int32" || bag?.format === "uint32" || bag?.format === "int64" || bag?.format === "uint64") {
        return `integer${descStr}`;
      }
      return `number${descStr}`;
    }
    case "int": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      return `integer${descStr}`;
    }
    case "boolean": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      return `boolean${descStr}`;
    }
    case "enum": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      const entries = def.entries;
      const values = Object.values(entries).map((v: unknown) => JSON.stringify(v));
      return `${values.join(" | ")}${descStr}`;
    }
    case "literal": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      const values = (def.values as unknown[]).map((v: unknown) => JSON.stringify(v));
      return `${values.join(" | ")}${descStr}`;
    }
    case "union": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      const options = def.options as z.ZodType[];
      if (options.every(isInline)) {
        return options.map(o => formatNode(o, indent)).join(" | ") + descStr;
      }
      const lines: string[] = [];
      if (desc) lines.push(`${pad}${desc}`);
      for (const option of options) {
        const unwrapped = unwrap(option);
        const nul = unwrapped.nullable ? " | null" : "";
        lines.push(`${pad}  | ${formatNode(unwrapped.inner, indent + 1)}${nul}`);
      }
      return `union\n${lines.join("\n")}`;
    }
    case "intersection": {
      const left = formatNode(def.left, indent);
      const right = formatNode(def.right, indent);
      return `${left} & ${right}`;
    }
    case "record": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      const valueStr = formatNode(def.valueType, indent);
      return `Record<string, ${valueStr}>${descStr}`;
    }
    case "tuple": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      const items = (def.items as z.ZodType[]).map((item: z.ZodType) => formatNode(item, indent));
      return `[${items.join(", ")}]${descStr}`;
    }
    case "lazy": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      const meta = schema.meta?.() as Record<string, unknown> | undefined;
      const title = meta?.title;
      if (title) return `${title}${descStr}`;
      return `(recursive)${descStr}`;
    }
    case "optional":
      return formatNode(def.innerType, indent);
    case "nullable": {
      return `${formatNode(def.innerType, indent)} | null`;
    }
    case "default":
    case "prefault":
      return formatNode(def.innerType, indent);
    case "pipe": {
      return formatNode(def.out, indent);
    }
    case "readonly": {
      return formatNode(def.innerType, indent);
    }
    case "null": {
      return "null";
    }
    case "undefined": {
      return "undefined";
    }
    case "any": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      return `any${descStr}`;
    }
    case "unknown": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      return `unknown${descStr}`;
    }
    case "date": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      return `Date${descStr}`;
    }
    case "custom": {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      return `custom${descStr}`;
    }
    default: {
      const desc = schema.description;
      const descStr = desc ? ` - ${desc}` : "";
      return `${type}${descStr}`;
    }
  }
}

function unwrap(schema: z.ZodType): { inner: z.ZodType; optional: boolean; nullable: boolean } {
  let optional = false;
  let nullable = false;
  let current = schema;

  while (true) {
    const def = (current as any)._def ?? (current as any).def;
    const type = def?.type ?? "";
    if (type === "optional") {
      optional = true;
      current = def.innerType;
    } else if (type === "nullable") {
      nullable = true;
      current = def.innerType;
    } else if (type === "default" || type === "prefault") {
      optional = true;
      current = def.innerType;
    } else {
      break;
    }
  }

  return { inner: current, optional, nullable };
}

function isInline(schema: z.ZodType): boolean {
  const def = (schema as any)._def ?? (schema as any).def;
  const type = def?.type ?? "";
  const unwrapped = unwrap(schema);
  const innerDef = (unwrapped.inner as any)._def ?? (unwrapped.inner as any).def;
  const innerType = innerDef?.type ?? "";
  return ["string", "number", "int", "boolean", "literal", "null", "undefined", "any", "unknown", "date", "nan"].includes(innerType);
}
