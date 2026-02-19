import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { Functions } from "objectiveai";
import { GitHubBackend } from "../github";
import { AgentStep, AgentStepFn } from ".";
import { NotificationMessage } from "../notification";
import { Parameters } from "../parameters";
import { Tool } from "../tool";
import { getAgentMockConfig } from "../config";

export interface Config {
  notificationDelayMs?: number;
}

const MOCK_OWNER = "mock";
const MOCK_COMMIT = "mock";

type MockName =
  | "mock-branch-scalar"
  | "mock-branch-vector"
  | "mock-leaf-scalar"
  | "mock-leaf-vector";

function getMockName(
  type: "scalar.function" | "vector.function",
  depth: number,
): MockName {
  const tier = depth > 0 ? "branch" : "leaf";
  const kind = type === "vector.function" ? "vector" : "scalar";
  return `mock-${tier}-${kind}`;
}

// Hardcoded functions returned by fetchRemoteFunctions — no file reading needed.

const MOCK_LEAF_SCALAR: Functions.RemoteFunction = {
  type: "scalar.function",
  description: "Mock leaf scalar function",
  input_schema: {
    type: "object",
    properties: { text: { type: "string" } },
    required: ["text"],
  },
  tasks: [
    {
      type: "vector.completion",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: { $starlark: "'Rate: ' + input['text']" },
            },
          ],
        },
      ],
      responses: [
        [{ type: "text", text: "Good" }],
        [{ type: "text", text: "Bad" }],
      ],
      output: { $starlark: "output['scores'][0]" },
    },
  ],
};

const MOCK_LEAF_VECTOR: Functions.RemoteFunction = {
  type: "vector.function",
  description: "Mock leaf vector function",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        minItems: 2,
        items: {
          type: "object",
          properties: { text: { type: "string" } },
          required: ["text"],
        },
      },
    },
    required: ["items"],
  },
  output_length: { $starlark: "len(input['items'])" },
  input_split: {
    $starlark: "[{'items': [item]} for item in input['items']]",
  },
  input_merge: {
    $starlark: "{'items': [item for sub in input for item in sub['items']]}",
  },
  tasks: [
    {
      type: "vector.completion",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: { $starlark: "'Rank: ' + str(input['items'])" },
            },
          ],
        },
      ],
      responses: {
        $starlark:
          "[[{'type': 'text', 'text': item['text']}] for item in input['items']]",
      },
      output: { $starlark: "output['scores']" },
    },
  ],
};

const MOCK_BRANCH_SCALAR: Functions.RemoteFunction = {
  type: "scalar.function",
  description: "Mock branch scalar function",
  input_schema: {
    type: "object",
    properties: { text: { type: "string" } },
    required: ["text"],
  },
  tasks: [
    {
      type: "placeholder.scalar.function",
      input_schema: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
      },
      input: { $starlark: "input" },
      output: { $starlark: "output" },
    },
  ],
};

const MOCK_BRANCH_VECTOR: Functions.RemoteFunction = {
  type: "vector.function",
  description: "Mock branch vector function",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        minItems: 2,
        items: {
          type: "object",
          properties: { text: { type: "string" } },
          required: ["text"],
        },
      },
    },
    required: ["items"],
  },
  output_length: { $starlark: "len(input['items'])" },
  input_split: {
    $starlark: "[{'items': [item]} for item in input['items']]",
  },
  input_merge: {
    $starlark: "{'items': [item for sub in input for item in sub['items']]}",
  },
  tasks: [
    {
      type: "placeholder.vector.function",
      input_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            minItems: 2,
            items: {
              type: "object",
              properties: { text: { type: "string" } },
              required: ["text"],
            },
          },
        },
        required: ["items"],
      },
      output_length: { $starlark: "len(input['items'])" },
      input_split: {
        $starlark: "[{'items': [item]} for item in input['items']]",
      },
      input_merge: {
        $starlark:
          "{'items': [item for sub in input for item in sub['items']]}",
      },
      input: { $starlark: "input" },
      output: { $starlark: "output" },
    },
  ],
};

const MOCK_FUNCTIONS: Record<MockName, Functions.RemoteFunction> = {
  "mock-leaf-scalar": MOCK_LEAF_SCALAR,
  "mock-leaf-vector": MOCK_LEAF_VECTOR,
  "mock-branch-scalar": MOCK_BRANCH_SCALAR,
  "mock-branch-vector": MOCK_BRANCH_VECTOR,
};

function findTool(step: AgentStep, name: string): Tool | undefined {
  return step.tools.find((t) => t.name === name);
}

async function* callTool(
  tool: Tool,
  args: Record<string, unknown>,
  wait: () => Promise<unknown>,
): AsyncGenerator<NotificationMessage, void> {
  const result = await tool.fn(args);
  if (result.ok) {
    yield { role: "tool", name: tool.name };
  } else {
    yield { role: "tool", name: tool.name, error: result.error };
  }
  await wait();
}

export function mock(): [AgentStepFn<unknown>, GitHubBackend] {
  const { notificationDelayMs = 100 } = getAgentMockConfig() || {};
  const wait = () =>
    new Promise((resolve) => setTimeout(resolve, notificationDelayMs));

  const agent: AgentStepFn<unknown> = async function* (
    step: AgentStep,
    _state: unknown,
    parameters: Parameters,
  ): AsyncGenerator<NotificationMessage, unknown> {
    // Step 1: WriteFunctionType (now runs before WriteFunctionName)
    const typeTool = findTool(step, "WriteFunctionType");
    if (typeTool) {
      const type = Math.random() < 0.5 ? "scalar.function" : "vector.function";
      yield { role: "assistant", content: `Setting function type to ${type}` };
      await wait();
      yield* callTool(typeTool, { type }, wait);
      return undefined;
    }

    // Step 2: WriteFunctionName
    const nameTool = findTool(step, "WriteFunctionName");
    if (nameTool) {
      const readTypeTool = findTool(step, "ReadFunctionType");
      let type: "scalar.function" | "vector.function" = "scalar.function";
      if (readTypeTool) {
        const result = await readTypeTool.fn({});
        if (result.ok)
          type = result.value as "scalar.function" | "vector.function";
      }
      const name = getMockName(type, parameters.depth);
      yield {
        role: "assistant",
        content: `Setting function name to "${name}"`,
      };
      await wait();
      yield* callTool(nameTool, { name }, wait);
      return undefined;
    }

    // Step 3: WriteInventEssay
    const essayTool = findTool(step, "WriteInventEssay");
    if (essayTool) {
      yield { role: "assistant", content: "Writing essay" };
      await wait();
      yield* callTool(
        essayTool,
        {
          essay:
            "This function evaluates quality by examining multiple aspects of the input. Each task assesses a different dimension.",
        },
        wait,
      );
      return undefined;
    }

    // Step 4: Fields (WriteFunctionInputSchema + CheckFields)
    const inputSchemaTool = findTool(step, "WriteFunctionInputSchema");
    const checkFieldsTool = findTool(step, "CheckFields");
    if (inputSchemaTool && checkFieldsTool) {
      const isVector = !!findTool(step, "WriteFunctionOutputLength");

      yield { role: "assistant", content: "Setting input schema" };
      await wait();

      if (isVector) {
        yield* callTool(
          inputSchemaTool,
          {
            input_schema: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  minItems: 2,
                  items: {
                    type: "object",
                    properties: { text: { type: "string" } },
                    required: ["text"],
                  },
                },
              },
              required: ["items"],
            },
          },
          wait,
        );

        const outputLengthTool = findTool(step, "WriteFunctionOutputLength")!;
        yield* callTool(
          outputLengthTool,
          { output_length: { $starlark: "len(input['items'])" } },
          wait,
        );

        const inputSplitTool = findTool(step, "WriteFunctionInputSplit")!;
        yield* callTool(
          inputSplitTool,
          {
            input_split: {
              $starlark: "[{'items': [item]} for item in input['items']]",
            },
          },
          wait,
        );

        const inputMergeTool = findTool(step, "WriteFunctionInputMerge")!;
        yield* callTool(
          inputMergeTool,
          {
            input_merge: {
              $starlark:
                "{'items': [item for sub in input for item in sub['items']]}",
            },
          },
          wait,
        );
      } else {
        yield* callTool(
          inputSchemaTool,
          {
            input_schema: {
              type: "object",
              properties: { text: { type: "string" } },
              required: ["text"],
            },
          },
          wait,
        );
      }

      yield { role: "assistant", content: "Checking fields" };
      await wait();
      yield* callTool(checkFieldsTool, {}, wait);
      return undefined;
    }

    // Step 5: WriteInventEssayTasks
    const essayTasksTool = findTool(step, "WriteInventEssayTasks");
    if (essayTasksTool) {
      yield { role: "assistant", content: "Writing essay tasks" };
      await wait();
      yield* callTool(
        essayTasksTool,
        {
          essay_tasks:
            "Task 1: Evaluate overall quality.\nTask 2: Evaluate clarity.\nTask 3: Evaluate relevance.",
        },
        wait,
      );
      return undefined;
    }

    // Step 6: Body (append tasks one at a time until CheckFunction passes)
    const checkFunctionTool = findTool(step, "CheckFunction");
    if (checkFunctionTool) {
      const appendVectorTask = findTool(step, "AppendVectorTask");
      const appendTask = findTool(step, "AppendTask");

      let taskNum = 0;
      for (;;) {
        // Append one task
        yield { role: "assistant", content: `Creating task ${taskNum}` };
        await wait();

        if (appendVectorTask) {
          // Branch vector: all vector placeholder tasks
          yield* callTool(
            appendVectorTask,
            {
              spec: `Evaluate aspect ${taskNum}`,
              task: {
                type: "placeholder.vector.function",
                input_schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      minItems: 2,
                      items: {
                        type: "object",
                        properties: { text: { type: "string" } },
                        required: ["text"],
                      },
                    },
                  },
                  required: ["items"],
                },
                output_length: { $starlark: "len(input['items'])" },
                input_split: {
                  $starlark: "[{'items': [item]} for item in input['items']]",
                },
                input_merge: {
                  $starlark:
                    "{'items': [item for sub in input for item in sub['items']]}",
                },
                input: { $starlark: "input" },
                output: { $starlark: "output" },
              },
            },
            wait,
          );
        } else if (appendTask && findTool(step, "ReadTaskSpec")) {
          // Branch scalar: placeholder scalar tasks
          yield* callTool(
            appendTask,
            {
              spec: `Evaluate aspect ${taskNum}`,
              task: {
                type: "placeholder.scalar.function",
                input_schema: {
                  type: "object",
                  properties: { text: { type: "string" } },
                  required: ["text"],
                },
                input: { $starlark: "input" },
                output: { $starlark: "output" },
              },
            },
            wait,
          );
        } else if (appendTask) {
          const isVector = !!findTool(step, "ReadFunctionOutputLength");

          if (isVector) {
            // Leaf vector
            yield* callTool(
              appendTask,
              {
                task: {
                  type: "vector.completion",
                  messages: [
                    {
                      role: "user",
                      content: [
                        {
                          type: "text",
                          text: {
                            $starlark: `'Evaluate aspect ${taskNum}: ' + str(input['items'])`,
                          },
                        },
                      ],
                    },
                  ],
                  responses: {
                    $starlark:
                      "[[{'type': 'text', 'text': item['text']}] for item in input['items']]",
                  },
                  output: { $starlark: "output['scores']" },
                },
              },
              wait,
            );
          } else {
            // Leaf scalar
            yield* callTool(
              appendTask,
              {
                task: {
                  type: "vector.completion",
                  messages: [
                    {
                      role: "user",
                      content: [
                        {
                          type: "text",
                          text: {
                            $starlark: `'Evaluate aspect ${taskNum} of: ' + input['text']`,
                          },
                        },
                      ],
                    },
                  ],
                  responses: [
                    [{ type: "text", text: "Excellent" }],
                    [{ type: "text", text: "Good" }],
                    [{ type: "text", text: "Poor" }],
                  ],
                  output: {
                    $starlark:
                      "output['scores'][0] * 1.0 + output['scores'][1] * 0.5 + output['scores'][2] * 0.0",
                  },
                },
              },
              wait,
            );
          }
        }

        taskNum++;

        // Check if we have enough tasks
        yield { role: "assistant", content: "Checking function" };
        await wait();
        const result = await checkFunctionTool.fn({});
        if (result.ok) {
          yield { role: "tool", name: checkFunctionTool.name };
          await wait();
          return undefined;
        }
        yield {
          role: "tool",
          name: checkFunctionTool.name,
          error: result.error,
        };
        await wait();
      }
    }

    // Step 7: WriteFunctionDescription + WriteReadme
    const descTool = findTool(step, "WriteFunctionDescription");
    const readmeTool = findTool(step, "WriteReadme");
    if (descTool && readmeTool) {
      yield { role: "assistant", content: "Writing description and README" };
      await wait();
      yield* callTool(
        descTool,
        {
          description:
            "A mock function that evaluates quality, clarity, and relevance.",
        },
        wait,
      );
      yield* callTool(
        readmeTool,
        {
          readme:
            "# Mock Function\n\nEvaluates quality, clarity, and relevance.",
        },
        wait,
      );
      return undefined;
    }

    throw new Error(
      `Mock agent: unrecognized step with tools: ${step.tools.map((t) => t.name).join(", ")}`,
    );
  };

  const github: GitHubBackend = {
    pushInitial: async () => {},
    pushFinal: async () => {},
    getOwnerRepositoryCommit: async (dir) => {
      const namePath = join(dir, "name.txt");
      if (!existsSync(namePath)) return null;
      try {
        const name = readFileSync(namePath, "utf-8").trim();
        if (!name) return null;
        return { owner: MOCK_OWNER, repository: name, commit: MOCK_COMMIT };
      } catch {
        return null;
      }
    },
    fetchRemoteFunctions: async (refs) => {
      const entries = Array.from(refs);
      const record: Record<string, Functions.RemoteFunction> = {};
      for (const { owner, repository, commit } of entries) {
        const key = `${owner}/${repository}/${commit}`;
        const fn = MOCK_FUNCTIONS[repository as MockName];
        if (!fn) return null;
        record[key] = fn;
      }
      return record;
    },
    repoExists: () => Promise.resolve(false),
  };

  return [agent, github];
}
