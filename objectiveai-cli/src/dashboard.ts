import { AgentEvent } from "./events";

interface AgentPanel {
  name: string;
  lines: string[];
}

export class Dashboard {
  private panels: Map<string, AgentPanel> = new Map();
  private knownNames: Set<string> = new Set();
  private maxLines: number;
  private dirty = false;
  private renderTimer: ReturnType<typeof setTimeout> | null = null;
  private headerLines: string[] = [];
  private inputBuffer = "";
  private inputEnabled = false;
  private altScreen = false;

  /** Called when the user presses Enter with a non-empty line */
  onInputSubmit?: (line: string) => void;

  constructor(maxLines = 5) {
    this.maxLines = maxLines;
    // Create root panel
    this.panels.set("", { name: "unnamed function", lines: [] });
    // Enter alternate screen buffer
    process.stdout.write("\x1b[?1049h");
    // Hide cursor
    process.stdout.write("\x1b[?25l");
    this.altScreen = true;
  }

  setHeader(lines: string[]): void {
    this.headerLines = lines;
  }

  enableInput(): void {
    this.inputEnabled = true;
    this.scheduleRender();
  }

  setRootName(name: string): void {
    const panel = this.panels.get("");
    if (panel) panel.name = name;
    this.scheduleRender();
  }

  handleEvent(evt: AgentEvent): void {
    switch (evt.event) {
      case "start": {
        if (!this.panels.has(evt.path)) {
          this.panels.set(evt.path, { name: evt.path.split("/").pop()!, lines: [] });
        }
        this.knownNames.add(evt.path.split("/").pop()!);
        break;
      }
      case "name": {
        const panel = this.panels.get(evt.path);
        if (panel) {
          panel.name = evt.name;
        }
        break;
      }
      case "log": {
        let panel = this.panels.get(evt.path);
        if (!panel) {
          panel = { name: evt.path, lines: [] };
          this.panels.set(evt.path, panel);
        }
        // Split multi-line log entries
        const logLines = evt.line.split("\n");
        for (const l of logLines) {
          panel.lines.push(l);
          if (panel.lines.length > this.maxLines) {
            panel.lines.shift();
          }
        }
        break;
      }
      case "done": {
        this.panels.delete(evt.path);
        this.renderNow();
        return;
      }
    }
    this.scheduleRender();
  }

  /** Process raw stdin data. Call this when stdin is in raw mode. */
  handleKeystroke(data: Buffer): void {
    const str = data.toString("utf-8");

    // Skip escape sequences (arrow keys, etc.)
    if (str.charCodeAt(0) === 0x1b) return;

    for (const ch of str) {
      const code = ch.charCodeAt(0);
      if (code === 0x03) {
        // Ctrl+C
        this.dispose();
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        process.exit(0);
      } else if (ch === "\r" || ch === "\n") {
        const line = this.inputBuffer.trim();
        this.inputBuffer = "";
        if (line && this.onInputSubmit) {
          this.onInputSubmit(line);
        }
        this.scheduleRender();
      } else if (code === 0x7f || code === 0x08) {
        // Backspace
        if (this.inputBuffer.length > 0) {
          this.inputBuffer = this.inputBuffer.slice(0, -1);
          this.repaintInputLine();
        }
      } else if (code >= 0x20) {
        // Printable character
        this.inputBuffer += ch;
        this.repaintInputLine();
      }
    }
  }

  /** Repaint only the input line in-place (no full re-render). */
  private repaintInputLine(): void {
    if (!this.inputEnabled) return;
    process.stdout.write(`\r\x1b[2K\x1b[2m>\x1b[0m ${this.inputBuffer}`);
  }

  private scheduleRender(): void {
    this.dirty = true;
    if (this.renderTimer) return;
    this.renderTimer = setTimeout(() => {
      this.renderTimer = null;
      if (this.dirty) this.renderNow();
    }, 50);
  }

  /** Check if path is the last sibling among sorted non-root paths */
  private isLastSibling(path: string, index: number, sortedPaths: string[]): boolean {
    const segments = path.split("/");
    const depth = segments.length;
    const parentPrefix = depth === 1 ? "" : segments.slice(0, depth - 1).join("/");

    for (let j = index + 1; j < sortedPaths.length; j++) {
      const otherSegs = sortedPaths[j].split("/");
      if (otherSegs.length < depth) continue;
      const otherParent = depth === 1 ? "" : otherSegs.slice(0, depth - 1).join("/");
      if (otherParent === parentPrefix && otherSegs[depth - 1] !== segments[depth - 1]) {
        return false;
      }
    }
    return true;
  }

  private renderNow(): void {
    this.dirty = false;

    const out: string[] = [];

    // Header
    for (const line of this.headerLines) {
      out.push(line);
    }

    // Root panel
    const root = this.panels.get("");
    if (root) {
      out.push(`\x1b[1m${root.name}\x1b[0m`);
      for (const l of root.lines) {
        out.push(`  ${l}`);
      }
    }

    // Children sorted by path
    const sortedPaths = [...this.panels.keys()]
      .filter((p) => p !== "")
      .sort();

    // Track which depth levels have active (non-last) branches
    const active: boolean[] = [];

    for (let i = 0; i < sortedPaths.length; i++) {
      const path = sortedPaths[i];
      const panel = this.panels.get(path)!;
      const depth = path.split("/").length;
      const isLast = this.isLastSibling(path, i, sortedPaths);

      // Trim active stack to this panel's parent depth
      active.length = depth - 1;

      // Separator line: show active ancestor branches
      const sepChars = active.map((a) => (a ? "│ " : "  ")).join("");
      out.push(sepChars.trimEnd());

      // Header line: ancestor bars + connector
      let hPfx = active.map((a) => (a ? "│ " : "  ")).join("");
      hPfx += isLast ? "└─ " : "├─ ";
      out.push(`${hPfx}\x1b[1m${panel.name}\x1b[0m`);

      // Update active: this depth is active if not last
      active.push(!isLast);

      // Content lines: ancestor bars + continuation
      const cPfx = active.map((a) => (a ? "│ " : "  ")).join("") + " ";
      for (const l of panel.lines) {
        out.push(`${cPfx}${l}`);
      }
    }

    // Input bar at the bottom
    if (this.inputEnabled) {
      out.push("");
      out.push(`\x1b[2m>\x1b[0m ${this.inputBuffer}`);
    }

    const output = out.join("\n");

    // Move cursor to top-left and clear screen
    process.stdout.write("\x1b[H\x1b[0J");
    process.stdout.write(output);

    // Show cursor only on the input line
    if (this.inputEnabled) {
      process.stdout.write("\x1b[?25h");
    }
  }

  findPathByName(name: string): string | undefined {
    for (const [path] of this.panels) {
      if (!path) continue;
      const lastSegment = path.split("/").pop()!;
      if (lastSegment === name) return path;
    }
    return undefined;
  }

  isKnownName(name: string): boolean {
    return this.knownNames.has(name);
  }

  dispose(): void {
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
      this.renderTimer = null;
    }
    // Show cursor
    process.stdout.write("\x1b[?25h");
    // Leave alternate screen buffer
    if (this.altScreen) {
      process.stdout.write("\x1b[?1049l");
      this.altScreen = false;
    }
  }
}
