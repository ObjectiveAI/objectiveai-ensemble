import {
  isDefaultType,
  isDefaultDescription,
  isDefaultInputSchema,
  isDefaultInputMaps,
  isDefaultTasks,
  isDefaultOutputLength,
  isDefaultInputSplit,
  isDefaultInputMerge,
} from "../function";
import { isDefaultExampleInputs } from "../inputs";
import { isDefaultReadme } from "../markdown";
import type { Writable } from "stream";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { AgentEvent } from "../../events";
import { MessageQueue } from "../../messageQueue";

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
  hasReadType: boolean;
  hasReadDescription: boolean;
  hasReadInputSchema: boolean;
  hasReadInputMaps: boolean;
  hasReadTasks: boolean;
  hasReadOutputLength: boolean;
  hasReadInputSplit: boolean;
  hasReadInputMerge: boolean;
  hasReadExampleInputs: boolean;
  hasReadReadme: boolean;
  onChildEvent?: (evt: AgentEvent) => void;
  messageQueue: MessageQueue;
  pendingAgentResults: Promise<CallToolResult>[];
  activeChildren: Map<string, import("stream").Writable>;
}

export function formatReadList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function mustRead(flag: boolean, fieldName: string): string | undefined {
  if (!flag) return `Read the ${fieldName} field before modifying it.`;
  return undefined;
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
  onChildEvent?: (evt: AgentEvent) => void;
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
    hasReadType: isDefaultType(),
    hasReadDescription: isDefaultDescription(),
    hasReadInputSchema: isDefaultInputSchema(),
    hasReadInputMaps: isDefaultInputMaps(),
    hasReadTasks: isDefaultTasks(),
    hasReadOutputLength: isDefaultOutputLength(),
    hasReadInputSplit: isDefaultInputSplit(),
    hasReadInputMerge: isDefaultInputMerge(),
    hasReadExampleInputs: isDefaultExampleInputs(),
    hasReadReadme: isDefaultReadme(),
    onChildEvent: options.onChildEvent,
    messageQueue: new MessageQueue(),
    pendingAgentResults: [],
    activeChildren: new Map(),
  };
}
