'use client';

/**
 * ExecutionTreeVisualization Component
 * FRONTEND-ONLY: Displays execution data in a responsive 3D tree
 * Does NOT execute functions, modify data, or change backend logic
 */

import React, { useRef, useMemo } from 'react';
import { useTreeLayout } from '@/lib/tree-layout';
import { useDeviceCapabilities } from '@/lib/device-detection';
import { useResponsiveScale } from '@/lib/responsive-scale';
import { TreeScene } from './TreeScene';
import { ExecutionTreeVisualizationProps, TreeNode } from './types';
import './index.css';

/**
 * Create a test tree with static data (Phase 1)
 * In later phases, this will be replaced with actual execution data
 */
function createTestTree(): TreeNode[] {
  return [
    {
      id: 'root-function',
      type: 'function',
      label: 'Score Function',
      level: 0,
      children: [
        {
          id: 'task-1',
          type: 'task',
          label: 'Task 1',
          level: 1,
          children: [
            {
              id: 'llm-1',
              type: 'llm',
              label: 'GPT-4o',
              level: 2,
              metadata: { color: '#22C55E' },
            },
            {
              id: 'llm-2',
              type: 'llm',
              label: 'Claude',
              level: 2,
              metadata: { color: '#22C55E' },
            },
          ],
        },
        {
          id: 'task-2',
          type: 'task',
          label: 'Task 2',
          level: 1,
          children: [
            {
              id: 'llm-3',
              type: 'llm',
              label: 'Gemini',
              level: 2,
              metadata: { color: '#22C55E' },
            },
          ],
        },
      ],
    },
    {
      id: 'output-node',
      type: 'output',
      label: 'Output',
      level: 3,
      metadata: { value: 0.87 },
    },
  ];
}

/**
 * Main ExecutionTreeVisualization Component
 */
export function ExecutionTreeVisualization({
  execution,
  isStreaming = false,
  functionName = 'Execution Tree',
  onNodeClick,
}: ExecutionTreeVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { vw: viewportWidth, vh: viewportHeight } = useResponsiveScale();
  const { prefersReducedMotion, shouldUseSimplifiedLayout } =
    useDeviceCapabilities();

  // Use test tree for Phase 1 (no execution data yet)
  const nodes = useMemo(() => createTestTree(), []);

  // Calculate responsive layout
  const layout = useTreeLayout(nodes, containerRef as React.RefObject<HTMLDivElement>);

  // Get canvas height from CSS variable or fallback
  const canvasHeight = Math.max(250, Math.min(600, viewportHeight * 0.45));

  if (!containerRef.current) {
    return (
      <div className="execution-tree-visualization">
        <div className="execution-tree-empty">
          <div className="execution-tree-empty-icon">📊</div>
          <div className="execution-tree-empty-text">
            Loading visualization...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="execution-tree-visualization">
      {/* Header */}
      <div className="execution-tree-header">
        <h2 className="execution-tree-title">{functionName}</h2>
        <div className={`execution-tree-status ${isStreaming ? 'streaming' : ''}`}>
          {isStreaming ? (
            <>
              <span style={{ display: 'inline-block' }}>●</span>
              <span>Streaming...</span>
            </>
          ) : (
            <span>Complete</span>
          )}
        </div>
      </div>

      {/* Tree Container */}
      <div
        ref={containerRef}
        className="execution-tree-container"
        style={{ height: `${canvasHeight}px` }}
      >
        {layout && nodes.length > 0 ? (
          <TreeScene
            layout={layout}
            nodes={nodes}
            canvasHeight={canvasHeight}
          />
        ) : (
          <div className="execution-tree-loading">
            Calculating layout...
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div
        style={{
          fontSize: 'var(--font-metric)',
          color: 'var(--color-text-muted)',
          padding: 'var(--spacing-sm)',
          textAlign: 'center',
        }}
      >
        {layout && (
          <span>
            {layout.totalNodes} nodes • {layout.maxDepth} levels •{' '}
            {layout.requiredWidth.toFixed(0)}x{layout.requiredHeight.toFixed(0)}px
          </span>
        )}
      </div>
    </div>
  );
}

export default ExecutionTreeVisualization;
