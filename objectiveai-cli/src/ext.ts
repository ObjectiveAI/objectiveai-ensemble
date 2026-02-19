import { Functions } from "objectiveai";
import { OwnerRepositoryCommit } from "./github";

export namespace CliFunctionExt {
  export function* remoteChildren(
    self: Functions.Function,
  ): Iterable<OwnerRepositoryCommit> {
    for (const task of self.tasks) {
      if (task.type === "scalar.function" || task.type === "vector.function") {
        const { owner, repository, commit } = task;
        yield { owner, repository, commit };
      }
    }
  }
}
