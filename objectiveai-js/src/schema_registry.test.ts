import { describe, it, expect, beforeAll } from "vitest";
import z from "zod";
import * as objectiveai from "./index";
import {
  createSchemaRegistry,
  getZodSchema,
  getJsonSchema,
  listTitles,
  listRefDependencies,
} from "./schema_registry";

beforeAll(() => {
  createSchemaRegistry(objectiveai as unknown as Record<string, unknown>);
});

describe("schema_registry", () => {
  it("finds a substantial number of titled schemas", () => {
    expect(listTitles().length).toBeGreaterThan(100);
  });

  it("returns undefined for unknown titles", () => {
    expect(getZodSchema("DoesNotExist")).toBeUndefined();
    expect(getJsonSchema("DoesNotExist")).toBeUndefined();
  });

  it("getZodSchema returns a ZodType for EnsembleLlm", () => {
    expect(getZodSchema("EnsembleLlm")).toBeInstanceOf(z.ZodType);
  });

  it("getJsonSchema returns an object schema for EnsembleLlm", () => {
    const jsonSchema = getJsonSchema("EnsembleLlm");
    expect(jsonSchema).toBeDefined();
    expect(jsonSchema!.type).toBe("object");
  });

  it("getJsonSchema caches results", () => {
    const first = getJsonSchema("Ensemble");
    const second = getJsonSchema("Ensemble");
    expect(first).toBe(second);
  });

  it("every title resolves to both a Zod schema and a JSON Schema", () => {
    for (const title of listTitles()) {
      expect(getZodSchema(title), `missing Zod schema for "${title}"`).toBeDefined();
      expect(getJsonSchema(title), `missing JSON Schema for "${title}"`).toBeDefined();
    }
  });

  it("listRefDependencies returns refs from a schema", () => {
    const jsonSchema = getJsonSchema("EnsembleLlm");
    expect(jsonSchema).toBeDefined();
    const refs = listRefDependencies(jsonSchema!);
    expect(refs.length).toBeGreaterThan(0);
  });

  it("listRefDependencies returns empty for a schema with no refs", () => {
    expect(listRefDependencies({ type: "string" })).toEqual([]);
  });

  it("listRefDependencies deduplicates refs", () => {
    const jsonSchema = getJsonSchema("EnsembleLlm");
    expect(jsonSchema).toBeDefined();
    const refs = listRefDependencies(jsonSchema!);
    expect(refs.length).toBe(new Set(refs).size);
  });
});
