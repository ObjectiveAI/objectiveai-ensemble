import { Functions } from "objectiveai";

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
