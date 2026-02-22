import { useState, useCallback, useMemo, useEffect } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { Notification, NotificationMessage } from "../notification";
import { ParametersBuilder } from "../parameters";
import { useInventWorker } from "../worker/useInventWorker";

interface FunctionNode {
  name?: string;
  messages: NotificationMessage[];
  done: boolean;
  waiting: boolean;
  error?: string;
  functionTasks?: number;
  placeholderTasks?: number;
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
        waiting: false,
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
    waiting: false,
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
        node.waiting = false;
        if (notification.message.error) {
          node.error = notification.message.error;
        }
        if (notification.message.functionTasks !== undefined) {
          node.functionTasks = notification.message.functionTasks;
        }
        if (notification.message.placeholderTasks !== undefined) {
          node.placeholderTasks = notification.message.placeholderTasks;
        }
      } else if (notification.message.role === "waiting") {
        node.waiting = true;
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

// Flat line types for the scrollable viewport.
// INVARIANT: each FlatLine renders as exactly 1 terminal row.
interface TitleLine {
  type: "title";
  gutter: string;
  prefix: string;
  name: string;
  done: boolean;
  waiting: boolean;
  error?: string;
  functionTasks?: number;
  placeholderTasks?: number;
}

interface ToolSuccessLine {
  type: "toolSuccess";
  gutter: string;
  name: string;
}

interface TextLine {
  type: "text";
  text: string;
  color?: string;
  dimColor?: boolean;
  wrap?: "truncate";
}

interface LoadingLine {
  type: "loading";
  gutter: string;
}

type FlatLine = TitleLine | ToolSuccessLine | TextLine | LoadingLine;

function flattenNode(
  node: FunctionNode,
  gutter: string,
  isLast: boolean,
  isRoot: boolean,
  termWidth: number,
): FlatLine[] {
  const lines: FlatLine[] = [];
  const prefix = isRoot ? "" : isLast ? "└─ " : "├─ ";
  const continuation = isRoot ? "" : isLast ? "   " : "│  ";
  const childGutter = gutter + continuation;

  lines.push({
    type: "title",
    gutter,
    prefix,
    name: node.name ?? "Unnamed Function",
    done: node.done,
    waiting: node.waiting,
    error: node.error,
    functionTasks: node.functionTasks,
    placeholderTasks: node.placeholderTasks,
  });

  const children = Array.from(node.children.entries());

  if (node.done && node.error && node.functionTasks !== undefined) {
    const errorGutter = children.length > 0 ? childGutter + "│  " : childGutter;
    for (const errLine of node.error.split("\n")) {
      if (errLine) lines.push({ type: "text", text: errorGutter + "✗ " + errLine, color: "red" });
    }
  }

  if (!node.done && !node.waiting && node.messages.length > 0) {
    for (const msg of node.messages) {
      flattenMessage(lines, childGutter, msg, termWidth);
    }
  }

  if (!node.done && !node.waiting) {
    lines.push({ type: "loading", gutter: childGutter });
  }

  for (let i = 0; i < children.length; i++) {
    const [, child] = children[i];
    lines.push(
      ...flattenNode(child, childGutter, i === children.length - 1, false, termWidth),
    );
  }

  return lines;
}

function capLines(rawLines: string[], max = 5): string[] {
  if (rawLines.length <= max) return rawLines;
  return [...rawLines.slice(0, 2), "...", ...rawLines.slice(-2)];
}

function flattenMessage(
  lines: FlatLine[],
  gutter: string,
  msg: NotificationMessage,
  termWidth: number,
): void {
  if (msg.role === "assistant") {
    const indent = gutter + "  ";
    const rawLines = capLines(msg.content.split("\n"));
    for (const raw of rawLines) {
      const wrapped = wrapIndent(raw, termWidth - indent.length, indent);
      for (const row of wrapped.split("\n")) {
        lines.push({ type: "text", text: row, wrap: "truncate" });
      }
    }
  } else if (msg.role === "tool") {
    if (msg.error) {
      // First row: "  ✗ toolName — first line of error"
      const errIndent = gutter + "    ";
      const rawLines = capLines(msg.error.split("\n"));
      const firstPrefixLen = gutter.length + 4 + msg.name.length + 3;
      for (let j = 0; j < rawLines.length; j++) {
        if (j === 0) {
          const wrapped = wrapIndent(rawLines[0], termWidth - firstPrefixLen, errIndent);
          const wrappedRows = wrapped.split("\n");
          const firstRow = gutter + "  ✗ " + msg.name + " — " + wrappedRows[0].slice(errIndent.length);
          lines.push({ type: "text", text: firstRow, color: "red", wrap: "truncate" });
          for (let k = 1; k < wrappedRows.length; k++) {
            lines.push({ type: "text", text: wrappedRows[k], color: "red", wrap: "truncate" });
          }
        } else {
          const wrapped = wrapIndent(rawLines[j], termWidth - errIndent.length, errIndent);
          for (const row of wrapped.split("\n")) {
            lines.push({ type: "text", text: row, color: "red", wrap: "truncate" });
          }
        }
      }
    } else {
      lines.push({ type: "toolSuccess", gutter, name: msg.name });
    }
  }
  // "done" and "waiting" roles are handled at the node level, not here
}

function wrapIndent(text: string, width: number, indent: string): string {
  if (width <= 0) return indent + text;
  const lines: string[] = [];
  for (const segment of text.split("\n")) {
    if (segment.length <= width) {
      lines.push(segment);
      continue;
    }
    let remaining = segment;
    while (remaining.length > width) {
      let breakAt = remaining.lastIndexOf(" ", width);
      if (breakAt <= 0) breakAt = width;
      lines.push(remaining.slice(0, breakAt));
      remaining = remaining.slice(breakAt === width ? breakAt : breakAt + 1);
    }
    if (remaining) lines.push(remaining);
  }
  return indent + lines.join("\n" + indent);
}

const LOADING_FRAMES = ["·  ", "·· ", "···"];

function RenderLine({ line, tick }: { line: FlatLine; tick: number }) {
  if (line.type === "title") {
    return (
      <Text>
        {line.gutter}{line.prefix}
        <Text bold color="#5948e7">{line.name}</Text>
        {line.waiting && !line.done && <Text color="#5948e7">{" — Waiting"}<Text dimColor>{LOADING_FRAMES[tick % LOADING_FRAMES.length]}</Text></Text>}
        {line.done && !line.error && <Text color="#5948e7">{" — Complete"}{line.functionTasks !== undefined && line.placeholderTasks !== undefined && ` [${line.functionTasks}/${line.functionTasks + line.placeholderTasks}]`}</Text>}
        {line.done && line.error && line.functionTasks !== undefined && line.placeholderTasks !== undefined && <Text color="#5948e7">{" — "}{`[${line.functionTasks}/${line.functionTasks + line.placeholderTasks}]`}</Text>}
        {line.done && line.error && (line.functionTasks === undefined || line.placeholderTasks === undefined) && <Text color="red">{" — "}{line.error}</Text>}
      </Text>
    );
  }

  if (line.type === "toolSuccess") {
    return (
      <Text>{line.gutter}<Text color="green">{"  ✓ "}{line.name}</Text></Text>
    );
  }

  if (line.type === "text") {
    if (line.color) {
      return <Text wrap={line.wrap}><Text color={line.color}>{line.text}</Text></Text>;
    }
    return <Text wrap={line.wrap}>{line.text}</Text>;
  }

  if (line.type === "loading") {
    return (
      <Text>{line.gutter}<Text dimColor>{"  "}{LOADING_FRAMES[tick % LOADING_FRAMES.length]}</Text></Text>
    );
  }

  return null;
}

function Scrollbar({
  totalLines,
  viewportHeight,
  scrollOffset,
}: {
  totalLines: number;
  viewportHeight: number;
  scrollOffset: number;
}) {
  if (viewportHeight <= 0) return null;

  const track: string[] = [];

  if (totalLines <= viewportHeight) {
    // Everything fits — full thumb
    for (let i = 0; i < viewportHeight; i++) {
      track.push("█");
    }
  } else {
    const thumbSize = Math.max(1, Math.round((viewportHeight / totalLines) * viewportHeight));
    const maxOffset = totalLines - viewportHeight;
    const thumbStart = maxOffset > 0
      ? Math.round((scrollOffset / maxOffset) * (viewportHeight - thumbSize))
      : 0;

    for (let i = 0; i < viewportHeight; i++) {
      if (i >= thumbStart && i < thumbStart + thumbSize) {
        track.push("█");
      } else {
        track.push("░");
      }
    }
  }

  return (
    <Box flexDirection="column" width={1}>
      {track.map((ch, i) => (
        <Text key={i} dimColor>{ch}</Text>
      ))}
    </Box>
  );
}

export function InventFlow({
  spec,
  parameters,
  onBack,
}: {
  spec: string;
  parameters: ParametersBuilder;
  onBack: () => void;
}) {
  const { tree, onNotification } = useInventNotifications();
  const done = useInventWorker(onNotification, {
    type: "invent",
    options: { inventSpec: spec, parameters },
  });

  useInput((_ch, key) => {
    if (key.escape && done) onBack();
  });

  return <InventView tree={tree} done={done} />;
}

export function InventView({ tree, done }: { tree: FunctionNode; done?: boolean }) {
  const { stdout } = useStdout();
  const [scrollOffset, setScrollOffset] = useState(0);
  const [autoFollow, setAutoFollow] = useState(true);
  const [termHeight, setTermHeight] = useState(stdout.rows ?? 24);
  const [termWidth, setTermWidth] = useState(stdout.columns ?? 80);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTick((t) => t + 1), 400);
    return () => clearInterval(id);
  }, [done]);

  useEffect(() => {
    const onResize = () => {
      setTermHeight(stdout.rows ?? 24);
      setTermWidth(stdout.columns ?? 80);
    };
    stdout.on("resize", onResize);
    return () => { stdout.off("resize", onResize); };
  }, [stdout]);

  const hintHeight = done ? 1 : 0;
  const viewportHeight = termHeight - hintHeight;

  const scrollbarWidth = 1;
  const contentWidth = termWidth - scrollbarWidth;
  const lines = useMemo(() => flattenNode(tree, "", true, true, contentWidth), [tree, contentWidth]);
  const maxOffset = Math.max(0, lines.length - viewportHeight);

  // Auto-follow: scroll to bottom when new content arrives
  useEffect(() => {
    if (autoFollow) {
      setScrollOffset(maxOffset);
    }
  }, [autoFollow, maxOffset]);

  useInput((_input, key) => {
    if (key.upArrow) {
      setAutoFollow(false);
      setScrollOffset((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setScrollOffset((prev) => {
        const next = Math.min(maxOffset, prev + 1);
        if (next >= maxOffset) setAutoFollow(true);
        return next;
      });
    } else if (key.pageUp) {
      setAutoFollow(false);
      setScrollOffset((prev) => Math.max(0, prev - Math.floor(viewportHeight / 2)));
    } else if (key.pageDown) {
      setScrollOffset((prev) => {
        const next = Math.min(maxOffset, prev + Math.floor(viewportHeight / 2));
        if (next >= maxOffset) setAutoFollow(true);
        return next;
      });
    }
  });

  const visible = lines.slice(scrollOffset, scrollOffset + viewportHeight);

  return (
    <Box flexDirection="column" height={termHeight}>
      <Box width="100%" flexGrow={1}>
        <Box flexDirection="column" flexGrow={1}>
          {visible.map((line, i) => (
            <RenderLine key={scrollOffset + i} line={line} tick={tick} />
          ))}
        </Box>
        <Scrollbar
          totalLines={lines.length}
          viewportHeight={viewportHeight}
          scrollOffset={scrollOffset}
        />
      </Box>
      {done && (
        <Text dimColor>{"  press esc to go back"}</Text>
      )}
    </Box>
  );
}
