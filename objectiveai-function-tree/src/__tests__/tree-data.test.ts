import { describe, it, expect } from "vitest";
import { buildTree } from "../core/tree-data";
import type {
  InputFunctionExecution,
  InputVectorCompletionTask,
  InputFunctionExecutionTask,
  FunctionNodeData,
  VectorCompletionNodeData,
  LlmNodeData,
} from "../types";

// ---------------------------------------------------------------------------
// Helpers: mock data builders
// ---------------------------------------------------------------------------

function makeVote(index: number, voteDistribution: number[] = [1, 0]) {
  return {
    model: `model-${index}-${"x".repeat(14)}`,
    ensemble_index: index,
    flat_ensemble_index: index,
    vote: voteDistribution,
    weight: 1,
    from_cache: false,
    from_rng: false,
  };
}

function makeCompletion(modelId: string, text: string) {
  return {
    model: modelId,
    choices: [{ delta: { content: text } }],
  };
}

function makeVCTask(
  index: number,
  taskPath: number[],
  votes: ReturnType<typeof makeVote>[] = [],
  scores: number[] = []
): InputVectorCompletionTask {
  return {
    index,
    task_index: index,
    task_path: taskPath,
    votes,
    scores,
    completions: votes.map((v) =>
      makeCompletion(v.model, `Reasoning for model ${v.flat_ensemble_index}`)
    ),
  };
}

function makeFuncTask(
  index: number,
  taskPath: number[],
  subTasks: (InputVectorCompletionTask | InputFunctionExecutionTask)[] = [],
  output?: number
): InputFunctionExecutionTask {
  return {
    index,
    task_index: index,
    task_path: taskPath,
    tasks: subTasks,
    output,
    function: `user/nested-func-${index}`,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("buildTree", () => {
  it("returns null for null input", () => {
    expect(buildTree(null)).toBeNull();
  });

  it("builds a root-only tree for empty execution", () => {
    const exec: InputFunctionExecution = {
      id: "exec-1",
      function: "user/my-func",
      tasks: [],
    };

    const tree = buildTree(exec);
    expect(tree).not.toBeNull();
    expect(tree!.rootId).toBe("root");
    expect(tree!.nodes.size).toBe(1);

    const root = tree!.nodes.get("root")!;
    expect(root.kind).toBe("function");
    expect(root.label).toBe("my-func");
    expect(root.children).toEqual([]);
    expect((root.data as FunctionNodeData).taskCount).toBe(0);
  });

  it("builds tree with scalar execution (single VC task + 2 LLMs)", () => {
    const exec: InputFunctionExecution = {
      id: "exec-2",
      function: "user/scorer",
      output: 0.75,
      tasks: [
        makeVCTask(0, [0], [makeVote(0, [0.8, 0.2]), makeVote(1, [0.7, 0.3])], [0.75, 0.25]),
      ],
    };

    const tree = buildTree(exec)!;
    expect(tree.nodes.size).toBe(4); // root + vc + 2 llms

    const root = tree.nodes.get("root")!;
    expect(root.state).toBe("complete");
    expect((root.data as FunctionNodeData).output).toBe(0.75);
    expect(root.children).toEqual(["vc-0"]);

    const vc = tree.nodes.get("vc-0")!;
    expect(vc.kind).toBe("vector-completion");
    expect(vc.state).toBe("complete");
    expect(vc.children.length).toBe(2);

    const llm0 = tree.nodes.get("vc-0-llm-0")!;
    expect(llm0.kind).toBe("llm");
    expect((llm0.data as LlmNodeData).vote).toEqual([0.8, 0.2]);
    expect((llm0.data as LlmNodeData).weight).toBe(1);
    expect((llm0.data as LlmNodeData).streamingText).toBe("Reasoning for model 0");
  });

  it("builds tree with vector execution", () => {
    const exec: InputFunctionExecution = {
      id: "exec-3",
      output: [0.4, 0.35, 0.25],
      tasks: [
        makeVCTask(0, [0], [makeVote(0), makeVote(1), makeVote(2)], [0.4, 0.35, 0.25]),
      ],
    };

    const tree = buildTree(exec)!;
    const root = tree.nodes.get("root")!;
    expect((root.data as FunctionNodeData).output).toEqual([0.4, 0.35, 0.25]);
  });

  it("builds tree with nested function tasks", () => {
    const exec: InputFunctionExecution = {
      id: "exec-4",
      function: "user/parent-func",
      output: 0.6,
      tasks: [
        makeFuncTask(0, [0], [
          makeVCTask(0, [0, 0], [makeVote(0)], [0.8, 0.2]),
          makeVCTask(1, [0, 1], [makeVote(0)], [0.5, 0.5]),
        ], 0.65),
        makeVCTask(1, [1], [makeVote(0), makeVote(1)], [0.55, 0.45]),
      ],
    };

    const tree = buildTree(exec)!;
    // root + func-task + 2 vc + 2 llm (from nested) + vc + 2 llm (from root)
    // = 1 + 1 + 2 + 2 + 1 + 2 = 9
    expect(tree.nodes.size).toBe(9);

    const root = tree.nodes.get("root")!;
    expect(root.children.length).toBe(2); // func-0 and vc-1

    const funcTask = tree.nodes.get("func-0")!;
    expect(funcTask.kind).toBe("function");
    expect(funcTask.label).toBe("nested-func-0");
    expect(funcTask.children.length).toBe(2); // vc-0-0 and vc-0-1
    expect((funcTask.data as FunctionNodeData).output).toBe(0.65);
  });

  it("handles streaming partial data (no votes yet)", () => {
    const exec: InputFunctionExecution = {
      id: "exec-5",
      function: "user/func",
      tasks: [
        {
          index: 0,
          task_index: 0,
          task_path: [0],
          completions: [makeCompletion("model-0-xxxxxxxxxxxxxx", "Thinking...")],
        } as InputVectorCompletionTask,
      ],
    };

    const tree = buildTree(exec)!;
    expect(tree.nodes.size).toBe(2); // root + vc (no llm leaves without votes)
    const vc = tree.nodes.get("vc-0")!;
    expect(vc.state).toBe("streaming");
  });

  it("resolves model names when provided", () => {
    const exec: InputFunctionExecution = {
      id: "exec-6",
      tasks: [
        makeVCTask(0, [0], [makeVote(0)], [1]),
      ],
    };

    const modelNames = {
      "model-0-xxxxxxxxxxxxxx": "openai/gpt-4o",
    };

    const tree = buildTree(exec, modelNames)!;
    const llm = tree.nodes.get("vc-0-llm-0")!;
    expect(llm.label).toBe("gpt-4o");
    expect((llm.data as LlmNodeData).modelName).toBe("openai/gpt-4o");
  });

  it("marks error state correctly", () => {
    const exec: InputFunctionExecution = {
      id: "exec-7",
      error: { message: "Something failed" },
      tasks: [],
    };

    const tree = buildTree(exec)!;
    const root = tree.nodes.get("root")!;
    expect(root.state).toBe("error");
    expect((root.data as FunctionNodeData).error).toBe("Something failed");
  });
});
