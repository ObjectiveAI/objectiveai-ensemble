/**
 * Frontend-only types for execution tree visualization
 * These are visualization types, NOT SDK types
 */

export interface TreeNode {
  id: string;
  type: 'function' | 'task' | 'llm' | 'vote' | 'score' | 'output';
  label: string;
  level: number;
  children?: TreeNode[];
  metadata?: {
    color?: string;
    value?: number | string;
    icon?: string;
  };
}

export interface LayoutPosition {
  nodeId: string;
  x: number; // Pixel x position
  y: number; // Pixel y position
  level: number; // Depth in tree
  positionInLevel: number; // Index within level
}

export interface LayoutResult {
  positions: Map<string, LayoutPosition>;
  requiredWidth: number;
  requiredHeight: number;
  columnsPerLevel: Map<number, number>;
  totalNodes: number;
  maxDepth: number;
}

export interface ExecutionTreeVisualizationProps {
  execution?: {
    id: string;
    tasks?: Array<{
      index: string;
      votes?: Array<{ model: string; weight: number }>;
      scores?: number[];
    }>;
    output?: any;
  };
  isStreaming?: boolean;
  functionName?: string;
  onNodeClick?: (nodeId: string) => void;
}
