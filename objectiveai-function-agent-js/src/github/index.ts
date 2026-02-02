import { execSync } from "child_process";

export interface Issue {
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  labels: { name: string }[];
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  user: { login: string } | null;
}

// Execute gh command and return output
function gh(args: string): string {
  return execSync(`gh ${args}`, { encoding: "utf-8", stdio: "pipe" }).trim();
}

// Get the upstream remote URL (origin)
function getUpstream(): string | null {
  try {
    return execSync("git remote get-url origin", {
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
  } catch {
    return null;
  }
}

// Check if there are any open issues
export function hasOpenIssues(): boolean {
  const upstream = getUpstream();
  if (!upstream) {
    return false;
  }

  try {
    const result = gh("issue list --state open --json number --limit 1");
    const issues = JSON.parse(result);
    return issues.length > 0;
  } catch {
    return false;
  }
}

// Fetch all open issues
export function fetchOpenIssues(): Issue[] {
  const upstream = getUpstream();
  if (!upstream) {
    throw new Error("No upstream remote found. Cannot fetch issues.");
  }

  const result = gh(
    "issue list --state open --json number,title,body,state,labels,createdAt,updatedAt,closedAt,author",
  );
  const raw = JSON.parse(result);

  return raw.map((issue: Record<string, unknown>) => ({
    number: issue.number,
    title: issue.title,
    body: issue.body,
    state: issue.state,
    labels: issue.labels,
    created_at: issue.createdAt,
    updated_at: issue.updatedAt,
    closed_at: issue.closedAt,
    user: issue.author ? { login: (issue.author as { login: string }).login } : null,
  }));
}

// Fetch all closed issues
export function fetchClosedIssues(): Issue[] {
  const upstream = getUpstream();
  if (!upstream) {
    throw new Error("No upstream remote found. Cannot fetch issues.");
  }

  const result = gh(
    "issue list --state closed --json number,title,body,state,labels,createdAt,updatedAt,closedAt,author",
  );
  const raw = JSON.parse(result);

  return raw.map((issue: Record<string, unknown>) => ({
    number: issue.number,
    title: issue.title,
    body: issue.body,
    state: issue.state,
    labels: issue.labels,
    created_at: issue.createdAt,
    updated_at: issue.updatedAt,
    closed_at: issue.closedAt,
    user: issue.author ? { login: (issue.author as { login: string }).login } : null,
  }));
}

// Comment on an issue
export function commentOnIssue(issueNumber: number, comment: string): void {
  const upstream = getUpstream();
  if (!upstream) {
    throw new Error("No upstream remote found. Cannot comment on issue.");
  }

  // Use stdin to pass the comment body to avoid shell escaping issues
  execSync(`gh issue comment ${issueNumber} --body-file -`, {
    input: comment,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

// Close an issue
export function closeIssue(issueNumber: number): void {
  const upstream = getUpstream();
  if (!upstream) {
    throw new Error("No upstream remote found. Cannot close issue.");
  }

  gh(`issue close ${issueNumber}`);
}
