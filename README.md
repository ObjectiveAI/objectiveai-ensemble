# {ai} | ObjectiveAI

[![npm version](https://img.shields.io/npm/v/objectiveai.svg)](https://www.npmjs.com/package/objectiveai)
[![Crates.io](https://img.shields.io/crates/v/objectiveai.svg)](https://crates.io/crates/objectiveai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/badge/Discord-join-5865F2?logo=discord&logoColor=white)](https://discord.gg/gbNFHensby)

## Score everything. Rank everything. Simulate anyone.

ObjectiveAI is a platform for **Functions** — composable scoring and ranking pipelines powered by ensembles of LLMs. Instead of asking one model and hoping for the best, multiple LLMs vote together and their votes are combined with learned weights to produce calibrated numeric scores.

[Website](https://objective-ai.io) | [API Docs](https://api.objective-ai.io) | [Discord](https://discord.gg/gbNFHensby) | [npm](https://www.npmjs.com/package/objectiveai) | [crates.io](https://crates.io/crates/objectiveai)

## Why ObjectiveAI?

Most LLM pipelines ask one model a question and treat the text output as truth. This is fragile:

- Outputs vary by model, prompt, and temperature
- No calibrated confidence — just "the answer"
- No way to learn which models are actually reliable for your task

ObjectiveAI treats LLM outputs as **votes** — the same way random forests aggregate trees or boosting aggregates weak learners. The result is a numeric score you can trust, train, and improve over time.

```
Traditional:   Model → "This is good"          (subjective, not comparable)
ObjectiveAI:   Ensemble → score: 0.87          (numeric, calibrated, trainable)
```

## Use cases

- **Content moderation** — score toxicity, spam, or policy violations across millions of items
- **Hiring** — rank candidates by fit for a role, scored by an ensemble trained on your past hires
- **Search ranking** — rerank results by relevance to a query using learned preferences
- **Code review** — score pull requests for quality, security, or adherence to standards
- **Support triage** — classify and prioritize tickets by urgency or topic
- **Recommendation** — simulate how a specific person or group would rate an item

## Quick Start

### TypeScript

```bash
npm install objectiveai
```

```typescript
import { createClient, Functions } from 'objectiveai';

const client = createClient({ apiKey: process.env.OBJECTIVEAI_API_KEY });

// Execute a community Function from GitHub
const result = await Functions.Executions.create(client, 'ObjectiveAI-claude-code-1', 'yc-application-scorer', {
  profile: {
    tasks: [{ ensemble: { llms: [{ model: 'openai/gpt-4o', count: 3 }] }, profile: [1, 1, 1] }],
    profile: [1],
  },
  input: {
    company_name: 'Acme Corp',
    company_description_short: 'B2B SaaS for supply chain',
    what_company_makes: 'Inventory optimization software for mid-market manufacturers',
    founders: [{ founder_name: 'Jane Doe', founder_title: 'CEO', founder_bio: '10 years in supply chain at Amazon' }],
    who_writes_code: 'Jane writes all the code',
    how_far_along: 'Beta with 5 paying customers',
    how_long_working: '18 months, full-time for 12',
    tech_stack: 'Python, PostgreSQL, React',
    why_this_idea: 'Saw the problem firsthand at Amazon',
    competitors: 'Netsuite, SAP — we focus on mid-market and are 10x easier to integrate',
    how_make_money: 'SaaS subscriptions, $500-$2000/month',
  },
  from_cache: true,   // use cached votes during development
});

console.log(`Score: ${(result.output * 100).toFixed(1)}%`);
// Score: 72.3%
```

### Rust

```bash
cargo add objectiveai
```

```rust
use objectiveai::HttpClient;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let client = HttpClient::from_env()?; // reads OBJECTIVEAI_API_KEY

    let request = serde_json::json!({
        "profile": {
            "tasks": [{ "ensemble": { "llms": [{ "model": "openai/gpt-4o", "count": 3 }] }, "profile": [1, 1, 1] }],
            "profile": [1]
        },
        "input": { "company_name": "Acme Corp", /* ... */ },
        "from_cache": true
    });

    let result = client
        .functions()
        .execute("ObjectiveAI-claude-code-1", "yc-application-scorer", &request)
        .await?;

    println!("Score: {:.1}%", result.output * 100.0);
    Ok(())
}
```

### CLI

```bash
npm install -g @objectiveai/cli

objectiveai
```

Type `/invent` to have an AI agent design and publish a new Function for you.

## How it works

### 1. Ensembles — groups of LLMs that vote together

Each LLM in the ensemble can have its own system prompt, temperature, output mode, and decoding settings. Every definition is content-addressed — the same configuration always produces the same ID.

```json
{
  "llms": [
    {
      "model": "openai/gpt-4o",
      "output_mode": "json_schema",
      "prefix_messages": [
        { "role": "system", "content": "You are a rational skeptic. Prefer logically grounded responses." }
      ],
      "count": 2
    },
    {
      "model": "anthropic/claude-sonnet-4-20250514",
      "output_mode": "tool_call",
      "suffix_messages": [
        { "role": "system", "content": "You are an experienced domain expert. Trust your intuition." }
      ],
      "count": 1
    }
  ]
}
```

### 2. Vector Completions — structured voting

Give the ensemble a prompt and a list of possible responses. Each LLM votes for what it thinks is best, and votes are combined using weights to produce scores.

```
Prompt:    "Rate this job application"
Responses: ["Exceptional", "Strong", "Average", "Weak", "Poor"]

Votes:     GPT-4o #1 → "Strong"
           GPT-4o #2 → "Strong"
           Claude   → "Exceptional"

Scores:    [0.33, 0.67, 0.00, 0.00, 0.00]  (sums to 1)
```

#### Probabilistic Voting via Logprobs

LLMs are probabilistic — the sampler picks one token, discarding the rest of the distribution. ObjectiveAI bypasses the sampler entirely using **logprobs** to capture each model's full preference distribution:

```
Traditional: Model outputs "Strong"  →  loses the 30% signal it had for "Exceptional"
ObjectiveAI: Model vote = [0.30, 0.70, 0.00, 0.00, 0.00]  →  full distribution preserved
```

For large response sets, a prefix tree captures preferences in stages — enabling voting over hundreds of options while staying within logprobs limits.

### 3. Functions — composable scoring pipelines

A **Function** is a `function.json` file hosted on GitHub. It defines a pipeline of Vector Completions that transforms structured input into a score or ranking.

```json
{
  "type": "scalar.function",
  "description": "Score a job application from 0 (reject) to 1 (hire)",
  "tasks": [
    {
      "type": "vector.completion",
      "messages": [
        { "role": "system", "content": "You are a senior hiring manager." },
        { "role": "user",   "content": { "$starlark": "'Evaluate: ' + input['resume']" } }
      ],
      "responses": ["Exceptional", "Strong", "Average", "Weak", "Poor"],
      "output": {
        "$starlark": "output['scores'][0]*1.0 + output['scores'][1]*0.75 + output['scores'][2]*0.5 + output['scores'][3]*0.25"
      }
    }
  ]
}
```

Functions are referenced by `owner/repo` — anyone can publish one:

```
ObjectiveAI-claude-code-1/yc-application-scorer
ObjectiveAI-claude-code-1/code-review-scorer
your-org/custom-hiring-scorer
```

### 4. Profiles — learned weights

ObjectiveAI doesn't fine-tune models. It learns **weights** over a fixed ensemble.

Give it labeled examples (input → expected score). It optimizes weights to minimize loss, producing a **Profile** (`profile.json`) you can version and reuse. Different Profiles on the same Function give different behavior — a "senior engineer" profile and a "product manager" profile can score the same code review differently.

## Concepts

| Concept | Description |
|---------|-------------|
| **Ensemble LLM** | A configured LLM (model + settings). Content-addressed. |
| **Ensemble** | Group of Ensemble LLMs that vote together. Weights-free. |
| **Weights** | Per-model influence factors. Learned from labeled data. |
| **Vector Completion** | Prompt + responses → score distribution (sums to 1) |
| **Function** | Structured input → score. Defined in `function.json` on GitHub. |
| **Profile** | Learned weights for a Function. Defined in `profile.json` on GitHub. |

## Repo structure

```
objectiveai/
├── objectiveai-rs/                 # Rust SDK (core crate: types, validation, HTTP client)
├── objectiveai-api/                # Self-hostable API server (or import as library)
├── objectiveai-rs-wasm-js/         # WASM bindings for browser/Node.js validation
├── objectiveai-js/                 # TypeScript SDK (npm: objectiveai)
├── objectiveai-cli/                # Interactive CLI for inventing and managing Functions
└── objectiveai-web/                # Next.js web interface (objective-ai.io)
```

## Related

- **[ObjectiveAI-claude-code-1](https://github.com/ObjectiveAI-claude-code-1)** — An autonomous Claude Code agent that invents and publishes ObjectiveAI Functions without human intervention.
- **[objective-ai.io/functions](https://objective-ai.io/functions)** — Browse community Functions you can execute today.
- **[Discord](https://discord.gg/gbNFHensby)** — Questions, ideas, and community discussion.

## Contributing

Pull requests are welcome. For larger changes, open an issue first to discuss.

The API server (`objectiveai-api`) can be run locally with a single OpenRouter key — see its [README](objectiveai-api/README.md).

## License

MIT
