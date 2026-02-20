# ObjectiveAI JavaScript SDK

[![npm version](https://img.shields.io/npm/v/objectiveai.svg)](https://www.npmjs.com/package/objectiveai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Score everything. Rank everything. Simulate anyone.**

The official JavaScript/TypeScript SDK for [ObjectiveAI](https://objective-ai.io) - a platform for remote Functions that score, rank, and simulate preferences using ensembles of LLMs.

[Website](https://objective-ai.io) | [GitHub](https://github.com/ObjectiveAI/objectiveai) | [Discord](https://discord.gg/gbNFHensby)

## Installation

```bash
npm install objectiveai
```

## Quick Start

```typescript
import { createClient, Functions } from 'objectiveai';

const client = createClient({ apiKey: process.env.OBJECTIVEAI_API_KEY });

// Execute a Function from GitHub
const result = await Functions.Executions.create(
  client,
  'ObjectiveAI-claude-code-1',  // GitHub owner
  'yc-application-scorer',       // GitHub repo
  {
    profile: {
      tasks: [{
        ensemble: { llms: [{ model: 'openai/gpt-4o', count: 3 }] },
        profile: [1, 1, 1],
      }],
      profile: [1],
    },
    input: {
      company_name: 'Acme Corp',
      what_company_makes: 'B2B SaaS for supply chain optimization',
      // ... other fields
    },
    from_cache: true,   // use cached votes in development
  }
);

console.log(`Score: ${(result.output * 100).toFixed(1)}%`);
```

## Features

- **TypeScript-first** with full type definitions and Zod schemas for runtime validation
- **ESM and CommonJS** support
- **Streaming** support for long-running executions
- **WASM bindings** for client-side Ensemble validation and Function compilation
- **Zero dependencies** beyond `zod` and the bundled WASM module

## Key Namespaces

| Namespace | Description |
|-----------|-------------|
| `Chat.Completions` | Direct chat completions with Ensemble LLMs |
| `Vector.Completions` | Vector completions — prompt + responses → scores |
| `Functions` | List and retrieve indexed Functions |
| `Functions.Executions` | Execute Functions with inline or remote Profiles |
| `Functions.Profiles` | List, retrieve, and train Profiles |
| `Ensemble` | List and retrieve Ensembles |
| `EnsembleLlm` | List and retrieve Ensemble LLM configurations |

## Usage Examples

### Chat Completions

```typescript
import { createClient, Chat } from 'objectiveai';

const client = createClient({ apiKey: process.env.OBJECTIVEAI_API_KEY });

const response = await Chat.Completions.create(client, {
  // `model` accepts an inline Ensemble LLM definition or a pre-computed ID string
  model: {
    model: 'openai/gpt-4o',
    temperature: 0.7,
  },
  messages: [
    { role: 'user', content: 'What is the capital of France?' },
  ],
});

console.log(response.choices[0].message.content);
```

### Vector Completions

```typescript
import { createClient, Vector } from 'objectiveai';

const client = createClient({ apiKey: process.env.OBJECTIVEAI_API_KEY });

const result = await Vector.Completions.create(client, {
  ensemble: {
    llms: [
      { model: 'openai/gpt-4o', count: 2, output_mode: 'json_schema' },
      { model: 'anthropic/claude-sonnet-4-20250514', count: 1, output_mode: 'tool_call' },
    ],
  },
  weights: [1, 1, 1],
  messages: [
    { role: 'system', content: 'You are a code reviewer. Select the quality level.' },
    { role: 'user',   content: 'Review this PR: adds null check before dereferencing pointer' },
  ],
  responses: [
    { type: 'text', value: 'Excellent — catches a real bug' },
    { type: 'text', value: 'Good — sensible defensive code' },
    { type: 'text', value: 'Neutral — minor improvement' },
    { type: 'text', value: 'Poor — unnecessary complexity' },
  ],
});

console.log(result.scores); // [0.6, 0.3, 0.1, 0.0]
```

### WASM Validation (client-side)

```typescript
import { validateEnsembleLlm, validateEnsemble } from 'objectiveai';

// Compute content-addressed IDs without a round-trip to the server
const llm = validateEnsembleLlm({
  model: 'openai/gpt-4o',
  temperature: 0.7,
  output_mode: 'json_schema',
});
console.log(llm.id); // deterministic 22-char base62 ID

const ensemble = validateEnsemble({ llms: [llm] });
console.log(ensemble.id);
```

### Streaming Execution

```typescript
const stream = await Functions.Executions.create(client, owner, repo, {
  profile,
  input,
  stream: true,
});

for await (const chunk of stream) {
  // chunks arrive as each task completes
  console.log(chunk);
}
```

## Client Setup

```typescript
// Authenticated (required for completions and executions)
import { createClient } from 'objectiveai';
const client = createClient({ apiKey: process.env.OBJECTIVEAI_API_KEY });

// Unauthenticated (public browse endpoints only)
import { createPublicClient } from 'objectiveai';
const publicClient = createPublicClient();
```

Get an API key at [objective-ai.io/account/keys](https://objective-ai.io/account/keys).

## License

MIT
