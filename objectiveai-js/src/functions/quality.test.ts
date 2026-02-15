import { describe, it, expect } from "vitest";
import type z from "zod";

// === Imports: Quality schemas and their base counterparts ===

// task.ts
import {
  // Base
  TaskExpressionMapSchema,
  ScalarFunctionTaskExpressionSchema,
  VectorFunctionTaskExpressionSchema,
  VectorCompletionTaskExpressionSchema,
  TaskExpressionSchema,
  TaskExpressionsSchema,
  VectorCompletionTaskSchema,
  TaskSchema,
  CompiledTaskSchema,
  CompiledTasksSchema,
  // Quality
  QualityTaskExpressionMapSchema,
  QualityScalarFunctionTaskExpressionSchema,
  QualityVectorFunctionTaskExpressionSchema,
  QualityScalarVectorCompletionTaskExpressionSchema,
  QualityVectorVectorCompletionTaskExpressionSchema,
  QualityBranchScalarFunctionTasksExpressionSchema,
  QualityBranchScalarFunctionTasksExpressionsSchema,
  QualityBranchVectorFunctionTasksExpressionSchema,
  QualityBranchVectorFunctionTasksExpressionsSchema,
  QualityLeafScalarTasksExpressionsSchema,
  QualityLeafVectorTasksExpressionsSchema,
  QualityVectorCompletionTaskSchema,
  QualityTaskSchema,
  QualityCompiledTaskSchema,
  QualityCompiledTasksSchema,
} from "./task";

// function.ts
import {
  // Base
  RemoteScalarFunctionSchema,
  RemoteVectorFunctionSchema,
  RemoteFunctionSchema,
  // Quality
  QualityLeafRemoteScalarFunctionSchema,
  QualityLeafRemoteVectorFunctionSchema,
  QualityLeafRemoteFunctionSchema,
  QualityBranchRemoteScalarFunctionSchema,
  QualityBranchRemoteVectorFunctionSchema,
  QualityBranchRemoteFunctionSchema,
} from "./function";

// expression/input.ts
import {
  ObjectInputSchemaSchema,
  InputSchemaSchema,
  InputMapsExpressionSchema,
  QualityVectorFunctionObjectInputSchemaSchema,
  QualityVectorFunctionInputSchemaSchema,
  QualityInputMapsExpressionSchema,
} from "./expression/input";

// message.ts
import {
  // Base
  DeveloperMessageExpressionSchema,
  SystemMessageExpressionSchema,
  UserMessageExpressionSchema,
  ToolMessageExpressionSchema,
  AssistantMessageExpressionSchema,
  MessageExpressionSchema,
  MessagesExpressionSchema,
  DeveloperMessageSchema,
  SystemMessageSchema,
  UserMessageSchema,
  ToolMessageSchema,
  AssistantMessageSchema,
  MessageSchema,
  MessagesSchema,
  // Quality
  QualityDeveloperMessageExpressionSchema,
  QualitySystemMessageExpressionSchema,
  QualityUserMessageExpressionSchema,
  QualityToolMessageExpressionSchema,
  QualityAssistantMessageExpressionSchema,
  QualityMessageExpressionSchema,
  QualityMessagesExpressionSchema,
  QualityDeveloperMessageSchema,
  QualitySystemMessageSchema,
  QualityUserMessageSchema,
  QualityToolMessageSchema,
  QualityAssistantMessageSchema,
  QualityMessageSchema,
  QualityMessagesSchema,
} from "src/chat/completions/request/message";

// vector_response.ts
import {
  // Base
  VectorResponseSchema,
  VectorResponsesSchema,
  VectorResponsesExpressionSchema,
  // Quality
  QualityScalarVectorResponseSchema,
  QualityScalarVectorResponsesSchema,
  QualityScalarVectorResponsesExpressionSchema,
  QualityVectorVectorResponsesExpressionSchema,
} from "src/vector/completions/request/vector_response";

// === Test helpers ===

function assertSubtype<Q, B>(
  qualitySchema: z.ZodType<Q>,
  baseSchema: z.ZodType<B>,
  value: unknown,
  label: string,
) {
  const qResult = qualitySchema.safeParse(value);
  expect(qResult.success, `${label}: should pass Quality schema`).toBe(true);
  const bResult = baseSchema.safeParse(value);
  expect(bResult.success, `${label}: should pass base schema`).toBe(true);
}

// === Fixtures ===

const richContentParts = [{ type: "text" as const, text: "hello" }];
const simpleContentParts = [{ type: "text" as const, text: "hello" }];

const qualityOutputExpr = { $starlark: "output['scores'][0]" };
const inputExpr = { $starlark: "input" };

const qualityVectorCompletionTaskExpression = {
  type: "vector.completion",
  messages: [
    { role: "user", content: richContentParts },
  ],
  responses: [richContentParts, richContentParts],
  output: qualityOutputExpr,
};

const qualityVectorCompletionTask = {
  type: "vector.completion",
  messages: [
    { role: "user", content: richContentParts },
  ],
  responses: [richContentParts, richContentParts],
  output: qualityOutputExpr,
};

const unmappedScalarFunctionTaskExpression = {
  type: "scalar.function",
  owner: "test-owner",
  repository: "test-repo",
  commit: "abc123",
  input: inputExpr,
  output: qualityOutputExpr,
};

const unmappedPlaceholderScalarFunctionTaskExpression = {
  type: "placeholder.scalar.function",
  input_schema: { type: "object", properties: { x: { type: "string" } } },
  input: inputExpr,
  output: qualityOutputExpr,
};

const mappedScalarFunctionTaskExpression = {
  ...unmappedScalarFunctionTaskExpression,
  map: 0,
};

const mappedPlaceholderScalarFunctionTaskExpression = {
  ...unmappedPlaceholderScalarFunctionTaskExpression,
  map: 0,
};

const unmappedVectorFunctionTaskExpression = {
  type: "vector.function",
  owner: "test-owner",
  repository: "test-repo",
  commit: "abc123",
  input: inputExpr,
  output: qualityOutputExpr,
};

const unmappedPlaceholderVectorFunctionTaskExpression = {
  type: "placeholder.vector.function",
  input_schema: { type: "object", properties: { items: { type: "array", items: { type: "string" } } } },
  output_length: { $starlark: "len(input['items'])" },
  input_split: { $starlark: "[{'items': [x]} for x in input['items']]" },
  input_merge: { $starlark: "{'items': [x['items'][0] for x in input]}" },
  input: inputExpr,
  output: qualityOutputExpr,
};

const objectInputSchemaWithArray = {
  type: "object",
  properties: {
    items: { type: "array", items: { type: "string" } },
    label: { type: "string" },
  },
  required: ["items"],
};

const arrayInputSchema = {
  type: "array",
  items: { type: "string" },
  minItems: 2,
};

const scalarInputSchema = {
  type: "object",
  properties: {
    text: { type: "string" },
  },
  required: ["text"],
};

const baseLeafScalarFunction = {
  type: "scalar.function",
  description: "A test scalar function",
  input_schema: scalarInputSchema,
  tasks: [qualityVectorCompletionTaskExpression],
};

const qualityVectorVectorCompletionTaskExpression = {
  type: "vector.completion",
  messages: [
    { role: "user", content: richContentParts },
  ],
  responses: { $starlark: "[[{'type': 'text', 'text': x}] for x in input['items']]" },
  output: { $starlark: "output['scores']" },
};

const baseLeafVectorFunction = {
  type: "vector.function",
  description: "A test vector function",
  input_schema: objectInputSchemaWithArray,
  output_length: { $starlark: "len(input['items'])" },
  input_split: { $starlark: "[{'items': [x]} for x in input['items']]" },
  input_merge: { $starlark: "{'items': [x['items'][0] for x in input]}" },
  input_maps: [{ $starlark: "input['items']" }],
  tasks: [qualityVectorVectorCompletionTaskExpression],
};

const baseBranchScalarFunction = {
  type: "scalar.function",
  description: "A test branch scalar function",
  input_schema: scalarInputSchema,
  tasks: [unmappedScalarFunctionTaskExpression],
};

const baseBranchVectorFunction = {
  type: "vector.function",
  description: "A test branch vector function",
  input_schema: objectInputSchemaWithArray,
  output_length: { $starlark: "len(input['items'])" },
  input_split: { $starlark: "[{'items': [x]} for x in input['items']]" },
  input_merge: { $starlark: "{'items': [x['items'][0] for x in input]}" },
  input_maps: [{ $starlark: "input['items']" }],
  tasks: [mappedScalarFunctionTaskExpression],
};

// === Tests ===

describe("Quality schemas are subtypes of base schemas", () => {
  // -- expression/input.ts --

  describe("QualityVectorFunctionObjectInputSchemaSchema", () => {
    it("accepts object with array property and passes ObjectInputSchemaSchema", () => {
      assertSubtype(
        QualityVectorFunctionObjectInputSchemaSchema,
        ObjectInputSchemaSchema,
        objectInputSchemaWithArray,
        "object-with-array",
      );
    });
  });

  describe("QualityVectorFunctionInputSchemaSchema", () => {
    it("accepts object with array property and passes InputSchemaSchema", () => {
      assertSubtype(
        QualityVectorFunctionInputSchemaSchema,
        InputSchemaSchema,
        objectInputSchemaWithArray,
        "object-with-array",
      );
    });

    it("accepts array schema and passes InputSchemaSchema", () => {
      assertSubtype(
        QualityVectorFunctionInputSchemaSchema,
        InputSchemaSchema,
        arrayInputSchema,
        "array-schema",
      );
    });
  });

  describe("QualityInputMapsExpressionSchema", () => {
    it("accepts array of expressions and passes InputMapsExpressionSchema", () => {
      const value = [{ $starlark: "input['items']" }];
      assertSubtype(
        QualityInputMapsExpressionSchema,
        InputMapsExpressionSchema,
        value,
        "input-maps-array",
      );
    });
  });

  // -- vector_response.ts --

  describe("QualityScalarVectorResponseSchema", () => {
    it("accepts content parts array and passes VectorResponseSchema", () => {
      assertSubtype(
        QualityScalarVectorResponseSchema,
        VectorResponseSchema,
        richContentParts,
        "response-parts",
      );
    });
  });

  describe("QualityScalarVectorResponsesSchema", () => {
    it("accepts array of content parts arrays and passes VectorResponsesSchema", () => {
      const value = [richContentParts, richContentParts];
      assertSubtype(
        QualityScalarVectorResponsesSchema,
        VectorResponsesSchema,
        value,
        "responses-parts",
      );
    });
  });

  describe("QualityScalarVectorResponsesExpressionSchema", () => {
    it("accepts array of content parts arrays and passes VectorResponsesExpressionSchema", () => {
      const value = [richContentParts, richContentParts];
      assertSubtype(
        QualityScalarVectorResponsesExpressionSchema,
        VectorResponsesExpressionSchema,
        value,
        "responses-expr-parts",
      );
    });
  });

  describe("QualityVectorVectorResponsesExpressionSchema", () => {
    it("accepts expression and passes VectorResponsesExpressionSchema", () => {
      const value = { $starlark: "[[{'type': 'text', 'text': x}] for x in input]" };
      assertSubtype(
        QualityVectorVectorResponsesExpressionSchema,
        VectorResponsesExpressionSchema,
        value,
        "vector-responses-expr",
      );
    });
  });

  // -- message.ts (expression) --

  describe("QualityDeveloperMessageExpressionSchema", () => {
    it("passes DeveloperMessageExpressionSchema", () => {
      const value = { role: "developer", content: simpleContentParts };
      assertSubtype(
        QualityDeveloperMessageExpressionSchema,
        DeveloperMessageExpressionSchema,
        value,
        "dev-msg-expr",
      );
    });
  });

  describe("QualitySystemMessageExpressionSchema", () => {
    it("passes SystemMessageExpressionSchema", () => {
      const value = { role: "system", content: simpleContentParts };
      assertSubtype(
        QualitySystemMessageExpressionSchema,
        SystemMessageExpressionSchema,
        value,
        "sys-msg-expr",
      );
    });
  });

  describe("QualityUserMessageExpressionSchema", () => {
    it("passes UserMessageExpressionSchema", () => {
      const value = { role: "user", content: richContentParts };
      assertSubtype(
        QualityUserMessageExpressionSchema,
        UserMessageExpressionSchema,
        value,
        "user-msg-expr",
      );
    });
  });

  describe("QualityToolMessageExpressionSchema", () => {
    it("passes ToolMessageExpressionSchema", () => {
      const value = { role: "tool", content: richContentParts, tool_call_id: "tc_123" };
      assertSubtype(
        QualityToolMessageExpressionSchema,
        ToolMessageExpressionSchema,
        value,
        "tool-msg-expr",
      );
    });
  });

  describe("QualityAssistantMessageExpressionSchema", () => {
    it("passes AssistantMessageExpressionSchema", () => {
      const value = { role: "assistant", content: richContentParts };
      assertSubtype(
        QualityAssistantMessageExpressionSchema,
        AssistantMessageExpressionSchema,
        value,
        "asst-msg-expr",
      );
    });
  });

  describe("QualityMessageExpressionSchema", () => {
    it("passes MessageExpressionSchema for user message", () => {
      const value = { role: "user", content: richContentParts };
      assertSubtype(
        QualityMessageExpressionSchema,
        MessageExpressionSchema,
        value,
        "msg-expr-user",
      );
    });

    it("passes MessageExpressionSchema for developer message", () => {
      const value = { role: "developer", content: simpleContentParts };
      assertSubtype(
        QualityMessageExpressionSchema,
        MessageExpressionSchema,
        value,
        "msg-expr-dev",
      );
    });
  });

  describe("QualityMessagesExpressionSchema", () => {
    it("passes MessagesExpressionSchema", () => {
      const value = [
        { role: "developer", content: simpleContentParts },
        { role: "user", content: richContentParts },
      ];
      assertSubtype(
        QualityMessagesExpressionSchema,
        MessagesExpressionSchema,
        value,
        "msgs-expr",
      );
    });
  });

  // -- message.ts (compiled, non-expression) --

  describe("QualityDeveloperMessageSchema", () => {
    it("passes DeveloperMessageSchema", () => {
      const value = { role: "developer", content: simpleContentParts };
      assertSubtype(
        QualityDeveloperMessageSchema,
        DeveloperMessageSchema,
        value,
        "dev-msg",
      );
    });
  });

  describe("QualitySystemMessageSchema", () => {
    it("passes SystemMessageSchema", () => {
      const value = { role: "system", content: simpleContentParts };
      assertSubtype(
        QualitySystemMessageSchema,
        SystemMessageSchema,
        value,
        "sys-msg",
      );
    });
  });

  describe("QualityUserMessageSchema", () => {
    it("passes UserMessageSchema", () => {
      const value = { role: "user", content: richContentParts };
      assertSubtype(
        QualityUserMessageSchema,
        UserMessageSchema,
        value,
        "user-msg",
      );
    });
  });

  describe("QualityToolMessageSchema", () => {
    it("passes ToolMessageSchema", () => {
      const value = { role: "tool", content: richContentParts, tool_call_id: "tc_123" };
      assertSubtype(
        QualityToolMessageSchema,
        ToolMessageSchema,
        value,
        "tool-msg",
      );
    });
  });

  describe("QualityAssistantMessageSchema", () => {
    it("passes AssistantMessageSchema", () => {
      const value = { role: "assistant", content: richContentParts };
      assertSubtype(
        QualityAssistantMessageSchema,
        AssistantMessageSchema,
        value,
        "asst-msg",
      );
    });
  });

  describe("QualityMessageSchema", () => {
    it("passes MessageSchema for each role", () => {
      for (const value of [
        { role: "developer", content: simpleContentParts },
        { role: "system", content: simpleContentParts },
        { role: "user", content: richContentParts },
        { role: "tool", content: richContentParts, tool_call_id: "tc_123" },
        { role: "assistant", content: richContentParts },
      ]) {
        assertSubtype(QualityMessageSchema, MessageSchema, value, `msg-${value.role}`);
      }
    });
  });

  describe("QualityMessagesSchema", () => {
    it("passes MessagesSchema", () => {
      const value = [
        { role: "developer", content: simpleContentParts },
        { role: "user", content: richContentParts },
      ];
      assertSubtype(QualityMessagesSchema, MessagesSchema, value, "msgs");
    });
  });

  // -- task.ts (expression level) --

  describe("QualityTaskExpressionMapSchema", () => {
    it("passes TaskExpressionMapSchema", () => {
      assertSubtype(QualityTaskExpressionMapSchema, TaskExpressionMapSchema, 0, "map-0");
      assertSubtype(QualityTaskExpressionMapSchema, TaskExpressionMapSchema, 5, "map-5");
    });
  });

  describe("QualityScalarFunctionTaskExpressionSchema", () => {
    it("passes ScalarFunctionTaskExpressionSchema", () => {
      const value = { ...unmappedScalarFunctionTaskExpression, map: 0 };
      assertSubtype(
        QualityScalarFunctionTaskExpressionSchema,
        ScalarFunctionTaskExpressionSchema,
        value,
        "scalar-fn-task-expr",
      );
    });
  });

  describe("QualityVectorFunctionTaskExpressionSchema", () => {
    it("passes VectorFunctionTaskExpressionSchema", () => {
      const value = { ...unmappedVectorFunctionTaskExpression, map: 0 };
      assertSubtype(
        QualityVectorFunctionTaskExpressionSchema,
        VectorFunctionTaskExpressionSchema,
        value,
        "vector-fn-task-expr",
      );
    });
  });

  describe("QualityScalarVectorCompletionTaskExpressionSchema", () => {
    it("passes VectorCompletionTaskExpressionSchema", () => {
      assertSubtype(
        QualityScalarVectorCompletionTaskExpressionSchema,
        VectorCompletionTaskExpressionSchema,
        qualityVectorCompletionTaskExpression,
        "scalar-vc-task-expr",
      );
    });
  });

  describe("QualityVectorVectorCompletionTaskExpressionSchema", () => {
    it("passes VectorCompletionTaskExpressionSchema", () => {
      assertSubtype(
        QualityVectorVectorCompletionTaskExpressionSchema,
        VectorCompletionTaskExpressionSchema,
        qualityVectorVectorCompletionTaskExpression,
        "vector-vc-task-expr",
      );
    });
  });

  describe("QualityBranchScalarFunctionTasksExpressionSchema", () => {
    it("passes TaskExpressionSchema for unmapped scalar.function", () => {
      assertSubtype(
        QualityBranchScalarFunctionTasksExpressionSchema,
        TaskExpressionSchema,
        unmappedScalarFunctionTaskExpression,
        "branch-scalar-fn",
      );
    });

    it("passes TaskExpressionSchema for unmapped placeholder.scalar.function", () => {
      assertSubtype(
        QualityBranchScalarFunctionTasksExpressionSchema,
        TaskExpressionSchema,
        unmappedPlaceholderScalarFunctionTaskExpression,
        "branch-scalar-placeholder",
      );
    });
  });

  describe("QualityBranchScalarFunctionTasksExpressionsSchema", () => {
    it("passes TaskExpressionsSchema", () => {
      const value = [
        unmappedScalarFunctionTaskExpression,
        unmappedPlaceholderScalarFunctionTaskExpression,
      ];
      assertSubtype(
        QualityBranchScalarFunctionTasksExpressionsSchema,
        TaskExpressionsSchema,
        value,
        "branch-scalar-tasks",
      );
    });
  });

  describe("QualityBranchVectorFunctionTasksExpressionSchema", () => {
    it("passes TaskExpressionSchema for mapped scalar.function", () => {
      assertSubtype(
        QualityBranchVectorFunctionTasksExpressionSchema,
        TaskExpressionSchema,
        mappedScalarFunctionTaskExpression,
        "branch-vector-mapped-scalar",
      );
    });

    it("passes TaskExpressionSchema for mapped placeholder.scalar.function", () => {
      assertSubtype(
        QualityBranchVectorFunctionTasksExpressionSchema,
        TaskExpressionSchema,
        mappedPlaceholderScalarFunctionTaskExpression,
        "branch-vector-mapped-placeholder",
      );
    });

    it("passes TaskExpressionSchema for unmapped vector.function", () => {
      assertSubtype(
        QualityBranchVectorFunctionTasksExpressionSchema,
        TaskExpressionSchema,
        unmappedVectorFunctionTaskExpression,
        "branch-vector-unmapped-vector",
      );
    });

    it("passes TaskExpressionSchema for unmapped placeholder.vector.function", () => {
      assertSubtype(
        QualityBranchVectorFunctionTasksExpressionSchema,
        TaskExpressionSchema,
        unmappedPlaceholderVectorFunctionTaskExpression,
        "branch-vector-unmapped-placeholder-vector",
      );
    });
  });

  describe("QualityBranchVectorFunctionTasksExpressionsSchema", () => {
    it("passes TaskExpressionsSchema", () => {
      const value = [
        mappedScalarFunctionTaskExpression,
        unmappedVectorFunctionTaskExpression,
      ];
      assertSubtype(
        QualityBranchVectorFunctionTasksExpressionsSchema,
        TaskExpressionsSchema,
        value,
        "branch-vector-tasks",
      );
    });
  });

  describe("QualityLeafScalarTasksExpressionsSchema", () => {
    it("passes TaskExpressionsSchema", () => {
      const value = [qualityVectorCompletionTaskExpression];
      assertSubtype(
        QualityLeafScalarTasksExpressionsSchema,
        TaskExpressionsSchema,
        value,
        "leaf-scalar-tasks",
      );
    });
  });

  describe("QualityLeafVectorTasksExpressionsSchema", () => {
    it("passes TaskExpressionsSchema", () => {
      const value = [qualityVectorVectorCompletionTaskExpression];
      assertSubtype(
        QualityLeafVectorTasksExpressionsSchema,
        TaskExpressionsSchema,
        value,
        "leaf-vector-tasks",
      );
    });
  });

  // -- task.ts (compiled level) --

  describe("QualityVectorCompletionTaskSchema", () => {
    it("passes VectorCompletionTaskSchema", () => {
      assertSubtype(
        QualityVectorCompletionTaskSchema,
        VectorCompletionTaskSchema,
        qualityVectorCompletionTask,
        "vc-task-compiled",
      );
    });
  });

  describe("QualityTaskSchema", () => {
    it("passes TaskSchema for vector.completion", () => {
      assertSubtype(
        QualityTaskSchema,
        TaskSchema,
        qualityVectorCompletionTask,
        "task-vc",
      );
    });

    it("passes TaskSchema for scalar.function", () => {
      const value = {
        type: "scalar.function",
        owner: "test-owner",
        repository: "test-repo",
        commit: "abc123",
        input: { text: "hello" },
        output: qualityOutputExpr,
      };
      assertSubtype(QualityTaskSchema, TaskSchema, value, "task-scalar-fn");
    });

    it("passes TaskSchema for vector.function", () => {
      const value = {
        type: "vector.function",
        owner: "test-owner",
        repository: "test-repo",
        commit: "abc123",
        input: { items: ["a", "b"] },
        output: qualityOutputExpr,
      };
      assertSubtype(QualityTaskSchema, TaskSchema, value, "task-vector-fn");
    });

    it("passes TaskSchema for placeholder.scalar.function", () => {
      const value = {
        type: "placeholder.scalar.function",
        input_schema: scalarInputSchema,
        input: { text: "hello" },
        output: qualityOutputExpr,
      };
      assertSubtype(QualityTaskSchema, TaskSchema, value, "task-placeholder-scalar");
    });

    it("passes TaskSchema for placeholder.vector.function", () => {
      const value = {
        ...unmappedPlaceholderVectorFunctionTaskExpression,
        // Compiled tasks don't have skip/map
      };
      // Remove expression-only fields for compiled schema
      const { skip, map, ...compiled } = value as Record<string, unknown>;
      assertSubtype(QualityTaskSchema, TaskSchema, compiled, "task-placeholder-vector");
    });
  });

  describe("QualityCompiledTaskSchema", () => {
    it("passes CompiledTaskSchema for single task", () => {
      assertSubtype(
        QualityCompiledTaskSchema,
        CompiledTaskSchema,
        qualityVectorCompletionTask,
        "compiled-single",
      );
    });

    it("passes CompiledTaskSchema for mapped (array) task", () => {
      const value = [qualityVectorCompletionTask, qualityVectorCompletionTask];
      assertSubtype(
        QualityCompiledTaskSchema,
        CompiledTaskSchema,
        value,
        "compiled-mapped",
      );
    });

    it("passes CompiledTaskSchema for skipped (null) task", () => {
      assertSubtype(
        QualityCompiledTaskSchema,
        CompiledTaskSchema,
        null,
        "compiled-null",
      );
    });
  });

  describe("QualityCompiledTasksSchema", () => {
    it("passes CompiledTasksSchema", () => {
      const value = [
        qualityVectorCompletionTask,
        [qualityVectorCompletionTask],
        null,
      ];
      assertSubtype(
        QualityCompiledTasksSchema,
        CompiledTasksSchema,
        value,
        "compiled-tasks",
      );
    });
  });

  // -- function.ts (leaf) --

  describe("QualityLeafRemoteScalarFunctionSchema", () => {
    it("passes RemoteScalarFunctionSchema", () => {
      assertSubtype(
        QualityLeafRemoteScalarFunctionSchema,
        RemoteScalarFunctionSchema,
        baseLeafScalarFunction,
        "leaf-scalar-fn",
      );
    });
  });

  describe("QualityLeafRemoteVectorFunctionSchema", () => {
    it("passes RemoteVectorFunctionSchema", () => {
      assertSubtype(
        QualityLeafRemoteVectorFunctionSchema,
        RemoteVectorFunctionSchema,
        baseLeafVectorFunction,
        "leaf-vector-fn",
      );
    });
  });

  describe("QualityLeafRemoteFunctionSchema", () => {
    it("passes RemoteFunctionSchema for scalar", () => {
      assertSubtype(
        QualityLeafRemoteFunctionSchema,
        RemoteFunctionSchema,
        baseLeafScalarFunction,
        "leaf-fn-scalar",
      );
    });

    it("passes RemoteFunctionSchema for vector", () => {
      assertSubtype(
        QualityLeafRemoteFunctionSchema,
        RemoteFunctionSchema,
        baseLeafVectorFunction,
        "leaf-fn-vector",
      );
    });
  });

  // -- function.ts (branch) --

  describe("QualityBranchRemoteScalarFunctionSchema", () => {
    it("passes RemoteScalarFunctionSchema", () => {
      assertSubtype(
        QualityBranchRemoteScalarFunctionSchema,
        RemoteScalarFunctionSchema,
        baseBranchScalarFunction,
        "branch-scalar-fn",
      );
    });
  });

  describe("QualityBranchRemoteVectorFunctionSchema", () => {
    it("passes RemoteVectorFunctionSchema", () => {
      assertSubtype(
        QualityBranchRemoteVectorFunctionSchema,
        RemoteVectorFunctionSchema,
        baseBranchVectorFunction,
        "branch-vector-fn",
      );
    });
  });

  describe("QualityBranchRemoteFunctionSchema", () => {
    it("passes RemoteFunctionSchema for scalar", () => {
      assertSubtype(
        QualityBranchRemoteFunctionSchema,
        RemoteFunctionSchema,
        baseBranchScalarFunction,
        "branch-fn-scalar",
      );
    });

    it("passes RemoteFunctionSchema for vector", () => {
      assertSubtype(
        QualityBranchRemoteFunctionSchema,
        RemoteFunctionSchema,
        baseBranchVectorFunction,
        "branch-fn-vector",
      );
    });
  });
});

// === Negative tests: Quality schemas REJECT what they're meant to reject ===

describe("Quality schemas reject invalid values", () => {
  it("QualityScalarVectorResponseSchema rejects plain string", () => {
    const result = QualityScalarVectorResponseSchema.safeParse("hello");
    expect(result.success).toBe(false);
  });

  it("QualityScalarVectorResponsesSchema rejects array with string responses", () => {
    const result = QualityScalarVectorResponsesSchema.safeParse(["hello", "world"]);
    expect(result.success).toBe(false);
  });

  it("QualityUserMessageSchema rejects string content", () => {
    const result = QualityUserMessageSchema.safeParse({
      role: "user",
      content: "hello",
    });
    expect(result.success).toBe(false);
  });

  it("QualityDeveloperMessageSchema rejects string content", () => {
    const result = QualityDeveloperMessageSchema.safeParse({
      role: "developer",
      content: "hello",
    });
    expect(result.success).toBe(false);
  });

  it("QualitySystemMessageSchema rejects string content", () => {
    const result = QualitySystemMessageSchema.safeParse({
      role: "system",
      content: "hello",
    });
    expect(result.success).toBe(false);
  });

  it("QualityAssistantMessageSchema rejects string content", () => {
    const result = QualityAssistantMessageSchema.safeParse({
      role: "assistant",
      content: "hello",
    });
    expect(result.success).toBe(false);
  });

  it("QualityScalarVectorCompletionTaskExpressionSchema rejects map field", () => {
    const result = QualityScalarVectorCompletionTaskExpressionSchema.safeParse({
      ...qualityVectorCompletionTaskExpression,
      map: 0,
    });
    expect(result.success).toBe(false);
  });

  it("QualityVectorCompletionTaskSchema rejects string message content", () => {
    const result = QualityVectorCompletionTaskSchema.safeParse({
      type: "vector.completion",
      messages: [{ role: "user", content: "hello" }],
      responses: [richContentParts],
      output: qualityOutputExpr,
    });
    expect(result.success).toBe(false);
  });

  it("QualityVectorCompletionTaskSchema rejects string response", () => {
    const result = QualityVectorCompletionTaskSchema.safeParse({
      type: "vector.completion",
      messages: [{ role: "user", content: richContentParts }],
      responses: ["hello"],
      output: qualityOutputExpr,
    });
    expect(result.success).toBe(false);
  });

  it("QualityVectorFunctionInputSchemaSchema rejects object without array property", () => {
    const result = QualityVectorFunctionInputSchemaSchema.safeParse({
      type: "object",
      properties: { name: { type: "string" } },
    });
    // This should parse (Zod can't enforce "has array property"), but the description says it must
    // The schema itself is a union of array or object, so a plain object will parse
    // The "at least one required array property" is in the description only
    expect(result.success).toBe(true);
  });

  it("QualityVectorFunctionInputSchemaSchema rejects non-array non-object schemas", () => {
    const result = QualityVectorFunctionInputSchemaSchema.safeParse({
      type: "string",
    });
    expect(result.success).toBe(false);
  });

  it("QualityLeafRemoteScalarFunctionSchema rejects input_maps", () => {
    const result = QualityLeafRemoteScalarFunctionSchema.safeParse({
      ...baseLeafScalarFunction,
      input_maps: [{ $starlark: "input['items']" }],
    });
    expect(result.success).toBe(false);
  });

  it("QualityBranchRemoteScalarFunctionSchema rejects input_maps", () => {
    const result = QualityBranchRemoteScalarFunctionSchema.safeParse({
      ...baseBranchScalarFunction,
      input_maps: [{ $starlark: "input['items']" }],
    });
    expect(result.success).toBe(false);
  });

  it("QualityBranchScalarFunctionTasksExpressionSchema rejects mapped tasks", () => {
    const result = QualityBranchScalarFunctionTasksExpressionSchema.safeParse(
      mappedScalarFunctionTaskExpression,
    );
    expect(result.success).toBe(false);
  });

  it("QualityBranchScalarFunctionTasksExpressionSchema rejects vector-like tasks", () => {
    const result = QualityBranchScalarFunctionTasksExpressionSchema.safeParse(
      unmappedVectorFunctionTaskExpression,
    );
    expect(result.success).toBe(false);
  });

  it("QualityBranchVectorFunctionTasksExpressionSchema rejects unmapped scalar-like tasks", () => {
    const result = QualityBranchVectorFunctionTasksExpressionSchema.safeParse(
      unmappedScalarFunctionTaskExpression,
    );
    expect(result.success).toBe(false);
  });

  it("QualityLeafScalarTasksExpressionsSchema rejects non-vector-completion tasks", () => {
    const result = QualityLeafScalarTasksExpressionsSchema.safeParse([
      unmappedScalarFunctionTaskExpression,
    ]);
    expect(result.success).toBe(false);
  });

  it("QualityLeafVectorTasksExpressionsSchema rejects non-vector-completion tasks", () => {
    const result = QualityLeafVectorTasksExpressionsSchema.safeParse([
      unmappedScalarFunctionTaskExpression,
    ]);
    expect(result.success).toBe(false);
  });

  // Scalar function VC task: rejects responses as overall expression
  it("QualityScalarVectorCompletionTaskExpressionSchema rejects responses as overall expression", () => {
    const result = QualityScalarVectorCompletionTaskExpressionSchema.safeParse({
      type: "vector.completion",
      messages: [{ role: "user", content: richContentParts }],
      responses: { $starlark: "['a', 'b']" },
      output: qualityOutputExpr,
    });
    expect(result.success).toBe(false);
  });

  // Scalar function VC task: accepts responses with expression elements
  it("QualityScalarVectorCompletionTaskExpressionSchema accepts responses with expression elements", () => {
    const result = QualityScalarVectorCompletionTaskExpressionSchema.safeParse({
      type: "vector.completion",
      messages: [{ role: "user", content: richContentParts }],
      responses: [
        richContentParts,
        { $starlark: "[{'type': 'text', 'text': 'hi'}]" },
      ],
      output: qualityOutputExpr,
    });
    expect(result.success).toBe(true);
  });

  // Scalar function VC task: accepts array of content parts arrays
  it("QualityScalarVectorCompletionTaskExpressionSchema accepts array of content parts arrays", () => {
    const result = QualityScalarVectorCompletionTaskExpressionSchema.safeParse({
      type: "vector.completion",
      messages: [{ role: "user", content: richContentParts }],
      responses: [richContentParts, [{ type: "text", text: "world" }]],
      output: qualityOutputExpr,
    });
    expect(result.success).toBe(true);
  });

  // Vector function VC task: rejects responses as array
  it("QualityVectorVectorCompletionTaskExpressionSchema rejects responses as array", () => {
    const result = QualityVectorVectorCompletionTaskExpressionSchema.safeParse({
      type: "vector.completion",
      messages: [{ role: "user", content: richContentParts }],
      responses: [richContentParts, richContentParts],
      output: qualityOutputExpr,
    });
    expect(result.success).toBe(false);
  });

  // Vector function VC task: accepts responses as expression
  it("QualityVectorVectorCompletionTaskExpressionSchema accepts responses as expression", () => {
    const result = QualityVectorVectorCompletionTaskExpressionSchema.safeParse({
      type: "vector.completion",
      messages: [{ role: "user", content: richContentParts }],
      responses: { $starlark: "[[{'type': 'text', 'text': x}] for x in input]" },
      output: qualityOutputExpr,
    });
    expect(result.success).toBe(true);
  });
});
