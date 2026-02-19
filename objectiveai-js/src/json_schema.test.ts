import { describe, it, expect } from "vitest";
import * as objectiveai from "./index";
import z from "zod";

function isZodSchema(value: unknown): boolean {
  return value instanceof z.ZodType;
}

interface SchemaEntry {
  path: string;
  title: string;
  wrapper: boolean;
}

/**
 * Recursively collects all Zod schemas from the module exports,
 * extracting their meta titles and wrapper flags.
 */
function collectSchemas(
  entries: Record<string, unknown>,
  path: string[] = [],
  seen = new WeakSet<object>(),
): SchemaEntry[] {
  const results: SchemaEntry[] = [];
  for (const [name, value] of Object.entries(entries)) {
    if (name === "default") continue;
    if (name.endsWith("Schema") && !name.endsWith("JsonSchema") && isZodSchema(value)) {
      const schema = value as z.ZodType;
      try {
        const meta = schema.meta?.() as Record<string, unknown> | undefined;
        const title = meta?.title as string | undefined;
        if (title) {
          results.push({
            path: [...path, name].join("."),
            title,
            wrapper: !!meta?.wrapper,
          });
        }
      } catch {
        // skip schemas where .meta() throws
      }
    } else if (
      path.length < 3 &&
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      !isZodSchema(value) &&
      !seen.has(value)
    ) {
      seen.add(value);
      results.push(...collectSchemas(value as Record<string, unknown>, [...path, name], seen));
    }
  }
  return results;
}

describe("json_schema meta titles", () => {
  const all = collectSchemas(objectiveai as unknown as Record<string, unknown>);
  const nonWrappers = all.filter((e) => !e.wrapper);
  const wrappers = all.filter((e) => e.wrapper);

  it("every non-wrapper meta title is unique", () => {
    const byTitle = new Map<string, string[]>();
    for (const { path, title } of nonWrappers) {
      const existing = byTitle.get(title);
      if (existing) {
        existing.push(path);
      } else {
        byTitle.set(title, [path]);
      }
    }
    const duplicates = [...byTitle.entries()]
      .filter(([, paths]) => paths.length > 1)
      .map(([title, paths]) => `"${title}" used by: ${paths.join(", ")}`);
    expect(duplicates, `Duplicate meta titles found:\n${duplicates.join("\n")}`).toEqual([]);
  });

  it("every wrapper title refers to a non-wrapper with the same title", () => {
    const nonWrapperTitles = new Set(nonWrappers.map((e) => e.title));
    const orphans = wrappers
      .filter((e) => !nonWrapperTitles.has(e.title))
      .map((e) => `"${e.title}" at ${e.path}`);
    expect(orphans, `Wrapper schemas without a matching non-wrapper:\n${orphans.join("\n")}`).toEqual([]);
  });
});
