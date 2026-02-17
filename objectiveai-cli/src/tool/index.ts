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

export function getSchemaTools(schema: JSONSchema, name: string): Tool<{}>[] {
  const toolName = `Read${name}Schema`;
  const tools: Tool<{}>[] = [
    {
      name: toolName,
      description: toolName.replace("Read", "Read "),
      inputSchema: {},
      fn: () =>
        Promise.resolve({
          ok: true as const,
          value: JSON.stringify(schema, null, 2),
          error: undefined,
        }),
    },
  ];

  for (const ref of listRefDependencies(schema)) {
    const refSchema = getJsonSchema(ref);
    if (!refSchema) throw new Error(`Missing JSON schema for ref: ${ref}`);
    const refName = `Read${ref}Schema`;
    tools.push({
      name: refName,
      description: refName.replace("Read", "Read "),
      inputSchema: {},
      fn: () =>
        Promise.resolve({
          ok: true as const,
          value: JSON.stringify(refSchema, null, 2),
          error: undefined,
        }),
    });
  }

  return tools;
}
