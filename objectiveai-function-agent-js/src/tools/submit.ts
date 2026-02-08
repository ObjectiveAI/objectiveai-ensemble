import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { Result } from "./result";
import { checkFunction } from "./function/function";
import { checkExampleInputs } from "./inputs";
import { runNetworkTests } from "./test";
import { checkDescription, readDescription } from "./function/description";
import { readReadme } from "./markdown";
import { readName } from "./name";

function gh(args: string): string {
  return execSync(`gh ${args}`, { encoding: "utf-8", stdio: "pipe" }).trim();
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

function ensureGitHubRepo(name: string, description: string): void {
  const upstream = getUpstream();

  if (!upstream) {
    let cmd = `repo create ${name} --public --source=. --push`;
    if (description) {
      cmd += ` --description "${description.replace(/"/g, '\\"')}"`;
    }
    gh(cmd);
  } else {
    // Parse owner/repo from remote
    const match = upstream.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (match) {
      const repo = `${match[1]}/${match[2]}`;
      if (description) {
        gh(
          `repo edit ${repo} --description "${description.replace(/"/g, '\\"')}"`,
        );
      }
    }
    execSync("git push", { stdio: "inherit" });
  }
}

export async function submit(message: string, apiBase?: string): Promise<Result<string>> {
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
  const testsResult = await runNetworkTests(apiBase);
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

  // 5. Commit
  execSync("git add -A", { stdio: "pipe" });
  try {
    execSync("git diff --cached --quiet", { stdio: "pipe" });
    // No changes — still push in case there are unpushed commits
  } catch {
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      stdio: "inherit",
    });
  }

  // 6. Push and ensure GitHub repo with correct description
  try {
    ensureGitHubRepo(name, description);
  } catch (e) {
    return {
      ok: false,
      value: undefined,
      error: `Git push failed: ${(e as Error).message}`,
    };
  }

  // 7. Get the commit SHA
  const commit = execSync("git rev-parse HEAD", {
    encoding: "utf-8",
    stdio: "pipe",
  }).trim();

  return { ok: true, value: commit, error: undefined };
}
