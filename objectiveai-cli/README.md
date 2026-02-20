# ObjectiveAI CLI

[![npm version](https://img.shields.io/npm/v/@objectiveai/cli.svg)](https://www.npmjs.com/package/@objectiveai/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An interactive terminal UI for creating, testing, and deploying ObjectiveAI Functions.

[Website](https://objective-ai.io) | [GitHub](https://github.com/ObjectiveAI/objectiveai) | [Discord](https://discord.gg/gbNFHensby)

## Install

```bash
npm install -g @objectiveai/cli
```

## Usage

```bash
objectiveai
```

The CLI opens an interactive TUI. Type `/` to see available commands.

### Commands

| Command | Description |
|---------|-------------|
| `/invent` | Have an AI agent design and publish a new Function |
| `/config` | Open the configuration panel |

### Inventing a Function

The `/invent` command launches a wizard that asks you to describe what you want the Function to do, then runs an AI agent (ObjectiveAI-claude-code-1) that:

1. Generates a `function.json` definition
2. Tests it via the ObjectiveAI API
3. Publishes it to a GitHub repository

```
❯ /invent

What should this function do?
→ Score a resume for a senior software engineer role

Enter depth (0 = leaf only)
→ 1

Enter minimum width
→ 4

Enter maximum width
→ 6
```

The agent will generate a multi-dimensional scoring function with tasks for each evaluation dimension (technical skills, experience level, communication, etc.) and publish it to GitHub where it becomes immediately executable.

## Configuration

Run `/config` or set environment variables:

| Variable | Description |
|----------|-------------|
| `OBJECTIVEAI_API_KEY` | Your ObjectiveAI API key |
| `GITHUB_TOKEN` | GitHub token for publishing Functions |
| `ANTHROPIC_API_KEY` | Anthropic API key for the invention agent |

Get an ObjectiveAI API key at [objective-ai.io/account/keys](https://objective-ai.io/account/keys).

## What gets created

When you invent a Function, the CLI:

1. Creates a new GitHub repository under your account
2. Pushes a `function.json` to the repository root
3. Executes the Function once to index it on ObjectiveAI
4. Returns the `owner/repo` reference you can use in your code

```typescript
// After inventing "your-org/resume-scorer"
const result = await Functions.Executions.create(client, 'your-org', 'resume-scorer', {
  profile: { ... },
  input: { resume: '...' },
});
```

## Requirements

- Node.js 18+
- An ObjectiveAI API key
- A GitHub token with `repo` scope (for publishing Functions)

## License

MIT
