import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import {
  mkdtempSync,
  readFileSync,
  existsSync,
  writeFileSync,
  mkdirSync,
  rmSync,
} from "fs";
import { join } from "path";
import { tmpdir } from "os";

// ============================================================
// Mock: @anthropic-ai/claude-agent-sdk
// Keep tool() passthrough, mock createSdkMcpServer and query
// ============================================================
vi.mock("@anthropic-ai/claude-agent-sdk", () => ({
  tool: (name: string, description: string, schema: any, handler: any) => ({
    name,
    description,
    schema,
    handler,
  }),
  createSdkMcpServer: ({ name, tools }: { name: string; tools: any[] }) => ({
    name,
    tools,
  }),
  query: (args: any) => mockQuery(args.options),
}));

// ============================================================
// Mock: objectiveai (partial — keep schemas/WASM real, mock network)
// ============================================================
vi.mock("objectiveai", async (importOriginal) => {
  const mod = await importOriginal<any>();
  return {
    ...mod,
    ObjectiveAI: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    Functions: {
      ...mod.Functions,
      list: vi.fn().mockResolvedValue({ data: [] }),
      retrieve: vi.fn().mockResolvedValue({}),
      Executions: {
        ...mod.Functions.Executions,
        inlineFunctionInlineProfileCreate: vi
          .fn()
          .mockResolvedValue({ output: 0.5, error: null, tasks_errors: null }),
      },
      Profiles: {
        ...mod.Functions.Profiles,
        retrieve: vi.fn().mockResolvedValue({}),
      },
    },
  };
});

// ============================================================
// Mock: child_process (git/gh commands in submit)
// ============================================================
vi.mock("child_process", async (importOriginal) => {
  const mod = await importOriginal<any>();
  return {
    ...mod,
    execSync: vi.fn((cmd: string, _opts?: any) => {
      if (cmd === "git add -A") return "";
      if (cmd === "git diff --cached --quiet")
        throw new Error("staged changes");
      if (cmd.startsWith("git commit")) return "";
      if (cmd === "git remote get-url origin")
        return "https://github.com/test-owner/test-repo.git";
      if (cmd === "git push") return "";
      if (cmd === "gh api user --jq .login") return "test-owner";
      if (cmd.startsWith("gh repo view "))
        throw new Error("not found");
      if (cmd.startsWith("gh ")) return "";
      if (cmd === "git rev-parse HEAD") return "abc123def456";
      throw new Error(`Unexpected execSync command: ${cmd}`);
    }),
  };
});

// ============================================================
// Mock query async generator
// ============================================================
async function* mockQuery(options: any): AsyncGenerator<any> {
  yield { type: "system", subtype: "init", session_id: "mock-session" };

  const serverNames = Object.keys(options?.mcpServers ?? {});

  if (serverNames.includes("essay")) {
    writeFileSync(
      "ESSAY.md",
      "# Essay\n\nThis function scores text quality by analyzing grammar, clarity, and coherence.",
    );
  } else if (serverNames.includes("essayTasks")) {
    writeFileSync(
      "ESSAY_TASKS.md",
      "# Tasks\n\n1. Evaluate grammar correctness\n2. Evaluate clarity and readability",
    );
  } else if (serverNames.includes("plan")) {
    mkdirSync("plans", { recursive: true });
    writeFileSync(
      "plans/1.md",
      "# Plan\n\nBuild a scalar text quality scorer with one vector.completion task.",
    );
  } else if (serverNames.includes("invent")) {
    await inventScript();
  }
}

// ============================================================
// inventScript: builds a valid function via real tool functions
// ============================================================
async function inventScript(): Promise<void> {
  const { editType } = await import("../tools/function/type");
  const { editDescription } = await import("../tools/function/description");
  const { editInputSchema } = await import("../tools/function/inputSchema");
  const { appendTask } = await import("../tools/function/tasks");
  const { buildProfile } = await import("../tools/profile");
  const { appendExampleInput } = await import("../tools/inputs");
  const { writeReadme } = await import("../tools/markdown");
  const {
    readFunction,
    validateFunction,
  } = await import("../tools/function/function");
  const { Functions } = await import("objectiveai");

  // 1. Set function type
  assertOk(editType("scalar.function"), "editType");

  // 2. Set description
  assertOk(editDescription("Scores text quality"), "editDescription");

  // 3. Set input schema
  assertOk(
    editInputSchema({
      type: "object",
      properties: { text: { type: "string" } },
      required: ["text"],
    }),
    "editInputSchema",
  );

  // 4. Append a vector.completion task with static messages/responses
  assertOk(
    appendTask({
      type: "vector.completion",
      messages: [{ role: "user", content: "Rate quality" }],
      responses: ["good", "bad"],
      output: { $starlark: "output['scores'][0]" },
    }),
    "appendTask",
  );

  // 5. Build profile from tasks
  assertOk(buildProfile(), "buildProfile");

  // 6. Read the built function for compileFunctionTasks
  const fnRaw = readFunction();
  assertOk(fnRaw, "readFunction");
  const funcResult = validateFunction(fnRaw.value);
  assertOk(funcResult, "validateFunction");
  const func = funcResult.value;

  // 7. Add 10 example inputs with compiled tasks
  for (let i = 0; i < 10; i++) {
    const value = { text: `Example text number ${i}` };
    const compiledTasks = Functions.compileFunctionTasks(func, value);
    const result = appendExampleInput({
      value,
      compiledTasks,
      outputLength: null,
    });
    assertOk(result, `appendExampleInput[${i}]`);
  }

  // 8. Write README
  writeReadme("# Test Function\n\nA function that scores text quality.");
}

function assertOk(result: { ok: boolean; error?: string }, label: string) {
  if (!result.ok) {
    throw new Error(`${label} failed: ${result.error}`);
  }
}

// ============================================================
// Test
// ============================================================
describe("invent() integration", () => {
  let originalCwd: string;
  let tempDir: string;

  beforeAll(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), "objectiveai-test-"));
    process.chdir(tempDir);
  });

  afterAll(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("depth=0 completes successfully", async () => {
    const { invent } = await import("../claude");

    await invent({
      spec: "A scalar function that scores text quality",
      name: "text-quality",
      depth: 0,
      log: () => {},
    });

    // ---- Core files exist ----
    expect(existsSync("function.json")).toBe(true);
    expect(existsSync("profile.json")).toBe(true);
    expect(existsSync("inputs.json")).toBe(true);
    expect(existsSync("SPEC.md")).toBe(true);
    expect(existsSync("name.txt")).toBe(true);
    expect(existsSync("ESSAY.md")).toBe(true);
    expect(existsSync("ESSAY_TASKS.md")).toBe(true);
    expect(existsSync("README.md")).toBe(true);
    expect(existsSync(".gitignore")).toBe(true);
    expect(existsSync("parameters.json")).toBe(true);

    // ---- function.json is valid ----
    const func = JSON.parse(readFileSync("function.json", "utf-8"));
    expect(func.type).toBe("scalar.function");
    expect(func.description).toBe("Scores text quality");
    expect(func.tasks).toHaveLength(1);
    expect(func.tasks[0].type).toBe("vector.completion");

    // ---- profile.json exists and is valid JSON ----
    const profile = JSON.parse(readFileSync("profile.json", "utf-8"));
    expect(profile.tasks).toHaveLength(1);
    expect(profile.profile).toHaveLength(1);

    // ---- inputs.json has 10 entries ----
    const inputs = JSON.parse(readFileSync("inputs.json", "utf-8"));
    expect(inputs).toHaveLength(10);
    for (const input of inputs) {
      expect(input.value).toHaveProperty("text");
      expect(input.compiledTasks).toBeDefined();
      expect(input.outputLength).toBeNull();
    }

    // ---- parameters.json ----
    const params = JSON.parse(readFileSync("parameters.json", "utf-8"));
    expect(params.depth).toBe(0);

    // ---- name.txt ----
    expect(readFileSync("name.txt", "utf-8")).toBe("text-quality");

    // ---- SPEC.md has content from options ----
    expect(readFileSync("SPEC.md", "utf-8")).toBe(
      "A scalar function that scores text quality",
    );

    // ---- networkTests directory was created ----
    expect(existsSync(join("networkTests", "default"))).toBe(true);
  });
});
