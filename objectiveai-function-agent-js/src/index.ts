/**
 * ObjectiveAI Function Agent SDK
 *
 * This SDK provides tools for building and executing ObjectiveAI function agents.
 */

export * as Claude from "./claude";
export * as GitHub from "./github";
export { init, type InitOptions } from "./init";
export { assets } from "./assets";
export {
  buildFunction,
  buildProfile,
  writeFunctionJson,
  writeProfileJson,
  defaultVectorCompletionTaskProfile,
  type FunctionFields,
  type ProfileOptions,
} from "./build";
export {
  runTests,
  test,
  testAsync,
  compiledTasksEqual,
  type RunTestsOptions,
} from "./test";
export {
  spawnApiServer,
  createLocalObjectiveAI,
  type ApiServerOptions,
} from "./apiServer";
export { ExampleInputSchema, type ExampleInput } from "./exampleInput";
export { createFileLogger, getLatestLogPath } from "./logging";
export { type LogFn, type AgentOptions } from "./agentOptions";
