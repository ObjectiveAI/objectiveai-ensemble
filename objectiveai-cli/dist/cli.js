#!/usr/bin/env node
import { render, useStdout, useInput, Box, Text } from 'ink';
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join, relative, basename } from 'path';
import { homedir } from 'os';
import z2 from 'zod';
import { tool, createSdkMcpServer, query } from '@anthropic-ai/claude-agent-sdk';
import { Worker } from 'worker_threads';
import { Functions } from 'objectiveai';
import { execSync } from 'child_process';

function useTextInput() {
  const [state, setState] = useState({ text: "", cursor: 0 });
  const handleKey = useCallback(
    (ch, key) => {
      if (key.backspace || key.delete) {
        setState((prev) => {
          if (prev.cursor <= 0) return prev;
          return {
            text: prev.text.slice(0, prev.cursor - 1) + prev.text.slice(prev.cursor),
            cursor: prev.cursor - 1
          };
        });
        return true;
      }
      if (key.leftArrow) {
        setState((prev) => ({ ...prev, cursor: Math.max(0, prev.cursor - 1) }));
        return true;
      }
      if (key.rightArrow) {
        setState((prev) => ({
          ...prev,
          cursor: Math.min(prev.text.length, prev.cursor + 1)
        }));
        return true;
      }
      if (ch && !key.ctrl && !key.meta) {
        setState((prev) => ({
          text: prev.text.slice(0, prev.cursor) + ch + prev.text.slice(prev.cursor),
          cursor: prev.cursor + 1
        }));
        return true;
      }
      return false;
    },
    []
  );
  const clear = useCallback(() => setState({ text: "", cursor: 0 }), []);
  const set = useCallback(
    (text) => setState({ text, cursor: text.length }),
    []
  );
  return [state, { handleKey, clear, set }];
}
var COMMANDS = [
  { name: "/invent", description: "Invent a new ObjectiveAI Function" },
  { name: "/inventplaceholders", description: "Resume inventing placeholder sub-functions" },
  { name: "/config", description: "Open the Config Panel" }
];
var INVENT_WIZARD = [
  {
    label: "What should this function do?",
    helper: "Describe the function's purpose",
    placeholder: ""
  },
  {
    label: "Enter depth",
    helper: "How many levels of sub-functions (0 = leaf only)",
    placeholder: "1"
  },
  {
    label: "Enter minimum width",
    helper: "Minimum tasks per function",
    placeholder: "4"
  },
  {
    label: "Enter maximum width",
    helper: "Maximum tasks per function",
    placeholder: "8"
  }
];
function Menu({ onResult }) {
  const { stdout } = useStdout();
  const termHeight = stdout.rows ?? 24;
  const [{ text: input, cursor: cursorPos }, inputActions] = useTextInput();
  const [wizardStep, setWizardStep] = useState(null);
  const [wizardValues, setWizardValues] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inWizard = wizardStep !== null;
  const commandsOpen = !inWizard && input.length > 0 && input.startsWith("/");
  const filtered = commandsOpen ? COMMANDS.filter((c) => c.name.startsWith(input)) : [];
  const handleCommandEnter = useCallback(
    (cmd) => {
      if (cmd === "/config") {
        onResult({ command: "config" });
      } else if (cmd === "/inventplaceholders") {
        onResult({ command: "inventplaceholders" });
      } else if (cmd === "/invent") {
        setWizardStep(0);
        setWizardValues([]);
        inputActions.clear();
      }
    },
    [onResult]
  );
  const handleWizardEnter = useCallback(
    (value) => {
      if (wizardStep === null) return;
      const step = INVENT_WIZARD[wizardStep];
      const resolved = value.trim() || step.placeholder;
      if (!resolved) return;
      const next = [...wizardValues, resolved];
      if (wizardStep < INVENT_WIZARD.length - 1) {
        setWizardValues(next);
        setWizardStep(wizardStep + 1);
        inputActions.clear();
      } else {
        const [spec, depth, minWidth, maxWidth] = next;
        const depthNum = parseInt(depth, 10);
        const minWidthNum = parseInt(minWidth, 10);
        const maxWidthNum = parseInt(maxWidth, 10);
        onResult({
          command: "invent",
          spec,
          parameters: {
            depth: Number.isFinite(depthNum) ? depthNum : void 0,
            minWidth: Number.isFinite(minWidthNum) ? minWidthNum : void 0,
            maxWidth: Number.isFinite(maxWidthNum) ? maxWidthNum : void 0
          }
        });
      }
    },
    [wizardStep, wizardValues, onResult]
  );
  useInput((ch, key) => {
    if (key.return) {
      if (inWizard) {
        handleWizardEnter(input);
      } else if (commandsOpen && filtered.length === 1) {
        handleCommandEnter(filtered[0].name);
      } else if (commandsOpen && filtered.length > 0) {
        handleCommandEnter(filtered[selectedIndex]?.name ?? filtered[0].name);
      }
      return;
    }
    if ((key.backspace || key.delete) && inWizard && input.length === 0) {
      if (wizardStep > 0) {
        setWizardValues(wizardValues.slice(0, -1));
        setWizardStep(wizardStep - 1);
      } else {
        setWizardStep(null);
        setWizardValues([]);
      }
      inputActions.clear();
      return;
    }
    if (key.escape) {
      if (inWizard) {
        setWizardStep(null);
        setWizardValues([]);
      }
      inputActions.clear();
      return;
    }
    if (key.upArrow && commandsOpen) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
      return;
    }
    if (key.downArrow && commandsOpen) {
      setSelectedIndex((prev) => Math.min(filtered.length - 1, prev + 1));
      return;
    }
    if (inputActions.handleKey(ch, key)) {
      setSelectedIndex(0);
    }
  });
  const currentStep = inWizard ? INVENT_WIZARD[wizardStep] : null;
  let belowHeight = 0;
  if (commandsOpen && filtered.length > 0) belowHeight += filtered.length;
  if (!inWizard && !commandsOpen) belowHeight += 1;
  if (inWizard && currentStep) belowHeight += 1;
  const targetFromBottom = Math.max(
    Math.floor(termHeight / 3),
    belowHeight
  );
  const spacerHeight = Math.max(0, termHeight - 1 - targetFromBottom);
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", height: termHeight, children: [
    /* @__PURE__ */ jsx(Box, { height: spacerHeight }),
    /* @__PURE__ */ jsxs(Box, { children: [
      /* @__PURE__ */ jsx(Text, { color: "#5948e7", bold: true, children: "\u276F " }),
      input.length > 0 ? /* @__PURE__ */ jsxs(Text, { children: [
        input.slice(0, cursorPos),
        /* @__PURE__ */ jsx(Text, { dimColor: true, children: "\u2588" }),
        input.slice(cursorPos)
      ] }) : currentStep && currentStep.placeholder ? /* @__PURE__ */ jsxs(Text, { children: [
        "\u2588",
        /* @__PURE__ */ jsx(Text, { color: "gray", children: currentStep.placeholder })
      ] }) : /* @__PURE__ */ jsx(Text, { dimColor: true, children: "\u2588" })
    ] }),
    /* @__PURE__ */ jsx(Box, { flexGrow: 1 }),
    inWizard && currentStep && /* @__PURE__ */ jsxs(Text, { dimColor: true, children: [
      "  ",
      currentStep.label,
      " \u2014 ",
      currentStep.helper
    ] }),
    commandsOpen && filtered.length > 0 && /* @__PURE__ */ jsx(Box, { flexDirection: "column", children: filtered.map((cmd, i) => /* @__PURE__ */ jsxs(Text, { children: [
      i === selectedIndex ? /* @__PURE__ */ jsxs(Text, { color: "#5948e7", bold: true, children: [
        "  ",
        cmd.name
      ] }) : /* @__PURE__ */ jsxs(Text, { dimColor: true, children: [
        "  ",
        cmd.name
      ] }),
      /* @__PURE__ */ jsxs(Text, { dimColor: true, children: [
        "  ",
        cmd.description
      ] })
    ] }, cmd.name)) }),
    !inWizard && !commandsOpen && /* @__PURE__ */ jsx(Text, { dimColor: true, children: "  type / for commands" })
  ] });
}
function functionsDir(owner) {
  return join(homedir(), ".objectiveai", "functions", owner);
}

// src/agent/mock.ts
var MOCK_OWNER = "mock";
var MOCK_COMMIT = "mock";
function getMockVariant(type, depth) {
  const tier = depth > 0 ? "branch" : "leaf";
  const kind = type === "vector.function" ? "vector" : "scalar";
  return `mock-${tier}-${kind}`;
}
function getNextMockName(type, depth) {
  const variant = getMockVariant(type, depth);
  const dir = functionsDir(MOCK_OWNER);
  const pattern = new RegExp(`^${variant}-(\\d+)$`);
  let max = 0;
  try {
    for (const entry of readdirSync(dir)) {
      const match = entry.match(pattern);
      if (match) max = Math.max(max, parseInt(match[1], 10));
    }
  } catch {
  }
  return `${variant}-${max + 1}`;
}
function stripMockSuffix(repository) {
  return repository.replace(/-\d+$/, "");
}
var MOCK_LEAF_SCALAR = {
  type: "scalar.function",
  description: "Mock leaf scalar function",
  input_schema: {
    type: "object",
    properties: { text: { type: "string" } },
    required: ["text"]
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
              text: { $starlark: "'Rate: ' + input['text']" }
            }
          ]
        }
      ],
      responses: [
        [{ type: "text", text: "Good" }],
        [{ type: "text", text: "Bad" }]
      ],
      output: { $starlark: "output['scores'][0]" }
    }
  ]
};
var MOCK_LEAF_VECTOR = {
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
          required: ["text"]
        }
      }
    },
    required: ["items"]
  },
  output_length: { $starlark: "len(input['items'])" },
  input_split: {
    $starlark: "[{'items': [item]} for item in input['items']]"
  },
  input_merge: {
    $starlark: "{'items': [item for sub in input for item in sub['items']]}"
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
              text: { $starlark: "'Rank: ' + str(input['items'])" }
            }
          ]
        }
      ],
      responses: {
        $starlark: "[[{'type': 'text', 'text': item['text']}] for item in input['items']]"
      },
      output: { $starlark: "output['scores']" }
    }
  ]
};
var MOCK_BRANCH_SCALAR = {
  type: "scalar.function",
  description: "Mock branch scalar function",
  input_schema: {
    type: "object",
    properties: { text: { type: "string" } },
    required: ["text"]
  },
  tasks: [
    {
      type: "placeholder.scalar.function",
      input_schema: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"]
      },
      input: { $starlark: "input" },
      output: { $starlark: "output" }
    }
  ]
};
var MOCK_BRANCH_VECTOR = {
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
          required: ["text"]
        }
      }
    },
    required: ["items"]
  },
  output_length: { $starlark: "len(input['items'])" },
  input_split: {
    $starlark: "[{'items': [item]} for item in input['items']]"
  },
  input_merge: {
    $starlark: "{'items': [item for sub in input for item in sub['items']]}"
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
              required: ["text"]
            }
          }
        },
        required: ["items"]
      },
      output_length: { $starlark: "len(input['items'])" },
      input_split: {
        $starlark: "[{'items': [item]} for item in input['items']]"
      },
      input_merge: {
        $starlark: "{'items': [item for sub in input for item in sub['items']]}"
      },
      input: { $starlark: "input" },
      output: { $starlark: "output" }
    }
  ]
};
var MOCK_FUNCTIONS = {
  "mock-leaf-scalar": MOCK_LEAF_SCALAR,
  "mock-leaf-vector": MOCK_LEAF_VECTOR,
  "mock-branch-scalar": MOCK_BRANCH_SCALAR,
  "mock-branch-vector": MOCK_BRANCH_VECTOR
};
function findTool(step, name) {
  return step.tools.find((t) => t.name === name);
}
async function* callTool(tool2, args, wait) {
  const result = await tool2.fn(args);
  if (result.ok) {
    yield { role: "tool", name: tool2.name };
  } else {
    yield { role: "tool", name: tool2.name, error: result.error };
  }
  await wait();
}
function mock() {
  const { notificationDelayMs = 100 } = getAgentMockConfig() || {};
  const wait = () => new Promise((resolve) => {
    const jitter = notificationDelayMs * (0.5 + Math.random());
    setTimeout(resolve, jitter);
  });
  const agent = async function* (step, _state, parameters) {
    const typeTool = findTool(step, "WriteFunctionType");
    if (typeTool) {
      const type = Math.random() < 0.5 ? "scalar.function" : "vector.function";
      yield { role: "assistant", content: `Setting function type to ${type}` };
      await wait();
      yield* callTool(typeTool, { type }, wait);
      return void 0;
    }
    const nameTool = findTool(step, "WriteFunctionName");
    if (nameTool) {
      const readTypeTool = findTool(step, "ReadFunctionType");
      let type = "scalar.function";
      if (readTypeTool) {
        const result = await readTypeTool.fn({});
        if (result.ok)
          type = result.value;
      }
      for (; ; ) {
        const name = getNextMockName(type, parameters.depth);
        yield {
          role: "assistant",
          content: `Setting function name to "${name}"`
        };
        await wait();
        const result = await nameTool.fn({ name });
        if (result.ok) {
          yield { role: "tool", name: nameTool.name };
          await wait();
          break;
        }
        yield { role: "tool", name: nameTool.name, error: result.error };
        await wait();
      }
      return void 0;
    }
    const essayTool = findTool(step, "WriteInventEssay");
    if (essayTool) {
      yield { role: "assistant", content: "Writing essay" };
      await wait();
      yield* callTool(
        essayTool,
        {
          essay: "This function evaluates quality by examining multiple aspects of the input. Each task assesses a different dimension."
        },
        wait
      );
      yield {
        role: "assistant",
        content: "I've written the essay describing the function's approach.\nIt covers the key evaluation dimensions:\n- Quality assessment\n- Clarity scoring\n- Relevance matching"
      };
      await wait();
      return void 0;
    }
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
                    required: ["text"]
                  }
                }
              },
              required: ["items"]
            }
          },
          wait
        );
        const outputLengthTool = findTool(step, "WriteFunctionOutputLength");
        yield* callTool(
          outputLengthTool,
          { output_length: { $starlark: "len(input['items'])" } },
          wait
        );
        const inputSplitTool = findTool(step, "WriteFunctionInputSplit");
        yield* callTool(
          inputSplitTool,
          {
            input_split: {
              $starlark: "[{'items': [item]} for item in input['items']]"
            }
          },
          wait
        );
        const inputMergeTool = findTool(step, "WriteFunctionInputMerge");
        yield* callTool(
          inputMergeTool,
          {
            input_merge: {
              $starlark: "{'items': [item for sub in input for item in sub['items']]}"
            }
          },
          wait
        );
      } else {
        yield* callTool(
          inputSchemaTool,
          {
            input_schema: {
              type: "object",
              properties: { text: { type: "string" } },
              required: ["text"]
            }
          },
          wait
        );
      }
      yield { role: "assistant", content: "Checking fields" };
      await wait();
      yield* callTool(checkFieldsTool, {}, wait);
      return void 0;
    }
    const essayTasksTool = findTool(step, "WriteInventEssayTasks");
    if (essayTasksTool) {
      yield { role: "assistant", content: "Writing essay tasks" };
      await wait();
      yield* callTool(
        essayTasksTool,
        {
          essay_tasks: "Task 1: Evaluate overall quality.\nTask 2: Evaluate clarity.\nTask 3: Evaluate relevance."
        },
        wait
      );
      return void 0;
    }
    const checkFunctionTool = findTool(step, "CheckFunction");
    if (checkFunctionTool) {
      const appendVectorTask = findTool(step, "AppendVectorTask");
      const appendTask = findTool(step, "AppendTask");
      let taskNum = 0;
      for (; ; ) {
        yield { role: "assistant", content: `Creating task ${taskNum}` };
        await wait();
        if (appendVectorTask) {
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
                        required: ["text"]
                      }
                    }
                  },
                  required: ["items"]
                },
                output_length: { $starlark: "len(input['items'])" },
                input_split: {
                  $starlark: "[{'items': [item]} for item in input['items']]"
                },
                input_merge: {
                  $starlark: "{'items': [item for sub in input for item in sub['items']]}"
                },
                input: { $starlark: "input" },
                output: { $starlark: "output" }
              }
            },
            wait
          );
        } else if (appendTask && findTool(step, "ReadTaskSpec")) {
          yield* callTool(
            appendTask,
            {
              spec: `Evaluate aspect ${taskNum}`,
              task: {
                type: "placeholder.scalar.function",
                input_schema: {
                  type: "object",
                  properties: { text: { type: "string" } },
                  required: ["text"]
                },
                input: { $starlark: "input" },
                output: { $starlark: "output" }
              }
            },
            wait
          );
        } else if (appendTask) {
          const isVector = !!findTool(step, "ReadFunctionOutputLength");
          if (isVector) {
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
                            $starlark: `'Evaluate aspect ${taskNum}: ' + str(input['items'])`
                          }
                        }
                      ]
                    }
                  ],
                  responses: {
                    $starlark: "[[{'type': 'text', 'text': item['text']}] for item in input['items']]"
                  },
                  output: { $starlark: "output['scores']" }
                }
              },
              wait
            );
          } else {
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
                            $starlark: `'Evaluate aspect ${taskNum} of: ' + input['text']`
                          }
                        }
                      ]
                    }
                  ],
                  responses: [
                    [{ type: "text", text: "Excellent" }],
                    [{ type: "text", text: "Good" }],
                    [{ type: "text", text: "Poor" }]
                  ],
                  output: {
                    $starlark: "output['scores'][0] * 1.0 + output['scores'][1] * 0.5 + output['scores'][2] * 0.0"
                  }
                }
              },
              wait
            );
          }
        }
        taskNum++;
        yield { role: "assistant", content: "Checking function" };
        await wait();
        const result = await checkFunctionTool.fn({});
        if (result.ok) {
          yield { role: "tool", name: checkFunctionTool.name };
          await wait();
          yield {
            role: "assistant",
            content: "Function validation passed successfully.\nAll tasks compile correctly and produce valid outputs.\nThe function is ready for deployment."
          };
          await wait();
          return void 0;
        }
        yield {
          role: "tool",
          name: checkFunctionTool.name,
          error: result.error
        };
        await wait();
      }
    }
    const descTool = findTool(step, "WriteFunctionDescription");
    const readmeTool = findTool(step, "WriteReadme");
    if (descTool && readmeTool) {
      yield { role: "assistant", content: "Writing description and README" };
      await wait();
      yield* callTool(
        descTool,
        {
          description: "A mock function that evaluates quality, clarity, and relevance."
        },
        wait
      );
      const isBranch = !!findTool(step, "ReadTaskSpec");
      let readmeContent = "# Mock Function\n\nEvaluates quality, clarity, and relevance.";
      if (isBranch) {
        const tasksLengthTool = findTool(step, "ReadTasksLength");
        let taskCount = 1;
        if (tasksLengthTool) {
          const result = await tasksLengthTool.fn({});
          if (result.ok) taskCount = parseInt(result.value, 10) || 1;
        }
        readmeContent += "\n\n## Sub-functions\n";
        for (let i = 0; i < taskCount; i++) {
          readmeContent += `
- https://github.com/{{ .Owner }}/{{ .Task${i} }}`;
        }
      }
      yield* callTool(readmeTool, { readme: readmeContent }, wait);
      return void 0;
    }
    throw new Error(
      `Mock agent: unrecognized step with tools: ${step.tools.map((t) => t.name).join(", ")}`
    );
  };
  const github = {
    pushInitial: async () => {
    },
    pushFinal: async () => {
    },
    getOwnerRepositoryCommit: async (dir) => {
      const paramsPath = join(dir, "parameters.json");
      if (!existsSync(paramsPath)) return null;
      const name = basename(dir);
      if (!name) return null;
      return { owner: MOCK_OWNER, repository: name, commit: MOCK_COMMIT };
    },
    fetchRemoteFunctions: async (refs) => {
      const entries = Array.from(refs);
      const record = {};
      for (const { owner, repository, commit: commit2 } of entries) {
        const key = `${owner}/${repository}/${commit2}`;
        const variant = stripMockSuffix(repository);
        const fn = MOCK_FUNCTIONS[variant];
        if (!fn) return null;
        record[key] = fn;
      }
      return record;
    },
    repoExists: () => Promise.resolve(false),
    getAuthenticatedUser: async () => MOCK_OWNER
  };
  return [agent, github];
}
process.setMaxListeners(0);
function resultToCallToolResult(result) {
  if (!result.ok) {
    return { content: [{ type: "text", text: result.error }], isError: true };
  }
  return { content: [{ type: "text", text: result.value ?? "OK" }] };
}
var STEP_TO_CONFIG_KEY = {
  type: "typeModel",
  name: "nameModel",
  essay: "essayModel",
  fields: "fieldsModel",
  essay_tasks: "essayTasksModel",
  body: "bodyModel",
  description: "descriptionModel"
};
var CLAUDE_MODEL_TO_QUERY = {
  opus: "default",
  sonnet: "sonnet",
  haiku: "haiku"
};
function claude() {
  const agent = async function* (step, state, _parameters) {
    const notifications = [];
    const sdkTools = step.tools.map(
      (t) => tool(t.name, t.description, t.inputSchema, async (args) => {
        const result = await t.fn(args);
        notifications.push(
          result.ok ? { role: "tool", name: t.name } : { role: "tool", name: t.name, error: result.error }
        );
        return resultToCallToolResult(result);
      })
    );
    const mcpServer = createSdkMcpServer({
      name: "invent",
      tools: sdkTools
    });
    const claudeConfig = getAgentClaudeConfig();
    const configKey = STEP_TO_CONFIG_KEY[step.stepName];
    const claudeModel = claudeConfig[configKey];
    const stream = query({
      prompt: step.prompt,
      options: {
        mcpServers: { invent: mcpServer },
        allowedTools: ["mcp__invent__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: state?.sessionId,
        ...claudeModel ? { model: CLAUDE_MODEL_TO_QUERY[claudeModel] } : {}
      }
    });
    let sessionId = state?.sessionId;
    const onUncaughtException = (err) => {
      if (err?.code === "ERR_STREAM_WRITE_AFTER_END") {
        return;
      }
      throw err;
    };
    process.on("uncaughtException", onUncaughtException);
    try {
      for await (const message of stream) {
        while (notifications.length > 0) {
          yield notifications.shift();
        }
        if (message.type === "system" && message.subtype === "init") {
          sessionId = message.session_id;
        }
        if (message.type === "assistant") {
          const parts = [];
          for (const block of message.message.content) {
            if (block.type === "text") {
              const text = block.text.trim();
              if (text) parts.push(text);
            }
          }
          if (parts.length > 0) {
            yield { role: "assistant", content: parts.join("\n") };
          }
        }
      }
    } finally {
      process.removeListener("uncaughtException", onUncaughtException);
    }
    while (notifications.length > 0) {
      yield notifications.shift();
    }
    return { sessionId };
  };
  return [agent, null];
}

// src/agent/index.ts
var MockAgentUpstreamSchema = z2.literal("mock");
var ClaudeAgentUpstreamSchema = z2.literal("claude");
var AgentUpstreamSchema = z2.union([
  MockAgentUpstreamSchema,
  ClaudeAgentUpstreamSchema
]);
z2.union([
  z2.literal("type"),
  z2.literal("name"),
  z2.literal("essay"),
  z2.literal("fields"),
  z2.literal("essay_tasks"),
  z2.literal("body"),
  z2.literal("description")
]);
function getAgentStepFn(agentUpstream) {
  if (agentUpstream === "mock") {
    return mock();
  } else if (agentUpstream === "claude") {
    return claude();
  } else {
    const _exhaustiveCheck = agentUpstream;
    return _exhaustiveCheck;
  }
}

// src/config.ts
function readConfigFile(dir) {
  try {
    const raw = readFileSync(join(dir, ".objectiveai", "config.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return void 0;
  }
}
function getValue(env, key, deserialize) {
  if (env)
    return deserialize ? deserialize(env) : env;
  const project = readConfigFile(process.cwd());
  if (project?.[key] !== void 0)
    return project[key];
  const user = readConfigFile(homedir());
  if (user?.[key] !== void 0) return user[key];
  return null;
}
function getGitHubToken() {
  return getValue(process.env.OBJECTIVEAI_GITHUB_TOKEN, "gitHubToken");
}
function getAgentUpstream() {
  const raw = getValue(process.env.OBJECTIVEAI_AGENT, "agent");
  if (raw === null) return null;
  const parsed = AgentUpstreamSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data;
}
function getAgentMockConfig() {
  const raw = getValue(
    process.env.OBJECTIVEAI_AGENT_MOCK_NOTIFICATION_DELAY_MS,
    "agentMockNotificationDelayMs"
  );
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return { notificationDelayMs: n };
}
var CLAUDE_MODELS = ["opus", "sonnet", "haiku"];
function parseClaudeModel(value) {
  if (typeof value === "string" && CLAUDE_MODELS.includes(value)) {
    return value;
  }
  return void 0;
}
function getAgentClaudeConfig() {
  const config = {
    ...readConfigFile(homedir()) ?? {},
    ...readConfigFile(process.cwd()) ?? {}
  };
  return {
    typeModel: parseClaudeModel(config.agentClaudeTypeModel),
    nameModel: parseClaudeModel(config.agentClaudeNameModel),
    essayModel: parseClaudeModel(config.agentClaudeEssayModel),
    fieldsModel: parseClaudeModel(config.agentClaudeFieldsModel),
    essayTasksModel: parseClaudeModel(config.agentClaudeEssayTasksModel),
    bodyModel: parseClaudeModel(config.agentClaudeBodyModel),
    descriptionModel: parseClaudeModel(config.agentClaudeDescriptionModel)
  };
}
var homeConfigDir = () => join(homedir(), ".objectiveai");
var homeConfigPath = () => join(homeConfigDir(), "config.json");
function readHomeConfig() {
  try {
    return JSON.parse(readFileSync(homeConfigPath(), "utf-8"));
  } catch {
    return {};
  }
}
function writeHomeConfig(config) {
  const dir = homeConfigDir();
  mkdirSync(dir, { recursive: true });
  writeFileSync(homeConfigPath(), JSON.stringify(config, null, 2) + "\n");
}
function setHomeConfigValue(key, value) {
  const config = readHomeConfig();
  config[key] = value;
  writeHomeConfig(config);
}
function deleteHomeConfigValue(key) {
  const config = readHomeConfig();
  delete config[key];
  writeHomeConfig(config);
}
function SelectableList({
  items,
  selectedIndex,
  labelWidth,
  viewportHeight
}) {
  let visibleItems = items;
  let startIndex = 0;
  if (viewportHeight !== void 0 && items.length > viewportHeight) {
    const half = Math.floor(viewportHeight / 2);
    startIndex = Math.max(0, Math.min(selectedIndex - half, items.length - viewportHeight));
    visibleItems = items.slice(startIndex, startIndex + viewportHeight);
  }
  return /* @__PURE__ */ jsx(Box, { flexDirection: "column", children: visibleItems.map((item, i) => {
    const actualIndex = startIndex + i;
    const selected = actualIndex === selectedIndex;
    const prefix = selected ? "\u276F " : "  ";
    return /* @__PURE__ */ jsxs(Box, { children: [
      selected ? /* @__PURE__ */ jsxs(Text, { color: "#5948e7", bold: true, children: [
        prefix,
        item.label.padEnd(labelWidth)
      ] }) : /* @__PURE__ */ jsxs(Text, { dimColor: true, children: [
        prefix,
        item.label.padEnd(labelWidth)
      ] }),
      /* @__PURE__ */ jsx(Text, { dimColor: !selected, children: item.value })
    ] }, item.key);
  }) });
}
var CLAUDE_MODELS2 = ["opus", "sonnet", "haiku"];
var CONFIG_ITEMS = [
  { label: "GitHub Token", key: "gitHubToken", kind: "text" },
  { label: "Git Author Name", key: "gitAuthorName", kind: "text" },
  { label: "Git Author Email", key: "gitAuthorEmail", kind: "text" },
  {
    label: "Agent",
    key: "agent",
    kind: "toggle",
    options: ["mock", "claude"]
  },
  {
    label: "Mock Agent Notification Delay Milliseconds",
    key: "agentMockNotificationDelayMs",
    kind: "text",
    validate: (v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0;
    }
  },
  {
    label: "Claude Agent Type Model",
    key: "agentClaudeTypeModel",
    kind: "toggle",
    options: CLAUDE_MODELS2
  },
  {
    label: "Claude Agent Name Model",
    key: "agentClaudeNameModel",
    kind: "toggle",
    options: CLAUDE_MODELS2
  },
  {
    label: "Claude Agent Essay Model",
    key: "agentClaudeEssayModel",
    kind: "toggle",
    options: CLAUDE_MODELS2
  },
  {
    label: "Claude Agent Fields Model",
    key: "agentClaudeFieldsModel",
    kind: "toggle",
    options: CLAUDE_MODELS2
  },
  {
    label: "Claude Agent Essay Tasks Model",
    key: "agentClaudeEssayTasksModel",
    kind: "toggle",
    options: CLAUDE_MODELS2
  },
  {
    label: "Claude Agent Body Model",
    key: "agentClaudeBodyModel",
    kind: "toggle",
    options: CLAUDE_MODELS2
  },
  {
    label: "Claude Agent Description Model",
    key: "agentClaudeDescriptionModel",
    kind: "toggle",
    options: CLAUDE_MODELS2
  }
];
var LABEL_WIDTH = Math.max(...CONFIG_ITEMS.map((item) => item.label.length)) + 2;
function Config({ onBack }) {
  const { stdout } = useStdout();
  const termHeight = stdout.rows ?? 24;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [{ text: editValue, cursor: cursorPos }, editActions] = useTextInput();
  const [values, setValues] = useState(() => {
    const config = readHomeConfig();
    const result = {};
    for (const item of CONFIG_ITEMS) {
      const v = config[item.key];
      result[item.key] = v !== void 0 ? String(v) : void 0;
    }
    return result;
  });
  const saveValue = (item, value) => {
    if (item.key === "agentMockNotificationDelayMs") {
      setHomeConfigValue(item.key, Number(value));
    } else {
      setHomeConfigValue(item.key, value);
    }
    setValues((prev) => ({ ...prev, [item.key]: value }));
  };
  const clearValue = (item) => {
    deleteHomeConfigValue(item.key);
    setValues((prev) => ({ ...prev, [item.key]: void 0 }));
  };
  useInput((ch, key) => {
    if (editing) {
      if (key.escape) {
        setEditing(false);
        return;
      }
      if (key.return) {
        const item = CONFIG_ITEMS[selectedIndex];
        const trimmed = editValue.trim();
        if (trimmed === "") {
          clearValue(item);
        } else if (item.kind === "text" && item.validate && !item.validate(trimmed)) {
          return;
        } else {
          saveValue(item, trimmed);
        }
        setEditing(false);
        return;
      }
      editActions.handleKey(ch, key);
      return;
    }
    if (key.escape) {
      onBack();
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(CONFIG_ITEMS.length - 1, prev + 1));
      return;
    }
    if (key.return) {
      const item = CONFIG_ITEMS[selectedIndex];
      if (item.kind === "toggle") {
        const current = values[item.key];
        const idx = current ? item.options.indexOf(current) : -1;
        const next = (idx + 1) % (item.options.length + 1);
        if (next === item.options.length) {
          clearValue(item);
        } else {
          saveValue(item, item.options[next]);
        }
      } else {
        setEditing(true);
        editActions.set(values[item.key] ?? "");
      }
    }
  });
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", height: termHeight, children: [
    /* @__PURE__ */ jsx(Box, { children: /* @__PURE__ */ jsx(Text, { bold: true, color: "#5948e7", children: "Config" }) }),
    /* @__PURE__ */ jsx(Box, { height: 1 }),
    editing ? /* @__PURE__ */ jsx(Fragment, { children: CONFIG_ITEMS.map((item, i) => {
      const selected = i === selectedIndex;
      const value = values[item.key];
      const prefix = selected ? "\u276F " : "  ";
      return /* @__PURE__ */ jsxs(Box, { children: [
        selected ? /* @__PURE__ */ jsxs(Text, { color: "#5948e7", bold: true, children: [
          prefix,
          item.label.padEnd(LABEL_WIDTH)
        ] }) : /* @__PURE__ */ jsxs(Text, { dimColor: true, children: [
          prefix,
          item.label.padEnd(LABEL_WIDTH)
        ] }),
        selected ? /* @__PURE__ */ jsxs(Text, { children: [
          editValue.slice(0, cursorPos),
          "\u2588",
          editValue.slice(cursorPos)
        ] }) : value !== void 0 ? /* @__PURE__ */ jsx(Text, { dimColor: true, children: value }) : /* @__PURE__ */ jsx(Text, { color: "gray", dimColor: true, children: "unset" })
      ] }, item.key);
    }) }) : /* @__PURE__ */ jsx(
      SelectableList,
      {
        items: CONFIG_ITEMS.map((item) => ({
          key: item.key,
          label: item.label,
          value: values[item.key] ?? "unset"
        })),
        selectedIndex,
        labelWidth: LABEL_WIDTH
      }
    ),
    /* @__PURE__ */ jsx(Box, { flexGrow: 1 }),
    /* @__PURE__ */ jsx(Text, { dimColor: true, children: "  press esc to go back" })
  ] });
}
function useInventWorker(onNotification, message) {
  const [done, setDone] = useState(false);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const workerPath = new URL("./inventWorker.js", import.meta.url);
    const worker = new Worker(workerPath);
    worker.on("message", (msg) => {
      if (msg.type === "notification") {
        onNotification(msg.notification);
      } else if (msg.type === "done" || msg.type === "error") {
        if (msg.type === "error") {
          console.error("Worker error:", msg.message);
        }
        setDone(true);
      }
    });
    worker.on("error", (err) => {
      console.error("Worker thread error:", err);
      setDone(true);
    });
    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Worker exited with code ${code}`);
      }
      setDone(true);
    });
    worker.postMessage(message);
    return () => {
      worker.terminate();
    };
  }, []);
  return done;
}
function findOrCreateNode(root, path) {
  let node = root;
  for (const index of path) {
    if (!node.children.has(index)) {
      node.children.set(index, {
        messages: [],
        done: false,
        waiting: false,
        children: /* @__PURE__ */ new Map()
      });
    }
    node = node.children.get(index);
  }
  return node;
}
function cloneTree(node) {
  return {
    ...node,
    messages: [...node.messages],
    children: new Map(
      Array.from(node.children.entries()).map(([k, v]) => [k, cloneTree(v)])
    )
  };
}
function useInventNotifications() {
  const [tree, setTree] = useState({
    messages: [],
    done: false,
    waiting: false,
    children: /* @__PURE__ */ new Map()
  });
  const onNotification = useCallback((notification) => {
    setTree((prev) => {
      const next = cloneTree(prev);
      const node = findOrCreateNode(next, notification.path);
      if (notification.name !== void 0) {
        node.name = notification.name;
      }
      if (notification.message.role === "done") {
        node.done = true;
        node.waiting = false;
        if (notification.message.error) {
          node.error = notification.message.error;
        }
        if (notification.message.functionTasks !== void 0) {
          node.functionTasks = notification.message.functionTasks;
        }
        if (notification.message.placeholderTasks !== void 0) {
          node.placeholderTasks = notification.message.placeholderTasks;
        }
      } else if (notification.message.role === "waiting") {
        node.waiting = true;
      } else {
        node.messages.push(notification.message);
        if (node.messages.length > 5) {
          node.messages = node.messages.slice(-5);
        }
      }
      return next;
    });
  }, []);
  return { tree, onNotification };
}
function flattenNode(node, gutter, isLast, isRoot, termWidth) {
  const lines = [];
  const prefix = isRoot ? "" : isLast ? "\u2514\u2500 " : "\u251C\u2500 ";
  const continuation = isRoot ? "" : isLast ? "   " : "\u2502  ";
  const childGutter = gutter + continuation;
  lines.push({
    type: "title",
    gutter,
    prefix,
    name: node.name ?? "Unnamed Function",
    done: node.done,
    waiting: node.waiting,
    error: node.error,
    functionTasks: node.functionTasks,
    placeholderTasks: node.placeholderTasks
  });
  const children = Array.from(node.children.entries());
  if (node.done && node.error && node.functionTasks !== void 0) {
    const errorGutter = children.length > 0 ? childGutter + "\u2502  " : childGutter;
    for (const errLine of node.error.split("\n")) {
      if (errLine) lines.push({ type: "text", text: errorGutter + "\u2717 " + errLine, color: "red" });
    }
  }
  if (!node.done && !node.waiting && node.messages.length > 0) {
    for (const msg of node.messages) {
      flattenMessage(lines, childGutter, msg, termWidth);
    }
  }
  if (!node.done && !node.waiting) {
    lines.push({ type: "loading", gutter: childGutter });
  }
  for (let i = 0; i < children.length; i++) {
    const [, child] = children[i];
    lines.push(
      ...flattenNode(child, childGutter, i === children.length - 1, false, termWidth)
    );
  }
  return lines;
}
function capLines(rawLines, max = 5) {
  if (rawLines.length <= max) return rawLines;
  return [...rawLines.slice(0, 2), "...", ...rawLines.slice(-2)];
}
function flattenMessage(lines, gutter, msg, termWidth) {
  if (msg.role === "assistant") {
    const indent = gutter + "  ";
    const rawLines = capLines(msg.content.split("\n"));
    for (const raw of rawLines) {
      const wrapped = wrapIndent(raw, termWidth - indent.length, indent);
      for (const row of wrapped.split("\n")) {
        lines.push({ type: "text", text: row, wrap: "truncate" });
      }
    }
  } else if (msg.role === "tool") {
    if (msg.error) {
      const errIndent = gutter + "    ";
      const rawLines = capLines(msg.error.split("\n"));
      const firstPrefixLen = gutter.length + 4 + msg.name.length + 3;
      for (let j = 0; j < rawLines.length; j++) {
        if (j === 0) {
          const wrapped = wrapIndent(rawLines[0], termWidth - firstPrefixLen, errIndent);
          const wrappedRows = wrapped.split("\n");
          const firstRow = gutter + "  \u2717 " + msg.name + " \u2014 " + wrappedRows[0].slice(errIndent.length);
          lines.push({ type: "text", text: firstRow, color: "red", wrap: "truncate" });
          for (let k = 1; k < wrappedRows.length; k++) {
            lines.push({ type: "text", text: wrappedRows[k], color: "red", wrap: "truncate" });
          }
        } else {
          const wrapped = wrapIndent(rawLines[j], termWidth - errIndent.length, errIndent);
          for (const row of wrapped.split("\n")) {
            lines.push({ type: "text", text: row, color: "red", wrap: "truncate" });
          }
        }
      }
    } else {
      lines.push({ type: "toolSuccess", gutter, name: msg.name });
    }
  }
}
function wrapIndent(text, width, indent) {
  if (width <= 0) return indent + text;
  const lines = [];
  for (const segment of text.split("\n")) {
    if (segment.length <= width) {
      lines.push(segment);
      continue;
    }
    let remaining = segment;
    while (remaining.length > width) {
      let breakAt = remaining.lastIndexOf(" ", width);
      if (breakAt <= 0) breakAt = width;
      lines.push(remaining.slice(0, breakAt));
      remaining = remaining.slice(breakAt === width ? breakAt : breakAt + 1);
    }
    if (remaining) lines.push(remaining);
  }
  return indent + lines.join("\n" + indent);
}
var LOADING_FRAMES = ["\xB7  ", "\xB7\xB7 ", "\xB7\xB7\xB7"];
function RenderLine({ line, tick }) {
  if (line.type === "title") {
    return /* @__PURE__ */ jsxs(Text, { children: [
      line.gutter,
      line.prefix,
      /* @__PURE__ */ jsx(Text, { bold: true, color: "#5948e7", children: line.name }),
      line.waiting && !line.done && /* @__PURE__ */ jsxs(Text, { color: "#5948e7", children: [
        " \u2014 Waiting",
        /* @__PURE__ */ jsx(Text, { dimColor: true, children: LOADING_FRAMES[tick % LOADING_FRAMES.length] })
      ] }),
      line.done && !line.error && /* @__PURE__ */ jsxs(Text, { color: "#5948e7", children: [
        " \u2014 Complete",
        line.functionTasks !== void 0 && line.placeholderTasks !== void 0 && ` [${line.functionTasks}/${line.functionTasks + line.placeholderTasks}]`
      ] }),
      line.done && line.error && line.functionTasks !== void 0 && line.placeholderTasks !== void 0 && /* @__PURE__ */ jsxs(Text, { color: "#5948e7", children: [
        " \u2014 ",
        `[${line.functionTasks}/${line.functionTasks + line.placeholderTasks}]`
      ] }),
      line.done && line.error && (line.functionTasks === void 0 || line.placeholderTasks === void 0) && /* @__PURE__ */ jsxs(Text, { color: "red", children: [
        " \u2014 ",
        line.error
      ] })
    ] });
  }
  if (line.type === "toolSuccess") {
    return /* @__PURE__ */ jsxs(Text, { children: [
      line.gutter,
      /* @__PURE__ */ jsxs(Text, { color: "green", children: [
        "  \u2713 ",
        line.name
      ] })
    ] });
  }
  if (line.type === "text") {
    if (line.color) {
      return /* @__PURE__ */ jsx(Text, { wrap: line.wrap, children: /* @__PURE__ */ jsx(Text, { color: line.color, children: line.text }) });
    }
    return /* @__PURE__ */ jsx(Text, { wrap: line.wrap, children: line.text });
  }
  if (line.type === "loading") {
    return /* @__PURE__ */ jsxs(Text, { children: [
      line.gutter,
      /* @__PURE__ */ jsxs(Text, { dimColor: true, children: [
        "  ",
        LOADING_FRAMES[tick % LOADING_FRAMES.length]
      ] })
    ] });
  }
  return null;
}
function Scrollbar({
  totalLines,
  viewportHeight,
  scrollOffset
}) {
  if (viewportHeight <= 0) return null;
  const track = [];
  if (totalLines <= viewportHeight) {
    for (let i = 0; i < viewportHeight; i++) {
      track.push("\u2588");
    }
  } else {
    const thumbSize = Math.max(1, Math.round(viewportHeight / totalLines * viewportHeight));
    const maxOffset = totalLines - viewportHeight;
    const thumbStart = maxOffset > 0 ? Math.round(scrollOffset / maxOffset * (viewportHeight - thumbSize)) : 0;
    for (let i = 0; i < viewportHeight; i++) {
      if (i >= thumbStart && i < thumbStart + thumbSize) {
        track.push("\u2588");
      } else {
        track.push("\u2591");
      }
    }
  }
  return /* @__PURE__ */ jsx(Box, { flexDirection: "column", width: 1, children: track.map((ch, i) => /* @__PURE__ */ jsx(Text, { dimColor: true, children: ch }, i)) });
}
function InventFlow({
  spec,
  parameters,
  onBack
}) {
  const { tree, onNotification } = useInventNotifications();
  const done = useInventWorker(onNotification, {
    type: "invent",
    options: { inventSpec: spec, parameters }
  });
  useInput((_ch, key) => {
    if (key.escape && done) onBack();
  });
  return /* @__PURE__ */ jsx(InventView, { tree, done });
}
function InventView({ tree, done }) {
  const { stdout } = useStdout();
  const [scrollOffset, setScrollOffset] = useState(0);
  const [autoFollow, setAutoFollow] = useState(true);
  const [termHeight, setTermHeight] = useState(stdout.rows ?? 24);
  const [termWidth, setTermWidth] = useState(stdout.columns ?? 80);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTick((t) => t + 1), 400);
    return () => clearInterval(id);
  }, [done]);
  useEffect(() => {
    const onResize = () => {
      setTermHeight(stdout.rows ?? 24);
      setTermWidth(stdout.columns ?? 80);
    };
    stdout.on("resize", onResize);
    return () => {
      stdout.off("resize", onResize);
    };
  }, [stdout]);
  const hintHeight = done ? 1 : 0;
  const viewportHeight = termHeight - hintHeight;
  const scrollbarWidth = 1;
  const contentWidth = termWidth - scrollbarWidth;
  const lines = useMemo(() => flattenNode(tree, "", true, true, contentWidth), [tree, contentWidth]);
  const maxOffset = Math.max(0, lines.length - viewportHeight);
  useEffect(() => {
    if (autoFollow) {
      setScrollOffset(maxOffset);
    }
  }, [autoFollow, maxOffset]);
  useInput((_input, key) => {
    if (key.upArrow) {
      setAutoFollow(false);
      setScrollOffset((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setScrollOffset((prev) => {
        const next = Math.min(maxOffset, prev + 1);
        if (next >= maxOffset) setAutoFollow(true);
        return next;
      });
    } else if (key.pageUp) {
      setAutoFollow(false);
      setScrollOffset((prev) => Math.max(0, prev - Math.floor(viewportHeight / 2)));
    } else if (key.pageDown) {
      setScrollOffset((prev) => {
        const next = Math.min(maxOffset, prev + Math.floor(viewportHeight / 2));
        if (next >= maxOffset) setAutoFollow(true);
        return next;
      });
    }
  });
  const visible = lines.slice(scrollOffset, scrollOffset + viewportHeight);
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", height: termHeight, children: [
    /* @__PURE__ */ jsxs(Box, { width: "100%", flexGrow: 1, children: [
      /* @__PURE__ */ jsx(Box, { flexDirection: "column", flexGrow: 1, children: visible.map((line, i) => /* @__PURE__ */ jsx(RenderLine, { line, tick }, scrollOffset + i)) }),
      /* @__PURE__ */ jsx(
        Scrollbar,
        {
          totalLines: lines.length,
          viewportHeight,
          scrollOffset
        }
      )
    ] }),
    done && /* @__PURE__ */ jsx(Text, { dimColor: true, children: "  press esc to go back" })
  ] });
}
var ParametersBaseSchema = z2.object({
  branchMinWidth: z2.int().positive().describe("The minimum number of tasks for branch functions."),
  branchMaxWidth: z2.int().positive().describe("The maximum number of tasks for branch functions."),
  leafMinWidth: z2.int().positive().describe("The minimum number of tasks for leaf functions."),
  leafMaxWidth: z2.int().positive().describe("The maximum number of tasks for leaf functions.")
});
ParametersBaseSchema.extend({
  depth: z2.int().positive().describe("The depth of this function. All tasks will be sub-functions.")
});
ParametersBaseSchema.extend({
  depth: z2.literal(0).describe(
    "The depth of this function. All tasks will be Vector Completions."
  )
});
var ParametersSchema = ParametersBaseSchema.extend({
  depth: z2.int().nonnegative().describe(
    "The depth of this function. If depth > 0, then all tasks will be sub-functions. If depth = 0, then all tasks will be Vector Completions."
  )
});
z2.object({
  depth: z2.int().nonnegative().optional(),
  branchMinWidth: z2.int().positive().optional(),
  branchMaxWidth: z2.int().positive().optional(),
  branchWidth: z2.int().positive().optional(),
  leafMinWidth: z2.int().positive().optional(),
  leafMaxWidth: z2.int().positive().optional(),
  leafWidth: z2.int().positive().optional(),
  minWidth: z2.int().positive().optional(),
  maxWidth: z2.int().positive().optional(),
  width: z2.int().positive().optional()
});
var PlaceholderTaskSpecEntrySchema = z2.object({
  spec: z2.string().nonempty(),
  token: z2.string().nonempty()
});
var PlaceholderTaskSpecsSchema = z2.array(
  z2.union([PlaceholderTaskSpecEntrySchema, z2.null()])
);

// src/fs.ts
z2.object({
  parameters: ParametersSchema,
  name: z2.string().nonempty(),
  function: z2.discriminatedUnion("type", [
    z2.object({
      type: z2.literal("branch.scalar.function"),
      function: Functions.QualityBranchRemoteScalarFunctionSchema
    }),
    z2.object({
      type: z2.literal("branch.vector.function"),
      function: Functions.QualityBranchRemoteVectorFunctionSchema
    }),
    z2.object({
      type: z2.literal("leaf.scalar.function"),
      function: Functions.QualityLeafRemoteScalarFunctionSchema
    }),
    z2.object({
      type: z2.literal("leaf.vector.function"),
      function: Functions.QualityLeafRemoteVectorFunctionSchema
    })
  ]),
  placeholderTaskSpecs: PlaceholderTaskSpecsSchema.optional()
});
function readTextFromFilesystem(path) {
  try {
    if (!existsSync(path)) return null;
    const content = readFileSync(path, "utf-8").trim();
    return content || null;
  } catch {
    return null;
  }
}
function readJsonFromFilesystem(path) {
  try {
    const text = readTextFromFilesystem(path);
    if (text === null) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}
function readParametersFromFilesystem(path) {
  const json = readJsonFromFilesystem(join(path, "parameters.json"));
  if (json === null) return null;
  const result = ParametersSchema.safeParse(json);
  if (!result.success) return null;
  return result.data;
}
function readFunctionFromFilesystem(path) {
  const json = readJsonFromFilesystem(join(path, "function.json"));
  if (json === null) return null;
  const result = Functions.RemoteFunctionSchema.safeParse(json);
  if (!result.success) return null;
  return result.data;
}
function readParentTokenFromFilesystem(dir) {
  return readTextFromFilesystem(join(dir, "parent.txt"));
}
function scanFunctionsWithPlaceholders(owner) {
  const ownerDir = functionsDir(owner);
  if (!existsSync(ownerDir)) return [];
  let entries;
  try {
    entries = readdirSync(ownerDir);
  } catch {
    return [];
  }
  const results = [];
  for (const entry of entries) {
    const dir = join(ownerDir, entry);
    if (readParentTokenFromFilesystem(dir) !== null) continue;
    const parameters = readParametersFromFilesystem(dir);
    if (!parameters || parameters.depth <= 0) continue;
    const fn = readFunctionFromFilesystem(dir);
    if (!fn) continue;
    let placeholderCount = 0;
    for (const task of fn.tasks) {
      if (task.type === "placeholder.scalar.function" || task.type === "placeholder.vector.function") {
        placeholderCount++;
      }
    }
    if (placeholderCount === 0) continue;
    results.push({
      name: entry,
      dir,
      functionTasks: fn.tasks.length - placeholderCount,
      placeholderTasks: placeholderCount
    });
  }
  return results;
}

// src/http.ts
async function fetchWithRetries(url, init, maxRetries = 3) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetch(url, init);
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 1e3 * 2 ** attempt));
    }
  }
}
var execOpts = { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] };
function getRepoRoot(dir) {
  try {
    const root = execSync("git rev-parse --show-toplevel", {
      ...execOpts,
      cwd: dir
    }).trim();
    return root || null;
  } catch {
    return null;
  }
}
function getRemoteUrl(dir) {
  try {
    const url = execSync("git remote get-url origin", {
      ...execOpts,
      cwd: dir
    }).trim();
    return url || null;
  } catch {
    return null;
  }
}
function parseGitHubRemote(url) {
  const httpsMatch = url.match(/github\.com\/([^/]+)\/([^/.]+)/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repository: httpsMatch[2] };
  }
  const sshMatch = url.match(/github\.com:([^/]+)\/([^/.]+)/);
  if (sshMatch) {
    return { owner: sshMatch[1], repository: sshMatch[2] };
  }
  return null;
}
function getLatestCommitForPath(repoRoot, relativePath) {
  try {
    const sha = execSync(`git log -1 --format=%H -- "${relativePath}"`, {
      ...execOpts,
      cwd: repoRoot
    }).trim();
    return sha || null;
  } catch {
    return null;
  }
}
function hasUncommittedChanges(repoRoot, relativePath) {
  try {
    const output = execSync(`git status --porcelain -- "${relativePath}"`, {
      ...execOpts,
      cwd: repoRoot
    }).trim();
    return output.length > 0;
  } catch {
    return true;
  }
}
function removeGitDir(dir) {
  rmSync(join(dir, ".git"), { recursive: true, force: true });
}
function initRepo(dir) {
  execSync("git init", { ...execOpts, cwd: dir });
}
function addAll(dir) {
  execSync("git add -A", { ...execOpts, cwd: dir });
}
function commit(dir, message, authorName, authorEmail) {
  execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
    ...execOpts,
    cwd: dir,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: authorName,
      GIT_COMMITTER_NAME: authorName,
      GIT_AUTHOR_EMAIL: authorEmail,
      GIT_COMMITTER_EMAIL: authorEmail
    }
  });
}
function addRemote(dir, url) {
  execSync(`git remote add origin ${url}`, { ...execOpts, cwd: dir });
}
function push(dir, gitHubToken) {
  execSync(
    `git -c "url.https://x-access-token:${gitHubToken}@github.com/.insteadOf=https://github.com/" push -u origin main`,
    { ...execOpts, cwd: dir }
  );
}

// src/github.ts
var DefaultGitHubBackend = {
  pushInitial,
  pushFinal,
  getOwnerRepositoryCommit,
  fetchRemoteFunctions,
  repoExists,
  getAuthenticatedUser
};
var fetchRemoteFunctionCache = /* @__PURE__ */ new Map();
function fetchRemoteFunction(owner, repository, commit2) {
  const key = `${owner}/${repository}/${commit2}`;
  const cached = fetchRemoteFunctionCache.get(key);
  if (cached) {
    return cached;
  }
  const promise = (async () => {
    const url = `https://raw.githubusercontent.com/${owner}/${repository}/${commit2}/function.json`;
    const response = await fetchWithRetries(url);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching ${url}`);
    }
    let json;
    try {
      json = await response.json();
    } catch {
      return null;
    }
    const result = Functions.RemoteFunctionSchema.safeParse(json);
    if (!result.success) {
      return null;
    }
    return result.data;
  })();
  fetchRemoteFunctionCache.set(key, promise);
  return promise;
}
async function fetchRemoteFunctions(refs) {
  const entries = Array.from(refs);
  const results = await Promise.all(
    entries.map(
      ({ owner, repository, commit: commit2 }) => fetchRemoteFunction(owner, repository, commit2)
    )
  );
  const record = {};
  for (let i = 0; i < entries.length; i++) {
    const result = results[i];
    if (result === null) {
      return null;
    }
    const { owner, repository, commit: commit2 } = entries[i];
    record[`${owner}/${repository}/${commit2}`] = result;
  }
  return record;
}
async function repoExists(name, gitHubToken) {
  try {
    const userRes = await fetchWithRetries("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${gitHubToken}`,
        Accept: "application/vnd.github.v3+json"
      }
    });
    if (!userRes.ok) return false;
    const user = await userRes.json();
    const res = await fetchWithRetries(
      `https://api.github.com/repos/${user.login}/${name}`,
      {
        headers: {
          Authorization: `Bearer ${gitHubToken}`,
          Accept: "application/vnd.github.v3+json"
        }
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}
async function commitExistsOnRemote(owner, repository, sha, gitHubToken) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repository}/commits/${sha}`;
    const response = await fetchWithRetries(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${gitHubToken}`
      }
    });
    return response.ok;
  } catch {
    return false;
  }
}
async function getOwnerRepositoryCommit(dir, gitHubToken) {
  const repoRoot = getRepoRoot(dir);
  if (!repoRoot) return null;
  const remoteUrl = getRemoteUrl(repoRoot);
  if (!remoteUrl) return null;
  const parsed = parseGitHubRemote(remoteUrl);
  if (!parsed) return null;
  const relativePath = relative(repoRoot, dir).replace(/\\/g, "/") || ".";
  if (hasUncommittedChanges(repoRoot, relativePath + "/function.json")) {
    return null;
  }
  const localCommit = getLatestCommitForPath(repoRoot, relativePath);
  if (!localCommit) return null;
  const exists = await commitExistsOnRemote(
    parsed.owner,
    parsed.repository,
    localCommit,
    gitHubToken
  );
  if (!exists) return null;
  return {
    owner: parsed.owner,
    repository: parsed.repository,
    commit: localCommit
  };
}
async function pushInitial(options) {
  const { dir, name, gitHubToken, gitAuthorName, gitAuthorEmail, message } = options;
  removeGitDir(dir);
  initRepo(dir);
  addAll(dir);
  commit(dir, message, gitAuthorName, gitAuthorEmail);
  const res = await fetchWithRetries("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gitHubToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, visibility: "public" })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Failed to create repo ${name}: HTTP ${res.status} ${body}`
    );
  }
  const repo = await res.json();
  const owner = repo.owner.login;
  const repository = repo.name;
  addRemote(dir, `https://github.com/${owner}/${repository}.git`);
  push(dir, gitHubToken);
}
var authenticatedUserCache = /* @__PURE__ */ new Map();
function getAuthenticatedUser(gitHubToken) {
  const cached = authenticatedUserCache.get(gitHubToken);
  if (cached) return cached;
  const promise = (async () => {
    const res = await fetchWithRetries("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${gitHubToken}`,
        Accept: "application/vnd.github.v3+json"
      }
    });
    if (!res.ok) {
      throw new Error(`Failed to get authenticated user: HTTP ${res.status}`);
    }
    const user = await res.json();
    return user.login;
  })();
  authenticatedUserCache.set(gitHubToken, promise);
  return promise;
}
async function pushFinal(options) {
  const {
    dir,
    name,
    gitHubToken,
    gitAuthorName,
    gitAuthorEmail,
    message,
    description
  } = options;
  const repoRoot = getRepoRoot(dir);
  if (!repoRoot) throw new Error("Git repository not initialized");
  if (!getRemoteUrl(repoRoot)) {
    await ensureRemote(dir, name, gitHubToken);
  }
  const remoteUrl = getRemoteUrl(repoRoot);
  if (!remoteUrl) throw new Error("No remote origin set");
  const parsed = parseGitHubRemote(remoteUrl);
  if (!parsed) throw new Error("Remote is not a GitHub repository");
  const { owner, repository } = parsed;
  const res = await fetchWithRetries(
    `https://api.github.com/repos/${owner}/${repository}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${gitHubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ description })
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Failed to update repo ${owner}/${repository}: HTTP ${res.status} ${body}`
    );
  }
  addAll(dir);
  commit(dir, message, gitAuthorName, gitAuthorEmail);
  push(dir, gitHubToken);
}
async function ensureRemote(dir, name, gitHubToken) {
  const res = await fetchWithRetries("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gitHubToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, visibility: "public" })
  });
  if (res.ok) {
    const repo = await res.json();
    addRemote(dir, `https://github.com/${repo.owner.login}/${repo.name}.git`);
  } else if (res.status === 422) {
    const user = await fetchWithRetries("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${gitHubToken}`,
        Accept: "application/vnd.github.v3+json"
      }
    });
    if (user.ok) {
      const { login } = await user.json();
      addRemote(dir, `https://github.com/${login}/${name}.git`);
    }
  }
}
function InventPlaceholdersList({
  onSelect,
  onBack
}) {
  const { stdout } = useStdout();
  const termHeight = stdout.rows ?? 24;
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const gitHubToken = getGitHubToken();
        if (!gitHubToken) {
          setError("GitHub token not configured");
          return;
        }
        const upstream = getAgentUpstream();
        if (!upstream) {
          setError("Agent not configured");
          return;
        }
        const [, gitHubBackend] = getAgentStepFn(upstream);
        const backend = gitHubBackend ?? DefaultGitHubBackend;
        const owner = await backend.getAuthenticatedUser(gitHubToken);
        setItems(scanFunctionsWithPlaceholders(owner));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    })();
  }, []);
  useInput((_ch, key) => {
    if (key.escape) {
      onBack();
      return;
    }
    if (items && items.length > 0) {
      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(items.length - 1, prev + 1));
      } else if (key.return) {
        onSelect(items[selectedIndex]);
      }
    }
  });
  if (error) {
    return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", height: termHeight, children: [
      /* @__PURE__ */ jsxs(Text, { color: "red", children: [
        "Error: ",
        error
      ] }),
      /* @__PURE__ */ jsx(Box, { flexGrow: 1 }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: "  press esc to go back" })
    ] });
  }
  if (items === null) {
    return /* @__PURE__ */ jsx(Box, { flexDirection: "column", height: termHeight, children: /* @__PURE__ */ jsx(Text, { dimColor: true, children: "Scanning for functions with placeholders..." }) });
  }
  if (items.length === 0) {
    return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", height: termHeight, children: [
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: "No functions with placeholders found." }),
      /* @__PURE__ */ jsx(Box, { flexGrow: 1 }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: "  press esc to go back" })
    ] });
  }
  const labelWidth = Math.max(...items.map((item) => item.name.length)) + 2;
  const listItems = items.map((item) => ({
    key: item.name,
    label: item.name,
    value: `${item.functionTasks}/${item.functionTasks + item.placeholderTasks}`
  }));
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", height: termHeight, children: [
    /* @__PURE__ */ jsx(Box, { children: /* @__PURE__ */ jsx(Text, { bold: true, color: "#5948e7", children: "Functions with placeholders" }) }),
    /* @__PURE__ */ jsx(Box, { height: 1 }),
    /* @__PURE__ */ jsx(
      SelectableList,
      {
        items: listItems,
        selectedIndex,
        labelWidth,
        viewportHeight: termHeight - 4
      }
    ),
    /* @__PURE__ */ jsx(Box, { flexGrow: 1 }),
    /* @__PURE__ */ jsx(Text, { dimColor: true, children: "  press esc to go back \xB7 enter to resume" })
  ] });
}
function InventPlaceholdersRun({
  name,
  onBack
}) {
  const { tree, onNotification } = useInventNotifications();
  const done = useInventWorker(onNotification, {
    type: "inventPlaceholders",
    name
  });
  useInput((_ch, key) => {
    if (key.escape && done) onBack();
  });
  return /* @__PURE__ */ jsx(InventView, { tree, done });
}
function InventPlaceholdersFlow({ onBack }) {
  const [selected, setSelected] = useState(null);
  if (!selected) {
    return /* @__PURE__ */ jsx(
      InventPlaceholdersList,
      {
        onSelect: setSelected,
        onBack
      }
    );
  }
  return /* @__PURE__ */ jsx(
    InventPlaceholdersRun,
    {
      name: selected.name,
      onBack: () => setSelected(null)
    },
    selected.name
  );
}
function App() {
  const [route, setRoute] = useState({ name: "menu" });
  if (route.name === "config") {
    return /* @__PURE__ */ jsx(Config, { onBack: () => setRoute({ name: "menu" }) });
  }
  if (route.name === "invent") {
    return /* @__PURE__ */ jsx(
      InventFlow,
      {
        spec: route.spec,
        parameters: route.parameters,
        onBack: () => setRoute({ name: "menu" })
      }
    );
  }
  if (route.name === "inventplaceholders") {
    return /* @__PURE__ */ jsx(InventPlaceholdersFlow, { onBack: () => setRoute({ name: "menu" }) });
  }
  return /* @__PURE__ */ jsx(
    Menu,
    {
      onResult: (result) => {
        if (result.command === "config") {
          setRoute({ name: "config" });
        } else if (result.command === "invent") {
          setRoute({
            name: "invent",
            spec: result.spec,
            parameters: result.parameters
          });
        } else if (result.command === "inventplaceholders") {
          setRoute({ name: "inventplaceholders" });
        }
      }
    }
  );
}

// src/cli.ts
render(React.createElement(App), {
  alternateBuffer: true,
  incrementalRendering: true,
  patchConsole: false
});
