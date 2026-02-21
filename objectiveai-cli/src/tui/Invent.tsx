import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { Notification, NotificationMessage } from "../notification";
import { ParametersBuilder } from "../parameters";
import { invent } from "../invent";

interface FunctionNode {
  name?: string;
  messages: NotificationMessage[];
  done: boolean;
  waiting: boolean;
  error?: string;
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

// Flat line types for the scrollable viewport
interface TitleLine {
  type: "title";
  gutter: string;
  prefix: string;
  name: string;
  done: boolean;
  waiting: boolean;
  error?: string;
}

interface MsgLine {
  type: "message";
  gutter: string;
  message: NotificationMessage;
}

interface LoadingLine {
  type: "loading";
  gutter: string;
}

type FlatLine = TitleLine | MsgLine | LoadingLine;

function flattenNode(
  node: FunctionNode,
  gutter: string,
  isLast: boolean,
  isRoot: boolean,
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
  });

  if (!node.done && !node.waiting && node.messages.length > 0) {
    for (const msg of node.messages) {
      lines.push({ type: "message", gutter: childGutter, message: msg });
    }
  }

  if (!node.done && !node.waiting) {
    lines.push({ type: "loading", gutter: childGutter });
  }

  const children = Array.from(node.children.entries());
  for (let i = 0; i < children.length; i++) {
    const [, child] = children[i];
    lines.push(
      ...flattenNode(child, childGutter, i === children.length - 1, false),
    );
  }

  return lines;
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

function RenderLine({ line, tick, termWidth }: { line: FlatLine; tick: number; termWidth: number }) {
  if (line.type === "title") {
    return (
      <Text>
        {line.gutter}{line.prefix}
        <Text bold color="#5948e7">{line.name}</Text>
        {line.waiting && !line.done && <Text color="#5948e7">{" — Waiting"}<Text dimColor>{LOADING_FRAMES[tick % LOADING_FRAMES.length]}</Text></Text>}
        {line.done && !line.error && <Text color="#5948e7">{" — Complete"}</Text>}
        {line.done && line.error && <Text color="red">{" — "}{line.error}</Text>}
      </Text>
    );
  }

  if (line.type === "loading") {
    return (
      <Text>{line.gutter}<Text dimColor>{"  "}{LOADING_FRAMES[tick % LOADING_FRAMES.length]}</Text></Text>
    );
  }

  const msg = line.message;
  if (msg.role === "assistant") {
    const indent = line.gutter + "  ";
    return <Text wrap="truncate">{wrapIndent(msg.content, termWidth - indent.length, indent)}</Text>;
  }
  if (msg.role === "tool") {
    if (msg.error) {
      const errIndent = line.gutter + "    ";
      const firstPrefixLen = line.gutter.length + 4 + msg.name.length + 3;
      const error = wrapIndent(msg.error, termWidth - firstPrefixLen, errIndent);
      return (
        <Text wrap="truncate">{line.gutter}<Text color="red">{"  ✗ "}{msg.name}{" — "}{error.slice(errIndent.length)}</Text></Text>
      );
    }
    return (
      <Text>{line.gutter}<Text color="green">{"  ✓ "}{msg.name}</Text></Text>
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
  const started = useRef(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    invent(onNotification, { inventSpec: spec, parameters })
      .then(() => setDone(true))
      .catch((err) => {
        console.error(err);
        setDone(true);
      });
  }, [spec, parameters, onNotification]);

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

  const lines = useMemo(() => flattenNode(tree, "", true, true), [tree]);
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
            <RenderLine key={scrollOffset + i} line={line} tick={tick} termWidth={termWidth - 1} />
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
