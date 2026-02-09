import { describe, it, expect, vi, beforeAll } from "vitest";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { formatZodSchema } from "../tools/schema";

// Set SCHEMA_OUTPUT_DIR env var to write each schema's output to a file
const outputDir = process.env.SCHEMA_OUTPUT_DIR;
if (outputDir) {
  mkdirSync(outputDir, { recursive: true });
}

// Mock readFunction so fs-dependent schema functions work without function.json
vi.mock("../tools/function/function", async (importOriginal) => {
  const original = await importOriginal<typeof import("../tools/function/function")>();
  return {
    ...original,
    readFunction: vi.fn().mockReturnValue({
      ok: true,
      value: {
        type: "scalar.function",
        input_schema: {
          type: "object",
          properties: { text: { type: "string" } },
          required: ["text"],
        },
      },
      error: undefined,
    }),
  };
});

// Function field schemas
import { readFunctionSchema } from "../tools/function/function";
import { readTypeSchema } from "../tools/function/type";
import { readDescriptionSchema } from "../tools/function/description";
import { readInputSchemaSchema } from "../tools/function/inputSchema";
import { readInputMapsSchema } from "../tools/function/inputMaps";
import { readTasksSchema, readMessagesSchema, readToolsSchema, readResponsesSchema } from "../tools/function/tasks";
import { readOutputLengthSchema } from "../tools/function/outputLength";
import { readInputSplitSchema } from "../tools/function/inputSplit";
import { readInputMergeSchema } from "../tools/function/inputMerge";

// Expression param schemas
import { readInputParamSchema } from "../tools/expressionParams/input";
import { readMapParamSchema } from "../tools/expressionParams/map";
import { readOutputParamSchema } from "../tools/expressionParams/output";

// Example inputs schema
import { readExampleInputsSchema } from "../tools/inputs";

// Register all schema refs (lazy type refs + property refs) before tests run
import { registerSchemaRefs } from "../tools/schemaRefs";

// Import claude tool wrappers for handler tests
import { ReadJsonValueSchema, ReadJsonValueExpressionSchema } from "../tools/claude/jsonValue";
import { ReadInputValueSchema, ReadInputValueExpressionSchema } from "../tools/claude/inputValue";
import {
  ReadDeveloperMessageSchema,
  ReadSystemMessageSchema,
  ReadUserMessageSchema,
  ReadToolMessageSchema,
  ReadAssistantMessageSchema,
  ReadDeveloperMessageExpressionSchema,
  ReadSystemMessageExpressionSchema,
  ReadUserMessageExpressionSchema,
  ReadToolMessageExpressionSchema,
  ReadAssistantMessageExpressionSchema,
} from "../tools/claude/messages";
import {
  ReadSimpleContentSchema,
  ReadRichContentSchema,
  ReadSimpleContentExpressionSchema,
  ReadRichContentExpressionSchema,
} from "../tools/claude/content";
import {
  ReadScalarFunctionTaskSchema,
  ReadVectorFunctionTaskSchema,
  ReadVectorCompletionTaskSchema,
  ReadCompiledScalarFunctionTaskSchema,
  ReadCompiledVectorFunctionTaskSchema,
  ReadCompiledVectorCompletionTaskSchema,
} from "../tools/claude/taskTypes";

function assertNonEmptyString(value: unknown, name?: string): asserts value is string {
  expect(typeof value).toBe("string");
  expect((value as string).length).toBeGreaterThan(0);
  if (outputDir && name) {
    writeFileSync(join(outputDir, `${name}.json`), value as string);
  }
}

describe("formatZodSchema", () => {
  beforeAll(() => registerSchemaRefs());

  // --- Function field schemas (no fs dependency) ---

  it("readTypeSchema", () => {
    assertNonEmptyString(formatZodSchema(readTypeSchema()), "readTypeSchema");
  });

  it("readDescriptionSchema", () => {
    assertNonEmptyString(formatZodSchema(readDescriptionSchema()), "readDescriptionSchema");
  });

  it("readInputSchemaSchema", () => {
    assertNonEmptyString(formatZodSchema(readInputSchemaSchema()), "readInputSchemaSchema");
  });

  it("readInputMapsSchema", () => {
    assertNonEmptyString(formatZodSchema(readInputMapsSchema()), "readInputMapsSchema");
  });

  it("readTasksSchema", () => {
    assertNonEmptyString(formatZodSchema(readTasksSchema()), "readTasksSchema");
  });

  it("readMessagesExpressionSchema", () => {
    assertNonEmptyString(formatZodSchema(readMessagesSchema()), "readMessagesExpressionSchema");
  });

  it("readToolsExpressionSchema", () => {
    assertNonEmptyString(formatZodSchema(readToolsSchema()), "readToolsExpressionSchema");
  });

  it("readResponsesExpressionSchema", () => {
    assertNonEmptyString(formatZodSchema(readResponsesSchema()), "readResponsesExpressionSchema");
  });

  it("readOutputLengthSchema", () => {
    assertNonEmptyString(formatZodSchema(readOutputLengthSchema()), "readOutputLengthSchema");
  });

  it("readInputSplitSchema", () => {
    assertNonEmptyString(formatZodSchema(readInputSplitSchema()), "readInputSplitSchema");
  });

  it("readInputMergeSchema", () => {
    assertNonEmptyString(formatZodSchema(readInputMergeSchema()), "readInputMergeSchema");
  });

  // --- Expression param schemas ---

  it("readMapParamSchema", () => {
    assertNonEmptyString(formatZodSchema(readMapParamSchema()), "readMapParamSchema");
  });

  it("readOutputParamSchema", () => {
    assertNonEmptyString(formatZodSchema(readOutputParamSchema()), "readOutputParamSchema");
  });

  // --- fs-dependent schemas (use mocked readFunction) ---

  it("readFunctionSchema", () => {
    assertNonEmptyString(formatZodSchema(readFunctionSchema()), "readFunctionSchema");
  });

  it("readInputParamSchema", () => {
    const result = readInputParamSchema();
    expect(result.ok).toBe(true);
    assertNonEmptyString(formatZodSchema(result.value!), "readInputParamSchema");
  });

  it("readExampleInputsSchema", () => {
    const result = readExampleInputsSchema();
    expect(result.ok).toBe(true);
    assertNonEmptyString(formatZodSchema(result.value!), "readExampleInputsSchema");
  });

  // --- Recursive type schemas (lazy, resolved via resolveLazy) ---

  it("readJsonValueSchema", async () => {
    const result = await ReadJsonValueSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readJsonValueSchema");
  });

  it("readJsonValueExpressionSchema", async () => {
    const result = await ReadJsonValueExpressionSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readJsonValueExpressionSchema");
  });

  it("readInputValueSchema", async () => {
    const result = await ReadInputValueSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readInputValueSchema");
  });

  it("readInputValueExpressionSchema", async () => {
    const result = await ReadInputValueExpressionSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readInputValueExpressionSchema");
  });

  // --- Message role schemas ---

  it("readDeveloperMessageSchema", async () => {
    const result = await ReadDeveloperMessageSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readDeveloperMessageSchema");
  });

  it("readSystemMessageSchema", async () => {
    const result = await ReadSystemMessageSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readSystemMessageSchema");
  });

  it("readUserMessageSchema", async () => {
    const result = await ReadUserMessageSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readUserMessageSchema");
  });

  it("readToolMessageSchema", async () => {
    const result = await ReadToolMessageSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readToolMessageSchema");
  });

  it("readAssistantMessageSchema", async () => {
    const result = await ReadAssistantMessageSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readAssistantMessageSchema");
  });

  // --- Content schemas ---

  it("readSimpleContentSchema", async () => {
    const result = await ReadSimpleContentSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readSimpleContentSchema");
  });

  it("readRichContentSchema", async () => {
    const result = await ReadRichContentSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readRichContentSchema");
  });

  // --- Message role schemas (expression variants) ---

  it("readDeveloperMessageExpressionSchema", async () => {
    const result = await ReadDeveloperMessageExpressionSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readDeveloperMessageExpressionSchema");
  });

  it("readSystemMessageExpressionSchema", async () => {
    const result = await ReadSystemMessageExpressionSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readSystemMessageExpressionSchema");
  });

  it("readUserMessageExpressionSchema", async () => {
    const result = await ReadUserMessageExpressionSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readUserMessageExpressionSchema");
  });

  it("readToolMessageExpressionSchema", async () => {
    const result = await ReadToolMessageExpressionSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readToolMessageExpressionSchema");
  });

  it("readAssistantMessageExpressionSchema", async () => {
    const result = await ReadAssistantMessageExpressionSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readAssistantMessageExpressionSchema");
  });

  // --- Content schemas (expression variants) ---

  it("readSimpleContentExpressionSchema", async () => {
    const result = await ReadSimpleContentExpressionSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readSimpleContentExpressionSchema");
  });

  it("readRichContentExpressionSchema", async () => {
    const result = await ReadRichContentExpressionSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readRichContentExpressionSchema");
  });

  // --- Task type schemas ---

  it("readScalarFunctionTaskSchema", async () => {
    const result = await ReadScalarFunctionTaskSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readScalarFunctionTaskSchema");
  });

  it("readVectorFunctionTaskSchema", async () => {
    const result = await ReadVectorFunctionTaskSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readVectorFunctionTaskSchema");
  });

  it("readVectorCompletionTaskSchema", async () => {
    const result = await ReadVectorCompletionTaskSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readVectorCompletionTaskSchema");
  });

  // --- Compiled task type schemas (used in ExampleInputs) ---

  it("readCompiledScalarFunctionTaskSchema", async () => {
    const result = await ReadCompiledScalarFunctionTaskSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readCompiledScalarFunctionTaskSchema");
  });

  it("readCompiledVectorFunctionTaskSchema", async () => {
    const result = await ReadCompiledVectorFunctionTaskSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readCompiledVectorFunctionTaskSchema");
  });

  it("readCompiledVectorCompletionTaskSchema", async () => {
    const result = await ReadCompiledVectorCompletionTaskSchema.handler({});
    assertNonEmptyString(result.content[0].text, "readCompiledVectorCompletionTaskSchema");
  });
});
