import { getSlashCwd, getBackslashCwd, getGitBashCwd } from "../util";

export type AllowedToolKind = "ts-node" | "write-edit" | "edit-glob";

export interface AllowedTool {
  kind: AllowedToolKind;
  value: string;
}

/**
 * Generate allowed tools array with all path variants.
 * Includes universal base tools plus expanded versions for each AllowedTool.
 */
export function allowedTools(tools: AllowedTool[]): string[] {
  const slashCwd = getSlashCwd();
  const backslashCwd = getBackslashCwd();
  const gitBashCwd = getGitBashCwd();

  // Universal base tools
  const result: string[] = [
    "Bash(ls*)",
    "Bash(cd)",
    "Bash(cat)",
    "Bash(diff)",
    "Glob",
    "Grep",
    "Read",
    "WebFetch",
    "WebSearch",
  ];

  for (const tool of tools) {
    switch (tool.kind) {
      case "ts-node": {
        const script = tool.value;
        result.push(
          `Bash(ts-node ${script})`,
          `Bash(npx ts-node ${script})`,
          `Bash(cd ${slashCwd} && ts-node ${script})`,
          `Bash(cd ${backslashCwd} && ts-node ${script})`,
          `Bash(cd ${gitBashCwd} && ts-node ${script})`,
          `Bash(cd ${slashCwd} && npx ts-node ${script})`,
          `Bash(cd ${backslashCwd} && npx ts-node ${script})`,
          `Bash(cd ${gitBashCwd} && npx ts-node ${script})`,
        );
        break;
      }
      case "write-edit": {
        const file = tool.value;
        // Convert forward slashes to backslashes for Windows path
        const backslashFile = file.replace(/\//g, "\\");
        result.push(
          `Edit(${file})`,
          `Edit(./${file})`,
          `Edit(${slashCwd}/${file})`,
          `Edit(${backslashCwd}\\${backslashFile})`,
          `Edit(${gitBashCwd}/${file})`,
          `Write(${file})`,
          `Write(./${file})`,
          `Write(${slashCwd}/${file})`,
          `Write(${backslashCwd}\\${backslashFile})`,
          `Write(${gitBashCwd}/${file})`,
        );
        break;
      }
      case "edit-glob": {
        // For glob patterns like objectiveai/objectiveai-api/src/**
        const pattern = tool.value;
        const backslashPattern = pattern.replace(/\//g, "\\");
        result.push(
          `Edit(${pattern})`,
          `Edit(./${pattern})`,
          `Edit(${slashCwd}/${pattern})`,
          `Edit(${backslashCwd}\\${backslashPattern})`,
          `Edit(${gitBashCwd}/${pattern})`,
        );
        break;
      }
    }
  }

  console.log(result);

  return result;
}
