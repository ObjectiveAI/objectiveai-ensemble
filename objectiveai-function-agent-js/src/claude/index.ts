import { createInterface } from "readline";
import type { Writable } from "stream";
import { AgentOptions, makeAgentOptions } from "../agentOptions";
import { printBanner } from "../banner";
import { init } from "../init";
import { prepare } from "./prepare";
import { inventMcp } from "./invent";
import { amendMcp } from "./amend";
import { makeToolState, ToolState } from "../tools/claude/toolState";
import { setMessageQueue } from "../tools/claude/util";
import { getNextPlanIndex } from "./planIndex";
import { Dashboard } from "../dashboard";
import { MessageQueue } from "../messageQueue";
import { createRootLogger, createChildLogger } from "../logging";
import { serializeEvent, AgentEvent } from "../events";
import { readName } from "../tools/name";
import { appendAmendment } from "../tools/markdown";

export * from "./prepare";
export * from "./invent";
export * from "./amend";
export { dryrun } from "./dryrun";

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

function routeForward(
  forward: string,
  message: string,
  activeChildren: Map<string, Writable>,
): void {
  const slashIdx = forward.indexOf("/");
  const childName = slashIdx === -1 ? forward : forward.substring(0, slashIdx);
  const remaining = slashIdx === -1 ? undefined : forward.substring(slashIdx + 1);

  const childStdin = activeChildren.get(childName);
  if (!childStdin) return;

  if (remaining) {
    childStdin.write(JSON.stringify({ forward: remaining, message }) + "\n");
  } else {
    childStdin.write(message + "\n");
  }
}

function startStdinReader(
  queue: MessageQueue,
  activeChildren: Map<string, Writable>,
  dashboard?: Dashboard,
): (() => void) | undefined {
  if (!process.stdin.readable) return undefined;
  const rl = createInterface({ input: process.stdin });
  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Forwarding protocol (child processes receive these from parent)
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed.forward === "string" && typeof parsed.message === "string") {
        routeForward(parsed.forward, parsed.message, activeChildren);
        return;
      }
    } catch {}

    // @name prefix targets a specific agent (root process with dashboard)
    if (dashboard && trimmed.startsWith("@")) {
      const spaceIdx = trimmed.indexOf(" ");
      if (spaceIdx > 1) {
        const targetName = trimmed.substring(1, spaceIdx);
        const message = trimmed.substring(spaceIdx + 1).trim();
        if (message) {
          const path = dashboard.findPathByName(targetName);
          if (path) {
            routeForward(path, message, activeChildren);
            return;
          }
          // Known but not active — silently drop
          if (dashboard.isKnownName(targetName)) {
            return;
          }
        }
      }
    }

    // Regular message for this agent
    queue.push(trimmed);
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
  if (!isChild) printBanner();

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
  toolState.messageQueue.onDrain = (msgs) => msgs.forEach((m) => options.log(`[USER MESSAGE]: ${m}`));
  const closeStdin = startStdinReader(toolState.messageQueue, toolState.activeChildren, dashboard);

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
  if (!isChild) printBanner();

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
  toolState.messageQueue.onDrain = (msgs) => msgs.forEach((m) => options.log(`[USER MESSAGE]: ${m}`));
  const closeStdin = startStdinReader(toolState.messageQueue, toolState.activeChildren, dashboard);

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
