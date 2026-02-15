import { existsSync, readFileSync, writeFileSync } from "fs";

export function readSession(): string | undefined {
  if (!existsSync("session.txt")) return undefined;
  const content = readFileSync("session.txt", "utf-8").trim();
  return content || undefined;
}

export function writeSession(sessionId: string): void {
  writeFileSync("session.txt", sessionId);
}
