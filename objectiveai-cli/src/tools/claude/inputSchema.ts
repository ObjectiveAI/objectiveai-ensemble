import { tool } from "@anthropic-ai/claude-agent-sdk";
import { ToolState, mustRead } from "./toolState";
import { resultFromResult, textResult, errorResult } from "./util";
import {
  checkInputSchema,
  editInputSchema,
  readInputSchema,
  readInputSchemaSchema,
  validateInputSchema,
} from "../function";
import { collectModalities } from "../inputs";
import z from "zod";
import { formatZodSchema } from "../schema";

export function makeReadInputSchema(state: ToolState) {
  return tool(
    "ReadInputSchema",
    "Read the Function's `input_schema` field",
    {},
    async () => {
      state.hasReadInputSchema = true;
      return resultFromResult(readInputSchema());
    },
  );
}

export function makeReadInputSchemaSchema(state: ToolState) {
  return tool(
    "ReadInputSchemaSchema",
    "Read the schema for Function `input_schema` field",
    {},
    async () => textResult(formatZodSchema(readInputSchemaSchema())),
  );
}

export function makeEditInputSchema(state: ToolState) {
  return tool(
    "EditInputSchema",
    "Edit the Function's `input_schema` field. If the new schema removes multimodal types present in the current schema, you must pass `dangerouslyRemoveModalities: true` — but only after re-reading SPEC.md to confirm this does not contradict it.",
    {
      value: z.record(z.string(), z.unknown()),
      dangerouslyRemoveModalities: z.boolean().optional(),
    },
    async ({ value, dangerouslyRemoveModalities }) => {
      const readErr = mustRead(state.hasReadInputSchema, "input_schema");
      if (readErr) return errorResult(readErr);

      if (dangerouslyRemoveModalities) {
        if (!state.editInputSchemaModalityRemovalRejected) {
          return resultFromResult({
            ok: false,
            value: undefined,
            error: "dangerouslyRemoveModalities can only be used after a previous EditInputSchema call was rejected for removing modalities.",
          });
        }
        state.editInputSchemaModalityRemovalRejected = false;
        return resultFromResult(editInputSchema(value));
      }

      // Check if the new schema removes modalities from the current schema
      const current = readInputSchema();
      if (current.ok && current.value) {
        const currentParsed = validateInputSchema({ input_schema: current.value });
        const newParsed = validateInputSchema({ input_schema: value });
        if (currentParsed.ok && newParsed.ok) {
          const oldModalities = collectModalities(currentParsed.value);
          const newModalities = collectModalities(newParsed.value);
          const removed: string[] = [];
          for (const m of oldModalities) {
            if (!newModalities.has(m)) {
              removed.push(m);
            }
          }
          if (removed.length > 0) {
            state.editInputSchemaModalityRemovalRejected = true;
            return resultFromResult({
              ok: false,
              value: undefined,
              error: `This edit would remove multimodal types: ${removed.join(", ")}. ` +
                `Re-read SPEC.md and confirm this does not contradict it. ` +
                `If SPEC.md allows removing these modalities, call EditInputSchema again with dangerouslyRemoveModalities: true.`,
            });
          }
        }
      }

      state.editInputSchemaModalityRemovalRejected = false;
      return resultFromResult(editInputSchema(value));
    },
  );
}

export function makeCheckInputSchema(state: ToolState) {
  return tool(
    "CheckInputSchema",
    "Validate the Function's `input_schema` field",
    {},
    async () => resultFromResult(checkInputSchema()),
  );
}
