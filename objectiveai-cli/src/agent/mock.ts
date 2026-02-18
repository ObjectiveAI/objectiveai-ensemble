import { GitHubBackend, PushFinalOptions, PushInitialOptions } from "../github";
import { AgentStepFn } from ".";

export function mock(): [AgentStepFn, GitHubBackend] {
  const dirToName = new Map<string, string>();
  return [
    (() => {
      throw new Error("Not implemented yet");
    }) as AgentStepFn,
    {
      pushInitial: ({ dir, name }: PushInitialOptions) => {
        dirToName.set(dir, name);
        return Promise.resolve({
          owner: "mock",
          repository: name,
          commit: "mock",
        });
      },
      pushFinal: ({ dir }: PushFinalOptions) =>
        Promise.resolve({
          owner: "mock",
          repository:
            dirToName.get(dir) ??
            (() => {
              throw new Error(
                "Expected pushInitial to be called first for dir " + dir,
              );
            })(),
          commit: "mock",
        }),
      getOwnerRepositoryCommit: (dir: string) =>
        Promise.resolve({
          owner: "mock",
          repository:
            dirToName.get(dir) ??
            (() => {
              throw new Error(
                "Expected pushInitial to be called first for dir " + dir,
              );
            })(),
          commit: "mock",
        }),
      fetchRemoteFunctions: () => Promise.resolve({}),
      repoExists: () => Promise.resolve(false),
    },
  ];
}

// export const Mock
