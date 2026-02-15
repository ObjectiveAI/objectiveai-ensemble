import { Functions } from "objectiveai";
import { Result } from "../result";
import { DeserializedFunction, editFunction, readFunction } from "./function";
import { readParameters, validateParameters } from "../parameters";
import z from "zod";

const TasksSchema = Functions.TaskExpressionsSchema.min(1);
type Tasks = z.infer<typeof TasksSchema>;

export function delTasks(): Result<undefined> {
  return editFunction({ tasks: [] });
}

export function readTasks(): Result<unknown> {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: undefined, error: fn.error };
  }
  return { ok: true, value: fn.value.tasks, error: undefined };
}

export function readTasksSchema(): typeof TasksSchema {
  return TasksSchema;
}

const MessagesSchema =
  Functions.VectorCompletionTaskExpressionSchema.shape.messages;
const ToolsSchema = Functions.VectorCompletionTaskExpressionSchema.shape.tools;
const ResponsesSchema =
  Functions.VectorCompletionTaskExpressionSchema.shape.responses;

export function readMessagesSchema(): typeof MessagesSchema {
  return MessagesSchema;
}

export function readToolsSchema(): typeof ToolsSchema {
  return ToolsSchema;
}

export function readResponsesSchema(): typeof ResponsesSchema {
  return ResponsesSchema;
}

export function checkTasks(fn?: DeserializedFunction): Result<undefined> {
  if (!fn) {
    const read = readFunction();
    if (!read.ok) {
      return {
        ok: false,
        value: undefined,
        error: `Unable to check tasks: ${read.error}`,
      };
    }
    fn = read.value;
  }

  const result = validateTasks(fn);
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `tasks is invalid: ${result.error}`,
    };
  }

  // At most 50% of tasks can have a map (unless there's only 1 task)
  if (result.value.length > 1) {
    const mappedCount = result.value.filter(
      (t) => typeof (t as Record<string, unknown>).map === "number",
    ).length;
    if (mappedCount > result.value.length / 2) {
      return {
        ok: false,
        value: undefined,
        error: `Too many mapped tasks: ${mappedCount} of ${result.value.length} tasks have a map index. At most 50% of tasks can be mapped.`,
      };
    }
  }

  // Width constraints are only checked here (not during mutations)
  const widthResult = validateTasksWidth(result.value);
  if (!widthResult.ok) {
    return {
      ok: false,
      value: undefined,
      error: `tasks is invalid: ${widthResult.error}`,
    };
  }

  return { ok: true, value: undefined, error: undefined };
}

// export function editTasks(value: unknown): Result<undefined> {
//   const result = validateTasks({ tasks: value });
//   if (!result.ok) {
//     return {
//       ok: false,
//       value: undefined,
//       error: `Invalid tasks: ${result.error}`,
//     };
//   }
//   return editFunction({ tasks: result.value });
// }

/**
 * Validate a single task against depth and function type constraints.
 * Shared by appendTask and editTask.
 */
function validateTaskConstraints(
  task: Record<string, unknown>,
  fnType: string,
): Result<undefined> {
  // Read depth from parameters
  const paramsRaw = readParameters();
  const paramsResult = paramsRaw.ok
    ? validateParameters(paramsRaw.value)
    : undefined;
  const depth = paramsResult?.ok ? paramsResult.value.depth : 0;

  const taskType = task.type as string | undefined;
  const hasMap = "map" in task;

  // Depth-based task type validation
  if (depth > 0) {
    if (taskType !== "scalar.function" && taskType !== "vector.function") {
      return {
        ok: false,
        value: undefined,
        error: `At depth ${depth}, tasks must be function tasks ("scalar.function" or "vector.function"), not "${taskType}".`,
      };
    }
  } else {
    if (taskType !== "vector.completion") {
      return {
        ok: false,
        value: undefined,
        error: `At depth 0, tasks must be "vector.completion", not "${taskType}".`,
      };
    }
  }

  // Map validation: only allowed on scalar.function tasks inside a vector.function
  if (hasMap) {
    if (fnType !== "vector.function") {
      return {
        ok: false,
        value: undefined,
        error: `Task "map" is only allowed when the function type is "vector.function" (current type: "${fnType}").`,
      };
    }
    if (taskType !== "scalar.function") {
      return {
        ok: false,
        value: undefined,
        error: `Task "map" is only allowed on "scalar.function" tasks (this task type: "${taskType}").`,
      };
    }
  }

  // Depth > 0: validate task type + map combinations against function type
  if (depth > 0) {
    if (fnType === "scalar.function") {
      // Scalar parent: must be un-mapped scalar.function task
      if (taskType !== "scalar.function") {
        return {
          ok: false,
          value: undefined,
          error: `Scalar functions require "scalar.function" tasks, not "${taskType}".`,
        };
      }
      if (hasMap) {
        return {
          ok: false,
          value: undefined,
          error: `Scalar functions do not support mapped tasks. Remove the "map" field.`,
        };
      }
    } else if (fnType === "vector.function") {
      // Vector parent: un-mapped vector.function OR mapped scalar.function
      const isUnmappedVector = taskType === "vector.function" && !hasMap;
      const isMappedScalar = taskType === "scalar.function" && hasMap;
      if (!isUnmappedVector && !isMappedScalar) {
        return {
          ok: false,
          value: undefined,
          error: `Vector functions require either an un-mapped "vector.function" task or a mapped "scalar.function" task (got ${hasMap ? "mapped" : "un-mapped"} "${taskType}").`,
        };
      }
    }
  }

  return { ok: true, value: undefined, error: undefined };
}

export function appendTask(value: unknown): Result<string> {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to append task: ${fn.error}`,
    };
  }

  const task = value as Record<string, unknown> | null;
  if (task && typeof task === "object") {
    const constraintResult = validateTaskConstraints(
      task,
      fn.value.type as string,
    );
    if (!constraintResult.ok) {
      return { ok: false, value: undefined, error: constraintResult.error! };
    }
  }

  const existing = Array.isArray(fn.value.tasks) ? fn.value.tasks : [];
  const newTasks = [...existing, value];

  const result = validateTasks({ tasks: newTasks });
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Invalid tasks after append: ${result.error}`,
    };
  }
  const editResult = editFunction({ tasks: result.value });
  if (!editResult.ok) {
    return editResult as Result<string>;
  }
  return {
    ok: true,
    value: `new length: ${newTasks.length}`,
    error: undefined,
  };
}

export function editTask(index: number, value: unknown): Result<undefined> {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to edit task: ${fn.error}`,
    };
  }

  if (!Array.isArray(fn.value.tasks)) {
    return {
      ok: false,
      value: undefined,
      error: "Unable to edit task: tasks is not an array",
    };
  }
  if (index < 0 || index >= fn.value.tasks.length) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to edit task: index ${index} is out of bounds (length ${fn.value.tasks.length})`,
    };
  }

  const task = value as Record<string, unknown> | null;
  if (task && typeof task === "object") {
    const constraintResult = validateTaskConstraints(
      task,
      fn.value.type as string,
    );
    if (!constraintResult.ok) {
      return { ok: false, value: undefined, error: constraintResult.error! };
    }
  }

  const newTasks = [...fn.value.tasks];
  newTasks[index] = value;

  const result = validateTasks({ tasks: newTasks });
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Invalid tasks after edit: ${result.error}`,
    };
  }
  return editFunction({ tasks: result.value });
}

export function delTask(index: number): Result<string> {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to delete task: ${fn.error}`,
    };
  }

  if (!Array.isArray(fn.value.tasks)) {
    return {
      ok: false,
      value: undefined,
      error: "Unable to delete task: tasks is not an array",
    };
  }
  if (index < 0 || index >= fn.value.tasks.length) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to delete task: index ${index} is out of bounds (length ${fn.value.tasks.length})`,
    };
  }

  const newTasks = [...fn.value.tasks];
  newTasks.splice(index, 1);
  const editResult = editFunction({ tasks: newTasks });
  if (!editResult.ok) {
    return editResult as Result<string>;
  }
  return {
    ok: true,
    value: `new length: ${newTasks.length}`,
    error: undefined,
  };
}

export function isDefaultTasks(): boolean {
  const result = readTasks();
  const v = result.ok ? result.value : undefined;
  return v === undefined || (Array.isArray(v) && v.length === 0);
}

/** Validate task schema and map indices (used by all mutation tools). */
export function validateTasks(fn: DeserializedFunction): Result<Tasks> {
  const parsed = TasksSchema.safeParse(fn.tasks);
  if (!parsed.success) {
    return { ok: false, value: undefined, error: parsed.error.message };
  }

  const mapIndices = parsed.data
    .map((t) => (t as Record<string, unknown>).map)
    .filter((m): m is number => typeof m === "number");
  const seen = new Set<number>();
  for (const idx of mapIndices) {
    if (seen.has(idx)) {
      return {
        ok: false,
        value: undefined,
        error: `Duplicate map index: ${idx}. Each task with a map index must reference a unique map index.`,
      };
    }
    seen.add(idx);
  }

  // Check map indices reference existing input_maps entries
  if (mapIndices.length > 0) {
    const fn = readFunction();
    if (fn.ok && Array.isArray(fn.value.input_maps)) {
      const inputMapsLength = fn.value.input_maps.length;
      for (const idx of mapIndices) {
        if (idx >= inputMapsLength) {
          return {
            ok: false,
            value: undefined,
            error: `Map index ${idx} is out of bounds: input_maps has ${inputMapsLength} entries (indices 0-${inputMapsLength - 1}).`,
          };
        }
      }
    }
  }

  return { ok: true, value: parsed.data, error: undefined };
}

/** Validate min_width/max_width from parameters.json (used only by checkTasks). */
function validateTasksWidth(tasks: Tasks): Result<undefined> {
  const paramsRaw = readParameters();
  if (!paramsRaw.ok) {
    return { ok: true, value: undefined, error: undefined };
  }
  const paramsResult = validateParameters(paramsRaw.value);
  if (!paramsResult.ok) {
    return { ok: true, value: undefined, error: undefined };
  }
  if (tasks.length < paramsResult.value.min_width) {
    return {
      ok: false,
      value: undefined,
      error: `Too few tasks: ${tasks.length} is below min_width of ${paramsResult.value.min_width}`,
    };
  }
  if (tasks.length > paramsResult.value.max_width) {
    return {
      ok: false,
      value: undefined,
      error: `Too many tasks: ${tasks.length} exceeds max_width of ${paramsResult.value.max_width}`,
    };
  }
  return { ok: true, value: undefined, error: undefined };
}
