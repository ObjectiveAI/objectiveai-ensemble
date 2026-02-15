'use client';

/**
 * ExecutionTreeVisualization Component
 * FRONTEND-ONLY: Displays execution data in a responsive 3D tree
 * Does NOT execute functions, modify data, or change backend logic
 */

import React, { useRef } from 'react';
import { useTreeLayout } from '@/lib/function-execution-tree/tree-layout';
import { useDeviceCapabilities } from '@/lib/device-detection';
import { useResponsiveScale } from '@/lib/responsive-scale';
import { useTreeData } from './useTreeData';
import { TreeScene } from './TreeScene';
import { ExecutionTreeVisualizationProps } from './types';
import './index.css';

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

  // Build tree from real execution data (or empty if no execution)
  const nodes = useTreeData(execution);

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
