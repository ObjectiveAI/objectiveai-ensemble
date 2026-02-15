/**
 * lib/tree-layout.ts
 *
 * Responsive tree layout algorithm.
 * Automatically positions nodes to fit available width.
 * No horizontal scrolling needed.
 *
 * Algorithm: Breadth-first grouping by level, with automatic row wrapping
 */

import React from 'react';
import { ResponsiveScale } from '../responsive-scale';

/**
 * Base tree node interface
 * Components should implement this for layout
 */
export interface TreeLayoutNode {
  id: string;
  type: string;
  children?: TreeLayoutNode[];
  metadata?: Record<string, any>;
}

/**
 * Computed position for a node
 * Used by rendering system to place nodes in canvas/SVG
 */
export interface LayoutPosition {
  nodeId: string;
  x: number;              // Pixel x position
  y: number;              // Pixel y position
  level: number;          // Depth in tree (0 = root)
  positionInLevel: number; // Index within this level
}

/**
 * Complete layout result
 * Contains all computed positions and metrics
 */
export interface LayoutResult {
  positions: Map<string, LayoutPosition>;
  requiredWidth: number;
  requiredHeight: number;
  columnsPerLevel: Map<number, number>;
  totalNodes: number;
  maxDepth: number;
}

export class TreeLayout {
  /**
   * Calculate responsive layout that fits in available width
   * Nodes are positioned left-to-right, top-to-bottom
   * Wraps to new row if node doesn't fit in current row
   *
   * @param nodes Root nodes of tree
   * @param containerWidth Available width for layout
   * @param containerHeight Available height for layout
   * @returns Complete layout with positions for all nodes
   */
  static calculateResponsiveLayout(
    nodes: TreeLayoutNode[],
    containerWidth: number,
    containerHeight: number
  ): LayoutResult {
    // Get current CSS variable values (these scale with viewport)
    const nodeWidth = ResponsiveScale.getCSSVariable('--node-width');
    const nodeHeight = ResponsiveScale.getCSSVariable('--node-height');
    const gapHorizontal = ResponsiveScale.getCSSVariable('--gap-horizontal');
    const gapVertical = ResponsiveScale.getCSSVariable('--gap-vertical');

    // Validate inputs
    if (containerWidth <= 0 || nodeWidth <= 0) {
      return {
        positions: new Map(),
        requiredWidth: containerWidth,
        requiredHeight: containerHeight,
        columnsPerLevel: new Map(),
        totalNodes: 0,
        maxDepth: 0,
      };
    }

    // Group nodes by tree level (distance from root)
    const levelMap = this.groupNodesByLevel(nodes);
    const positions = new Map<string, LayoutPosition>();
    const columnsPerLevel = new Map<number, number>();

    let currentY = gapVertical;
    const rowHeight = nodeHeight + gapVertical;
    let maxDepth = 0;
    let totalPositioned = 0;

    // Layout each level of the tree
    levelMap.forEach((nodesInLevel, level) => {
      maxDepth = Math.max(maxDepth, level);

      // Calculate how many columns fit in this container
      const availableWidth = containerWidth - gapHorizontal;
      const fittingColumns = Math.max(
        1,
        Math.floor(availableWidth / (nodeWidth + gapHorizontal))
      );
      columnsPerLevel.set(level, fittingColumns);

      // Position nodes in this level, wrapping to new rows as needed
      let currentX = gapHorizontal;
      let row = 0;

      nodesInLevel.forEach((node, nodeIndexInLevel) => {
        // Check if node fits in current row
        const wouldExceedWidth = currentX + nodeWidth + gapHorizontal > containerWidth;
        const isNotFirstInRow = nodeIndexInLevel % fittingColumns !== 0;

        // Start new row if needed
        if (wouldExceedWidth && isNotFirstInRow) {
          currentX = gapHorizontal;
          currentY += rowHeight;
          row++;
        }

        // Record position
        positions.set(node.id, {
          nodeId: node.id,
          x: currentX,
          y: currentY,
          level,
          positionInLevel: nodeIndexInLevel,
        });

        totalPositioned++;

        // Move to next column
        currentX += nodeWidth + gapHorizontal;
      });

      // Move to next level (add extra space for clarity)
      currentY += rowHeight;
    });

    // Calculate total required space
    const requiredHeight = currentY;

    return {
      positions,
      requiredWidth: containerWidth,
      requiredHeight,
      columnsPerLevel,
      totalNodes: totalPositioned,
      maxDepth,
    };
  }

  /**
   * Group nodes by tree level using breadth-first search
   * Returns map of level → [nodes at that level]
   */
  private static groupNodesByLevel(nodes: TreeLayoutNode[]): Map<number, TreeLayoutNode[]> {
    const levelMap = new Map<number, TreeLayoutNode[]>();

    // BFS queue: [node, level]
    const queue: [TreeLayoutNode, number][] = nodes.map((n) => [n, 0]);

    while (queue.length > 0) {
      const [node, level] = queue.shift()!;

      // Add node to its level group
      if (!levelMap.has(level)) {
        levelMap.set(level, []);
      }
      levelMap.get(level)!.push(node);

      // Add children to queue for next level
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => {
          queue.push([child, level + 1]);
        });
      }
    }

    return levelMap;
  }

  /**
   * Calculate optimal canvas height based on content
   * Reserve percentage of viewport for tree, with min/max bounds
   *
   * @param layoutResult Layout calculation result
   * @param viewportHeight Height of viewport
   * @returns Recommended canvas height in pixels
   */
  static calculateCanvasHeight(
    layoutResult: LayoutResult,
    viewportHeight: number
  ): number {
    // Reserve 40-50% of viewport height for tree
    const preferredRatio = 0.45; // 45% of viewport
    const preferredHeight = viewportHeight * preferredRatio;

    // But cap between reasonable bounds
    const minHeight = 250; // Don't go too small
    const maxHeight = 600; // Don't go too large

    return Math.max(minHeight, Math.min(maxHeight, preferredHeight));
  }

  /**
   * Determine if subtasks should be collapsed
   * Collapse if tree would need to wrap excessively
   *
   * @param estimatedNodeCount Approximate number of nodes
   * @param containerWidth Available width
   * @param nodeWidth Width of each node
   * @param gapHorizontal Gap between nodes
   * @returns true if should collapse subtasks
   */
  static shouldCollapseSubtasks(
    estimatedNodeCount: number,
    containerWidth: number,
    nodeWidth: number,
    gapHorizontal: number
  ): boolean {
    // How many columns fit?
    const columnsPerRow = Math.max(
      1,
      Math.floor(containerWidth / (nodeWidth + gapHorizontal))
    );

    // Estimate rows needed
    const estimatedRows = Math.ceil(estimatedNodeCount / columnsPerRow);

    // Collapse if would need more than 2 rows (heuristic)
    return estimatedRows > 2;
  }

  /**
   * Get position of a node by ID
   */
  static getNodePosition(layout: LayoutResult, nodeId: string): LayoutPosition | undefined {
    return layout.positions.get(nodeId);
  }

  /**
   * Get all positions in a specific level
   */
  static getPositionsInLevel(layout: LayoutResult, level: number): LayoutPosition[] {
    return Array.from(layout.positions.values()).filter((p) => p.level === level);
  }

  /**
   * Calculate edge (connection line) between two nodes
   * Used for drawing lines between nodes in visualization
   */
  static calculateEdge(
    layout: LayoutResult,
    fromNodeId: string,
    toNodeId: string
  ): { from: LayoutPosition; to: LayoutPosition } | null {
    const from = layout.positions.get(fromNodeId);
    const to = layout.positions.get(toNodeId);

    if (!from || !to) return null;

    return { from, to };
  }

  /**
   * Get center point of a node (for edge calculations)
   */
  static getNodeCenter(layout: LayoutResult, nodeId: string, nodeSize: { width: number; height: number }): { x: number; y: number } | null {
    const pos = layout.positions.get(nodeId);
    if (!pos) return null;

    return {
      x: pos.x + nodeSize.width / 2,
      y: pos.y + nodeSize.height / 2,
    };
  }

  /**
   * Debug: Log layout information
   */
  static logLayoutInfo(layout: LayoutResult): void {
    console.log('=== Tree Layout Info ===');
    console.log(`Total Nodes: ${layout.totalNodes}`);
    console.log(`Max Depth: ${layout.maxDepth}`);
    console.log(`Required Size: ${layout.requiredWidth}x${layout.requiredHeight}px`);
    console.log(`Columns per Level:`);
    layout.columnsPerLevel.forEach((cols, level) => {
      console.log(`  Level ${level}: ${cols} columns`);
    });
    console.log('=======================');
  }
}

/**
 * React Hook: useTreeLayout
 * Automatically calculate responsive layout when container or nodes change
 * Subscribes to container resize via ResizeObserver
 *
 * @param nodes Root nodes of tree
 * @param containerRef Reference to container element
 * @returns Layout result (null while calculating)
 */
export function useTreeLayout(
  nodes: TreeLayoutNode[],
  containerRef: React.RefObject<HTMLDivElement>
): LayoutResult | null {
  const [layout, setLayout] = React.useState<LayoutResult | null>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  // Measure container dimensions
  React.useEffect(() => {
    if (!containerRef.current) return;

    // Initial measurement
    const rect = containerRef.current.getBoundingClientRect();
    setDimensions({
      width: rect.width,
      height: rect.height,
    });

    // Watch for resize
    const observer = new ResizeObserver(([entry]) => {
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [containerRef]);

  // Recalculate layout when dimensions or nodes change
  React.useEffect(() => {
    if (dimensions.width > 0 && nodes.length > 0) {
      const newLayout = TreeLayout.calculateResponsiveLayout(
        nodes,
        dimensions.width,
        dimensions.height
      );
      setLayout(newLayout);
    } else {
      setLayout(null);
    }
  }, [dimensions, nodes]);

  return layout;
}

/**
 * React Hook: useLayoutDimensions
 * Get required dimensions for layout (without rendering)
 * Useful for pre-calculating canvas size
 */
export function useLayoutDimensions(
  nodes: TreeLayoutNode[],
  containerRef: React.RefObject<HTMLDivElement>
): { width: number; height: number } | null {
  const layout = useTreeLayout(nodes, containerRef);

  if (!layout) return null;

  return {
    width: layout.requiredWidth,
    height: layout.requiredHeight,
  };
}

export default TreeLayout;
