import { __export } from './chunk-MLKGABMK.js';
import { execSync } from 'child_process';
import { existsSync, readFileSync, mkdirSync, rmSync } from 'fs';

// src/github/index.ts
var github_exports = {};
__export(github_exports, {
  checkoutSubmodule: () => checkoutSubmodule,
  cloneSubFunctions: () => cloneSubFunctions,
  closeIssue: () => closeIssue,
  commentOnIssue: () => commentOnIssue,
  commitAndPush: () => commitAndPush,
  commitOnly: () => commitOnly,
  createRepository: () => createRepository,
  fetchClosedIssues: () => fetchClosedIssues,
  fetchIssueComments: () => fetchIssueComments,
  fetchOpenIssues: () => fetchOpenIssues,
  getCurrentRevision: () => getCurrentRevision,
  hasOpenIssues: () => hasOpenIssues,
  hasUncommittedChanges: () => hasUncommittedChanges,
  hasUntrackedFiles: () => hasUntrackedFiles,
  markIssueResolved: () => markIssueResolved,
  push: () => push,
  pushOrCreateUpstream: () => pushOrCreateUpstream,
  resetToRevision: () => resetToRevision
});
function gh(args) {
  return execSync(`gh ${args}`, { encoding: "utf-8", stdio: "pipe" }).trim();
}
function getUpstream() {
  try {
    return execSync("git remote get-url origin", {
      encoding: "utf-8",
      stdio: "pipe"
    }).trim();
  } catch {
    return null;
  }
}
function fetchIssueComments(issueNumber) {
  const result = gh(
    `issue view ${issueNumber} --json comments`
  );
  const raw = JSON.parse(result);
  return (raw.comments || []).map((comment) => ({
    body: comment.body,
    created_at: comment.createdAt,
    user: comment.author ? { login: comment.author.login } : null
  }));
}
function hasOpenIssues() {
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
function fetchOpenIssues() {
  const upstream = getUpstream();
  if (!upstream) {
    throw new Error("No upstream remote found. Cannot fetch issues.");
  }
  const result = gh(
    "issue list --state open --json number,title,body,state,labels,createdAt,updatedAt,closedAt,author"
  );
  const raw = JSON.parse(result);
  return raw.map((issue) => ({
    number: issue.number,
    title: issue.title,
    body: issue.body,
    state: issue.state,
    labels: issue.labels,
    created_at: issue.createdAt,
    updated_at: issue.updatedAt,
    closed_at: issue.closedAt,
    user: issue.author ? { login: issue.author.login } : null,
    comments: fetchIssueComments(issue.number)
  }));
}
function fetchClosedIssues() {
  const upstream = getUpstream();
  if (!upstream) {
    throw new Error("No upstream remote found. Cannot fetch issues.");
  }
  const result = gh(
    "issue list --state closed --json number,title,body,state,labels,createdAt,updatedAt,closedAt,author"
  );
  const raw = JSON.parse(result);
  return raw.map((issue) => ({
    number: issue.number,
    title: issue.title,
    body: issue.body,
    state: issue.state,
    labels: issue.labels,
    created_at: issue.createdAt,
    updated_at: issue.updatedAt,
    closed_at: issue.closedAt,
    user: issue.author ? { login: issue.author.login } : null,
    comments: fetchIssueComments(issue.number)
  }));
}
function commentOnIssue(issueNumber, comment) {
  const upstream = getUpstream();
  if (!upstream) {
    throw new Error("No upstream remote found. Cannot comment on issue.");
  }
  execSync(`gh issue comment ${issueNumber} --body-file -`, {
    input: comment,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"]
  });
}
function markIssueResolved(issueNumber) {
  const upstream = getUpstream();
  if (!upstream) {
    throw new Error("No upstream remote found. Cannot mark issue resolved.");
  }
  gh(`issue view ${issueNumber} --json number`);
  return issueNumber;
}
function closeIssue(issueNumber) {
  const upstream = getUpstream();
  if (!upstream) {
    throw new Error("No upstream remote found. Cannot close issue.");
  }
  gh(`issue close ${issueNumber}`);
}
function readStringJsonFile(path) {
  if (!existsSync(path)) {
    return null;
  }
  let content = readFileSync(path, "utf-8").trim();
  if (!content || content === "null") {
    return null;
  }
  if (content.startsWith('"') && content.endsWith('"')) {
    content = content.slice(1, -1);
  }
  return content;
}
function createRepository(options = {}) {
  const name = options.name ?? readStringJsonFile("github/name.json");
  if (!name) {
    throw new Error("Repository name is required. Provide it as option or in github/name.json");
  }
  const description = options.description ?? readStringJsonFile("github/description.json");
  let cmd = `repo create ${name}`;
  if (description) {
    cmd += ` --description "${description.replace(/"/g, '\\"')}"`;
  }
  if (options.public !== false) {
    cmd += " --public";
  } else {
    cmd += " --private";
  }
  cmd += " --source=. --push";
  gh(cmd);
  return getUpstream() ?? `https://github.com/${name}`;
}
function commitAndPush(options) {
  const { message, dryRun = false } = options;
  execSync("git add -A", { stdio: "pipe" });
  try {
    execSync("git diff --cached --quiet", { stdio: "pipe" });
    console.log("No changes to commit.");
    return;
  } catch {
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { stdio: "inherit" });
  }
  if (dryRun) {
    console.log("Dry run: commit created but not pushed.");
    return;
  }
  const upstream = getUpstream();
  if (!upstream) {
    createRepository({
      name: options.name,
      description: options.description
    });
  } else {
    execSync("git push", { stdio: "inherit" });
  }
}
function commitOnly(message) {
  commitAndPush({ message, dryRun: true });
}
function push() {
  const upstream = getUpstream();
  if (!upstream) {
    throw new Error("No upstream remote found. Cannot push.");
  }
  execSync("git push", { stdio: "inherit" });
}
function pushOrCreateUpstream(options = {}) {
  const upstream = getUpstream();
  if (!upstream) {
    createRepository(options);
  } else {
    execSync("git push", { stdio: "inherit" });
  }
}
function getCurrentRevision() {
  try {
    return execSync("git rev-parse HEAD", {
      encoding: "utf-8",
      stdio: "pipe"
    }).trim();
  } catch {
    return null;
  }
}
function resetToRevision(revision) {
  if (revision === null) {
    execSync("git checkout -- .", { stdio: "inherit" });
    execSync("git clean -fd", { stdio: "inherit" });
  } else {
    execSync(`git reset --hard ${revision}`, { stdio: "inherit" });
  }
}
function hasUncommittedChanges() {
  try {
    execSync("git diff --quiet", { stdio: "pipe" });
    execSync("git diff --cached --quiet", { stdio: "pipe" });
    return false;
  } catch {
    return true;
  }
}
function hasUntrackedFiles() {
  const result = execSync("git ls-files --others --exclude-standard", {
    encoding: "utf-8",
    stdio: "pipe"
  }).trim();
  return result.length > 0;
}
function checkoutSubmodule() {
  execSync("git checkout -- objectiveai", { stdio: "inherit" });
}
function getLatestCommit(owner, repository) {
  const result = gh(`api repos/${owner}/${repository}/commits/HEAD --jq .sha`);
  return result.trim();
}
function cloneSubFunctions(options = {}) {
  const { latest = false } = options;
  const tasksPath = "function/tasks.json";
  if (!existsSync(tasksPath)) {
    console.log("No function/tasks.json found.");
    return [];
  }
  const tasks = JSON.parse(readFileSync(tasksPath, "utf-8"));
  const cloned = [];
  for (const task of tasks) {
    if (task.type !== "scalar.function" && task.type !== "vector.function") {
      continue;
    }
    if (!task.owner || !task.repository) {
      console.log(`Skipping task with missing owner/repository: ${JSON.stringify(task)}`);
      continue;
    }
    let commit;
    if (latest) {
      console.log(`Fetching latest commit for ${task.owner}/${task.repository}...`);
      commit = getLatestCommit(task.owner, task.repository);
    } else {
      if (!task.commit) {
        console.log(`Skipping task with missing commit: ${JSON.stringify(task)}`);
        continue;
      }
      commit = task.commit;
    }
    const targetPath = `sub_functions/${task.owner}/${task.repository}/${commit}`;
    if (existsSync(targetPath)) {
      console.log(`Already cloned: ${targetPath}`);
      cloned.push({
        owner: task.owner,
        repository: task.repository,
        commit,
        path: targetPath
      });
      continue;
    }
    mkdirSync(`sub_functions/${task.owner}/${task.repository}`, { recursive: true });
    console.log(`Cloning ${task.owner}/${task.repository}@${commit} to ${targetPath}...`);
    execSync(
      `gh repo clone ${task.owner}/${task.repository} "${targetPath}" -- --depth 1`,
      { stdio: "inherit" }
    );
    execSync(`git -C "${targetPath}" fetch origin ${commit} --depth 1`, { stdio: "inherit" });
    execSync(`git -C "${targetPath}" checkout ${commit}`, { stdio: "inherit" });
    const logsPath = `${targetPath}/logs`;
    if (existsSync(logsPath)) {
      rmSync(logsPath, { recursive: true, force: true });
    }
    cloned.push({
      owner: task.owner,
      repository: task.repository,
      commit,
      path: targetPath
    });
  }
  return cloned;
}

export { checkoutSubmodule, cloneSubFunctions, closeIssue, commentOnIssue, commitAndPush, commitOnly, createRepository, fetchClosedIssues, fetchIssueComments, fetchOpenIssues, getCurrentRevision, github_exports, hasOpenIssues, hasUncommittedChanges, hasUntrackedFiles, markIssueResolved, push, pushOrCreateUpstream, resetToRevision };
