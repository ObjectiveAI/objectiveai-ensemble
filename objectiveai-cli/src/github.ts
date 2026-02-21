import { Functions } from "objectiveai";
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

export interface GitHubBackend {
  pushInitial(options: PushInitialOptions): Promise<void>;
  pushFinal(options: PushFinalOptions): Promise<void>;
  getOwnerRepositoryCommit(dir: string, gitHubToken: string): Promise<OwnerRepositoryCommit | null>;
  fetchRemoteFunctions(
    refs: Iterable<OwnerRepositoryCommit>,
  ): Promise<Record<string, Functions.RemoteFunction> | null>;
  repoExists(name: string, gitHubToken: string): Promise<boolean>;
  getAuthenticatedUser(gitHubToken: string): Promise<string>;
}

export const DefaultGitHubBackend: GitHubBackend = {
  pushInitial,
  pushFinal,
  getOwnerRepositoryCommit,
  fetchRemoteFunctions,
  repoExists,
  getAuthenticatedUser,
};

export interface OwnerRepositoryCommit {
  owner: string;
  repository: string;
  commit: string;
}

const fetchRemoteFunctionCache = new Map<
  string,
  Promise<Functions.RemoteFunction | null>
>();

function fetchRemoteFunction(
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

async function fetchRemoteFunctions(
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

async function repoExists(name: string, gitHubToken: string): Promise<boolean> {
  try {
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${gitHubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (!userRes.ok) return false;
    const user = (await userRes.json()) as { login: string };

    const res = await fetch(
      `https://api.github.com/repos/${user.login}/${name}`,
      {
        headers: {
          Authorization: `Bearer ${gitHubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function commitExistsOnRemote(
  owner: string,
  repository: string,
  sha: string,
  gitHubToken: string,
): Promise<boolean> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repository}/commits/${sha}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${gitHubToken}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function getOwnerRepositoryCommit(
  dir: string,
  gitHubToken: string,
): Promise<OwnerRepositoryCommit | null> {
  const repoRoot = getRepoRoot(dir);
  if (!repoRoot) return null;

  const remoteUrl = getRemoteUrl(repoRoot);
  if (!remoteUrl) return null;

  const parsed = parseGitHubRemote(remoteUrl);
  if (!parsed) return null;

  const relativePath = relative(repoRoot, dir).replace(/\\/g, "/") || ".";

  if (hasUncommittedChanges(repoRoot, relativePath + "/function.json")) {
    return null;
  }

  const localCommit = getLatestCommitForPath(repoRoot, relativePath);
  if (!localCommit) return null;

  const exists = await commitExistsOnRemote(
    parsed.owner,
    parsed.repository,
    localCommit,
    gitHubToken,
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

async function pushInitial(options: PushInitialOptions): Promise<void> {
  const { dir, name, gitHubToken, gitAuthorName, gitAuthorEmail, message } =
    options;

  // Initialize fresh git repo
  removeGitDir(dir);
  initRepo(dir);
  addAll(dir);
  commit(dir, message, gitAuthorName, gitAuthorEmail);

  // Create upstream repository via GitHub API
  const res = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gitHubToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, visibility: "public" }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Failed to create repo ${name}: HTTP ${res.status} ${body}`,
    );
  }
  const repo = (await res.json()) as { owner: { login: string }; name: string };
  const owner: string = repo.owner.login;
  const repository: string = repo.name;

  // Push
  addRemote(dir, `https://github.com/${owner}/${repository}.git`);
  push(dir, gitHubToken);
}

export interface PushFinalOptions {
  dir: string;
  gitHubToken: string;
  gitAuthorName: string;
  gitAuthorEmail: string;
  message: string;
  description: string;
}

const authenticatedUserCache = new Map<string, Promise<string>>();

function getAuthenticatedUser(gitHubToken: string): Promise<string> {
  const cached = authenticatedUserCache.get(gitHubToken);
  if (cached) return cached;

  const promise = (async (): Promise<string> => {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${gitHubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to get authenticated user: HTTP ${res.status}`);
    }
    const user = (await res.json()) as { login: string };
    return user.login;
  })();

  authenticatedUserCache.set(gitHubToken, promise);
  return promise;
}

async function pushFinal(options: PushFinalOptions): Promise<void> {
  const {
    dir,
    gitHubToken,
    gitAuthorName,
    gitAuthorEmail,
    message,
    description,
  } = options;

  // Verify git is initialized and has a remote
  const repoRoot = getRepoRoot(dir);
  if (!repoRoot) throw new Error("Git repository not initialized");

  const remoteUrl = getRemoteUrl(repoRoot);
  if (!remoteUrl) throw new Error("No remote origin set");

  const parsed = parseGitHubRemote(remoteUrl);
  if (!parsed) throw new Error("Remote is not a GitHub repository");

  const { owner, repository } = parsed;

  // Update repository description via GitHub API
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repository}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${gitHubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ description }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Failed to update repo ${owner}/${repository}: HTTP ${res.status} ${body}`,
    );
  }

  // Commit and push
  addAll(dir);
  commit(dir, message, gitAuthorName, gitAuthorEmail);
  push(dir, gitHubToken);
}
