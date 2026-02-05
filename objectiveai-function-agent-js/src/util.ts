import { execSync } from "child_process";

// Get the current working directory with forward slashes (Linux/Mac style)
export function getSlashCwd(): string {
  return process.cwd().replace(/\\/g, "/");
}

// Get the current working directory with backslashes (Windows style)
export function getBackslashCwd(): string {
  return process.cwd().replace(/\//g, "\\");
}

// Get the current working directory in Git Bash/MSYS2 style (D:\path -> /d/path)
export function getGitBashCwd(): string {
  return execSync('bash -c "pwd"', { encoding: "utf-8" }).trim();
}
