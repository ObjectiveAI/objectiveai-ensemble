import { useState, useCallback } from "react";
import { Box, Text } from "ink";
import { Notification, NotificationMessage } from "../notification";

interface FunctionNode {
  name?: string;
  parent?: string;
  taskIndex?: number;
  messages: NotificationMessage[];
  done: boolean;
  children: Map<string, FunctionNode>;
}

function getNodeKey(notification: Notification): string {
  if (notification.parent === undefined) return "__root__";
  return `${notification.parent}:${notification.taskIndex}`;
}

function findOrCreateNode(
  root: FunctionNode,
  notification: Notification,
): FunctionNode {
  if (notification.parent === undefined) return root;

  const key = getNodeKey(notification);
  if (!root.children.has(key)) {
    // Find the parent node to attach to
    const parentNode = findParentNode(root, notification.parent);
    const target = parentNode ?? root;
    target.children.set(key, {
      name: notification.name,
      parent: notification.parent,
      taskIndex: notification.taskIndex,
      messages: [],
      done: false,
      children: new Map(),
    });
  }
  return root.children.has(key)
    ? root.children.get(key)!
    : findInTree(root, key)!;
}

function findParentNode(
  node: FunctionNode,
  parentName: string,
): FunctionNode | undefined {
  if (node.name === parentName) return node;
  for (const child of node.children.values()) {
    const found = findParentNode(child, parentName);
    if (found) return found;
  }
  return undefined;
}

function findInTree(
  node: FunctionNode,
  key: string,
): FunctionNode | undefined {
  if (node.children.has(key)) return node.children.get(key)!;
  for (const child of node.children.values()) {
    const found = findInTree(child, key);
    if (found) return found;
  }
  return undefined;
}

function cloneTree(node: FunctionNode): FunctionNode {
  return {
    ...node,
    messages: [...node.messages],
    children: new Map(
      Array.from(node.children.entries()).map(([k, v]) => [k, cloneTree(v)]),
    ),
  };
}

export function useInventNotifications() {
  const [tree, setTree] = useState<FunctionNode>({
    messages: [],
    done: false,
    children: new Map(),
  });

  const onNotification = useCallback((notification: Notification) => {
    setTree((prev) => {
      const next = cloneTree(prev);
      const node = findOrCreateNode(next, notification);

      if (notification.name !== undefined) {
        node.name = notification.name;
      }

      if (notification.message.role === "done") {
        node.done = true;
      } else {
        node.messages.push(notification.message);
        if (node.messages.length > 5) {
          node.messages = node.messages.slice(-5);
        }
      }

      return next;
    });
  }, []);

  return { tree, onNotification };
}

function MessageLine({ message }: { message: NotificationMessage }) {
  if (message.role === "assistant") {
    return <Text>{message.content}</Text>;
  }
  if (message.role === "tool") {
    if (message.error) {
      return (
        <Box flexDirection="column">
          <Text color="red">
            {"✗ "}
            {message.name}
          </Text>
          <Text color="red">{"  "}{message.error}</Text>
        </Box>
      );
    }
    return (
      <Text color="green">
        {"✓ "}
        {message.name}
      </Text>
    );
  }
  return null;
}

function FunctionBox({
  node,
  depth,
  isLast,
}: {
  node: FunctionNode;
  depth: number;
  isLast: boolean;
}) {
  const indent = depth * 3;
  const children = Array.from(node.children.values());

  const title = node.name ?? "Unnamed Function";

  if (node.done) {
    return (
      <Box flexDirection="column">
        <Box marginLeft={indent}>
          {depth > 0 && (
            <Text dimColor>{isLast ? "└─ " : "├─ "}</Text>
          )}
          <Text dimColor>
            {"▪ "}
            {title}
            {" — Invention Complete"}
          </Text>
        </Box>
        {children.map((child, i) => (
          <FunctionBox
            key={getChildKey(child)}
            node={child}
            depth={depth + 1}
            isLast={i === children.length - 1}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginLeft={indent} flexDirection="column">
        {depth > 0 && (
          <Text>{isLast ? "└─ " : "├─ "}</Text>
        )}
        <Box
          borderStyle="round"
          borderColor="magenta"
          flexDirection="column"
          paddingX={1}
        >
          <Text bold color="magenta">
            {title}
          </Text>
          {node.messages.length > 0 && <Text> </Text>}
          {node.messages.map((msg, i) => (
            <MessageLine key={i} message={msg} />
          ))}
        </Box>
      </Box>
      {children.map((child, i) => (
        <FunctionBox
          key={getChildKey(child)}
          node={child}
          depth={depth + 1}
          isLast={i === children.length - 1}
        />
      ))}
    </Box>
  );
}

function getChildKey(node: FunctionNode): string {
  if (node.parent !== undefined && node.taskIndex !== undefined) {
    return `${node.parent}:${node.taskIndex}`;
  }
  return node.name ?? "__unknown__";
}

export function InventView({ tree }: { tree: FunctionNode }) {
  return (
    <Box flexDirection="column" width="100%" height="100%">
      <FunctionBox node={tree} depth={0} isLast={true} />
    </Box>
  );
}
