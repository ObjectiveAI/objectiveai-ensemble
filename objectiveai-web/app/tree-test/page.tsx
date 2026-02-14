'use client';

/**
 * Test page for ExecutionTreeVisualization
 * Allows testing responsive scaling at different viewport sizes
 * Phase 1: Static test tree
 */

import React, { useState } from 'react';
import ExecutionTreeVisualization from '@/components/ExecutionTreeVisualization';

export default function TreeTestPage() {
  const [isStreaming, setIsStreaming] = useState(false);

  const handleToggleStreaming = () => {
    setIsStreaming(!isStreaming);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginTop: 0 }}>Execution Tree Visualization - Test Page</h1>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleToggleStreaming}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isStreaming ? '#22C55E' : '#6B5CFF',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
        </button>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
          Responsive Test - Current Viewport
        </h2>
        <p
          style={{
            fontSize: '0.875rem',
            color: '#6B7280',
            marginBottom: '1rem',
          }}
        >
          Resize your browser window to test responsive scaling. No breakpoints
          - scales smoothly from 300px to 2560px.
        </p>
        <ExecutionTreeVisualization
          isStreaming={isStreaming}
          functionName="Test Function - Responsive"
        />
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
          Test Scenarios
        </h2>
        <ul style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.8 }}>
          <li>
            <strong>375px (iPhone):</strong> Resize to ~375px width - verify
            tree renders, no horizontal scroll
          </li>
          <li>
            <strong>768px (Tablet):</strong> Resize to ~768px - verify scaling
            is smooth
          </li>
          <li>
            <strong>1440px (Desktop):</strong> Standard desktop size - verify
            layout is optimal
          </li>
          <li>
            <strong>2560px (Ultra-wide):</strong> Very wide monitor - verify
            nodes don't oversized
          </li>
          <li>
            <strong>Dark mode:</strong> Toggle system dark mode - should
            automatically switch colors
          </li>
          <li>
            <strong>Streaming:</strong> Click "Start Streaming" button - status
            should update
          </li>
        </ul>
      </div>

      <div
        style={{
          padding: '1rem',
          backgroundColor: '#F7F7FA',
          borderRadius: '0.25rem',
          fontSize: '0.875rem',
          color: '#6B7280',
        }}
      >
        <p style={{ marginTop: 0 }}>
          <strong>Phase 1 Status:</strong> Static test tree rendering. In Phase
          2, this will display actual execution data from the backend.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>No backend changes:</strong> This is a frontend-only
          visualization. The tree receives and displays data - it does not
          execute functions.
        </p>
      </div>
    </div>
  );
}
