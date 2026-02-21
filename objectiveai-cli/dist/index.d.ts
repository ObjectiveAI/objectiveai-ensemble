import z from 'zod';
import * as objectiveai from 'objectiveai';
import { Functions } from 'objectiveai';

type Result<T = string> = {
    ok: true;
    value: T;
    error: undefined;
} | {
    ok: false;
    value: undefined;
    error: string;
};

interface Tool<TSchema extends z.ZodRawShape = z.ZodRawShape> {
    name: string;
    description: string;
    inputSchema: TSchema;
    fn: (args: z.infer<z.ZodObject<TSchema>>) => Promise<Result<string>>;
}

interface Notification {
    path: number[];
    name?: string;
    message: NotificationMessage;
}
type NotificationMessage = {
    role: "assistant";
    content: string;
} | {
    role: "tool";
    name: string;
    error?: string;
} | {
    role: "done";
    error?: string;
    functionTasks?: number;
    placeholderTasks?: number;
} | {
    role: "waiting";
};

declare const ParametersSchema: z.ZodObject<{
    branchMinWidth: z.ZodInt;
    branchMaxWidth: z.ZodInt;
    leafMinWidth: z.ZodInt;
    leafMaxWidth: z.ZodInt;
    depth: z.ZodInt;
}, z.core.$strip>;
type Parameters = z.infer<typeof ParametersSchema>;
declare const ParametersBuilderSchema: z.ZodObject<{
    depth: z.ZodOptional<z.ZodInt>;
    branchMinWidth: z.ZodOptional<z.ZodInt>;
    branchMaxWidth: z.ZodOptional<z.ZodInt>;
    branchWidth: z.ZodOptional<z.ZodInt>;
    leafMinWidth: z.ZodOptional<z.ZodInt>;
    leafMaxWidth: z.ZodOptional<z.ZodInt>;
    leafWidth: z.ZodOptional<z.ZodInt>;
    minWidth: z.ZodOptional<z.ZodInt>;
    maxWidth: z.ZodOptional<z.ZodInt>;
    width: z.ZodOptional<z.ZodInt>;
}, z.core.$strip>;
type ParametersBuilder = z.infer<typeof ParametersBuilderSchema>;
declare function buildParameters(builder?: ParametersBuilder): Parameters;

interface GitHubBackend {
    pushInitial(options: PushInitialOptions): Promise<void>;
    pushFinal(options: PushFinalOptions): Promise<void>;
    getOwnerRepositoryCommit(dir: string, gitHubToken: string): Promise<OwnerRepositoryCommit | null>;
    fetchRemoteFunctions(refs: Iterable<OwnerRepositoryCommit>): Promise<Record<string, Functions.RemoteFunction> | null>;
    repoExists(name: string, gitHubToken: string): Promise<boolean>;
    getAuthenticatedUser(gitHubToken: string): Promise<string>;
}
interface OwnerRepositoryCommit {
    owner: string;
    repository: string;
    commit: string;
}
interface PushInitialOptions {
    dir: string;
    name: string;
    gitHubToken: string;
    gitAuthorName: string;
    gitAuthorEmail: string;
    message: string;
}
interface PushFinalOptions {
    dir: string;
    gitHubToken: string;
    gitAuthorName: string;
    gitAuthorEmail: string;
    message: string;
    description: string;
}

declare const StepNameSchema: z.ZodUnion<readonly [z.ZodLiteral<"type">, z.ZodLiteral<"name">, z.ZodLiteral<"essay">, z.ZodLiteral<"fields">, z.ZodLiteral<"essay_tasks">, z.ZodLiteral<"body">, z.ZodLiteral<"description">]>;
type StepName = z.infer<typeof StepNameSchema>;
interface AgentStep {
    stepName: StepName;
    prompt: string;
    tools: Tool[];
}
type AgentStepFn<TState = unknown> = (step: AgentStep, state: TState | undefined, parameters: Parameters) => AsyncGenerator<NotificationMessage, TState>;

type InventOptionsBase = {
    inventSpec: string;
    parameters: ParametersBuilder;
} | {
    name: string;
};
type InventOptions = InventOptionsBase | (InventOptionsBase & {
    type: "scalar.function";
    input_schema?: Functions.RemoteScalarFunction["input_schema"];
}) | (InventOptionsBase & {
    type: "vector.function";
    input_schema?: Functions.RemoteVectorFunction["input_schema"];
    output_length?: Functions.RemoteVectorFunction["output_length"];
    input_split?: Functions.RemoteVectorFunction["input_split"];
    input_merge?: Functions.RemoteVectorFunction["input_merge"];
});
declare function invent(onNotification: (notification: Notification) => void, options: InventOptions, continuation?: {
    parentToken?: string;
    path: number[];
    agent: AgentStepFn;
    gitHubBackend: GitHubBackend;
    gitHubToken: string;
    gitAuthorName: string;
    gitAuthorEmail: string;
}): Promise<void>;

declare const PlaceholderTaskSpecsSchema: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
    spec: z.ZodString;
    token: z.ZodString;
}, z.core.$strip>, z.ZodNull]>>;
type PlaceholderTaskSpecs = z.infer<typeof PlaceholderTaskSpecsSchema>;

declare class BranchScalarState {
    readonly parameters: Parameters;
    readonly function: Partial<Functions.QualityBranchRemoteScalarFunction>;
    private placeholderTaskSpecs?;
    private editInputSchemaModalityRemovalRejected;
    constructor(parameters: Parameters, inputSchema?: Functions.RemoteScalarFunction["input_schema"]);
    getInputSchema(): Result<string>;
    getInputSchemaTool(): Tool<{}>;
    setInputSchema(value: unknown, dangerouslyRemoveModalities?: boolean): Result<string>;
    setInputSchemaTool(): Tool<{
        input_schema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        dangerouslyRemoveModalities: z.ZodOptional<z.ZodBoolean>;
    }>;
    checkFields(): Result<string>;
    checkFieldsTool(): Tool<{}>;
    getTasksLength(): Result<string>;
    getTasksLengthTool(): Tool<{}>;
    getTask(index: number): Result<string>;
    getTaskTool(): Tool<{
        index: z.ZodNumber;
    }>;
    getTaskSpec(index: number): Result<string>;
    getTaskSpecTool(): Tool<{
        index: z.ZodNumber;
    }>;
    appendTask(value: unknown, spec: string): Result<string>;
    appendTaskTool(): Tool<{
        spec: z.ZodString;
        task: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }>;
    deleteTask(index: number): Result<string>;
    deleteTaskTool(): Tool<{
        index: z.ZodNumber;
    }>;
    editTask(index: number, value: unknown): Result<string>;
    editTaskTool(): Tool<{
        index: z.ZodNumber;
        task: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }>;
    editTaskSpec(index: number, spec: string): Result<string>;
    editTaskSpecTool(): Tool<{
        index: z.ZodNumber;
        spec: z.ZodString;
    }>;
    checkFunction(): Result<string>;
    checkFunctionTool(): Tool<{}>;
    getSchemaTools(): Tool<{}>[];
    getPlaceholderTaskSpecs(): PlaceholderTaskSpecs | undefined;
}

declare class BranchVectorState {
    readonly parameters: Parameters;
    readonly function: Partial<Functions.QualityBranchRemoteVectorFunction>;
    private placeholderTaskSpecs?;
    private editInputSchemaModalityRemovalRejected;
    constructor(parameters: Parameters, inputSchema?: Functions.QualityBranchRemoteVectorFunction["input_schema"], outputLength?: Functions.RemoteVectorFunction["output_length"], inputSplit?: Functions.RemoteVectorFunction["input_split"], inputMerge?: Functions.RemoteVectorFunction["input_merge"]);
    getInputSchema(): Result<string>;
    getInputSchemaTool(): Tool<{}>;
    setInputSchema(value: unknown, dangerouslyRemoveModalities?: boolean): Result<string>;
    setInputSchemaTool(): Tool<{
        input_schema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        dangerouslyRemoveModalities: z.ZodOptional<z.ZodBoolean>;
    }>;
    getOutputLength(): Result<string>;
    getOutputLengthTool(): Tool<{}>;
    setOutputLength(value: unknown): Result<string>;
    setOutputLengthTool(): Tool<{
        output_length: z.ZodUnknown;
    }>;
    getInputSplit(): Result<string>;
    getInputSplitTool(): Tool<{}>;
    setInputSplit(value: unknown): Result<string>;
    setInputSplitTool(): Tool<{
        input_split: z.ZodUnknown;
    }>;
    getInputMerge(): Result<string>;
    getInputMergeTool(): Tool<{}>;
    setInputMerge(value: unknown): Result<string>;
    setInputMergeTool(): Tool<{
        input_merge: z.ZodUnknown;
    }>;
    checkFields(): Result<string>;
    checkFieldsTool(): Tool<{}>;
    getTasksLength(): Result<string>;
    getTasksLengthTool(): Tool<{}>;
    getTask(index: number): Result<string>;
    getTaskTool(): Tool<{
        index: z.ZodNumber;
    }>;
    getTaskSpec(index: number): Result<string>;
    getTaskSpecTool(): Tool<{
        index: z.ZodNumber;
    }>;
    appendVectorTask(value: unknown, spec: string): Result<string>;
    appendVectorTaskTool(): Tool<{
        task: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        spec: z.ZodString;
    }>;
    appendScalarTask(value: unknown, inputMap: unknown, spec: string): Result<string>;
    appendScalarTaskTool(): Tool<{
        task: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        input_map: z.ZodUnknown;
        spec: z.ZodString;
    }>;
    deleteTask(index: number): Result<string>;
    deleteTaskTool(): Tool<{
        index: z.ZodNumber;
    }>;
    editVectorTask(index: number, value: unknown): Result<string>;
    editVectorTaskTool(): Tool<{
        index: z.ZodNumber;
        task: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }>;
    editScalarTask(index: number, value: unknown, inputMap: unknown): Result<string>;
    editScalarTaskTool(): Tool<{
        index: z.ZodNumber;
        task: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        input_map: z.ZodUnknown;
    }>;
    editTaskSpec(index: number, spec: string): Result<string>;
    editTaskSpecTool(): Tool<{
        index: z.ZodNumber;
        spec: z.ZodString;
    }>;
    checkFunction(): Result<string>;
    checkFunctionTool(): Tool<{}>;
    getSchemaTools(): Tool<{}>[];
    getPlaceholderTaskSpecs(): PlaceholderTaskSpecs | undefined;
}

declare class LeafScalarState {
    readonly parameters: Parameters;
    readonly function: Partial<Functions.QualityLeafRemoteScalarFunction>;
    private editInputSchemaModalityRemovalRejected;
    constructor(parameters: Parameters, inputSchema?: Functions.RemoteScalarFunction["input_schema"]);
    getInputSchema(): Result<string>;
    getInputSchemaTool(): Tool<{}>;
    setInputSchema(value: unknown, dangerouslyRemoveModalities?: boolean): Result<string>;
    setInputSchemaTool(): Tool<{
        input_schema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        dangerouslyRemoveModalities: z.ZodOptional<z.ZodBoolean>;
    }>;
    checkFields(): Result<string>;
    checkFieldsTool(): Tool<{}>;
    getTasksLength(): Result<string>;
    getTasksLengthTool(): Tool<{}>;
    getTask(index: number): Result<string>;
    getTaskTool(): Tool<{
        index: z.ZodNumber;
    }>;
    appendTask(value: unknown): Result<string>;
    appendTaskTool(): Tool<{
        task: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }>;
    deleteTask(index: number): Result<string>;
    deleteTaskTool(): Tool<{
        index: z.ZodNumber;
    }>;
    editTask(index: number, value: unknown): Result<string>;
    editTaskTool(): Tool<{
        index: z.ZodNumber;
        task: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }>;
    checkFunction(): Result<string>;
    checkFunctionTool(): Tool<{}>;
    getSchemaTools(): Tool<{}>[];
}

declare class LeafVectorState {
    readonly parameters: Parameters;
    readonly function: Partial<Functions.QualityLeafRemoteVectorFunction>;
    private editInputSchemaModalityRemovalRejected;
    constructor(parameters: Parameters, inputSchema?: Functions.QualityLeafRemoteVectorFunction["input_schema"], outputLength?: Functions.RemoteVectorFunction["output_length"], inputSplit?: Functions.RemoteVectorFunction["input_split"], inputMerge?: Functions.RemoteVectorFunction["input_merge"]);
    getInputSchema(): Result<string>;
    getInputSchemaTool(): Tool<{}>;
    setInputSchema(value: unknown, dangerouslyRemoveModalities?: boolean): Result<string>;
    setInputSchemaTool(): Tool<{
        input_schema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        dangerouslyRemoveModalities: z.ZodOptional<z.ZodBoolean>;
    }>;
    getOutputLength(): Result<string>;
    getOutputLengthTool(): Tool<{}>;
    setOutputLength(value: unknown): Result<string>;
    setOutputLengthTool(): Tool<{
        output_length: z.ZodUnknown;
    }>;
    getInputSplit(): Result<string>;
    getInputSplitTool(): Tool<{}>;
    setInputSplit(value: unknown): Result<string>;
    setInputSplitTool(): Tool<{
        input_split: z.ZodUnknown;
    }>;
    getInputMerge(): Result<string>;
    getInputMergeTool(): Tool<{}>;
    setInputMerge(value: unknown): Result<string>;
    setInputMergeTool(): Tool<{
        input_merge: z.ZodUnknown;
    }>;
    checkFields(): Result<string>;
    checkFieldsTool(): Tool<{}>;
    getTasksLength(): Result<string>;
    getTasksLengthTool(): Tool<{}>;
    getTask(index: number): Result<string>;
    getTaskTool(): Tool<{
        index: z.ZodNumber;
    }>;
    appendTask(value: unknown): Result<string>;
    appendTaskTool(): Tool<{
        task: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }>;
    deleteTask(index: number): Result<string>;
    deleteTaskTool(): Tool<{
        index: z.ZodNumber;
    }>;
    editTask(index: number, value: unknown): Result<string>;
    editTaskTool(): Tool<{
        index: z.ZodNumber;
        task: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }>;
    checkFunction(): Result<string>;
    checkFunctionTool(): Tool<{}>;
    getSchemaTools(): Tool<{}>[];
}

declare const StateOptionsSchema: z.ZodUnion<readonly [z.ZodObject<{
    parameters: z.ZodObject<{
        branchMinWidth: z.ZodInt;
        branchMaxWidth: z.ZodInt;
        leafMinWidth: z.ZodInt;
        leafMaxWidth: z.ZodInt;
        depth: z.ZodInt;
    }, z.core.$strip>;
    inventSpec: z.ZodString;
    gitHubToken: z.ZodString;
    owner: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    parameters: z.ZodObject<{
        branchMinWidth: z.ZodInt;
        branchMaxWidth: z.ZodInt;
        leafMinWidth: z.ZodInt;
        leafMaxWidth: z.ZodInt;
        depth: z.ZodInt;
    }, z.core.$strip>;
    inventSpec: z.ZodString;
    gitHubToken: z.ZodString;
    owner: z.ZodString;
    type: z.ZodLiteral<"scalar.function">;
    input_schema: z.ZodUnion<readonly [z.ZodType<objectiveai.ObjectInputSchema, unknown, z.core.$ZodTypeInternals<objectiveai.ObjectInputSchema, unknown>>, z.ZodType<objectiveai.ArrayInputSchema, unknown, z.core.$ZodTypeInternals<objectiveai.ArrayInputSchema, unknown>>, z.ZodObject<{
        type: z.ZodLiteral<"string">;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        enum: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"number">;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        minimum: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        maximum: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"integer">;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        minimum: z.ZodNullable<z.ZodOptional<z.ZodUInt32>>;
        maximum: z.ZodNullable<z.ZodOptional<z.ZodUInt32>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"boolean">;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"image">;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"audio">;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"video">;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"file">;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>, z.ZodType<objectiveai.AnyOfInputSchema, unknown, z.core.$ZodTypeInternals<objectiveai.AnyOfInputSchema, unknown>>]>;
}, z.core.$strip>, z.ZodObject<{
    parameters: z.ZodObject<{
        branchMinWidth: z.ZodInt;
        branchMaxWidth: z.ZodInt;
        leafMinWidth: z.ZodInt;
        leafMaxWidth: z.ZodInt;
        depth: z.ZodInt;
    }, z.core.$strip>;
    inventSpec: z.ZodString;
    gitHubToken: z.ZodString;
    owner: z.ZodString;
    type: z.ZodLiteral<"vector.function">;
    input_schema: z.ZodUnion<readonly [z.ZodType<objectiveai.ArrayInputSchema, unknown, z.core.$ZodTypeInternals<objectiveai.ArrayInputSchema, unknown>>, z.ZodType<objectiveai.ObjectInputSchema, unknown, z.core.$ZodTypeInternals<objectiveai.ObjectInputSchema, unknown>>]>;
    output_length: z.ZodUnion<readonly [z.ZodUInt32, z.ZodUnion<readonly [z.ZodObject<{
        $jmespath: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        $starlark: z.ZodString;
    }, z.core.$strict>]>]>;
    input_split: z.ZodUnion<readonly [z.ZodObject<{
        $jmespath: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        $starlark: z.ZodString;
    }, z.core.$strict>]>;
    input_merge: z.ZodUnion<readonly [z.ZodObject<{
        $jmespath: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        $starlark: z.ZodString;
    }, z.core.$strict>]>;
}, z.core.$strip>]>;
type StateOptions = z.infer<typeof StateOptionsSchema>;
declare class State {
    readonly parameters: Parameters;
    readonly inventSpec: string;
    readonly gitHubToken: string;
    readonly owner: string;
    private name;
    private inventEssay;
    private inventEssayTasks;
    private _inner;
    private readme;
    private placeholderTaskIndices;
    private gitHubBackend;
    constructor(options: StateOptions, gitHubBackend: GitHubBackend);
    getInventSpec(): Result<string>;
    getInventSpecTool(): Tool<{}>;
    getName(): Result<string>;
    getNameTool(): Tool<{}>;
    setName(value: string): Promise<Result<string>>;
    setNameTool(): Tool<{
        name: z.ZodString;
    }>;
    getInventEssay(): Result<string>;
    getInventEssayTool(): Tool<{}>;
    setInventEssay(value: string): Result<string>;
    setInventEssayTool(): Tool<{
        essay: z.ZodString;
    }>;
    getInventEssayTasks(): Result<string>;
    getInventEssayTasksTool(): Tool<{}>;
    setInventEssayTasks(value: string): Result<string>;
    setInventEssayTasksTool(): Tool<{
        essay_tasks: z.ZodString;
    }>;
    getReadme(): Result<string>;
    getReadmeTool(): Tool<{}>;
    setPlaceholderTaskIndices(indices: number[]): void;
    setReadme(value: string): Result<string>;
    setReadmeTool(): Tool<{
        readme: z.ZodString;
    }>;
    getFunctionType(): Result<"scalar.function" | "vector.function">;
    getFunctionTypeTool(): Tool<{}>;
    setFunctionType(value: string): Result<string>;
    setFunctionTypeTool(): Tool<{
        type: z.ZodString;
    }>;
    getDescription(): Result<string>;
    getDescriptionTool(): Tool<{}>;
    setDescription(value: string): Result<string>;
    setDescriptionTool(): Tool<{
        description: z.ZodString;
    }>;
    forceSetName(value: string): void;
    get inner(): BranchScalarState | BranchVectorState | LeafScalarState | LeafVectorState | undefined;
}

export { type AgentStep, type AgentStepFn, type InventOptions, type Parameters, type ParametersBuilder, type Result, State, type StateOptions, type Tool, buildParameters, invent };
