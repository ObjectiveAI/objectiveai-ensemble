/**
 * useTreeData Hook - Convert FunctionExecution to TreeNode[]
 * FRONTEND-ONLY: Transforms backend execution data to visualization tree
 * Does NOT modify, calculate, or alter execution data
 */

'use client';

import { useMemo } from 'react';
import { TreeNode, ExecutionTreeVisualizationProps } from './types';

/**
 * Build tree from execution object
 * Recursively handles nested tasks, votes, and scores
 */
function buildTreeFromExecution(
  execution: ExecutionTreeVisualizationProps['execution'] | undefined
): TreeNode[] {
  if (!execution) {
    return [];
  }

  // Root node: Function
  const functionNode: TreeNode = {
    id: execution.id || 'function-root',
    type: 'function',
    label: `Execution`,
    level: 0,
    children: [],
  };

  // Build children from tasks
  if (execution.tasks && execution.tasks.length > 0) {
    functionNode.children = buildTaskTree(execution.tasks, 0);
  }

  // Add output node if available
  if (execution.output !== undefined) {
    functionNode.children!.push({
      id: `output-${execution.id}`,
      type: 'output',
      label: `Output: ${
        typeof execution.output === 'string'
          ? execution.output.substring(0, 15)
          : JSON.stringify(execution.output).substring(0, 15)
      }`,
      level: 1,
      metadata: { value: execution.output },
    });
  }

  return [functionNode];
}

/**
 * Recursively build task tree from execution.tasks
 * Handles arbitrary nesting depth
 */
function buildTaskTree(
  tasks: any[] | undefined,
  parentLevel: number
): TreeNode[] {
  if (!tasks || tasks.length === 0) {
    return [];
  }

  return tasks.map((task, taskIndex) => {
    const taskNode: TreeNode = {
      id: `task-${task.index || taskIndex}`,
      type: 'task',
      label: `Task ${task.index || taskIndex}`,
      level: parentLevel + 1,
      children: [],
    };

    // Handle nested tasks recursively
    if (task.tasks && task.tasks.length > 0) {
      taskNode.children = buildTaskTree(task.tasks, parentLevel + 1);
    }

    // Handle LLMs from votes
    if (task.votes && Array.isArray(task.votes) && task.votes.length > 0) {
      const llmNodes = task.votes.map((vote: any, voteIdx: number) => {
        const llmNode: TreeNode = {
          id: `llm-${task.index || taskIndex}-${voteIdx}`,
          type: 'llm',
          label: vote.model || `LLM ${voteIdx}`,
          level: parentLevel + 2,
          children: [],
        };

        // Add vote info as child
        if (vote.vote !== undefined) {
          const voteLabel =
            Array.isArray(vote.vote)
              ? `Vote: [${vote.vote.map((v: number) => v.toFixed(2)).join(', ')}]`
              : `Vote: ${vote.vote}`;

          llmNode.children!.push({
            id: `vote-${task.index || taskIndex}-${voteIdx}`,
            type: 'vote',
            label: voteLabel.substring(0, 30),
            level: parentLevel + 3,
            metadata: { value: vote.vote },
          });
        }

        // Add weight info
        if (vote.weight !== undefined) {
          llmNode.children!.push({
            id: `weight-${task.index || taskIndex}-${voteIdx}`,
            type: 'score',
            label: `Weight: ${(vote.weight * 100).toFixed(0)}%`,
            level: parentLevel + 3,
            metadata: { value: vote.weight },
          });
        }

        return llmNode;
      });

      if (!taskNode.children || taskNode.children.length === 0) {
        taskNode.children = llmNodes;
      } else {
        taskNode.children.push(...llmNodes);
      }
    }

    // Add score if available
    if (
      task.score !== undefined &&
      typeof task.score === 'number'
    ) {
      taskNode.children!.push({
        id: `score-${task.index || taskIndex}`,
        type: 'score',
        label: `Score: ${task.score.toFixed(3)}`,
        level: parentLevel + 2,
        metadata: { value: task.score },
      });
    }

    // Add scores array if available (vector output)
    if (task.scores && Array.isArray(task.scores) && task.scores.length > 0) {
      task.scores.forEach((score: number, scoreIdx: number) => {
        taskNode.children!.push({
          id: `score-array-${task.index || taskIndex}-${scoreIdx}`,
          type: 'score',
          label: `Score[${scoreIdx}]: ${score.toFixed(3)}`,
          level: parentLevel + 2,
          metadata: { value: score },
        });
      });
    }

    return taskNode;
  });
}

/**
 * React Hook: useTreeData
 * Converts execution object to TreeNode array
 * Memoized to prevent unnecessary rebuilds
 */
export function useTreeData(
  execution: ExecutionTreeVisualizationProps['execution'] | undefined
): TreeNode[] {
  return useMemo(() => {
    return buildTreeFromExecution(execution);
  }, [execution?.id, execution?.tasks, execution?.output]);
}

export default useTreeData;
