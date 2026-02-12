export interface ToolState {
  spawnFunctionAgentsHasSpawned: boolean;
  editInputSchemaModalityRemovalRejected: boolean;
  runNetworkTestsApiBase: string;
  runNetworkTestsApiKey: string;
  readPlanIndex: number;
  writePlanIndex: number;
  submitApiBase: string;
  submitApiKey: string;
  gitUserName: string;
  gitUserEmail: string;
  ghToken: string;
  minWidth: number;
  maxWidth: number;
  hasReadOrWrittenSpec: boolean;
  hasReadOrWrittenEssay: boolean;
  hasReadOrWrittenEssayTasks: boolean;
  hasReadOrWrittenPlan: boolean;
  hasReadExampleFunctions: boolean;
  anyStepRan: boolean;
}

export function formatReadList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function makeToolState(options: {
  apiBase: string;
  apiKey: string;
  readPlanIndex: number;
  writePlanIndex: number;
  gitUserName: string;
  gitUserEmail: string;
  ghToken: string;
  minWidth: number;
  maxWidth: number;
}): ToolState {
  return {
    spawnFunctionAgentsHasSpawned: false,
    editInputSchemaModalityRemovalRejected: false,
    runNetworkTestsApiBase: options.apiBase,
    runNetworkTestsApiKey: options.apiKey,
    readPlanIndex: options.readPlanIndex,
    writePlanIndex: options.writePlanIndex,
    submitApiBase: options.apiBase,
    submitApiKey: options.apiKey,
    gitUserName: options.gitUserName,
    gitUserEmail: options.gitUserEmail,
    ghToken: options.ghToken,
    minWidth: options.minWidth,
    maxWidth: options.maxWidth,
    hasReadOrWrittenSpec: false,
    hasReadOrWrittenEssay: false,
    hasReadOrWrittenEssayTasks: false,
    hasReadOrWrittenPlan: false,
    hasReadExampleFunctions: false,
    anyStepRan: false,
  };
}
