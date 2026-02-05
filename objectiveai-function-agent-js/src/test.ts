import { Functions, ObjectiveAI } from "objectiveai";
import { writeFileSync, existsSync, unlinkSync, readFileSync } from "fs";
import { ExampleInput, ExampleInputSchema } from "./exampleInput";

// Read JSON file, throw if it doesn't exist
function readJsonFile(path: string): unknown {
  if (!existsSync(path)) {
    throw new Error(`File not found: ${path}`);
  }
  const content = readFileSync(path, "utf-8");
  return JSON.parse(content);
}

export function test(title: string, testFunction: () => void): boolean {
  try {
    testFunction();
    console.log(`${title}: PASSED\n`);
    return true;
  } catch (error) {
    console.error(`${title}: FAILED\n${error}\n`);
    return false;
  }
}

export async function testAsync(
  title: string,
  testFunction: () => Promise<void>,
): Promise<boolean> {
  try {
    await testFunction();
    console.log(`${title}: PASSED\n`);
    return true;
  } catch (error) {
    console.error(`${title}: FAILED\n${error}\n`);
    return false;
  }
}

export function compiledTasksEqual(
  a: Functions.CompiledTask,
  b: Functions.CompiledTask,
): boolean {
  if (a === null) {
    return b === null;
  } else if (Array.isArray(a)) {
    return (
      b !== null &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((subTask, index) =>
        compiledTasksEqual(subTask, (b as Functions.CompiledTask[])[index]),
      )
    );
  } else if (a.type === "scalar.function") {
    return (
      b !== null &&
      !Array.isArray(b) &&
      b.type === "scalar.function" &&
      b.owner === a.owner &&
      b.repository === a.repository &&
      b.commit === a.commit &&
      JSON.stringify(a.input) === JSON.stringify(b.input)
    );
  } else if (a.type === "vector.function") {
    return (
      b !== null &&
      !Array.isArray(b) &&
      b.type === "vector.function" &&
      b.owner === a.owner &&
      b.repository === a.repository &&
      b.commit === a.commit &&
      JSON.stringify(a.input) === JSON.stringify(b.input)
    );
  } else if (a.type === "vector.completion") {
    return b !== null &&
      !Array.isArray(b) &&
      b.type === "vector.completion" &&
      JSON.stringify(a.messages) === JSON.stringify(b.messages) &&
      JSON.stringify(a.responses) === JSON.stringify(b.responses) &&
      a.tools === undefined
      ? b.tools === undefined
      : (b as Functions.VectorCompletionTask).tools !== undefined &&
          (a as Functions.VectorCompletionTask).tools!.length ===
            (b as Functions.VectorCompletionTask).tools!.length &&
          (a as Functions.VectorCompletionTask).tools!.every(
            (tool, index) =>
              JSON.stringify(tool) ===
              JSON.stringify(
                (b as Functions.VectorCompletionTask).tools![index],
              ),
          );
  } else {
    return false;
  }
}

export interface RunTestsOptions {
  func?: Functions.RemoteFunction;
  profile?: Functions.RemoteProfile;
  inputs?: ExampleInput[];
  objectiveai: ObjectiveAI;
}

export async function runTests(options: RunTestsOptions): Promise<void> {
  const { objectiveai } = options;

  // Read from files by default
  const func = options.func ?? readJsonFile("function.json") as Functions.RemoteFunction;
  const profile = options.profile ?? readJsonFile("profile.json") as Functions.RemoteProfile;
  const inputs = options.inputs ?? readJsonFile("inputs.json") as ExampleInput[];

  test("Function Schema Validation", () =>
    Functions.RemoteFunctionSchema.parse(func));

  test("Profile Schema Validation", () =>
    Functions.RemoteProfileSchema.parse(profile));

  // Read parameters.json for depth-based validation
  const parameters = existsSync("parameters.json")
    ? (readJsonFile("parameters.json") as { depth: number })
    : { depth: 0 };

  if (parameters.depth === 0) {
    test("Task Type Validation", () => {
      if (func.tasks.length === 0) {
        throw new Error("There must be at least 1 task");
      }
      for (const task of func.tasks) {
        if (task.type !== "vector.completion") {
          throw new Error(
            `All tasks must be vector.completion, but found task of type: ${task.type}`,
          );
        }
      }
    });
  } else {
    test("Task Type Validation", () => {
      for (const task of func.tasks) {
        if (task.type !== "scalar.function" && task.type !== "vector.function") {
          throw new Error(
            `All tasks must be function tasks (scalar.function or vector.function), but found task of type: ${task.type}`,
          );
        }
      }
      if (func.tasks.length < 2) {
        throw new Error(
          `There must be at least 2 tasks, but found ${func.tasks.length}`,
        );
      }
    });
  }

  test("Example Inputs Schema Validation", () => {
    for (const input of inputs) {
      ExampleInputSchema.parse(input);
    }
  });

  test("Example Inputs Length Validation", () => {
    if (inputs.length < 10 || inputs.length > 100) {
      throw new Error(
        `Expected between 10 and 100 example inputs, but got ${inputs.length}`,
      );
    }
  });

  test("Example Inputs Validation", () => {
    for (const { value, compiledTasks, outputLength } of inputs) {
      const _ = Functions.CompiledTasksSchema.parse(compiledTasks);
      if (!Functions.validateFunctionInput(func, value)) {
        throw new Error(
          `validation against Function's \`input_schema\` failed for input: ${JSON.stringify(value)}`,
        );
      }
      if (func.type === "scalar.function") {
        if (outputLength !== null) {
          throw new Error(
            `expected \`outputLength\` to be null for scalar function input: ${JSON.stringify(value)}`,
          );
        }
      } else if (func.type === "vector.function") {
        if (outputLength === null) {
          throw new Error(
            `expected \`outputLength\` to be non-null for vector function input: ${JSON.stringify(value)}`,
          );
        } else if (typeof outputLength !== "number") {
          throw new Error(
            `expected \`outputLength\` to be a number for vector function input: ${JSON.stringify(value)}`,
          );
        }
      }
    }
  });

  test("Compiled Task Validation", () => {
    if (existsSync("compiledTasks.json")) {
      unlinkSync("compiledTasks.json");
    }
    const writable: Record<number, Functions.CompiledTasks | string> = {};
    let writableIndex = 1;
    for (const { value } of inputs) {
      try {
        const compiledTasks = Functions.compileFunctionTasks(func, value);
        writable[writableIndex] = compiledTasks;
      } catch (e) {
        writable[writableIndex] = `Error: ${(e as Error).message}`;
      }
      writableIndex++;
    }
    writeFileSync("compiledTasks.json", JSON.stringify(writable, null, 2));
    for (const { value, compiledTasks: expectedCompiledTasks } of inputs) {
      const compiledTasks = Functions.compileFunctionTasks(func, value);
      if (compiledTasks.length !== expectedCompiledTasks.length) {
        throw new Error(
          `number of compiled tasks (${compiledTasks.length}) does not match number of compiled task expectations (${expectedCompiledTasks.length}) for input: ${JSON.stringify(value)}`,
        );
      }
      for (let i = 0; i < compiledTasks.length; i++) {
        const compiledTask = compiledTasks[i];
        const expectedCompiledTask = expectedCompiledTasks[i];
        if (!compiledTasksEqual(compiledTask, expectedCompiledTask)) {
          throw new Error(
            `compiled task does not match expected compiled task for input: ${JSON.stringify(
              value,
            )}\n\nExpected: ${JSON.stringify(
              expectedCompiledTask,
            )}\n\nGot: ${JSON.stringify(compiledTask)}`,
          );
        }
      }
    }
  });

  if (func.type === "vector.function") {
    test("Vector Function Validation", () => {
      for (const { value, outputLength } of inputs) {
        // Validate output length
        const compiledOutputLength = Functions.compileFunctionOutputLength(
          func,
          value,
        );
        if (compiledOutputLength === null) {
          throw new Error(
            `expected output length to be non-null for vector function input: ${JSON.stringify(value)}`,
          );
        } else if (compiledOutputLength !== outputLength) {
          throw new Error(
            `compiled output length (${compiledOutputLength}) does not match expected output length (${outputLength}) for vector function input: ${JSON.stringify(value)}`,
          );
        } else if (compiledOutputLength <= 1) {
          throw new Error(
            `expected output length to be greater than 1 for vector function input: ${JSON.stringify(value)}`,
          );
        }

        // Split input
        const inputSplit = Functions.compileFunctionInputSplit(func, value);
        if (inputSplit === null) {
          throw new Error(
            `expected input split to be non-null for vector function input: ${JSON.stringify(value)}`,
          );
        }

        // Validate output length for each split input
        for (const splitInput of inputSplit) {
          const compiledSplitOutputLength =
            Functions.compileFunctionOutputLength(func, splitInput);
          if (compiledSplitOutputLength !== 1) {
            throw new Error(
              `expected output length for split input to be 1, but got ${compiledSplitOutputLength} for split input: ${JSON.stringify(splitInput)}`,
            );
          }
        }

        // Merge outputs
        const mergedOutput = Functions.compileFunctionInputMerge(
          func,
          inputSplit,
        );
        if (mergedOutput === null) {
          throw new Error(
            `expected merged output to be non-null for vector function input: ${JSON.stringify(value)}`,
          );
        }

        // Validate merged output length equals original output length
        const mergedOutputLength = Functions.compileFunctionOutputLength(
          func,
          mergedOutput,
        );
        if (mergedOutputLength !== outputLength) {
          throw new Error(
            `merged output length (${mergedOutputLength}) does not match expected output length (${outputLength}) for vector function input: ${JSON.stringify(value)}`,
          );
        }
      }
    });

    await testAsync(
      "Vector Function Execution Validation (Default Strategy)",
      async () => {
        const promises = [];
        for (const { value } of inputs) {
          promises.push(
            Functions.Executions.inlineFunctionInlineProfileCreate(
              objectiveai,
              {
                input: value,
                function: func,
                profile: profile,
                from_rng: true,
              },
            ),
          );
        }
        const results = await Promise.all(promises);
        for (let i = 0; i < inputs.length; i++) {
          const result = results[i];
          if (result.error !== null) {
            throw new Error(
              `function execution failed for input: ${JSON.stringify(inputs[i].value)} with error: ${result.error}`,
            );
          } else if (result.tasks_errors) {
            throw new Error(
              `function execution had task errors for input: ${JSON.stringify(inputs[i].value)}`,
            );
          }
        }
      },
    );

    await testAsync(
      "Vector Function Execution Validation (SwissSystem Strategy)",
      async () => {
        const promises = [];
        for (const { value } of inputs) {
          promises.push(
            Functions.Executions.inlineFunctionInlineProfileCreate(
              objectiveai,
              {
                input: value,
                function: func,
                profile: profile,
                from_rng: true,
                strategy: {
                  type: "swiss_system",
                },
              },
            ),
          );
        }
        const results = await Promise.all(promises);
        for (let i = 0; i < inputs.length; i++) {
          const result = results[i];
          if (result.error !== null) {
            throw new Error(
              `function execution failed for input: ${JSON.stringify(inputs[i].value)} with error: ${result.error}`,
            );
          } else if (result.tasks_errors) {
            throw new Error(
              `function execution had task errors for input: ${JSON.stringify(inputs[i].value)}`,
            );
          }
        }
      },
    );
  } else if (func.type === "scalar.function") {
    await testAsync(
      "Scalar Function Execution Validation (Default Strategy)",
      async () => {
        const promises = [];
        for (const { value } of inputs) {
          promises.push(
            Functions.Executions.inlineFunctionInlineProfileCreate(
              objectiveai,
              {
                input: value,
                function: func,
                profile: profile,
                from_rng: true,
              },
            ),
          );
        }
        const results = await Promise.all(promises);
        for (let i = 0; i < inputs.length; i++) {
          const result = results[i];
          if (result.error !== null) {
            throw new Error(
              `function execution failed for input: ${JSON.stringify(inputs[i].value)} with error: ${result.error}`,
            );
          } else if (result.tasks_errors) {
            throw new Error(
              `function execution had task errors for input: ${JSON.stringify(inputs[i].value)}`,
            );
          }
        }
      },
    );
  }
}
