import React from 'react';

type TreeNodeKind = "function" | "vector-completion" | "llm";
type TreeNodeState = "pending" | "streaming" | "complete" | "error";
/** Data payload for a function node (root or nested FunctionExecutionTask). */
interface FunctionNodeData {
    kind: "function";
    functionId: string | null;
    profileId: string | null;
    output: number | number[] | null;
    taskCount: number;
    error: string | null;
}
/** Data payload for a vector completion task node. */
interface VectorCompletionNodeData {
    kind: "vector-completion";
    taskIndex: number;
    taskPath: number[];
    scores: number[] | null;
    responses: string[] | null;
    voteCount: number;
    /** Raw vote data for DetailPanel display (LLM nodes no longer rendered in tree). */
    votes: InputVote[] | null;
    /** Raw completion data for DetailPanel display. */
    completions: InputCompletion[] | null;
    error: string | null;
}
/** Data payload for an LLM leaf node (one Vote). */
interface LlmNodeData {
    kind: "llm";
    /** 22-char content-addressed Ensemble LLM ID. */
    modelId: string;
    /** Resolved readable name (e.g., "openai/gpt-4o"). Null until resolved. */
    modelName: string | null;
    /** Vote distribution over responses. Null while pending. */
    vote: number[] | null;
    /** Weight assigned to this vote. */
    weight: number;
    /** Accumulated streaming completion text. */
    streamingText: string;
    /** Whether this vote came from the global cache. */
    fromCache: boolean;
    /** Whether this vote was generated via RNG. */
    fromRng: boolean;
    /** Index into the ensemble. */
    flatEnsembleIndex: number;
}
type TreeNodeData = FunctionNodeData | VectorCompletionNodeData | LlmNodeData;
/** A single node in the function execution tree. */
interface TreeNode {
    id: string;
    kind: TreeNodeKind;
    label: string;
    parentId: string | null;
    children: string[];
    x: number;
    y: number;
    width: number;
    height: number;
    state: TreeNodeState;
    data: TreeNodeData;
}
/** Result of building a tree from execution data. */
interface TreeData {
    nodes: Map<string, TreeNode>;
    rootId: string;
}
/** Structurally compatible with SDK's Vote. */
interface InputVote {
    model: string;
    ensemble_index?: number;
    flat_ensemble_index?: number;
    vote: number[];
    weight: number;
    retry?: boolean;
    from_cache?: boolean;
    from_rng?: boolean;
}
/** Structurally compatible with SDK's ChatCompletion choice. */
interface InputCompletionChoice {
    delta?: {
        content?: string;
    };
    message?: {
        content?: string;
    };
}
/** Structurally compatible with SDK's ChatCompletion. */
interface InputCompletion {
    model: string;
    choices?: InputCompletionChoice[];
}
/** Structurally compatible with a VectorCompletionTask. */
interface InputVectorCompletionTask {
    index?: number;
    task_index?: number;
    task_path?: number[];
    votes?: InputVote[];
    completions?: InputCompletion[];
    scores?: number[];
    error?: {
        message?: string;
    } | null;
}
/** Structurally compatible with a FunctionExecutionTask. */
interface InputFunctionExecutionTask {
    index?: number;
    task_index?: number;
    task_path?: number[];
    tasks: InputTask[];
    output?: number | number[];
    error?: {
        message?: string;
    } | null;
    function?: string | null;
    profile?: string | null;
}
type InputTask = InputVectorCompletionTask | InputFunctionExecutionTask;
/** Structurally compatible with SDK's FunctionExecution. */
interface InputFunctionExecution {
    id?: string;
    tasks?: InputTask[];
    output?: number | number[];
    error?: {
        message?: string;
    } | null;
    function?: string | null;
    profile?: string | null;
    reasoning?: {
        choices?: Array<{
            message?: {
                content?: string;
            };
        }>;
    } | null;
}
interface FunctionTreeConfig {
    /** Tree orientation. Default: "vertical" (root at top). */
    orientation: "vertical" | "horizontal";
    /** Horizontal spacing between sibling nodes in pixels. */
    nodeGapX: number;
    /** Vertical spacing between tree levels in pixels. */
    nodeGapY: number;
    /** Whether to animate transitions when data changes. */
    animate: boolean;
    /** Animation duration in ms. */
    animationDuration: number;
    /** Minimum zoom level. */
    minZoom: number;
    /** Maximum zoom level. */
    maxZoom: number;
    /** Color theme. "auto" reads from CSS/prefers-color-scheme. */
    theme: "light" | "dark" | "auto";
    /** Max children before switching to grid layout. Default: 20. */
    gridThreshold: number;
}
declare const DEFAULT_CONFIG: FunctionTreeConfig;
declare const NODE_SIZES: Record<TreeNodeKind, {
    width: number;
    height: number;
}>;
interface FunctionTreeProps {
    /** The function execution data (streaming or complete). Null before execution. */
    data: InputFunctionExecution | null;
    /** Resolved model names: { [22-char-id]: "openai/gpt-4o" }. */
    modelNames?: Record<string, string>;
    /** Configuration overrides. */
    config?: Partial<FunctionTreeConfig>;
    /** Called when a node is clicked. */
    onNodeClick?: (node: TreeNode) => void;
    /** Called when a node is hovered. */
    onNodeHover?: (node: TreeNode | null) => void;
    /** Width (CSS value). Default: "100%". */
    width?: number | string;
    /** Height (CSS value). Default: 400. */
    height?: number | string;
    /** CSS class name for the container. */
    className?: string;
}
declare const SCORE_COLORS: {
    readonly green: "rgb(34, 197, 94)";
    readonly yellow: "rgb(234, 179, 8)";
    readonly orange: "rgb(249, 115, 22)";
    readonly red: "rgb(239, 68, 68)";
};
declare function scoreColor(score: number): string;

/**
 * FunctionTree — 2D canvas visualization of ObjectiveAI function execution trees.
 *
 * Each LLM is a leaf node. Supports streaming data, pan/zoom, and node selection.
 */
declare function FunctionTree({ data, modelNames, config, onNodeClick, onNodeHover, width, height, className, }: FunctionTreeProps): React.ReactElement;

declare class FunctionTreeEngine {
    private canvas;
    private ctx;
    private viewport;
    private renderer;
    private animation;
    private interaction;
    private config;
    private theme;
    private treeData;
    private prevNodes;
    private selectedId;
    private hoveredId;
    private rafId;
    private needsRender;
    private destroyed;
    private hasInitialFit;
    private layoutTimer;
    private layoutPending;
    onNodeClick: ((node: TreeNode) => void) | null;
    onNodeHover: ((node: TreeNode | null) => void) | null;
    onSelectedNodeChange: ((node: TreeNode | null) => void) | null;
    constructor(canvas: HTMLCanvasElement, config?: Partial<FunctionTreeConfig>);
    /** Update the tree data. Call on each streaming chunk or complete result. */
    setData(data: InputFunctionExecution | null, modelNames?: Record<string, string>): void;
    /** Update config (e.g., theme change). */
    setConfig(config: Partial<FunctionTreeConfig>): void;
    /** Resize the canvas (call from ResizeObserver). */
    resize(width: number, height: number): void;
    /** Zoom in by a fixed step. */
    zoomIn(): void;
    /** Zoom out by a fixed step. */
    zoomOut(): void;
    /** Fit the entire tree in view. */
    fitToContent(): void;
    /** Zoom to focus on a specific node. */
    zoomToNode(nodeId: string): void;
    /** Get the currently selected node. */
    getSelectedNode(): TreeNode | null;
    /** Deselect the current node. */
    deselect(): void;
    /** Clean up all resources. */
    destroy(): void;
    private scheduleLayout;
    private executeLayout;
    private requestRender;
    private startRenderLoop;
    private renderFrame;
}

/**
 * Transform a FunctionExecution (or streaming accumulation) into a flat
 * Map<string, TreeNode> with a root ID. This is the core data transform
 * that the layout algorithm and renderer consume.
 */
declare function buildTree(execution: InputFunctionExecution | null, modelNames?: Record<string, string>): TreeData | null;

/**
 * Lay out the tree using a modified Reingold-Tilford algorithm.
 * - Root is placed at top center.
 * - Children are distributed horizontally, centered under their parent.
 * - Large fan-outs (> gridThreshold) use a grid layout instead of a row.
 *
 * Mutates node x/y positions in place.
 */
declare function layoutTree(treeData: TreeData, config: FunctionTreeConfig): void;
/**
 * Compute the bounding box of all nodes in the tree.
 * Returns { minX, minY, maxX, maxY } or null if empty.
 */
declare function treeBounds(nodes: Map<string, TreeNode>): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
} | null;

interface ViewportState {
    panX: number;
    panY: number;
    zoom: number;
}
declare class Viewport {
    private minZoom;
    private maxZoom;
    panX: number;
    panY: number;
    zoom: number;
    private _animating;
    private _animStart;
    private _animDuration;
    private _animFrom;
    private _animTo;
    constructor(minZoom?: number, maxZoom?: number);
    /** Convert screen (canvas pixel) coordinates to world coordinates. */
    screenToWorld(sx: number, sy: number): {
        x: number;
        y: number;
    };
    /** Convert world coordinates to screen (canvas pixel) coordinates. */
    worldToScreen(wx: number, wy: number): {
        x: number;
        y: number;
    };
    /** Check if a world-space rectangle is visible in the viewport. */
    isVisible(x: number, y: number, w: number, h: number, canvasWidth: number, canvasHeight: number): boolean;
    /** Apply the viewport transform to a canvas context. */
    applyTransform(ctx: CanvasRenderingContext2D): void;
    /** Zoom by a delta, centering on a screen point. */
    zoomAt(delta: number, screenX: number, screenY: number): void;
    /** Pan by screen-space delta. */
    pan(dx: number, dy: number): void;
    /** Zoom to fit all nodes in the viewport with padding. */
    fitToContent(nodes: Map<string, TreeNode>, canvasWidth: number, canvasHeight: number, padding?: number, minInitialZoom?: number): void;
    /** Animate to a target viewport state. */
    animateTo(target: Partial<ViewportState>, duration?: number): void;
    /** Tick the animation. Returns true if still animating. */
    tick(now: number): boolean;
    get isAnimating(): boolean;
    /** Save current state for later comparison. */
    snapshot(): ViewportState;
}

export { DEFAULT_CONFIG, type FunctionNodeData, FunctionTree, type FunctionTreeConfig, FunctionTreeEngine, type FunctionTreeProps, type InputCompletion, type InputFunctionExecution, type InputFunctionExecutionTask, type InputTask, type InputVectorCompletionTask, type InputVote, type LlmNodeData, NODE_SIZES, SCORE_COLORS, type TreeData, type TreeNode, type TreeNodeData, type TreeNodeKind, type TreeNodeState, type VectorCompletionNodeData, Viewport, buildTree, layoutTree, scoreColor, treeBounds };
