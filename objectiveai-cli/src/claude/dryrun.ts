import { bannerLines } from "../banner";
import { Dashboard } from "../dashboard";

interface SimAgent {
  path: string;
  name: string;
  logs: string[];
}

const AGENTS: SimAgent[] = [
  {
    path: "",
    name: "yc-application-scorer",
    logs: [
      "=== Initializing workspace ===",
      "=== Preparing ===",
      "Reading SPEC.md",
      "Writing ESSAY.md",
      "=== Inventing ===",
      "Compiling function tasks",
      "Spawning 3 child agents",
      "Waiting for child agents",
    ],
  },
  {
    path: "relevance-scorer",
    name: "relevance-scorer",
    logs: [
      "=== Initializing workspace ===",
      "=== Preparing ===",
      "Reading SPEC.md",
      "=== Inventing ===",
      "Spawning 2 child agents",
      "Waiting for child agents",
    ],
  },
  {
    path: "relevance-scorer/topic-detector",
    name: "topic-detector",
    logs: [
      "=== Initializing workspace ===",
      "=== Preparing ===",
      "=== Inventing ===",
      "Compiling vector tasks",
      "Running network tests",
      "Tests passed (3/3)",
    ],
  },
  {
    path: "relevance-scorer/keyword-matcher",
    name: "keyword-matcher",
    logs: [
      "=== Initializing workspace ===",
      "=== Preparing ===",
      "=== Inventing ===",
      "Compiling vector tasks",
      "Running network tests",
      "Tests passed (2/2)",
    ],
  },
  {
    path: "quality-scorer",
    name: "quality-scorer",
    logs: [
      "=== Initializing workspace ===",
      "=== Preparing ===",
      "=== Inventing ===",
      "Spawning 1 child agent",
      "Waiting for child agents",
    ],
  },
  {
    path: "quality-scorer/grammar-checker",
    name: "grammar-checker",
    logs: [
      "=== Initializing workspace ===",
      "=== Preparing ===",
      "=== Inventing ===",
      "Compiling vector tasks",
      "Running network tests",
      "Tests passed (4/4)",
    ],
  },
  {
    path: "sentiment-analyzer",
    name: "sentiment-analyzer",
    logs: [
      "=== Initializing workspace ===",
      "=== Preparing ===",
      "=== Inventing ===",
      "Compiling vector tasks",
      "Running network tests",
      "Tests passed (5/5)",
      "Submitting to GitHub",
    ],
  },
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function dryrun(): Promise<void> {
  const dashboard = new Dashboard(5);
  dashboard.setHeader(bannerLines());
  dashboard.setRootName(AGENTS[0].name);

  // Enable input bar and route @name messages
  dashboard.enableInput();
  dashboard.onInputSubmit = (line) => {
    if (line.startsWith("@")) {
      const spaceIdx = line.indexOf(" ");
      if (spaceIdx > 1) {
        const targetName = line.substring(1, spaceIdx);
        const message = line.substring(spaceIdx + 1).trim();
        if (message) {
          const path = dashboard.findPathByName(targetName);
          if (path !== undefined) {
            dashboard.handleEvent({ event: "log", path, line: `[USER]: ${message}` });
            return;
          }
          if (dashboard.isKnownName(targetName)) return;
        }
      }
    }
    dashboard.handleEvent({ event: "log", path: "", line: `[USER]: ${line}` });
  };

  // Raw stdin for keystroke capture
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", (data) => dashboard.handleKeystroke(Buffer.from(data)));
  }

  // Drip-feed events
  for (const agent of AGENTS) {
    if (agent.path) {
      dashboard.handleEvent({ event: "start", path: agent.path });
      await sleep(200);
      dashboard.handleEvent({ event: "name", path: agent.path, name: agent.name });
      await sleep(100);
    }

    for (const line of agent.logs) {
      dashboard.handleEvent({ event: "log", path: agent.path, line });
      await sleep(150 + Math.random() * 200);
    }
  }

  // Keep running — Ctrl+C handled by dashboard.handleKeystroke
  await new Promise<void>(() => {});
}
