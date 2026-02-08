import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult, textResult } from "./util";
import {
  checkDescription,
  editDescription,
  readDescription,
  readDescriptionSchema,
} from "../function";
import z from "zod";
import { formatZodSchema } from "../schema";

export const ReadDescription = tool(
  "ReadDescription",
  "Read the Function's `description` field",
  {},
  async () => resultFromResult(readDescription()),
);

export const ReadDescriptionSchema = tool(
  "ReadDescriptionSchema",
  "Read the schema for Function `description` field",
  {},
  async () => textResult(formatZodSchema(readDescriptionSchema())),
);

export const EditDescription = tool(
  "EditDescription",
  "Edit the Function's `description` field",
  { value: z.string() },
  async ({ value }) => resultFromResult(editDescription(value)),
);

export const CheckDescription = tool(
  "CheckDescription",
  "Validate the Function's `description` field",
  {},
  async () => resultFromResult(checkDescription()),
);
