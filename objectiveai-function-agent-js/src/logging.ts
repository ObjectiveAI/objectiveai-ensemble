import { existsSync, mkdirSync, readdirSync, writeFileSync, appendFileSync } from "fs";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { LogFn } from "./agentOptions";

// Find the next available log index
function getNextLogIndex(): number {
  const logsDir = "logs";
  let nextIndex = 1;

  if (existsSync(logsDir)) {
    const files = readdirSync(logsDir);
    const logNumbers = files
      .filter((f) => /^\d+\.txt$/.test(f))
      .map((f) => parseInt(f.replace(".txt", ""), 10))
      .filter((n) => !isNaN(n));

    if (logNumbers.length > 0) {
      nextIndex = Math.max(...logNumbers) + 1;
    }
  }

  return nextIndex;
}

/**
 * Creates a log function that writes to both a file and console.
 * Returns the log function and the path to the log file.
 */
export function createFileLogger(): { log: LogFn; logPath: string } {
  const logsDir = "logs";

  // Ensure logs directory exists
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }

  const logIndex = getNextLogIndex();
  const logPath = `${logsDir}/${logIndex}.txt`;

  // Create empty log file
  writeFileSync(logPath, "");

  const log: LogFn = (...args: unknown[]) => {
    const message = args
      .map((arg) => (typeof arg === "string" ? arg : String(arg)))
      .join(" ");

    appendFileSync(logPath, message + "\n");
    console.log(message);
  };

  return { log, logPath };
}

/**
 * Extract important info from an SDK message and pre-serialize to string.
 * Returns null for messages that should be skipped.
 */
export function formatMessage(msg: SDKMessage): string | null {
  switch (msg.type) {
    case "system": {
      if (msg.subtype === "init") {
        return `[init] session=${msg.session_id} model=${msg.model}`;
      }
      if (msg.subtype === "compact_boundary") {
        return `[compact]`;
      }
      return null;
    }

    case "assistant": {
      const parts: string[] = [];
      for (const block of msg.message.content) {
        if (block.type === "text") {
          const text = block.text.trim();
          if (text) parts.push(text);
        } else if (block.type === "tool_use") {
          parts.push(`[tool_use] ${block.name}`);
        }
      }
      return parts.length > 0 ? parts.join("\n") : null;
    }

    case "result": {
      const durationSec = (msg.duration_ms / 1000).toFixed(1);
      if (msg.subtype === "success") {
        return `[result] success turns=${msg.num_turns} cost=$${msg.total_cost_usd.toFixed(4)} duration=${durationSec}s`;
      }
      return `[result] error=${msg.subtype} turns=${msg.num_turns} cost=$${msg.total_cost_usd.toFixed(4)} duration=${durationSec}s errors=${JSON.stringify(msg.errors)}`;
    }

    default:
      return null;
  }
}

/**
 * Consume an SDK message stream, extract session_id, and log formatted messages.
 */
export async function consumeStream(
  stream: AsyncIterable<SDKMessage>,
  log: LogFn,
  sessionId?: string,
): Promise<string | undefined> {
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    const formatted = formatMessage(message);
    if (formatted) log(formatted);
  }
  return sessionId;
}

/**
 * Get the path to the most recent log file.
 */
export function getLatestLogPath(): string | null {
  const logsDir = "logs";

  if (!existsSync(logsDir)) {
    return null;
  }

  const files = readdirSync(logsDir);
  const logNumbers = files
    .filter((f) => /^\d+\.txt$/.test(f))
    .map((f) => parseInt(f.replace(".txt", ""), 10))
    .filter((n) => !isNaN(n));

  if (logNumbers.length === 0) {
    return null;
  }

  const maxIndex = Math.max(...logNumbers);
  return `${logsDir}/${maxIndex}.txt`;
}
