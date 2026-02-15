'use client';

/**
 * Test page for ExecutionTreeVisualization
 * Allows testing responsive scaling at different viewport sizes
 * Phase 2: Real execution data from mock object
 */

import React, { useState } from 'react';
import ExecutionTreeVisualization from '@/components/function-execution-tree';

// Mock execution object - simulates real backend data structure
const MOCK_EXECUTION = {
  id: 'exec-test-123',
  tasks: [
    {
      index: '0',
      votes: [
        { model: 'openai/gpt-4o', vote: [0.85], weight: 0.5, from_cache: true },
        {
          model: 'anthropic/claude-3-sonnet',
          vote: [0.78],
          weight: 0.5,
          from_cache: false,
        },
      ],
      score: 0.815,
      scores: [0.815],
    },
    {
      index: '1',
      tasks: [
        {
          index: '1.1',
          votes: [
            {
              model: 'google/gemini-2.0-flash',
              vote: [0.92],
              weight: 0.33,
              from_rng: true,
            },
          ],
          score: 0.92,
        },
        {
          index: '1.2',
          votes: [
            { model: 'openai/gpt-4o', vote: [0.72], weight: 0.67 },
          ],
          score: 0.72,
        },
      ],
    },
  ],
  output: { result: 'high_confidence', value: 0.81 },
};

export default function TreeTestPage() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [showMockData, setShowMockData] = useState(true);

  const handleToggleStreaming = () => {
    setIsStreaming(!isStreaming);
  };

  const handleToggleMockData = () => {
    setShowMockData(!showMockData);
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
          {isStreaming ? '⏹ Stop Streaming' : '▶ Start Streaming'}
        </button>
        <button
          onClick={handleToggleMockData}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: showMockData ? '#6B5CFF' : '#9CA3AF',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          {showMockData ? '✓ Mock Data (ON)' : '✗ Mock Data (OFF)'}
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
          - scales smoothly from 300px to 2560px. {showMockData ? 'Showing mock execution data.' : 'No data provided (empty tree).'}
        </p>
        <ExecutionTreeVisualization
          execution={showMockData ? MOCK_EXECUTION : undefined}
          isStreaming={isStreaming}
          functionName="Test Scorer - Market Viability"
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
          <strong>Phase 2 Status:</strong> Real execution data rendering. Mock
          object simulates backend structure (tasks, votes, scores). Toggle
          "Mock Data" button to see empty state.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>No backend changes:</strong> This is a frontend-only
          visualization. The tree receives and displays data - it does not
          execute functions. Hook: <code>useTreeData(execution)</code> converts
          execution object to tree structure.
        </p>
      </div>
    </div>
  );
}
