import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { Result } from "./result";
import { writeSession } from "./session";
import { checkFunction } from "./function/function";
import { buildProfile } from "./profile";
import { checkExampleInputs } from "./inputs";
import { runNetworkTests } from "./test";
import { checkDescription, readDescription } from "./function/description";
import { readReadme } from "./markdown";
import { readName } from "./name";

function ghEnv(ghToken: string): NodeJS.ProcessEnv {
  return { ...process.env, GH_TOKEN: ghToken };
}

function gh(args: string, ghToken: string): string {
  return execSync(`gh ${args}`, { encoding: "utf-8", stdio: "pipe", env: ghEnv(ghToken) }).trim();
}

function getUpstream(): string | null {
  try {
    return execSync("git remote get-url origin", {
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
  } catch {
    return null;
  }
}

function ensureGitHubRepo(name: string, description: string, ghToken: string): void {
  const upstream = getUpstream();

  if (!upstream) {
    let cmd = `repo create ${name} --public --source=. --push`;
    if (description) {
      cmd += ` --description "${description.replace(/"/g, '\\"')}"`;
    }
    gh(cmd, ghToken);
  } else {
    // Parse owner/repo from remote
    const match = upstream.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (match) {
      const repo = `${match[1]}/${match[2]}`;
      if (description) {
        gh(
          `repo edit ${repo} --description "${description.replace(/"/g, '\\"')}"`,
          ghToken,
        );
      }
    }
    execSync("git push", { stdio: "inherit", env: ghEnv(ghToken) });
  }
}

export interface SubmitGitIdentity {
  userName?: string;
  userEmail?: string;
  ghToken?: string;
}

export async function submit(message: string, apiBase?: string, apiKey?: string, git?: SubmitGitIdentity, sessionId?: string): Promise<Result<string>> {
  // 0. Build profile from current function definition
  const profileBuild = buildProfile();
  if (!profileBuild.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Profile build failed: ${profileBuild.error}\n\nFix the function definition first.`,
    };
  }

  // 1. Check function
  const fnCheck = checkFunction();
  if (!fnCheck.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Function check failed: ${fnCheck.error}\n\nUse the CheckFunction tool to see detailed errors and fix them.`,
    };
  }

  // 2. Check example inputs
  const inputsCheck = checkExampleInputs();
  if (!inputsCheck.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Example inputs check failed: ${inputsCheck.error}\n\nUse the CheckExampleInputs tool to see detailed errors and fix them.`,
    };
  }

  // 3. Run network tests
  const testsResult = await runNetworkTests(apiBase, apiKey);
  if (!testsResult.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Network tests failed: ${testsResult.error}\n\nUse the ReadDefaultNetworkTest and ReadSwissSystemNetworkTest tools to read individual test results for more details, each ExampleInput has one.`,
    };
  }

  // 4. Check README.md is non-empty
  const readmeResult = readReadme();
  if (!readmeResult.ok || !readmeResult.value.trim()) {
    return {
      ok: false,
      value: undefined,
      error: "README.md is missing or empty. Use the WriteReadme tool to create it.",
    };
  }

  // 5. Check description is valid
  const descCheck = checkDescription();
  if (!descCheck.ok) {
    return {
      ok: false,
      value: undefined,
      error: `${descCheck.error}\n\nUse the EditDescription tool to fix it.`,
    };
  }

  const descResult = readDescription();
  const description =
    descResult.ok && typeof descResult.value === "string"
      ? descResult.value
      : "";

  // 6. Read name for GitHub
  const nameResult = readName();
  if (!nameResult.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to read name.txt: ${nameResult.error}`,
    };
  }
  const name = nameResult.value.trim();

  // 7. Commit
  if (sessionId) writeSession(sessionId);
  execSync("git add -A", { stdio: "pipe" });
  try {
    execSync("git diff --cached --quiet", { stdio: "pipe" });
    // No changes — still push in case there are unpushed commits
  } catch {
    const commitEnv = {
      ...process.env,
      ...(git?.userName && { GIT_AUTHOR_NAME: git.userName, GIT_COMMITTER_NAME: git.userName }),
      ...(git?.userEmail && { GIT_AUTHOR_EMAIL: git.userEmail, GIT_COMMITTER_EMAIL: git.userEmail }),
    };
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      stdio: "inherit",
      env: commitEnv,
    });
  }

  // 8. Push and ensure GitHub repo with correct description
  const ghToken = git?.ghToken ?? process.env.GH_TOKEN ?? "";
  try {
    ensureGitHubRepo(name, description, ghToken);
  } catch (e) {
    return {
      ok: false,
      value: undefined,
      error: `Git push failed: ${(e as Error).message}`,
    };
  }

  // 9. Get the commit SHA
  const commit = execSync("git rev-parse HEAD", {
    encoding: "utf-8",
    stdio: "pipe",
  }).trim();

  return { ok: true, value: commit, error: undefined };
}
