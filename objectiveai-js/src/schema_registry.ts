import z from "zod";
import { convert, type JSONSchema } from "./json_schema";

// --- Internal collection ---

function isZodSchema(value: unknown): boolean {
  return value instanceof z.ZodType;
}

/**
 * Recursively walks an object's properties and collects every Zod schema
 * that carries a `.meta({ title })`, keyed by that title.
 */
function collectSchemas(
  entries: Record<string, unknown>,
  seen = new WeakSet<object>(),
): Map<string, z.ZodType> {
  const results = new Map<string, z.ZodType>();
  for (const [name, value] of Object.entries(entries)) {
    if (name === "default") continue;
    if (name.endsWith("Schema") && !name.endsWith("JsonSchema") && isZodSchema(value)) {
      const schema = value as z.ZodType;
      try {
        const title = schema.meta?.()?.title as string | undefined;
        if (title) {
          const meta = schema.meta?.() as Record<string, unknown>;
          const isWrapper = meta?.wrapper === true;
          // Non-wrappers take priority over wrappers
          if (!isWrapper || !results.has(title)) {
            results.set(title, schema);
          }
        }
      } catch {
        // skip schemas where .meta() throws
      }
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      !isZodSchema(value) &&
      !seen.has(value)
    ) {
      seen.add(value);
      for (const [k, v] of collectSchemas(
        value as Record<string, unknown>,
        seen,
      )) {
        results.set(k, v);
      }
    }
  }
  return results;
}

// --- Lazy singleton (populated by require("./index") in bundled builds) ---

let zodMap: Map<string, z.ZodType> | undefined;
const jsonSchemaCache = new Map<string, JSONSchema>();

function getZodMap(): Map<string, z.ZodType> {
  if (!zodMap) {
    // In bundled builds, require("./index") resolves synchronously
    // since everything is in a single file.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./index");
    zodMap = collectSchemas(mod as Record<string, unknown>);
  }
  return zodMap;
}

// --- Public API ---

/**
 * Creates a schema registry from any module exports object.
 * Also seeds the internal singleton used by the standalone functions.
 */
export function createSchemaRegistry(
  exports: Record<string, unknown>,
): SchemaRegistry {
  zodMap = collectSchemas(exports);
  jsonSchemaCache.clear();
  return { getZodSchema, getJsonSchema, listTitles, listRefDependencies };
}

/**
 * Returns the Zod schema registered under the given meta title,
 * or `undefined` if no schema has that title.
 */
export function getZodSchema(title: string): z.ZodType | undefined {
  return getZodMap().get(title);
}

/**
 * Returns the JSON Schema for the Zod schema registered under the given
 * meta title, or `undefined` if no schema has that title.
 * Results are cached after the first conversion for each title.
 */
export function getJsonSchema(title: string): JSONSchema | undefined {
  const cached = jsonSchemaCache.get(title);
  if (cached) return cached;

  const zodSchema = getZodMap().get(title);
  if (!zodSchema) return undefined;

  const jsonSchema = convert(zodSchema);
  jsonSchemaCache.set(title, jsonSchema);
  return jsonSchema;
}

/**
 * Returns all registered meta titles.
 */
export function listTitles(): string[] {
  return [...getZodMap().keys()];
}

/**
 * Recursively collects all deduplicated `$ref` values reachable from a
 * JSON Schema, resolving each ref via the registry.
 */
export function listRefDependencies(schema: JSONSchema): string[] {
  const seen = new Set<string>();

  const walk = (node: JSONSchema): void => {
    if (node.$ref) {
      if (seen.has(node.$ref)) return;
      seen.add(node.$ref);
      const resolved = getJsonSchema(node.$ref);
      if (resolved) walk(resolved);
      return;
    }
    if (node.properties) {
      for (const prop of Object.values(node.properties)) walk(prop);
    }
    if (node.items) walk(node.items);
    if (node.prefixItems) {
      for (const item of node.prefixItems) walk(item);
    }
    if (node.additionalProperties) walk(node.additionalProperties);
    if (node.anyOf) {
      for (const branch of node.anyOf) walk(branch);
    }
    if (node.allOf) {
      for (const branch of node.allOf) walk(branch);
    }
  };

  walk(schema);
  return [...seen];
}

export interface SchemaRegistry {
  getZodSchema: typeof getZodSchema;
  getJsonSchema: typeof getJsonSchema;
  listTitles: typeof listTitles;
  listRefDependencies: typeof listRefDependencies;
}
