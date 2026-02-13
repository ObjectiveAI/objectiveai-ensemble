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

export function editTasks(value: unknown): Result<undefined> {
  const result = validateTasks({ tasks: value });
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Invalid tasks: ${result.error}`,
    };
  }
  return editFunction({ tasks: result.value });
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
