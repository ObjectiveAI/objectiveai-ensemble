export type AgentEvent =
  | { event: "log"; path: string; line: string }
  | { event: "name"; path: string; name: string }
  | { event: "start"; path: string }
  | { event: "done"; path: string };

export function serializeEvent(evt: AgentEvent): string {
  return JSON.stringify(evt);
}

export function parseEvent(line: string): AgentEvent | null {
  try {
    const obj = JSON.parse(line);
    if (typeof obj !== "object" || obj === null) return null;
    if (typeof obj.event !== "string" || typeof obj.path !== "string") return null;
    switch (obj.event) {
      case "log":
        return typeof obj.line === "string" ? obj : null;
      case "name":
        return typeof obj.name === "string" ? obj : null;
      case "start":
      case "done":
        return obj;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function prefixEvent(evt: AgentEvent, prefix: string): AgentEvent {
  const path = evt.path ? `${prefix}/${evt.path}` : prefix;
  return { ...evt, path };
}
