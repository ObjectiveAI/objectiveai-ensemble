import { createInterface } from "readline";
import { AgentOptions, makeAgentOptions } from "../agentOptions";
import { init } from "../init";
import { prepare } from "./prepare";
import { inventMcp } from "./invent";
import { amendMcp } from "./amend";
import { makeToolState } from "../tools/claude/toolState";
import { setMessageQueue } from "../tools/claude/util";
import { getNextPlanIndex } from "./planIndex";
import { Dashboard } from "../dashboard";
import { createRootLogger, createChildLogger } from "../logging";
import { serializeEvent, AgentEvent } from "../events";
import { readName } from "../tools/name";
import { appendAmendment } from "../tools/markdown";

export * from "./prepare";
export * from "./invent";
export * from "./amend";

function setupLogging() {
  const isChild = !!process.env.OBJECTIVEAI_PARENT_PID;

  let dashboard: Dashboard | undefined;
  let onChildEvent: ((evt: AgentEvent) => void) | undefined;
  let logOverride: { log: AgentOptions["log"]; logPath: string } | undefined;

  if (isChild) {
    logOverride = createChildLogger();
    onChildEvent = (evt) => {
      process.stdout.write(serializeEvent(evt) + "\n");
    };
  } else if (process.stdout.isTTY) {
    dashboard = new Dashboard(5);
    logOverride = createRootLogger(dashboard);
    onChildEvent = (evt) => dashboard!.handleEvent(evt);
  }

  return { isChild, dashboard, onChildEvent, logOverride };
}

function emitNameEvent(
  isChild: boolean,
  dashboard: Dashboard | undefined,
) {
  const nameResult = readName();
  if (nameResult.ok && nameResult.value) {
    const name = nameResult.value.trim();
    if (dashboard) {
      dashboard.setRootName(name);
    }
    if (isChild) {
      process.stdout.write(serializeEvent({ event: "name", path: "", name }) + "\n");
    }
  }
}

function startStdinReader(queue: string[]): (() => void) | undefined {
  if (!process.stdin.isTTY) return undefined;
  const rl = createInterface({ input: process.stdin });
  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (trimmed) queue.push(trimmed);
  });
  return () => rl.close();
}

function emitDoneAndDispose(
  isChild: boolean,
  dashboard: Dashboard | undefined,
) {
  if (isChild) {
    process.stdout.write(serializeEvent({ event: "done", path: "" }) + "\n");
  }
  if (dashboard) {
    dashboard.dispose();
  }
}

export async function invent(partialOptions: Partial<AgentOptions> = {}): Promise<void> {
  const { isChild, dashboard, onChildEvent, logOverride } = setupLogging();

  const options = makeAgentOptions({
    ...partialOptions,
    ...(logOverride && { log: logOverride.log }),
    onChildEvent,
  });

  const nextPlanIndex = getNextPlanIndex();
  const toolState = makeToolState({
    apiBase: options.apiBase,
    apiKey: options.apiKey,
    readPlanIndex: nextPlanIndex,
    writePlanIndex: nextPlanIndex,
    gitUserName: options.gitUserName,
    gitUserEmail: options.gitUserEmail,
    ghToken: options.ghToken,
    minWidth: options.minWidth,
    maxWidth: options.maxWidth,
    onChildEvent,
  });

  setMessageQueue(toolState.messageQueue);
  const closeStdin = !isChild ? startStdinReader(toolState.messageQueue) : undefined;

  options.log("=== Initializing workspace ===");
  await init(options);

  options.log("=== Preparing ===");
  const sessionId = await prepare(toolState, options);

  emitNameEvent(isChild, dashboard);

  options.log("=== Inventing ===");
  await inventMcp(toolState, { ...options, sessionId });

  closeStdin?.();
  emitDoneAndDispose(isChild, dashboard);
}

export async function amend(partialOptions: Partial<AgentOptions> = {}): Promise<void> {
  const { isChild, dashboard, onChildEvent, logOverride } = setupLogging();

  const options = makeAgentOptions({
    ...partialOptions,
    ...(logOverride && { log: logOverride.log }),
    onChildEvent,
  });

  const amendment = options.spec;
  if (!amendment) {
    throw new Error("Amendment spec is required. Pass spec as the first argument.");
  }

  // Append amendment to SPEC.md
  const n = appendAmendment(amendment);
  options.log(`=== Appended AMENDMENT ${n} to SPEC.md ===`);

  const nextPlanIndex = getNextPlanIndex();
  const toolState = makeToolState({
    apiBase: options.apiBase,
    apiKey: options.apiKey,
    readPlanIndex: nextPlanIndex,
    writePlanIndex: nextPlanIndex,
    gitUserName: options.gitUserName,
    gitUserEmail: options.gitUserEmail,
    ghToken: options.ghToken,
    minWidth: options.minWidth,
    maxWidth: options.maxWidth,
    onChildEvent,
  });

  setMessageQueue(toolState.messageQueue);
  const closeStdin = !isChild ? startStdinReader(toolState.messageQueue) : undefined;

  options.log("=== Initializing workspace ===");
  await init(options);

  options.log("=== Preparing ===");
  const sessionId = await prepare(toolState, options);

  emitNameEvent(isChild, dashboard);

  options.log("=== Amending ===");
  await amendMcp(toolState, { ...options, sessionId }, amendment);

  closeStdin?.();
  emitDoneAndDispose(isChild, dashboard);
}
