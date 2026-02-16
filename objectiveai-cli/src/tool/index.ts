import z from "zod";
import { Result } from "../result";

export interface Tool<TSchema extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  description: string;
  inputSchema: TSchema;
  fn: (args: z.infer<TSchema>) => Promise<Result<string>>;
}
