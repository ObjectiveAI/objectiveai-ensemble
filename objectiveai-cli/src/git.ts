import { execSync, ExecSyncOptionsWithStringEncoding } from "child_process";

const execOpts: ExecSyncOptionsWithStringEncoding = { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] };

export function getRepoRoot(dir: string): string | null {
  try {
    const root = execSync("git rev-parse --show-toplevel", {
      ...execOpts,
      cwd: dir,
    }).trim();
    return root || null;
  } catch {
    return null;
  }
}

export function getRemoteUrl(dir: string): string | null {
  try {
    const url = execSync("git remote get-url origin", {
      ...execOpts,
      cwd: dir,
    }).trim();
    return url || null;
  } catch {
    return null;
  }
}

export function parseGitHubRemote(
  url: string,
): { owner: string; repository: string } | null {
  // HTTPS: https://github.com/Owner/Repo.git
  const httpsMatch = url.match(/github\.com\/([^/]+)\/([^/.]+)/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repository: httpsMatch[2] };
  }
  // SSH: git@github.com:Owner/Repo.git
  const sshMatch = url.match(/github\.com:([^/]+)\/([^/.]+)/);
  if (sshMatch) {
    return { owner: sshMatch[1], repository: sshMatch[2] };
  }
  return null;
}

export function getLatestCommitForPath(
  repoRoot: string,
  relativePath: string,
): string | null {
  try {
    const sha = execSync(`git log -1 --format=%H -- "${relativePath}"`, {
      ...execOpts,
      cwd: repoRoot,
    }).trim();
    return sha || null;
  } catch {
    return null;
  }
}

export function hasUncommittedChanges(
  repoRoot: string,
  relativePath: string,
): boolean {
  try {
    const output = execSync(`git status --porcelain -- "${relativePath}"`, {
      ...execOpts,
      cwd: repoRoot,
    }).trim();
    return output.length > 0;
  } catch {
    return true; // If we can't check, assume dirty
  }
}
