// Function assets
import functionDescription from "../assets/function/description.json.txt";
import functionInputMaps from "../assets/function/input_maps.json.txt";
import functionInputMerge from "../assets/function/input_merge.json.txt";
import functionInputSchema from "../assets/function/input_schema.json.txt";
import functionInputSplit from "../assets/function/input_split.json.txt";
import functionOutput from "../assets/function/output.json.txt";
import functionOutputLength from "../assets/function/output_length.json.txt";
import functionTasks from "../assets/function/tasks.json.txt";
import functionType from "../assets/function/type.json.txt";

// GitHub assets
import githubDescription from "../assets/github/description.json.txt";
import githubName from "../assets/github/name.json.txt";

// Root assets
import gitignore from "../assets/.gitignore.txt";
import buildTs from "../assets/build.ts.txt";
import packageJson from "../assets/package.json.txt";
import readmeMd from "../assets/README.md.txt";
import tsconfigJson from "../assets/tsconfig.json.txt";

// GitHub issue assets
import fetchOpenIssuesTs from "../assets/fetchOpenIssues.ts.txt";
import fetchClosedIssuesTs from "../assets/fetchClosedIssues.ts.txt";
import commentOnIssueTs from "../assets/commentOnIssue.ts.txt";
import closeIssueTs from "../assets/closeIssue.ts.txt";
import commitAndPushTs from "../assets/commitAndPush.ts.txt";

// Agent spawning assets
import spawnFunctionAgentsTs from "../assets/spawnFunctionAgents.ts.txt";
import cloneSubFunctionsTs from "../assets/cloneSubFunctions.ts.txt";
import getSubFunctionCommitsTs from "../assets/getSubFunctionCommits.ts.txt";

// Plans assets
import plansGitkeep from "../assets/plans/.gitkeep.txt";

// Logs assets
import logsGitkeep from "../assets/logs/.gitkeep.txt";

// Sub-functions assets
import subFunctionsGitignore from "../assets/sub_functions/.gitignore.txt";

// Inputs asset
import inputsJson from "../assets/inputs.json.txt";

export const assets: Record<string, string> = {
  "function/description.json": functionDescription,
  "function/input_maps.json": functionInputMaps,
  "function/input_merge.json": functionInputMerge,
  "function/input_schema.json": functionInputSchema,
  "function/input_split.json": functionInputSplit,
  "function/output.json": functionOutput,
  "function/output_length.json": functionOutputLength,
  "function/tasks.json": functionTasks,
  "function/type.json": functionType,
  "github/description.json": githubDescription,
  "github/name.json": githubName,
  ".gitignore": gitignore,
  "build.ts": buildTs,
  "package.json": packageJson,
  "README.md": readmeMd,
  "tsconfig.json": tsconfigJson,
  "fetchOpenIssues.ts": fetchOpenIssuesTs,
  "fetchClosedIssues.ts": fetchClosedIssuesTs,
  "commentOnIssue.ts": commentOnIssueTs,
  "closeIssue.ts": closeIssueTs,
  "commitAndPush.ts": commitAndPushTs,
  "spawnFunctionAgents.ts": spawnFunctionAgentsTs,
  "cloneSubFunctions.ts": cloneSubFunctionsTs,
  "getSubFunctionCommits.ts": getSubFunctionCommitsTs,
  "plans/.gitkeep": plansGitkeep,
  "logs/.gitkeep": logsGitkeep,
  "sub_functions/.gitignore": subFunctionsGitignore,
  "inputs.json": inputsJson,
};
