import { AgentOptions } from "../../agentOptions";
import { inventFunctionTasks } from "./inventFunctionTasks";
import { inventVectorTasks } from "./inventVectorTasks";

export { inventFunctionTasks } from "./inventFunctionTasks";
export { inventVectorTasks } from "./inventVectorTasks";

export async function invent(options: AgentOptions = {}): Promise<void> {
  const depth = options.depth ?? 0;
  if (depth === 0) {
    await inventVectorTasks(options);
  } else {
    await inventFunctionTasks(options);
  }
}
