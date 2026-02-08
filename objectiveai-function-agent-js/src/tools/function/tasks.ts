import { Functions } from "objectiveai";
import { Result } from "../result";
import { DeserializedFunction, editFunction, readFunction } from "./function";
import z from "zod";

const TasksSchema = Functions.TaskExpressionsSchema.min(1);
type Tasks = z.infer<typeof TasksSchema>;

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

export function checkTasks(): Result<undefined> {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to check tasks: ${fn.error}`,
    };
  }

  const result = validateTasks(fn.value);
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `tasks is invalid: ${result.error}`,
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

export function appendTask(value: unknown): Result<undefined> {
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
  return editFunction({ tasks: result.value });
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

export function delTask(index: number): Result<undefined> {
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
  return editFunction({ tasks: newTasks });
}

export function validateTasks(fn: DeserializedFunction): Result<Tasks> {
  const parsed = TasksSchema.safeParse(fn.tasks);
  if (!parsed.success) {
    return { ok: false, value: undefined, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: undefined };
}
