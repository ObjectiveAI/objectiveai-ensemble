import {
  type JSONSchema,
  listRefDependencies,
  getJsonSchema,
} from "objectiveai";
import z from "zod";
import { Result } from "../result";

export interface Tool<TSchema extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  description: string;
  inputSchema: TSchema;
  fn: (args: z.infer<z.ZodObject<TSchema>>) => Promise<Result<string>>;
}

export function getSchemaTools(
  schemas: { schema: JSONSchema; name: string }[],
): Tool<{}>[] {
  const seen = new Set<string>();
  const tools: Tool<{}>[] = [];

  const addTool = (name: string, schema: JSONSchema) => {
    const toolName = `Read${name}Schema`;
    if (seen.has(toolName)) return;
    seen.add(toolName);
    tools.push({
      name: toolName,
      description: toolName.replace("Read", "Read "),
      inputSchema: {},
      fn: () =>
        Promise.resolve({
          ok: true as const,
          value: JSON.stringify(schema, null, 2),
          error: undefined,
        }),
    });
  };

  for (const { schema, name } of schemas) {
    addTool(name, schema);
    for (const ref of listRefDependencies(schema)) {
      const refSchema = getJsonSchema(ref);
      if (!refSchema) throw new Error(`Missing JSON schema for ref: ${ref}`);
      addTool(ref, refSchema);
    }
  }

  return tools;
}
