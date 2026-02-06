import { Functions, ObjectiveAI } from 'objectiveai';
import z, { z as z$1 } from 'zod';
import { ChildProcess } from 'child_process';

type LogFn = (...args: unknown[]) => void;
interface AgentOptions {
    name?: string;
    spec?: string;
    apiBase?: string;
    sessionId?: string;
    log?: LogFn;
    depth?: number;
}

declare function prepare(options?: AgentOptions): Promise<string | undefined>;

declare function inventFunctionTasks(options?: AgentOptions): Promise<void>;

declare function inventVectorTasks(options?: AgentOptions): Promise<void>;

declare function invent(options?: AgentOptions): Promise<void>;

declare function handleIssues(options?: AgentOptions): Promise<void>;

type index$1_AgentOptions = AgentOptions;
declare const index$1_handleIssues: typeof handleIssues;
declare const index$1_invent: typeof invent;
declare const index$1_inventFunctionTasks: typeof inventFunctionTasks;
declare const index$1_inventVectorTasks: typeof inventVectorTasks;
declare const index$1_prepare: typeof prepare;
declare namespace index$1 {
  export { type index$1_AgentOptions as AgentOptions, index$1_handleIssues as handleIssues, index$1_invent as invent, index$1_inventFunctionTasks as inventFunctionTasks, index$1_inventVectorTasks as inventVectorTasks, index$1_prepare as prepare };
}

interface IssueComment {
    body: string;
    created_at: string;
    user: {
        login: string;
    } | null;
}
interface Issue {
    number: number;
    title: string;
    body: string | null;
    state: "open" | "closed";
    labels: {
        name: string;
    }[];
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    user: {
        login: string;
    } | null;
    comments?: IssueComment[];
}
declare function fetchIssueComments(issueNumber: number): IssueComment[];
declare function hasOpenIssues(): boolean;
declare function fetchOpenIssues(): Issue[];
declare function fetchClosedIssues(): Issue[];
declare function commentOnIssue(issueNumber: number, comment: string): void;
declare function markIssueResolved(issueNumber: number): number;
declare function closeIssue(issueNumber: number): void;
interface CreateRepositoryOptions {
    name?: string;
    description?: string;
    public?: boolean;
}
declare function createRepository(options?: CreateRepositoryOptions): string;
interface CommitAndPushOptions {
    message: string;
    name?: string;
    description?: string;
    dryRun?: boolean;
}
declare function commitAndPush(options: CommitAndPushOptions): void;
declare function commitOnly(message: string): void;
declare function push(): void;
declare function pushOrCreateUpstream(options?: CreateRepositoryOptions): void;
declare function getCurrentRevision(): string | null;
declare function resetToRevision(revision: string | null): void;
declare function hasUncommittedChanges(): boolean;
declare function hasUntrackedFiles(): boolean;
declare function checkoutSubmodule(): void;
declare function resetAndUpdateSubmodule(): void;
interface FunctionTask {
    type: string;
    owner?: string;
    repository?: string;
    commit?: string;
}
interface CloneSubFunctionsOptions {
    latest?: boolean;
}
interface ClonedSubFunction {
    owner: string;
    repository: string;
    commit: string;
    path: string;
}
declare function cloneSubFunctions(options?: CloneSubFunctionsOptions): ClonedSubFunction[];

type index_CloneSubFunctionsOptions = CloneSubFunctionsOptions;
type index_ClonedSubFunction = ClonedSubFunction;
type index_CommitAndPushOptions = CommitAndPushOptions;
type index_CreateRepositoryOptions = CreateRepositoryOptions;
type index_FunctionTask = FunctionTask;
type index_Issue = Issue;
type index_IssueComment = IssueComment;
declare const index_checkoutSubmodule: typeof checkoutSubmodule;
declare const index_cloneSubFunctions: typeof cloneSubFunctions;
declare const index_closeIssue: typeof closeIssue;
declare const index_commentOnIssue: typeof commentOnIssue;
declare const index_commitAndPush: typeof commitAndPush;
declare const index_commitOnly: typeof commitOnly;
declare const index_createRepository: typeof createRepository;
declare const index_fetchClosedIssues: typeof fetchClosedIssues;
declare const index_fetchIssueComments: typeof fetchIssueComments;
declare const index_fetchOpenIssues: typeof fetchOpenIssues;
declare const index_getCurrentRevision: typeof getCurrentRevision;
declare const index_hasOpenIssues: typeof hasOpenIssues;
declare const index_hasUncommittedChanges: typeof hasUncommittedChanges;
declare const index_hasUntrackedFiles: typeof hasUntrackedFiles;
declare const index_markIssueResolved: typeof markIssueResolved;
declare const index_push: typeof push;
declare const index_pushOrCreateUpstream: typeof pushOrCreateUpstream;
declare const index_resetAndUpdateSubmodule: typeof resetAndUpdateSubmodule;
declare const index_resetToRevision: typeof resetToRevision;
declare namespace index {
  export { type index_CloneSubFunctionsOptions as CloneSubFunctionsOptions, type index_ClonedSubFunction as ClonedSubFunction, type index_CommitAndPushOptions as CommitAndPushOptions, type index_CreateRepositoryOptions as CreateRepositoryOptions, type index_FunctionTask as FunctionTask, type index_Issue as Issue, type index_IssueComment as IssueComment, index_checkoutSubmodule as checkoutSubmodule, index_cloneSubFunctions as cloneSubFunctions, index_closeIssue as closeIssue, index_commentOnIssue as commentOnIssue, index_commitAndPush as commitAndPush, index_commitOnly as commitOnly, index_createRepository as createRepository, index_fetchClosedIssues as fetchClosedIssues, index_fetchIssueComments as fetchIssueComments, index_fetchOpenIssues as fetchOpenIssues, index_getCurrentRevision as getCurrentRevision, index_hasOpenIssues as hasOpenIssues, index_hasUncommittedChanges as hasUncommittedChanges, index_hasUntrackedFiles as hasUntrackedFiles, index_markIssueResolved as markIssueResolved, index_push as push, index_pushOrCreateUpstream as pushOrCreateUpstream, index_resetAndUpdateSubmodule as resetAndUpdateSubmodule, index_resetToRevision as resetToRevision };
}

interface Parameters {
    depth: number;
}
declare function init(options?: AgentOptions): Promise<void>;

declare const assets: Record<string, string>;

declare const defaultVectorCompletionTaskProfile: Functions.VectorCompletionTaskProfile;
interface FunctionFields {
    type?: unknown;
    description?: unknown;
    input_maps?: unknown;
    input_schema?: unknown;
    tasks?: unknown;
    output_length?: unknown;
    input_split?: unknown;
    input_merge?: unknown;
}
declare function buildFunction(fields?: FunctionFields): Record<string, unknown>;
declare function writeFunctionJson(fields?: FunctionFields, path?: string): void;
interface ProfileOptions {
    name?: string | null;
    tasks?: Functions.Task[] | null;
    vectorCompletionTaskProfile?: Functions.VectorCompletionTaskProfile;
}
declare function buildProfile(options?: ProfileOptions): Functions.RemoteProfile;
declare function writeProfileJson(options?: ProfileOptions, path?: string): void;

declare const ExampleInputSchema: z.ZodObject<{
    value: z.ZodType<string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[])[])[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[])[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any;
    } | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[], unknown, z.core.$ZodTypeInternals<string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[])[])[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[])[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[])[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any)[];
    } | (string | number | boolean | {
        type: "image_url";
        image_url: {
            url: string;
            detail?: "low" | "high" | "auto" | null | undefined;
        };
    } | {
        type: "input_audio";
        input_audio: {
            data: string;
            format: "wav" | "mp3";
        };
    } | {
        type: "video_url" | "input_video";
        video_url: {
            url: string;
        };
    } | {
        type: "file";
        file: {
            file_data?: string | null | undefined;
            file_id?: string | null | undefined;
            filename?: string | null | undefined;
            file_url?: string | null | undefined;
        };
    } | {
        [key: string]: string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | /*elided*/ any | /*elided*/ any;
    } | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[], unknown>>;
    compiledTasks: z.ZodArray<z.ZodUnion<readonly [z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"scalar.function">;
        owner: z.ZodString;
        repository: z.ZodString;
        commit: z.ZodString;
        input: z.ZodType<string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any;
        } | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[], unknown, z.core.$ZodTypeInternals<string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any;
        } | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[], unknown>>;
        output: z.ZodUnion<readonly [z.ZodObject<{
            $jmespath: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            $starlark: z.ZodString;
        }, z.core.$strict>]>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"vector.function">;
        owner: z.ZodString;
        repository: z.ZodString;
        commit: z.ZodString;
        input: z.ZodType<string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any;
        } | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[], unknown, z.core.$ZodTypeInternals<string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any;
        } | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[], unknown>>;
        output: z.ZodUnion<readonly [z.ZodObject<{
            $jmespath: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            $starlark: z.ZodString;
        }, z.core.$strict>]>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"vector.completion">;
        messages: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            role: z.ZodLiteral<"developer">;
            content: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodObject<{
                type: z.ZodLiteral<"text">;
                text: z.ZodString;
            }, z.core.$strip>>]>;
            name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, z.core.$strip>, z.ZodObject<{
            role: z.ZodLiteral<"system">;
            content: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodObject<{
                type: z.ZodLiteral<"text">;
                text: z.ZodString;
            }, z.core.$strip>>]>;
            name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, z.core.$strip>, z.ZodObject<{
            role: z.ZodLiteral<"user">;
            content: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"text">;
                text: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"image_url">;
                image_url: z.ZodObject<{
                    url: z.ZodString;
                    detail: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
                        auto: "auto";
                        low: "low";
                        high: "high";
                    }>>>;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"input_audio">;
                input_audio: z.ZodObject<{
                    data: z.ZodString;
                    format: z.ZodEnum<{
                        wav: "wav";
                        mp3: "mp3";
                    }>;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodEnum<{
                    video_url: "video_url";
                    input_video: "input_video";
                }>;
                video_url: z.ZodObject<{
                    url: z.ZodString;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"file">;
                file: z.ZodObject<{
                    file_data: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    file_id: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    filename: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    file_url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                }, z.core.$strip>;
            }, z.core.$strip>], "type">>]>;
            name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, z.core.$strip>, z.ZodObject<{
            role: z.ZodLiteral<"tool">;
            content: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"text">;
                text: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"image_url">;
                image_url: z.ZodObject<{
                    url: z.ZodString;
                    detail: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
                        auto: "auto";
                        low: "low";
                        high: "high";
                    }>>>;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"input_audio">;
                input_audio: z.ZodObject<{
                    data: z.ZodString;
                    format: z.ZodEnum<{
                        wav: "wav";
                        mp3: "mp3";
                    }>;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodEnum<{
                    video_url: "video_url";
                    input_video: "input_video";
                }>;
                video_url: z.ZodObject<{
                    url: z.ZodString;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"file">;
                file: z.ZodObject<{
                    file_data: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    file_id: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    filename: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    file_url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                }, z.core.$strip>;
            }, z.core.$strip>], "type">>]>;
            tool_call_id: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            role: z.ZodLiteral<"assistant">;
            content: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"text">;
                text: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"image_url">;
                image_url: z.ZodObject<{
                    url: z.ZodString;
                    detail: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
                        auto: "auto";
                        low: "low";
                        high: "high";
                    }>>>;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"input_audio">;
                input_audio: z.ZodObject<{
                    data: z.ZodString;
                    format: z.ZodEnum<{
                        wav: "wav";
                        mp3: "mp3";
                    }>;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodEnum<{
                    video_url: "video_url";
                    input_video: "input_video";
                }>;
                video_url: z.ZodObject<{
                    url: z.ZodString;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"file">;
                file: z.ZodObject<{
                    file_data: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    file_id: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    filename: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    file_url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                }, z.core.$strip>;
            }, z.core.$strip>], "type">>]>>>;
            name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            refusal: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            tool_calls: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
                type: z.ZodLiteral<"function">;
                id: z.ZodString;
                function: z.ZodObject<{
                    name: z.ZodString;
                    arguments: z.ZodString;
                }, z.core.$strip>;
            }, z.core.$strip>]>>>>;
            reasoning: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, z.core.$strip>], "role">>;
        tools: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
            type: z.ZodLiteral<"function">;
            function: z.ZodObject<{
                name: z.ZodString;
                description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                parameters: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | {
                    [key: string]: string | number | boolean | /*elided*/ any | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null, unknown, z.core.$ZodTypeInternals<string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | {
                    [key: string]: string | number | boolean | /*elided*/ any | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null, unknown>>>>>;
                strict: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
            }, z.core.$strip>;
        }, z.core.$strip>]>>>;
        responses: z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"text">;
            text: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"image_url">;
            image_url: z.ZodObject<{
                url: z.ZodString;
                detail: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
                    auto: "auto";
                    low: "low";
                    high: "high";
                }>>>;
            }, z.core.$strip>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"input_audio">;
            input_audio: z.ZodObject<{
                data: z.ZodString;
                format: z.ZodEnum<{
                    wav: "wav";
                    mp3: "mp3";
                }>;
            }, z.core.$strip>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodEnum<{
                video_url: "video_url";
                input_video: "input_video";
            }>;
            video_url: z.ZodObject<{
                url: z.ZodString;
            }, z.core.$strip>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"file">;
            file: z.ZodObject<{
                file_data: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                file_id: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                filename: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                file_url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            }, z.core.$strip>;
        }, z.core.$strip>], "type">>]>>;
        output: z.ZodUnion<readonly [z.ZodObject<{
            $jmespath: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            $starlark: z.ZodString;
        }, z.core.$strict>]>;
    }, z.core.$strip>], "type">, z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"scalar.function">;
        owner: z.ZodString;
        repository: z.ZodString;
        commit: z.ZodString;
        input: z.ZodType<string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any;
        } | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[], unknown, z.core.$ZodTypeInternals<string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any;
        } | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[], unknown>>;
        output: z.ZodUnion<readonly [z.ZodObject<{
            $jmespath: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            $starlark: z.ZodString;
        }, z.core.$strict>]>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"vector.function">;
        owner: z.ZodString;
        repository: z.ZodString;
        commit: z.ZodString;
        input: z.ZodType<string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any;
        } | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[], unknown, z.core.$ZodTypeInternals<string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[])[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | (string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any)[];
        } | (string | number | boolean | {
            type: "image_url";
            image_url: {
                url: string;
                detail?: "low" | "high" | "auto" | null | undefined;
            };
        } | {
            type: "input_audio";
            input_audio: {
                data: string;
                format: "wav" | "mp3";
            };
        } | {
            type: "video_url" | "input_video";
            video_url: {
                url: string;
            };
        } | {
            type: "file";
            file: {
                file_data?: string | null | undefined;
                file_id?: string | null | undefined;
                filename?: string | null | undefined;
                file_url?: string | null | undefined;
            };
        } | {
            [key: string]: string | number | boolean | {
                type: "image_url";
                image_url: {
                    url: string;
                    detail?: "low" | "high" | "auto" | null | undefined;
                };
            } | {
                type: "input_audio";
                input_audio: {
                    data: string;
                    format: "wav" | "mp3";
                };
            } | {
                type: "video_url" | "input_video";
                video_url: {
                    url: string;
                };
            } | {
                type: "file";
                file: {
                    file_data?: string | null | undefined;
                    file_id?: string | null | undefined;
                    filename?: string | null | undefined;
                    file_url?: string | null | undefined;
                };
            } | /*elided*/ any | /*elided*/ any;
        } | /*elided*/ any)[])[])[])[])[])[])[])[])[])[])[], unknown>>;
        output: z.ZodUnion<readonly [z.ZodObject<{
            $jmespath: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            $starlark: z.ZodString;
        }, z.core.$strict>]>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"vector.completion">;
        messages: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            role: z.ZodLiteral<"developer">;
            content: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodObject<{
                type: z.ZodLiteral<"text">;
                text: z.ZodString;
            }, z.core.$strip>>]>;
            name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, z.core.$strip>, z.ZodObject<{
            role: z.ZodLiteral<"system">;
            content: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodObject<{
                type: z.ZodLiteral<"text">;
                text: z.ZodString;
            }, z.core.$strip>>]>;
            name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, z.core.$strip>, z.ZodObject<{
            role: z.ZodLiteral<"user">;
            content: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"text">;
                text: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"image_url">;
                image_url: z.ZodObject<{
                    url: z.ZodString;
                    detail: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
                        auto: "auto";
                        low: "low";
                        high: "high";
                    }>>>;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"input_audio">;
                input_audio: z.ZodObject<{
                    data: z.ZodString;
                    format: z.ZodEnum<{
                        wav: "wav";
                        mp3: "mp3";
                    }>;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodEnum<{
                    video_url: "video_url";
                    input_video: "input_video";
                }>;
                video_url: z.ZodObject<{
                    url: z.ZodString;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"file">;
                file: z.ZodObject<{
                    file_data: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    file_id: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    filename: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    file_url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                }, z.core.$strip>;
            }, z.core.$strip>], "type">>]>;
            name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, z.core.$strip>, z.ZodObject<{
            role: z.ZodLiteral<"tool">;
            content: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"text">;
                text: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"image_url">;
                image_url: z.ZodObject<{
                    url: z.ZodString;
                    detail: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
                        auto: "auto";
                        low: "low";
                        high: "high";
                    }>>>;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"input_audio">;
                input_audio: z.ZodObject<{
                    data: z.ZodString;
                    format: z.ZodEnum<{
                        wav: "wav";
                        mp3: "mp3";
                    }>;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodEnum<{
                    video_url: "video_url";
                    input_video: "input_video";
                }>;
                video_url: z.ZodObject<{
                    url: z.ZodString;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"file">;
                file: z.ZodObject<{
                    file_data: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    file_id: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    filename: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    file_url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                }, z.core.$strip>;
            }, z.core.$strip>], "type">>]>;
            tool_call_id: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            role: z.ZodLiteral<"assistant">;
            content: z.ZodNullable<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"text">;
                text: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"image_url">;
                image_url: z.ZodObject<{
                    url: z.ZodString;
                    detail: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
                        auto: "auto";
                        low: "low";
                        high: "high";
                    }>>>;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"input_audio">;
                input_audio: z.ZodObject<{
                    data: z.ZodString;
                    format: z.ZodEnum<{
                        wav: "wav";
                        mp3: "mp3";
                    }>;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodEnum<{
                    video_url: "video_url";
                    input_video: "input_video";
                }>;
                video_url: z.ZodObject<{
                    url: z.ZodString;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"file">;
                file: z.ZodObject<{
                    file_data: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    file_id: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    filename: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                    file_url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                }, z.core.$strip>;
            }, z.core.$strip>], "type">>]>>>;
            name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            refusal: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            tool_calls: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
                type: z.ZodLiteral<"function">;
                id: z.ZodString;
                function: z.ZodObject<{
                    name: z.ZodString;
                    arguments: z.ZodString;
                }, z.core.$strip>;
            }, z.core.$strip>]>>>>;
            reasoning: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, z.core.$strip>], "role">>;
        tools: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
            type: z.ZodLiteral<"function">;
            function: z.ZodObject<{
                name: z.ZodString;
                description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                parameters: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | {
                    [key: string]: string | number | boolean | /*elided*/ any | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null, unknown, z.core.$ZodTypeInternals<string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | {
                    [key: string]: string | number | boolean | /*elided*/ any | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null)[] | /*elided*/ any | null;
                } | null, unknown>>>>>;
                strict: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
            }, z.core.$strip>;
        }, z.core.$strip>]>>>;
        responses: z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"text">;
            text: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"image_url">;
            image_url: z.ZodObject<{
                url: z.ZodString;
                detail: z.ZodNullable<z.ZodOptional<z.ZodEnum<{
                    auto: "auto";
                    low: "low";
                    high: "high";
                }>>>;
            }, z.core.$strip>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"input_audio">;
            input_audio: z.ZodObject<{
                data: z.ZodString;
                format: z.ZodEnum<{
                    wav: "wav";
                    mp3: "mp3";
                }>;
            }, z.core.$strip>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodEnum<{
                video_url: "video_url";
                input_video: "input_video";
            }>;
            video_url: z.ZodObject<{
                url: z.ZodString;
            }, z.core.$strip>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"file">;
            file: z.ZodObject<{
                file_data: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                file_id: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                filename: z.ZodNullable<z.ZodOptional<z.ZodString>>;
                file_url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            }, z.core.$strip>;
        }, z.core.$strip>], "type">>]>>;
        output: z.ZodUnion<readonly [z.ZodObject<{
            $jmespath: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            $starlark: z.ZodString;
        }, z.core.$strict>]>;
    }, z.core.$strip>], "type">>, z.ZodNull]>>;
    outputLength: z.ZodNullable<z.ZodNumber>;
}, z.core.$strip>;
type ExampleInput = z.infer<typeof ExampleInputSchema>;

declare function test(title: string, testFunction: () => void): boolean;
declare function testAsync(title: string, testFunction: () => Promise<void>): Promise<boolean>;
declare function compiledTasksEqual(a: Functions.CompiledTask, b: Functions.CompiledTask): boolean;
interface RunTestsOptions {
    func?: Functions.RemoteFunction;
    profile?: Functions.RemoteProfile;
    inputs?: ExampleInput[];
    objectiveai: ObjectiveAI;
}
declare function runTests(options: RunTestsOptions): Promise<void>;

interface ApiServerOptions {
    port?: number;
    address?: string;
    apiBase?: string;
    manifestPath?: string;
}
declare function spawnApiServer(options?: ApiServerOptions): Promise<ChildProcess | null>;
declare function createLocalObjectiveAI(options?: ApiServerOptions): ObjectiveAI;

/**
 * Creates a log function that writes to both a file and console.
 * Returns the log function and the path to the log file.
 */
declare function createFileLogger(): {
    log: LogFn;
    logPath: string;
};
/**
 * Get the path to the most recent log file.
 */
declare function getLatestLogPath(): string | null;

declare const SpawnFunctionAgentsParamsSchema: z$1.ZodArray<z$1.ZodObject<{
    name: z$1.ZodString;
    spec: z$1.ZodString;
    overwrite: z$1.ZodOptional<z$1.ZodBoolean>;
}, z$1.core.$strip>>;
type SpawnFunctionAgentsParams = z$1.infer<typeof SpawnFunctionAgentsParamsSchema>;

export { type AgentOptions, type ApiServerOptions, index$1 as Claude, type ExampleInput, ExampleInputSchema, type FunctionFields, index as GitHub, type LogFn, type Parameters, type ProfileOptions, type RunTestsOptions, type SpawnFunctionAgentsParams, SpawnFunctionAgentsParamsSchema, assets, buildFunction, buildProfile, compiledTasksEqual, createFileLogger, createLocalObjectiveAI, defaultVectorCompletionTaskProfile, getLatestLogPath, init, runTests, spawnApiServer, test, testAsync, writeFunctionJson, writeProfileJson };
