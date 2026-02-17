import { Functions } from "objectiveai";
import { execSync } from "child_process";
import { relative } from "path";
import {
  getRepoRoot,
  getRemoteUrl,
  parseGitHubRemote,
  getLatestCommitForPath,
  hasUncommittedChanges,
  removeGitDir,
  initRepo,
  addAll,
  commit,
  addRemote,
  push,
} from "./git";

export interface OwnerRepositoryCommit {
  owner: string;
  repository: string;
  commit: string;
}

const fetchRemoteFunctionCache = new Map<
  string,
  Promise<Functions.RemoteFunction | null>
>();

export function fetchRemoteFunction(
  owner: string,
  repository: string,
  commit: string,
): Promise<Functions.RemoteFunction | null> {
  const key = `${owner}/${repository}/${commit}`;

  const cached = fetchRemoteFunctionCache.get(key);
  if (cached) {
    return cached;
  }

  const promise = (async (): Promise<Functions.RemoteFunction | null> => {
    const url = `https://raw.githubusercontent.com/${owner}/${repository}/${commit}/function.json`;

    const response = await fetch(url);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching ${url}`);
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      return null;
    }

    const result = Functions.RemoteFunctionSchema.safeParse(json);
    if (!result.success) {
      return null;
    }

    return result.data;
  })();

  fetchRemoteFunctionCache.set(key, promise);
  return promise;
}

export async function fetchRemoteFunctions(
  refs: Iterable<OwnerRepositoryCommit>,
): Promise<Record<string, Functions.RemoteFunction> | null> {
  const entries = Array.from(refs);
  const results = await Promise.all(
    entries.map(({ owner, repository, commit }) =>
      fetchRemoteFunction(owner, repository, commit),
    ),
  );

  const record: Record<string, Functions.RemoteFunction> = {};
  for (let i = 0; i < entries.length; i++) {
    const result = results[i];
    if (result === null) {
      return null;
    }
    const { owner, repository, commit } = entries[i];
    record[`${owner}/${repository}/${commit}`] = result;
  }

  return record;
}

export async function repoExists(
  name: string,
  gitHubToken: string,
): Promise<boolean> {
  try {
    const res = await fetch(`https://api.github.com/repos/${name}`, {
      headers: {
        Authorization: `Bearer ${gitHubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function commitExistsOnRemote(
  owner: string,
  repository: string,
  sha: string,
): Promise<boolean> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repository}/commits/${sha}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function getOwnerRepositoryCommit(
  dir: string,
): Promise<OwnerRepositoryCommit | null> {
  const repoRoot = getRepoRoot(dir);
  if (!repoRoot) return null;

  const remoteUrl = getRemoteUrl(repoRoot);
  if (!remoteUrl) return null;

  const parsed = parseGitHubRemote(remoteUrl);
  if (!parsed) return null;

  const relativePath = relative(repoRoot, dir).replace(/\\/g, "/");

  if (hasUncommittedChanges(repoRoot, relativePath + "/function.json"))
    return null;
  if (hasUncommittedChanges(repoRoot, relativePath + "/profile.json"))
    return null;

  const localCommit = getLatestCommitForPath(repoRoot, relativePath);
  if (!localCommit) return null;

  const exists = await commitExistsOnRemote(
    parsed.owner,
    parsed.repository,
    localCommit,
  );
  if (!exists) return null;

  return {
    owner: parsed.owner,
    repository: parsed.repository,
    commit: localCommit,
  };
}

export interface PushInitialOptions {
  dir: string;
  name: string;
  gitHubToken: string;
  gitAuthorName: string;
  gitAuthorEmail: string;
  message: string;
}

export function pushInitial(options: PushInitialOptions): OwnerRepositoryCommit {
  const { dir, name, gitHubToken, gitAuthorName, gitAuthorEmail, message } =
    options;

  const ghEnv = { ...process.env, GH_TOKEN: gitHubToken };
  const execOpts = { encoding: "utf-8" as const, stdio: ["pipe", "pipe", "pipe"] as const };

  // Initialize fresh git repo
  removeGitDir(dir);
  initRepo(dir);
  addAll(dir);
  commit(dir, message, gitAuthorName, gitAuthorEmail);

  // Create upstream repository
  const repoJson = execSync(
    `gh repo create ${name} --public --json owner,name`,
    { ...execOpts, cwd: dir, env: ghEnv },
  );
  const repo = JSON.parse(repoJson.toString().trim());
  const owner: string = repo.owner.login;
  const repository: string = repo.name;

  // Push
  addRemote(dir, `https://github.com/${owner}/${repository}.git`);
  push(dir);

  // Get commit SHA
  const sha = execSync("git rev-parse HEAD", { ...execOpts, cwd: dir })
    .toString()
    .trim();

  return { owner, repository, commit: sha };
}

export interface PushFinalOptions {
  dir: string;
  gitHubToken: string;
  gitAuthorName: string;
  gitAuthorEmail: string;
  message: string;
  description: string;
}

export function pushFinal(options: PushFinalOptions): OwnerRepositoryCommit {
  const { dir, gitHubToken, gitAuthorName, gitAuthorEmail, message, description } =
    options;

  const ghEnv = { ...process.env, GH_TOKEN: gitHubToken };
  const execOpts = { encoding: "utf-8" as const, stdio: ["pipe", "pipe", "pipe"] as const };

  // Verify git is initialized and has a remote
  const repoRoot = getRepoRoot(dir);
  if (!repoRoot) throw new Error("Git repository not initialized");

  const remoteUrl = getRemoteUrl(repoRoot);
  if (!remoteUrl) throw new Error("No remote origin set");

  const parsed = parseGitHubRemote(remoteUrl);
  if (!parsed) throw new Error("Remote is not a GitHub repository");

  const { owner, repository } = parsed;

  // Update repository description
  execSync(
    `gh repo edit ${owner}/${repository} --description "${description.replace(/"/g, '\\"')}"`,
    { ...execOpts, cwd: dir, env: ghEnv },
  );

  // Commit and push
  addAll(dir);
  commit(dir, message, gitAuthorName, gitAuthorEmail);
  push(dir);

  // Get commit SHA
  const sha = execSync("git rev-parse HEAD", { ...execOpts, cwd: dir })
    .toString()
    .trim();

  return { owner, repository, commit: sha };
}
