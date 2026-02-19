/**
 * Pre-computes all convert() results and writes them to a JSON mapping file.
 * Run this before tsup to generate the schema cache.
 *
 * Usage: npx tsx scripts/precompute-schemas.ts
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically import all schemas from the source
async function main() {
  // We need to import from the source files directly
  // tsx handles the TypeScript + path aliases
  const srcDir = path.resolve(__dirname, "../src");

  // Find all .ts files that contain convert() calls
  const files = findFiles(srcDir, /\.ts$/);
  const convertFiles = files.filter((f) => {
    const content = fs.readFileSync(f, "utf8");
    return (
      /JsonSchema: JSONSchema =\s*convert\(/.test(content) &&
      !content.includes(".test.ts")
    );
  });

  console.log(`Found ${convertFiles.length} files with convert() calls`);

  // Extract schema name -> convert call patterns
  const pattern =
    /export const (\w+JsonSchema): JSONSchema =\s*convert\(\s*(\w+)\s*,?\s*\);/gs;
  const schemas: Record<string, { file: string; schemaVar: string }> = {};

  for (const file of convertFiles) {
    const content = fs.readFileSync(file, "utf8");
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const [, jsonSchemaName, schemaVar] = match;
      const relPath = path.relative(srcDir, file).replace(/\\/g, "/");
      schemas[`${relPath}:${jsonSchemaName}`] = {
        file: relPath,
        schemaVar,
      };
    }
  }

  console.log(`Found ${Object.keys(schemas).length} convert() calls`);

  // Import the built module to get all the computed values
  // This requires that convert() works when importing from source
  const { convert } = await import(pathToFileURL(path.resolve(__dirname, "../src/json_schema.ts")).href);

  // Now import each file and compute the JsonSchemas
  const results: Record<string, any> = {};
  const fileModules = new Map<string, any>();

  for (const [key, { file, schemaVar }] of Object.entries(schemas)) {
    try {
      const fullPath = path.resolve(srcDir, file);
      if (!fileModules.has(file)) {
        fileModules.set(file, await import(pathToFileURL(fullPath).href));
      }
      const mod = fileModules.get(file)!;
      const schema = mod[schemaVar];
      if (schema) {
        results[key] = convert(schema, 1, true);
      } else {
        console.warn(`  Warning: ${schemaVar} not found in ${file}`);
      }
    } catch (err) {
      console.warn(`  Warning: Failed to compute ${key}:`, (err as Error).message);
    }
  }

  console.log(`Computed ${Object.keys(results).length} JsonSchemas`);

  // Write the cache file
  const cachePath = path.resolve(__dirname, "../.schema-cache.json");
  fs.writeFileSync(cachePath, JSON.stringify(results, null, 2));
  console.log(`Wrote cache to ${cachePath}`);
}

function findFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      results.push(...findFiles(fullPath, pattern));
    } else if (entry.isFile() && pattern.test(entry.name) && !entry.name.includes(".test.")) {
      results.push(fullPath);
    }
  }
  return results;
}

main().catch(console.error);
