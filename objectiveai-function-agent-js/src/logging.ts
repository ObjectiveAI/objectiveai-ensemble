import { existsSync, mkdirSync, readdirSync, writeFileSync, appendFileSync } from "fs";
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
    // Format arguments
    const message = args
      .map((arg) => {
        if (typeof arg === "string") return arg;
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      })
      .join(" ");

    // Write to file
    appendFileSync(logPath, message + "\n");

    // Write to console
    console.log(...args);
  };

  return { log, logPath };
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
