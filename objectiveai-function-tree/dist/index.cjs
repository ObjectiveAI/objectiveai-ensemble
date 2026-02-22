'use strict';

var react = require('react');
var jsxRuntime = require('react/jsx-runtime');

// src/react/FunctionTree.tsx

// src/types.ts
var DEFAULT_CONFIG = {
  orientation: "vertical",
  nodeGapX: 24,
  nodeGapY: 80,
  animate: true,
  animationDuration: 300,
  minZoom: 0.02,
  maxZoom: 3,
  theme: "auto",
  gridThreshold: 20
};
var NODE_SIZES = {
  function: { width: 200, height: 80 },
  "vector-completion": { width: 180, height: 70 },
  llm: { width: 150, height: 60 }
};
var SCORE_COLORS = {
  green: "rgb(34, 197, 94)",
  yellow: "rgb(234, 179, 8)",
  orange: "rgb(249, 115, 22)",
  red: "rgb(239, 68, 68)"
};
function scoreColor(score) {
  if (score >= 0.66) return SCORE_COLORS.green;
  if (score >= 0.33) return SCORE_COLORS.yellow;
  if (score >= 0.15) return SCORE_COLORS.orange;
  return SCORE_COLORS.red;
}

// src/core/tree-data.ts
function isFunctionExecutionTask(task) {
  return "tasks" in task && Array.isArray(task.tasks);
}
function nodeId(prefix, path) {
  return path.length > 0 ? `${prefix}-${path.join("-")}` : prefix;
}
function taskState(task) {
  if (task.error) return "error";
  if (task.scores && task.scores.length > 0) return "complete";
  if (task.completions && task.completions.length > 0)
    return "streaming";
  return "pending";
}
function functionState(exec) {
  if (exec.error) return "error";
  if (exec.output !== void 0 && exec.output !== null) return "complete";
  if (exec.tasks && exec.tasks.length > 0) return "streaming";
  return "pending";
}
function buildTree(execution, modelNames) {
  if (!execution) return null;
  const nodes = /* @__PURE__ */ new Map();
  const rootId = "root";
  const rootNode = {
    id: rootId,
    kind: "function",
    label: execution.function ? execution.function.split("/").pop() || "Function" : "Function",
    parentId: null,
    children: [],
    x: 0,
    y: 0,
    width: NODE_SIZES.function.width,
    height: NODE_SIZES.function.height,
    state: functionState(execution),
    data: {
      kind: "function",
      functionId: execution.function ?? null,
      profileId: execution.profile ?? null,
      output: execution.output !== void 0 ? execution.output : null,
      taskCount: execution.tasks?.length ?? 0,
      error: execution.error?.message ?? null
    }
  };
  nodes.set(rootId, rootNode);
  if (execution.tasks) {
    for (let i = 0; i < execution.tasks.length; i++) {
      processTask(execution.tasks[i], rootId, i, nodes);
    }
  }
  return { nodes, rootId };
}
function processTask(task, parentId, fallbackIndex, nodes, modelNames) {
  if (isFunctionExecutionTask(task)) {
    processFunctionTask(task, parentId, fallbackIndex, nodes);
  } else {
    processVectorCompletionTask(
      task,
      parentId,
      fallbackIndex,
      nodes);
  }
}
function processFunctionTask(task, parentId, fallbackIndex, nodes, modelNames) {
  const idx = task.index ?? fallbackIndex;
  const path = task.task_path ?? [idx];
  const id = nodeId("func", path);
  const node = {
    id,
    kind: "function",
    label: task.function ? task.function.split("/").pop() || `Task ${idx}` : `Task ${idx}`,
    parentId,
    children: [],
    x: 0,
    y: 0,
    width: NODE_SIZES.function.width,
    height: NODE_SIZES.function.height,
    state: functionState(task),
    data: {
      kind: "function",
      functionId: task.function ?? null,
      profileId: task.profile ?? null,
      output: task.output !== void 0 ? task.output : null,
      taskCount: task.tasks?.length ?? 0,
      error: task.error?.message ?? null
    }
  };
  nodes.set(id, node);
  const parent = nodes.get(parentId);
  if (parent) parent.children.push(id);
  if (task.tasks) {
    for (let i = 0; i < task.tasks.length; i++) {
      processTask(task.tasks[i], id, i, nodes);
    }
  }
}
function processVectorCompletionTask(task, parentId, fallbackIndex, nodes, modelNames) {
  const idx = task.index ?? fallbackIndex;
  const path = task.task_path ?? [idx];
  const id = nodeId("vc", path);
  const node = {
    id,
    kind: "vector-completion",
    label: `Task ${idx}`,
    parentId,
    children: [],
    // LLM nodes no longer rendered in tree — vote data stored on this node
    x: 0,
    y: 0,
    width: NODE_SIZES["vector-completion"].width,
    height: NODE_SIZES["vector-completion"].height,
    state: taskState(task),
    data: {
      kind: "vector-completion",
      taskIndex: task.task_index ?? idx,
      taskPath: path,
      scores: task.scores ?? null,
      responses: null,
      voteCount: task.votes?.length ?? 0,
      votes: task.votes ?? null,
      completions: task.completions ?? null,
      error: task.error?.message ?? null
    }
  };
  nodes.set(id, node);
  const parent = nodes.get(parentId);
  if (parent) parent.children.push(id);
}

// src/core/layout.ts
function layoutTree(treeData, config) {
  const { nodes, rootId } = treeData;
  const root = nodes.get(rootId);
  if (!root) return;
  const subtreeInfos = /* @__PURE__ */ new Map();
  computeSubtreeSize(rootId, nodes, config, subtreeInfos);
  const rootInfo = subtreeInfos.get(rootId);
  if (!rootInfo) return;
  assignPositions(rootId, 0, 0, nodes, config, subtreeInfos);
}
function computeSubtreeSize(nodeId2, nodes, config, infos) {
  const node = nodes.get(nodeId2);
  if (!node) return { width: 0, height: 0 };
  const children = node.children.map((cid) => nodes.get(cid)).filter((c) => c !== void 0);
  if (children.length === 0) {
    const info2 = { width: node.width, height: node.height };
    infos.set(nodeId2, info2);
    return info2;
  }
  const childInfos = [];
  for (const child of children) {
    childInfos.push(computeSubtreeSize(child.id, nodes, config, infos));
  }
  const useGrid = children.length > config.gridThreshold && children.every((c) => c.children.length === 0);
  let childrenWidth;
  let childrenHeight;
  if (useGrid) {
    const cols = Math.ceil(Math.sqrt(children.length));
    const rows = Math.ceil(children.length / cols);
    const cellWidth = children[0].width;
    const cellHeight = children[0].height;
    childrenWidth = cols * cellWidth + (cols - 1) * config.nodeGapX;
    childrenHeight = rows * cellHeight + (rows - 1) * (config.nodeGapX * 0.5);
  } else {
    childrenWidth = childInfos.reduce((sum, ci) => sum + ci.width, 0) + (childInfos.length - 1) * config.nodeGapX;
    childrenHeight = Math.max(...childInfos.map((ci) => ci.height));
  }
  const totalWidth = Math.max(node.width, childrenWidth);
  const totalHeight = node.height + config.nodeGapY + childrenHeight;
  const info = { width: totalWidth, height: totalHeight };
  infos.set(nodeId2, info);
  return info;
}
function assignPositions(nodeId2, cx, cy, nodes, config, infos) {
  const node = nodes.get(nodeId2);
  if (!node) return;
  node.x = cx - node.width / 2;
  node.y = cy;
  const children = node.children.map((cid) => nodes.get(cid)).filter((c) => c !== void 0);
  if (children.length === 0) return;
  const childY = cy + node.height + config.nodeGapY;
  const useGrid = children.length > config.gridThreshold && children.every((c) => c.children.length === 0);
  if (useGrid) {
    const cols = Math.ceil(Math.sqrt(children.length));
    const cellWidth = children[0].width;
    const cellHeight = children[0].height;
    const gridWidth = cols * cellWidth + (cols - 1) * config.nodeGapX;
    const gridGapY = config.nodeGapX * 0.5;
    const startX = cx - gridWidth / 2;
    for (let i = 0; i < children.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const childCx = startX + col * (cellWidth + config.nodeGapX) + cellWidth / 2;
      const childCy = childY + row * (cellHeight + gridGapY);
      children[i].x = childCx - children[i].width / 2;
      children[i].y = childCy;
    }
  } else {
    const childInfos = children.map((c) => infos.get(c.id));
    const totalChildrenWidth = childInfos.reduce((sum, ci) => sum + ci.width, 0) + (childInfos.length - 1) * config.nodeGapX;
    let currentX = cx - totalChildrenWidth / 2;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childInfo = childInfos[i];
      const childCx = currentX + childInfo.width / 2;
      assignPositions(child.id, childCx, childY, nodes, config, infos);
      currentX += childInfo.width + config.nodeGapX;
    }
  }
}
function treeBounds(nodes) {
  if (nodes.size === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes.values()) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  }
  return { minX, minY, maxX, maxY };
}

// src/core/viewport.ts
var Viewport = class {
  constructor(minZoom = 0.02, maxZoom = 3) {
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;
    this.panX = 0;
    this.panY = 0;
    this.zoom = 1;
    this._animating = false;
    this._animStart = 0;
    this._animDuration = 0;
    this._animFrom = { panX: 0, panY: 0, zoom: 1 };
    this._animTo = { panX: 0, panY: 0, zoom: 1 };
  }
  /** Convert screen (canvas pixel) coordinates to world coordinates. */
  screenToWorld(sx, sy) {
    return {
      x: sx / this.zoom + this.panX,
      y: sy / this.zoom + this.panY
    };
  }
  /** Convert world coordinates to screen (canvas pixel) coordinates. */
  worldToScreen(wx, wy) {
    return {
      x: (wx - this.panX) * this.zoom,
      y: (wy - this.panY) * this.zoom
    };
  }
  /** Check if a world-space rectangle is visible in the viewport. */
  isVisible(x, y, w, h, canvasWidth, canvasHeight) {
    const screen = this.worldToScreen(x, y);
    const sw = w * this.zoom;
    const sh = h * this.zoom;
    return screen.x + sw > 0 && screen.x < canvasWidth && screen.y + sh > 0 && screen.y < canvasHeight;
  }
  /** Apply the viewport transform to a canvas context. */
  applyTransform(ctx) {
    ctx.setTransform(this.zoom, 0, 0, this.zoom, -this.panX * this.zoom, -this.panY * this.zoom);
  }
  /** Zoom by a delta, centering on a screen point. */
  zoomAt(delta, screenX, screenY) {
    const worldBefore = this.screenToWorld(screenX, screenY);
    this.zoom = clamp(this.zoom * (1 + delta), this.minZoom, this.maxZoom);
    const worldAfter = this.screenToWorld(screenX, screenY);
    this.panX += worldBefore.x - worldAfter.x;
    this.panY += worldBefore.y - worldAfter.y;
  }
  /** Pan by screen-space delta. */
  pan(dx, dy) {
    this.panX -= dx / this.zoom;
    this.panY -= dy / this.zoom;
  }
  /** Zoom to fit all nodes in the viewport with padding. */
  fitToContent(nodes, canvasWidth, canvasHeight, padding = 40, minInitialZoom = 0.4) {
    if (nodes.size === 0) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const node of nodes.values()) {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    }
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    if (contentWidth <= 0 || contentHeight <= 0) return;
    const availableWidth = canvasWidth - padding * 2;
    const availableHeight = canvasHeight - padding * 2;
    const naturalZoom = Math.min(
      availableWidth / contentWidth,
      availableHeight / contentHeight
    );
    this.zoom = clamp(
      Math.max(naturalZoom, minInitialZoom),
      this.minZoom,
      this.maxZoom
    );
    this.panX = minX - (canvasWidth / this.zoom - contentWidth) / 2;
    this.panY = minY - (canvasHeight / this.zoom - contentHeight) / 2;
  }
  /** Animate to a target viewport state. */
  animateTo(target, duration = 300) {
    this._animFrom = { panX: this.panX, panY: this.panY, zoom: this.zoom };
    this._animTo = {
      panX: target.panX ?? this.panX,
      panY: target.panY ?? this.panY,
      zoom: target.zoom ?? this.zoom
    };
    this._animStart = performance.now();
    this._animDuration = duration;
    this._animating = true;
  }
  /** Tick the animation. Returns true if still animating. */
  tick(now) {
    if (!this._animating) return false;
    const elapsed = now - this._animStart;
    const t = Math.min(elapsed / this._animDuration, 1);
    const eased = easeOutCubic(t);
    this.panX = lerp(this._animFrom.panX, this._animTo.panX, eased);
    this.panY = lerp(this._animFrom.panY, this._animTo.panY, eased);
    this.zoom = lerp(this._animFrom.zoom, this._animTo.zoom, eased);
    if (t >= 1) {
      this._animating = false;
    }
    return this._animating;
  }
  get isAnimating() {
    return this._animating;
  }
  /** Save current state for later comparison. */
  snapshot() {
    return { panX: this.panX, panY: this.panY, zoom: this.zoom };
  }
};
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// src/core/lod.ts
function getLodLevel(zoom) {
  if (zoom >= 0.5) return "full";
  if (zoom >= 0.15) return "simplified";
  return "dots";
}
function getLodParams(level) {
  switch (level) {
    case "full":
      return {
        curvedEdges: true,
        showLabels: true,
        showStreamingText: true,
        showScoreBars: true,
        maxLabelLength: 0,
        cornerRadius: 8,
        showEdges: true,
        dotSize: 0
      };
    case "simplified":
      return {
        curvedEdges: false,
        showLabels: true,
        showStreamingText: false,
        showScoreBars: false,
        maxLabelLength: 12,
        cornerRadius: 4,
        showEdges: true,
        dotSize: 0
      };
    case "dots":
      return {
        curvedEdges: false,
        showLabels: false,
        showStreamingText: false,
        showScoreBars: false,
        maxLabelLength: 0,
        cornerRadius: 0,
        showEdges: false,
        dotSize: 6
      };
  }
}

// src/core/renderer.ts
var LIGHT_THEME = {
  bg: "#EDEDF2",
  text: "#1B1B1B",
  textSecondary: "#6B6B7B",
  accent: "#6B5CFF",
  nodeBg: "#FFFFFF",
  nodeBorder: "#D1D1D9",
  nodeSelectedBorder: "#6B5CFF",
  edgeColor: "#B0B0BE",
  edgeWidth: 1.5,
  font: '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSmall: '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontBold: 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};
var DARK_THEME = {
  bg: "#1B1B1B",
  text: "#EDEDF2",
  textSecondary: "#9B9BAB",
  accent: "#6B5CFF",
  nodeBg: "#2A2A2E",
  nodeBorder: "#3A3A42",
  nodeSelectedBorder: "#6B5CFF",
  edgeColor: "#4A4A56",
  edgeWidth: 1.5,
  font: '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSmall: '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontBold: 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};
function resolveTheme(mode) {
  if (mode === "light") return LIGHT_THEME;
  if (mode === "dark") return DARK_THEME;
  if (typeof window !== "undefined") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return isDark ? DARK_THEME : LIGHT_THEME;
  }
  return LIGHT_THEME;
}
var TreeRenderer = class {
  constructor(ctx) {
    this.ctx = ctx;
    this.textCache = /* @__PURE__ */ new Map();
  }
  /** Clear the canvas and draw the full tree. */
  render(nodes, rootId, viewport, theme, lod, animation, selectedId, hoveredId, canvasWidth, canvasHeight) {
    const ctx = this.ctx;
    const params = getLodParams(lod);
    const now = performance.now();
    ctx.resetTransform();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    viewport.applyTransform(ctx);
    if (params.showEdges) {
      this.drawEdges(nodes, viewport, theme, params, animation, now, canvasWidth, canvasHeight);
    }
    if (lod === "dots") {
      this.drawDots(nodes, viewport, theme, params, animation, now, canvasWidth, canvasHeight);
    } else {
      this.drawNodes(nodes, viewport, theme, params, animation, now, selectedId, hoveredId, canvasWidth, canvasHeight);
    }
  }
  // -- Edges ----------------------------------------------------------------
  drawEdges(nodes, viewport, theme, params, animation, now, canvasWidth, canvasHeight) {
    const ctx = this.ctx;
    ctx.strokeStyle = theme.edgeColor;
    ctx.lineWidth = theme.edgeWidth;
    ctx.beginPath();
    for (const node of nodes.values()) {
      if (node.children.length === 0) continue;
      const parentState = animation?.getInterpolated(node.id, now);
      const px = (parentState?.x ?? node.x) + node.width / 2;
      const py = (parentState?.y ?? node.y) + node.height;
      for (const childId of node.children) {
        const child = nodes.get(childId);
        if (!child) continue;
        const childState = animation?.getInterpolated(childId, now);
        const cx = (childState?.x ?? child.x) + child.width / 2;
        const cy = childState?.y ?? child.y;
        if (!this.edgeVisible(px, py, cx, cy, viewport, canvasWidth, canvasHeight)) {
          continue;
        }
        ctx.moveTo(px, py);
        if (params.curvedEdges) {
          const midY = py + (cy - py) / 2;
          ctx.bezierCurveTo(px, midY, cx, midY, cx, cy);
        } else {
          ctx.lineTo(cx, cy);
        }
      }
    }
    ctx.stroke();
  }
  edgeVisible(x1, y1, x2, y2, viewport, canvasWidth, canvasHeight) {
    const s1 = viewport.worldToScreen(x1, y1);
    const s2 = viewport.worldToScreen(x2, y2);
    const margin = 50;
    if (s1.x < -margin && s2.x < -margin) return false;
    if (s1.x > canvasWidth + margin && s2.x > canvasWidth + margin) return false;
    if (s1.y < -margin && s2.y < -margin) return false;
    if (s1.y > canvasHeight + margin && s2.y > canvasHeight + margin) return false;
    return true;
  }
  // -- Dots (LOD: dots) -----------------------------------------------------
  drawDots(nodes, viewport, theme, params, animation, now, canvasWidth, canvasHeight) {
    const ctx = this.ctx;
    const size = params.dotSize / viewport.zoom;
    for (const node of nodes.values()) {
      const state = animation?.getInterpolated(node.id, now);
      const x = state?.x ?? node.x;
      const y = state?.y ?? node.y;
      const opacity = state?.opacity ?? 1;
      if (!viewport.isVisible(x, y, node.width, node.height, canvasWidth, canvasHeight)) {
        continue;
      }
      ctx.globalAlpha = opacity;
      ctx.fillStyle = this.nodeColor(node, theme);
      ctx.fillRect(
        x + node.width / 2 - size / 2,
        y + node.height / 2 - size / 2,
        size,
        size
      );
    }
    ctx.globalAlpha = 1;
  }
  // -- Nodes (LOD: full/simplified) -----------------------------------------
  drawNodes(nodes, viewport, theme, params, animation, now, selectedId, hoveredId, canvasWidth, canvasHeight) {
    const ctx = this.ctx;
    for (const node of nodes.values()) {
      const state = animation?.getInterpolated(node.id, now);
      const x = state?.x ?? node.x;
      const y = state?.y ?? node.y;
      const opacity = state?.opacity ?? 1;
      if (!viewport.isVisible(x, y, node.width, node.height, canvasWidth, canvasHeight)) {
        continue;
      }
      ctx.globalAlpha = opacity;
      const isSelected = node.id === selectedId;
      const isHovered = node.id === hoveredId;
      this.drawRoundedRect(
        x,
        y,
        node.width,
        node.height,
        params.cornerRadius,
        theme.nodeBg,
        isSelected ? theme.nodeSelectedBorder : isHovered ? theme.accent : theme.nodeBorder,
        isSelected || isHovered ? 2 : 1
      );
      switch (node.data.kind) {
        case "function":
          this.drawFunctionNode(node, x, y, theme, params);
          break;
        case "vector-completion":
          this.drawVectorCompletionNode(node, x, y, theme, params);
          break;
        case "llm":
          this.drawLlmNode(node, x, y, theme, params);
          break;
      }
      this.drawStateIndicator(node.state, x + node.width - 12, y + 8, theme);
    }
    ctx.globalAlpha = 1;
  }
  // -- Node type renderers --------------------------------------------------
  drawFunctionNode(node, x, y, theme, params) {
    const ctx = this.ctx;
    const data = node.data;
    const padding = 10;
    ctx.fillStyle = theme.accent;
    ctx.fillRect(x, y, 4, node.height);
    if (params.showLabels) {
      ctx.font = theme.fontBold;
      ctx.fillStyle = theme.text;
      const label = params.maxLabelLength > 0 ? truncate(node.label, params.maxLabelLength) : node.label;
      ctx.fillText(label, x + padding + 4, y + 22, node.width - padding * 2);
    }
    if (data.output !== null && params.showScoreBars) {
      const outputStr = typeof data.output === "number" ? `${(data.output * 100).toFixed(1)}%` : `[${data.output.map((v) => v.toFixed(2)).join(", ")}]`;
      ctx.font = theme.font;
      ctx.fillStyle = typeof data.output === "number" ? scoreColor(data.output) : theme.textSecondary;
      ctx.fillText(outputStr, x + padding + 4, y + 42, node.width - padding * 2);
    }
    if (params.showLabels) {
      ctx.font = theme.fontSmall;
      ctx.fillStyle = theme.textSecondary;
      ctx.fillText(`${data.taskCount} tasks`, x + padding + 4, y + 60, node.width - padding * 2);
    }
  }
  drawVectorCompletionNode(node, x, y, theme, params) {
    const ctx = this.ctx;
    const data = node.data;
    const padding = 10;
    if (params.showLabels) {
      ctx.font = theme.fontBold;
      ctx.fillStyle = theme.text;
      const label = params.maxLabelLength > 0 ? truncate(node.label, params.maxLabelLength) : node.label;
      ctx.fillText(label, x + padding, y + 20, node.width - padding * 2);
    }
    if (data.scores && data.scores.length > 0 && params.showScoreBars) {
      const maxScore = Math.max(...data.scores);
      const barY = y + 32;
      const barWidth = node.width - padding * 2;
      const barHeight = 6;
      ctx.fillStyle = theme.nodeBorder;
      this.drawRoundedRectFill(x + padding, barY, barWidth, barHeight, 3);
      ctx.fillStyle = scoreColor(maxScore);
      this.drawRoundedRectFill(x + padding, barY, barWidth * maxScore, barHeight, 3);
    }
    if (params.showLabels) {
      ctx.font = theme.fontSmall;
      if (data.voteCount > 0) {
        ctx.fillStyle = theme.textSecondary;
        ctx.fillText(`${data.voteCount} LLMs`, x + padding, y + 56, node.width - padding * 2);
      } else if (node.state === "pending") {
        ctx.fillStyle = theme.nodeBorder;
        ctx.fillText("Pending", x + padding, y + 56, node.width - padding * 2);
      } else if (node.state === "streaming") {
        ctx.fillStyle = theme.accent;
        ctx.fillText("Running\u2026", x + padding, y + 56, node.width - padding * 2);
      } else if (node.state === "error") {
        ctx.fillStyle = SCORE_COLORS.red;
        ctx.fillText("Error", x + padding, y + 56, node.width - padding * 2);
      } else {
        ctx.fillStyle = theme.textSecondary;
        ctx.fillText("No votes", x + padding, y + 56, node.width - padding * 2);
      }
    }
  }
  drawLlmNode(node, x, y, theme, params) {
    const ctx = this.ctx;
    const data = node.data;
    const padding = 8;
    if (params.showLabels) {
      ctx.font = theme.font;
      ctx.fillStyle = theme.text;
      const label = params.maxLabelLength > 0 ? truncate(node.label, params.maxLabelLength) : node.label;
      ctx.fillText(label, x + padding, y + 16, node.width - padding * 2);
    }
    if (params.showScoreBars) {
      const barY = y + 24;
      const barWidth = node.width - padding * 2;
      const barHeight = 4;
      ctx.fillStyle = theme.nodeBorder;
      this.drawRoundedRectFill(x + padding, barY, barWidth, barHeight, 2);
      ctx.fillStyle = theme.accent;
      this.drawRoundedRectFill(x + padding, barY, barWidth * Math.min(data.weight, 1), barHeight, 2);
    }
    if (params.showStreamingText && data.streamingText) {
      ctx.font = theme.fontSmall;
      ctx.fillStyle = theme.textSecondary;
      const preview = truncate(data.streamingText.replace(/\n/g, " "), 30);
      ctx.fillText(preview, x + padding, y + 44, node.width - padding * 2);
    }
    if (params.showLabels && (data.fromCache || data.fromRng)) {
      ctx.font = theme.fontSmall;
      ctx.fillStyle = data.fromRng ? SCORE_COLORS.orange : SCORE_COLORS.yellow;
      const badge = data.fromRng ? "RNG" : "CACHE";
      ctx.fillText(badge, x + node.width - padding - this.measureText(badge, theme.fontSmall), y + 16);
    }
  }
  // -- Helpers --------------------------------------------------------------
  drawStateIndicator(state, x, y, theme) {
    const ctx = this.ctx;
    const radius = 4;
    let color;
    switch (state) {
      case "complete":
        color = SCORE_COLORS.green;
        break;
      case "streaming":
        color = theme.accent;
        break;
      case "error":
        color = SCORE_COLORS.red;
        break;
      default:
        color = theme.nodeBorder;
        break;
    }
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  drawRoundedRect(x, y, w, h, r, fill, stroke, lineWidth) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  drawRoundedRectFill(x, y, w, h, r) {
    if (w <= 0) return;
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.roundRect(x, y, Math.max(w, r * 2), h, r);
    ctx.fill();
  }
  nodeColor(node, theme) {
    switch (node.kind) {
      case "function":
        return theme.accent;
      case "vector-completion":
        return SCORE_COLORS.green;
      case "llm":
        return SCORE_COLORS.yellow;
    }
  }
  measureText(text, font) {
    const key = `${font}:${text}`;
    let w = this.textCache.get(key);
    if (w === void 0) {
      this.ctx.font = font;
      w = this.ctx.measureText(text).width;
      this.textCache.set(key, w);
      if (this.textCache.size > 500) {
        const firstKey = this.textCache.keys().next().value;
        if (firstKey) this.textCache.delete(firstKey);
      }
    }
    return w;
  }
  /** Clear the text measurement cache. */
  clearTextCache() {
    this.textCache.clear();
  }
};
function truncate(text, maxLen) {
  if (maxLen <= 0 || text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + "\u2026";
}

// src/core/animation.ts
var AnimationController = class {
  constructor() {
    this.transitions = /* @__PURE__ */ new Map();
  }
  /**
   * Schedule transitions by diffing previous and next tree states.
   * - New nodes: enter (fade in from parent position)
   * - Moved nodes: update (slide to new position)
   * - Removed nodes: exit (fade out)
   */
  scheduleTransitions(prevNodes, nextNodes, duration, now = performance.now()) {
    this.cleanup(now);
    if (!prevNodes) {
      for (const node of nextNodes.values()) {
        this.transitions.set(node.id, {
          nodeId: node.id,
          type: "enter",
          startTime: now,
          duration,
          fromX: node.x,
          fromY: node.y,
          fromOpacity: 0,
          toX: node.x,
          toY: node.y,
          toOpacity: 1
        });
      }
      return;
    }
    for (const [id, node] of nextNodes) {
      if (!prevNodes.has(id)) {
        const parent = node.parentId ? nextNodes.get(node.parentId) : null;
        this.transitions.set(id, {
          nodeId: id,
          type: "enter",
          startTime: now,
          duration,
          fromX: parent ? parent.x + parent.width / 2 - node.width / 2 : node.x,
          fromY: parent ? parent.y + parent.height : node.y,
          fromOpacity: 0,
          toX: node.x,
          toY: node.y,
          toOpacity: 1
        });
      }
    }
    for (const [id, node] of nextNodes) {
      const prev = prevNodes.get(id);
      if (prev && (prev.x !== node.x || prev.y !== node.y)) {
        this.transitions.set(id, {
          nodeId: id,
          type: "update",
          startTime: now,
          duration,
          fromX: prev.x,
          fromY: prev.y,
          fromOpacity: 1,
          toX: node.x,
          toY: node.y,
          toOpacity: 1
        });
      }
    }
    for (const [id, node] of prevNodes) {
      if (!nextNodes.has(id)) {
        this.transitions.set(id, {
          nodeId: id,
          type: "exit",
          startTime: now,
          duration,
          fromX: node.x,
          fromY: node.y,
          fromOpacity: 1,
          toX: node.x,
          toY: node.y,
          toOpacity: 0
        });
      }
    }
  }
  /** Get interpolated position/opacity for a node. Returns null if no active transition. */
  getInterpolated(nodeId2, now) {
    const t = this.transitions.get(nodeId2);
    if (!t) return null;
    const elapsed = now - t.startTime;
    const progress = Math.min(elapsed / t.duration, 1);
    const eased = easeOutCubic2(progress);
    return {
      x: lerp2(t.fromX, t.toX, eased),
      y: lerp2(t.fromY, t.toY, eased),
      opacity: lerp2(t.fromOpacity, t.toOpacity, eased)
    };
  }
  /** Are any transitions still active? */
  isAnimating(now = performance.now()) {
    for (const t of this.transitions.values()) {
      if (now - t.startTime < t.duration) return true;
    }
    return false;
  }
  /** Remove completed transitions. */
  cleanup(now) {
    for (const [id, t] of this.transitions) {
      if (now - t.startTime >= t.duration) {
        this.transitions.delete(id);
      }
    }
  }
  /** Clear all transitions. */
  reset() {
    this.transitions.clear();
  }
};
function lerp2(a, b, t) {
  return a + (b - a) * t;
}
function easeOutCubic2(t) {
  return 1 - Math.pow(1 - t, 3);
}

// src/core/interaction.ts
var InteractionHandler = class {
  constructor(canvas, viewport, callbacks) {
    this.canvas = canvas;
    this.viewport = viewport;
    this.callbacks = callbacks;
    this._isDragging = false;
    this._lastX = 0;
    this._lastY = 0;
    this._hoveredNodeId = null;
    // Touch state
    this._touches = /* @__PURE__ */ new Map();
    this._lastPinchDist = 0;
    /** Currently active nodes for hit testing. Set by the engine before rendering. */
    this._nodes = /* @__PURE__ */ new Map();
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onWheel = this._onWheel.bind(this);
    this._onDblClick = this._onDblClick.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    canvas.addEventListener("mousedown", this._onMouseDown);
    canvas.addEventListener("mousemove", this._onMouseMove);
    canvas.addEventListener("mouseup", this._onMouseUp);
    canvas.addEventListener("mouseleave", this._onMouseUp);
    canvas.addEventListener("wheel", this._onWheel, { passive: false });
    canvas.addEventListener("dblclick", this._onDblClick);
    canvas.addEventListener("touchstart", this._onTouchStart);
    canvas.addEventListener("touchmove", this._onTouchMove);
    canvas.addEventListener("touchend", this._onTouchEnd);
  }
  setNodes(nodes) {
    this._nodes = nodes;
  }
  /** Hit test: find the topmost node at screen coordinates. */
  hitTest(screenX, screenY) {
    const world = this.viewport.screenToWorld(screenX, screenY);
    const entries = Array.from(this._nodes.values()).reverse();
    for (const node of entries) {
      if (world.x >= node.x && world.x <= node.x + node.width && world.y >= node.y && world.y <= node.y + node.height) {
        return node;
      }
    }
    return null;
  }
  // -- Mouse handlers -------------------------------------------------------
  _onMouseDown(e) {
    if (e.button !== 0) return;
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const hit = this.hitTest(sx, sy);
    if (hit) {
      this.callbacks.onNodeClick?.(hit);
      return;
    }
    this._isDragging = true;
    this._lastX = e.clientX;
    this._lastY = e.clientY;
    this.canvas.style.cursor = "grabbing";
  }
  _onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    if (this._isDragging) {
      const dx = e.clientX - this._lastX;
      const dy = e.clientY - this._lastY;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      this.viewport.pan(dx, dy);
      this.callbacks.onViewportChange?.();
      return;
    }
    const hit = this.hitTest(sx, sy);
    const hitId = hit?.id ?? null;
    if (hitId !== this._hoveredNodeId) {
      this._hoveredNodeId = hitId;
      this.canvas.style.cursor = hit ? "pointer" : "grab";
      this.callbacks.onNodeHover?.(hit);
    }
  }
  _onMouseUp(_e) {
    if (this._isDragging) {
      this._isDragging = false;
      this.canvas.style.cursor = "grab";
    }
  }
  _onWheel(e) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const delta = -e.deltaY * 1e-3;
    this.viewport.zoomAt(delta, sx, sy);
    this.callbacks.onViewportChange?.();
  }
  _onDblClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const hit = this.hitTest(sx, sy);
    if (hit) {
      this.viewport.animateTo({
        panX: hit.x + hit.width / 2 - this.canvas.width / (2 * 1.5),
        panY: hit.y - 20,
        zoom: 1.5
      });
      this.callbacks.onViewportChange?.();
    }
  }
  // -- Touch handlers -------------------------------------------------------
  _onTouchStart(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      this._touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
    }
    if (this._touches.size === 1) {
      const t = Array.from(this._touches.values())[0];
      this._lastX = t.x;
      this._lastY = t.y;
      this._isDragging = false;
    } else if (this._touches.size === 2) {
      e.preventDefault();
      this._isDragging = false;
      const pts = Array.from(this._touches.values());
      this._lastPinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
    }
  }
  _onTouchMove(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      this._touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
    }
    if (this._touches.size === 1 && this._isDragging) {
      const t = Array.from(this._touches.values())[0];
      const dx = t.x - this._lastX;
      const dy = t.y - this._lastY;
      this._lastX = t.x;
      this._lastY = t.y;
      this.viewport.pan(dx, dy);
      this.callbacks.onViewportChange?.();
    } else if (this._touches.size === 2) {
      const pts = Array.from(this._touches.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      if (this._lastPinchDist > 0) {
        const delta = (dist - this._lastPinchDist) * 5e-3;
        const cx = (pts[0].x + pts[1].x) / 2;
        const cy = (pts[0].y + pts[1].y) / 2;
        const rect = this.canvas.getBoundingClientRect();
        this.viewport.zoomAt(delta, cx - rect.left, cy - rect.top);
        this.callbacks.onViewportChange?.();
      }
      this._lastPinchDist = dist;
    }
  }
  _onTouchEnd(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      this._touches.delete(e.changedTouches[i].identifier);
    }
    if (this._touches.size === 0) {
      this._isDragging = false;
    } else if (this._touches.size === 1) {
      const t = Array.from(this._touches.values())[0];
      this._lastX = t.x;
      this._lastY = t.y;
      this._isDragging = true;
    }
  }
  // -- Cleanup --------------------------------------------------------------
  destroy() {
    this.canvas.removeEventListener("mousedown", this._onMouseDown);
    this.canvas.removeEventListener("mousemove", this._onMouseMove);
    this.canvas.removeEventListener("mouseup", this._onMouseUp);
    this.canvas.removeEventListener("mouseleave", this._onMouseUp);
    this.canvas.removeEventListener("wheel", this._onWheel);
    this.canvas.removeEventListener("dblclick", this._onDblClick);
    this.canvas.removeEventListener("touchstart", this._onTouchStart);
    this.canvas.removeEventListener("touchmove", this._onTouchMove);
    this.canvas.removeEventListener("touchend", this._onTouchEnd);
  }
};

// src/core/engine.ts
var FunctionTreeEngine = class {
  constructor(canvas, config) {
    this.treeData = null;
    this.prevNodes = null;
    this.selectedId = null;
    this.hoveredId = null;
    this.rafId = null;
    this.needsRender = false;
    this.destroyed = false;
    this.hasInitialFit = false;
    // Layout debouncing
    this.layoutTimer = null;
    this.layoutPending = false;
    // Callbacks
    this.onNodeClick = null;
    this.onNodeHover = null;
    this.onSelectedNodeChange = null;
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D rendering context");
    this.ctx = ctx;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.theme = resolveTheme(this.config.theme);
    this.viewport = new Viewport(this.config.minZoom, this.config.maxZoom);
    this.renderer = new TreeRenderer(this.ctx);
    this.animation = new AnimationController();
    this.interaction = new InteractionHandler(canvas, this.viewport, {
      onNodeClick: (node) => {
        this.selectedId = this.selectedId === node.id ? null : node.id;
        this.onNodeClick?.(node);
        this.onSelectedNodeChange?.(
          this.selectedId ? this.treeData?.nodes.get(this.selectedId) ?? null : null
        );
        this.requestRender();
      },
      onNodeHover: (node) => {
        this.hoveredId = node?.id ?? null;
        this.onNodeHover?.(node);
        this.requestRender();
      },
      onViewportChange: () => {
        this.requestRender();
      }
    });
    canvas.style.cursor = "grab";
  }
  // -- Public API -----------------------------------------------------------
  /** Update the tree data. Call on each streaming chunk or complete result. */
  setData(data, modelNames) {
    if (this.destroyed) return;
    const newTree = buildTree(data);
    if (!newTree) {
      this.treeData = null;
      this.prevNodes = null;
      this.hasInitialFit = false;
      this.requestRender();
      return;
    }
    this.treeData = newTree;
    this.scheduleLayout();
  }
  /** Update config (e.g., theme change). */
  setConfig(config) {
    this.config = { ...this.config, ...config };
    this.theme = resolveTheme(this.config.theme);
    if (this.treeData) {
      layoutTree(this.treeData, this.config);
    }
    this.requestRender();
  }
  /** Resize the canvas (call from ResizeObserver). */
  resize(width, height) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(dpr, dpr);
    this.requestRender();
  }
  /** Zoom in by a fixed step. */
  zoomIn() {
    this.viewport.zoomAt(
      0.3,
      this.canvas.clientWidth / 2,
      this.canvas.clientHeight / 2
    );
    this.requestRender();
  }
  /** Zoom out by a fixed step. */
  zoomOut() {
    this.viewport.zoomAt(
      -0.3,
      this.canvas.clientWidth / 2,
      this.canvas.clientHeight / 2
    );
    this.requestRender();
  }
  /** Fit the entire tree in view. */
  fitToContent() {
    if (!this.treeData) return;
    this.viewport.fitToContent(
      this.treeData.nodes,
      this.canvas.clientWidth,
      this.canvas.clientHeight
    );
    this.requestRender();
  }
  /** Zoom to focus on a specific node. */
  zoomToNode(nodeId2) {
    const node = this.treeData?.nodes.get(nodeId2);
    if (!node) return;
    this.viewport.animateTo({
      panX: node.x + node.width / 2 - this.canvas.clientWidth / 2,
      panY: node.y - 20,
      zoom: 1.2
    });
    this.startRenderLoop();
  }
  /** Get the currently selected node. */
  getSelectedNode() {
    if (!this.selectedId || !this.treeData) return null;
    return this.treeData.nodes.get(this.selectedId) ?? null;
  }
  /** Deselect the current node. */
  deselect() {
    this.selectedId = null;
    this.onSelectedNodeChange?.(null);
    this.requestRender();
  }
  /** Clean up all resources. */
  destroy() {
    this.destroyed = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.layoutTimer !== null) {
      clearTimeout(this.layoutTimer);
      this.layoutTimer = null;
    }
    this.interaction.destroy();
    this.animation.reset();
  }
  // -- Internal -------------------------------------------------------------
  scheduleLayout() {
    if (!this.treeData) return;
    if (this.layoutTimer !== null) {
      this.layoutPending = true;
      return;
    }
    this.executeLayout();
    this.layoutTimer = setTimeout(() => {
      this.layoutTimer = null;
      if (this.layoutPending) {
        this.layoutPending = false;
        this.executeLayout();
      }
    }, 333);
  }
  executeLayout() {
    if (!this.treeData) return;
    layoutTree(this.treeData, this.config);
    if (this.config.animate) {
      this.animation.scheduleTransitions(
        this.prevNodes,
        this.treeData.nodes,
        this.config.animationDuration
      );
    }
    this.interaction.setNodes(this.treeData.nodes);
    this.prevNodes = new Map(this.treeData.nodes);
    if (!this.hasInitialFit) {
      this.hasInitialFit = true;
      this.viewport.fitToContent(
        this.treeData.nodes,
        this.canvas.clientWidth,
        this.canvas.clientHeight
      );
    }
    this.startRenderLoop();
  }
  requestRender() {
    this.needsRender = true;
    if (this.rafId === null) {
      this.startRenderLoop();
    }
  }
  startRenderLoop() {
    if (this.rafId !== null || this.destroyed) return;
    const loop = () => {
      if (this.destroyed) return;
      const now = performance.now();
      const viewportAnimating = this.viewport.tick(now);
      const nodesAnimating = this.animation.isAnimating(now);
      this.renderFrame();
      if (viewportAnimating || nodesAnimating || this.needsRender) {
        this.needsRender = false;
        this.rafId = requestAnimationFrame(loop);
      } else {
        this.rafId = null;
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }
  renderFrame() {
    if (!this.treeData) {
      this.ctx.resetTransform();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = this.theme.bg;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }
    const lod = getLodLevel(this.viewport.zoom);
    this.renderer.render(
      this.treeData.nodes,
      this.treeData.rootId,
      this.viewport,
      this.theme,
      lod,
      this.config.animate ? this.animation : null,
      this.selectedId,
      this.hoveredId,
      this.canvas.clientWidth,
      this.canvas.clientHeight
    );
  }
};

// src/react/use-engine.ts
function useEngine(options) {
  const canvasRef = react.useRef(null);
  const containerRef = react.useRef(null);
  const engineRef = react.useRef(null);
  const selectedNodeRef = react.useRef(null);
  react.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new FunctionTreeEngine(canvas, options.config);
    engineRef.current = engine;
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      engine.resize(rect.width, rect.height);
    }
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);
  react.useEffect(() => {
    const container = containerRef.current;
    const engine = engineRef.current;
    if (!container || !engine) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          engine.resize(width, height);
        }
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  react.useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setData(options.data, options.modelNames);
  }, [options.data, options.modelNames]);
  react.useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !options.config) return;
    engine.setConfig(options.config);
  }, [options.config]);
  react.useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.onNodeClick = options.onNodeClick ?? null;
    engine.onNodeHover = options.onNodeHover ?? null;
    engine.onSelectedNodeChange = (node) => {
      selectedNodeRef.current = node;
    };
  }, [options.onNodeClick, options.onNodeHover]);
  const zoomIn = react.useCallback(() => engineRef.current?.zoomIn(), []);
  const zoomOut = react.useCallback(() => engineRef.current?.zoomOut(), []);
  const fitToContent = react.useCallback(() => engineRef.current?.fitToContent(), []);
  const deselect = react.useCallback(() => engineRef.current?.deselect(), []);
  return {
    canvasRef,
    containerRef,
    engine: engineRef.current,
    selectedNode: selectedNodeRef.current,
    zoomIn,
    zoomOut,
    fitToContent,
    deselect
  };
}
function Controls({ onZoomIn, onZoomOut, onFitToContent }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ft-controls", children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        className: "ft-control-btn",
        onClick: onZoomIn,
        title: "Zoom in",
        "aria-label": "Zoom in",
        children: /* @__PURE__ */ jsxRuntime.jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M8 3v10M3 8h10", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) })
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        className: "ft-control-btn",
        onClick: onZoomOut,
        title: "Zoom out",
        "aria-label": "Zoom out",
        children: /* @__PURE__ */ jsxRuntime.jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M3 8h10", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) })
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        className: "ft-control-btn",
        onClick: onFitToContent,
        title: "Fit to content",
        "aria-label": "Fit to content",
        children: /* @__PURE__ */ jsxRuntime.jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) })
      }
    )
  ] });
}
function DetailPanel({ node, modelNames, onClose }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ft-detail-panel", role: "dialog", "aria-label": "Node details", children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ft-detail-header", children: [
      /* @__PURE__ */ jsxRuntime.jsx("span", { className: "ft-detail-kind", children: kindLabel(node.kind) }),
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          className: "ft-detail-close",
          onClick: onClose,
          "aria-label": "Close",
          children: "\xD7"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "ft-detail-title", children: node.label }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ft-detail-state", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "span",
        {
          className: "ft-detail-state-dot",
          style: { background: stateColor(node.state) }
        }
      ),
      node.state
    ] }),
    node.data.kind === "function" && /* @__PURE__ */ jsxRuntime.jsx(FunctionDetails, { data: node.data }),
    node.data.kind === "vector-completion" && /* @__PURE__ */ jsxRuntime.jsx(VectorCompletionDetails, { data: node.data, modelNames }),
    node.data.kind === "llm" && /* @__PURE__ */ jsxRuntime.jsx(LlmDetails, { data: node.data, modelNames })
  ] });
}
function FunctionDetails({ data }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ft-detail-body", children: [
    data.functionId && /* @__PURE__ */ jsxRuntime.jsx(DetailRow, { label: "Function", value: data.functionId }),
    data.profileId && /* @__PURE__ */ jsxRuntime.jsx(DetailRow, { label: "Profile", value: data.profileId }),
    /* @__PURE__ */ jsxRuntime.jsx(DetailRow, { label: "Tasks", value: String(data.taskCount) }),
    data.output !== null && /* @__PURE__ */ jsxRuntime.jsx(
      DetailRow,
      {
        label: "Output",
        value: formatOutput(data.output),
        valueColor: typeof data.output === "number" ? scoreColor(data.output) : void 0
      }
    ),
    data.error && /* @__PURE__ */ jsxRuntime.jsx(DetailRow, { label: "Error", value: data.error, valueColor: "rgb(239, 68, 68)" })
  ] });
}
function VectorCompletionDetails({
  data,
  modelNames
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ft-detail-body", children: [
    /* @__PURE__ */ jsxRuntime.jsx(DetailRow, { label: "Task Index", value: data.taskPath.join(" > ") }),
    /* @__PURE__ */ jsxRuntime.jsx(DetailRow, { label: "LLMs", value: String(data.voteCount) }),
    data.scores && data.scores.length > 0 && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ft-detail-scores", children: [
      /* @__PURE__ */ jsxRuntime.jsx("span", { className: "ft-detail-label", children: "Scores" }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "ft-detail-score-bars", children: data.scores.map((score, i) => /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ft-detail-score-bar", children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            className: "ft-detail-score-fill",
            style: {
              width: `${score * 100}%`,
              background: scoreColor(score)
            }
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "ft-detail-score-label", children: [
          (score * 100).toFixed(1),
          "%"
        ] })
      ] }, i)) })
    ] }),
    data.votes && data.votes.length > 0 && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ft-detail-votes", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "ft-detail-label", children: [
        "Vote Breakdown (",
        data.votes.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "ft-detail-vote-list", children: data.votes.map((vote, i) => {
        const name = modelNames?.[vote.model] ? modelNames[vote.model].split("/").pop() ?? vote.model.slice(0, 8) : vote.model.slice(0, 8);
        const maxVote = vote.vote.length > 0 ? Math.max(...vote.vote) : 0;
        return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ft-detail-vote-item", children: [
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ft-detail-vote-header", children: [
            /* @__PURE__ */ jsxRuntime.jsx("span", { className: "ft-detail-vote-name", children: name }),
            /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "ft-detail-vote-weight", children: [
              "w=",
              vote.weight.toFixed(2)
            ] })
          ] }),
          (vote.from_cache || vote.from_rng) && /* @__PURE__ */ jsxRuntime.jsx("span", { className: `ft-detail-vote-badge${vote.from_rng ? " ft-detail-vote-badge-rng" : ""}`, children: vote.from_rng ? "RNG" : "CACHE" }),
          vote.vote.length > 0 && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "ft-detail-score-bar", style: { height: 14, marginTop: 2 }, children: /* @__PURE__ */ jsxRuntime.jsx(
            "div",
            {
              className: "ft-detail-score-fill",
              style: {
                width: `${maxVote * 100}%`,
                background: scoreColor(maxVote)
              }
            }
          ) })
        ] }, i);
      }) })
    ] }),
    data.error && /* @__PURE__ */ jsxRuntime.jsx(DetailRow, { label: "Error", value: data.error, valueColor: "rgb(239, 68, 68)" })
  ] });
}
function LlmDetails({
  data,
  modelNames
}) {
  const resolvedName = modelNames?.[data.modelId] ?? data.modelName;
  data.vote ? Math.max(...data.vote) : 0;
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ft-detail-body", children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      DetailRow,
      {
        label: "Model",
        value: resolvedName ?? data.modelId
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx(DetailRow, { label: "Weight", value: data.weight.toFixed(3) }),
    data.fromCache && /* @__PURE__ */ jsxRuntime.jsx(DetailRow, { label: "Source", value: "Cached" }),
    data.fromRng && /* @__PURE__ */ jsxRuntime.jsx(DetailRow, { label: "Source", value: "RNG (simulated)" }),
    data.vote && data.vote.length > 0 && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ft-detail-scores", children: [
      /* @__PURE__ */ jsxRuntime.jsx("span", { className: "ft-detail-label", children: "Vote Distribution" }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "ft-detail-score-bars", children: data.vote.map((v, i) => /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ft-detail-score-bar", children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            className: "ft-detail-score-fill",
            style: {
              width: `${v * 100}%`,
              background: scoreColor(v)
            }
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "ft-detail-score-label", children: [
          (v * 100).toFixed(1),
          "%"
        ] })
      ] }, i)) })
    ] }),
    data.streamingText && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ft-detail-text", children: [
      /* @__PURE__ */ jsxRuntime.jsx("span", { className: "ft-detail-label", children: "Reasoning" }),
      /* @__PURE__ */ jsxRuntime.jsx("pre", { className: "ft-detail-pre", children: data.streamingText })
    ] })
  ] });
}
function DetailRow({
  label,
  value,
  valueColor
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ft-detail-row", children: [
    /* @__PURE__ */ jsxRuntime.jsx("span", { className: "ft-detail-label", children: label }),
    /* @__PURE__ */ jsxRuntime.jsx("span", { className: "ft-detail-value", style: valueColor ? { color: valueColor } : void 0, children: value })
  ] });
}
function kindLabel(kind) {
  switch (kind) {
    case "function":
      return "Function";
    case "vector-completion":
      return "Vector Completion";
    case "llm":
      return "LLM";
    default:
      return kind;
  }
}
function stateColor(state) {
  switch (state) {
    case "complete":
      return "rgb(34, 197, 94)";
    case "streaming":
      return "#6B5CFF";
    case "error":
      return "rgb(239, 68, 68)";
    default:
      return "#B0B0BE";
  }
}
function formatOutput(output) {
  if (typeof output === "number") {
    return `${(output * 100).toFixed(1)}%`;
  }
  return `[${output.map((v) => v.toFixed(3)).join(", ")}]`;
}
function FunctionTree({
  data,
  modelNames,
  config,
  onNodeClick,
  onNodeHover,
  width = "100%",
  height = 400,
  className
}) {
  const [selectedNode, setSelectedNode] = react.useState(null);
  const handleNodeClick = react.useCallback(
    (node) => {
      setSelectedNode((prev) => prev?.id === node.id ? null : node);
      onNodeClick?.(node);
    },
    [onNodeClick]
  );
  const {
    canvasRef,
    containerRef,
    zoomIn,
    zoomOut,
    fitToContent,
    deselect
  } = useEngine({
    data,
    modelNames,
    config,
    onNodeClick: handleNodeClick,
    onNodeHover
  });
  react.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && selectedNode) {
        setSelectedNode(null);
        deselect();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNode, deselect]);
  const containerStyle = {
    position: "relative",
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    overflow: "hidden",
    borderRadius: 8,
    border: "1px solid var(--ft-border, #D1D1D9)",
    background: "var(--ft-bg, #EDEDF2)"
  };
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      ref: containerRef,
      className: `ft-container${className ? ` ${className}` : ""}`,
      style: containerStyle,
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "canvas",
          {
            ref: canvasRef,
            style: {
              display: "block",
              width: "100%",
              height: "100%"
            }
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          Controls,
          {
            onZoomIn: zoomIn,
            onZoomOut: zoomOut,
            onFitToContent: fitToContent
          }
        ),
        selectedNode && /* @__PURE__ */ jsxRuntime.jsx(
          DetailPanel,
          {
            node: selectedNode,
            modelNames,
            onClose: () => {
              setSelectedNode(null);
              deselect();
            }
          }
        ),
        !data && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "ft-empty", children: /* @__PURE__ */ jsxRuntime.jsx("span", { className: "ft-empty-text", children: "Execute a function to see the tree" }) })
      ]
    }
  );
}

exports.DEFAULT_CONFIG = DEFAULT_CONFIG;
exports.FunctionTree = FunctionTree;
exports.FunctionTreeEngine = FunctionTreeEngine;
exports.NODE_SIZES = NODE_SIZES;
exports.SCORE_COLORS = SCORE_COLORS;
exports.Viewport = Viewport;
exports.buildTree = buildTree;
exports.layoutTree = layoutTree;
exports.scoreColor = scoreColor;
exports.treeBounds = treeBounds;
