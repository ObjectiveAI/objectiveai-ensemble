import { join } from "path";
import { homedir } from "os";

export function functionsDir(owner: string): string {
  return join(homedir(), ".objectiveai", "functions", owner);
}

export function inventDir(owner: string, name: string): string {
  return join(functionsDir(owner), name);
}
