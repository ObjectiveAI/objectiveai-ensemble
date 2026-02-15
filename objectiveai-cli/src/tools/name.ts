import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { Result } from "./result";

export function readName(): Result<string> {
  if (!existsSync("name.txt")) {
    return { ok: false, value: undefined, error: "name.txt is missing" };
  }
  return { ok: true, value: readFileSync("name.txt", "utf-8"), error: undefined };
}

function ghEnv(ghToken: string): NodeJS.ProcessEnv {
  return { ...process.env, GH_TOKEN: ghToken };
}

function getGitHubOwner(ghToken: string): string | null {
  try {
    return execSync("gh api user --jq .login", {
      encoding: "utf-8",
      stdio: "pipe",
      env: ghEnv(ghToken),
    }).trim();
  } catch {
    return null;
  }
}

function repoExists(owner: string, name: string, ghToken: string): boolean {
  try {
    execSync(`gh repo view ${owner}/${name}`, {
      stdio: "ignore",
      env: ghEnv(ghToken),
    });
    return true;
  } catch {
    return false;
  }
}

export function writeName(content: string, ghToken: string): Result<undefined> {
  const name = content.trim();
  const owner = getGitHubOwner(ghToken);
  if (owner && repoExists(owner, name, ghToken)) {
    return {
      ok: false,
      value: undefined,
      error: `Repository ${owner}/${name} already exists on GitHub. Choose a different name.`,
    };
  }
  writeFileSync("name.txt", name);
  return { ok: true, value: undefined, error: undefined };
}
