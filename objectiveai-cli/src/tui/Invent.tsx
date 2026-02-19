import { useState, useCallback } from "react";
import { Box, Text } from "ink";
import { Notification, NotificationMessage } from "../notification";

interface FunctionNode {
  name?: string;
  messages: NotificationMessage[];
  done: boolean;
  children: Map<number, FunctionNode>;
}

function findOrCreateNode(
  root: FunctionNode,
  path: number[],
): FunctionNode {
  let node = root;
  for (const index of path) {
    if (!node.children.has(index)) {
      node.children.set(index, {
        messages: [],
        done: false,
        children: new Map(),
      });
    }
    node = node.children.get(index)!;
  }
  return node;
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
      const node = findOrCreateNode(next, notification.path);

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
  const children = Array.from(node.children.entries());

  const title = node.name ?? "Unnamed Function";

  return (
    <Box flexDirection="column">
      <Box marginLeft={indent} flexDirection="column">
        {depth > 0 && (
          <Text>{isLast ? "└─ " : "├─ "}</Text>
        )}
        <Box
          borderStyle="round"
          borderColor="#5948e7"
          flexDirection="column"
          paddingX={1}
        >
          <Text bold color="#5948e7">
            {title}
          </Text>
          {node.done ? (
            <>
              <Text> </Text>
              <Text color="#5948e7">Invention Complete</Text>
            </>
          ) : node.messages.length > 0 ? (
            <>
              <Text> </Text>
              {node.messages.map((msg, i) => (
                <MessageLine key={i} message={msg} />
              ))}
            </>
          ) : null}
        </Box>
      </Box>
      {children.map(([index, child], i) => (
        <FunctionBox
          key={index}
          node={child}
          depth={depth + 1}
          isLast={i === children.length - 1}
        />
      ))}
    </Box>
  );
}

export function InventView({ tree }: { tree: FunctionNode }) {
  return (
    <Box flexDirection="column" width="100%" height="100%">
      <FunctionBox node={tree} depth={0} isLast={true} />
    </Box>
  );
}
