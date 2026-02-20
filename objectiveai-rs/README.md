# ObjectiveAI Rust SDK

[![Crates.io](https://img.shields.io/crates/v/objectiveai.svg)](https://crates.io/crates/objectiveai)
[![Documentation](https://docs.rs/objectiveai/badge.svg)](https://docs.rs/objectiveai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Score everything. Rank everything. Simulate anyone.**

The official Rust SDK for [ObjectiveAI](https://objective-ai.io) - a platform for remote Functions that score, rank, and simulate preferences using ensembles of LLMs.

[Website](https://objective-ai.io) | [Documentation](https://docs.rs/objectiveai) | [GitHub](https://github.com/ObjectiveAI/objectiveai) | [Discord](https://discord.gg/gbNFHensby)

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
objectiveai = "0.1.1"
```

To use as a pure data-structure / validation library without HTTP:

```toml
[dependencies]
objectiveai = { version = "0.1.1", default-features = false }
```

## Features

- **Data structures and validation** for Ensemble LLMs, Ensembles, Functions, and Profiles
- **Deterministic ID computation** using XXHash3-128 (content-addressed identities)
- **Client-side Function compilation** with JMESPath and Starlark expression evaluation
- **HTTP client** with streaming support (optional, enabled by default via the `http` feature)

### Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `http` | ✅ enabled | HTTP client for API requests |

## Quick Start

```rust
use objectiveai::{HttpClient, functions};
use std::env;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let client = HttpClient::from_env()?; // reads OBJECTIVEAI_API_KEY

    let request = serde_json::json!({
        "profile": {
            "tasks": [{ "ensemble": { "llms": [{ "model": "openai/gpt-4o", "count": 3 }] }, "profile": [1, 1, 1] }],
            "profile": [1]
        },
        "input": {
            "company_name": "Acme Corp",
            "what_company_makes": "B2B SaaS for supply chain optimization"
        },
        "from_cache": true
    });

    // Execute a Function from GitHub
    let result = client
        .functions()
        .execute("ObjectiveAI-claude-code-1", "yc-application-scorer", &request)
        .await?;

    println!("Score: {:.1}%", result.output * 100.0);
    Ok(())
}
```

## ID Computation

All Ensemble LLMs, Ensembles, prompts, and response options are **content-addressed** — their IDs are computed deterministically from their definitions using XXHash3-128, encoded as 22-character base62 strings.

```rust
use objectiveai::ensemble_llm::EnsembleLlm;

let llm = EnsembleLlm {
    model: "openai/gpt-4o".to_string(),
    temperature: Some(0.7),
    output_mode: OutputMode::JsonSchema,
    ..Default::default()
};

let id = llm.compute_id(); // same definition → same ID, always
println!("{}", id);        // e.g. "0QMZqudstCDbls4uoQOhEC"
```

## Function Compilation

Preview how a Function's expressions evaluate for a given input before sending to the API:

```rust
use objectiveai::functions::{Function, compile_tasks};

let function: Function = serde_json::from_str(include_str!("function.json"))?;
let input = serde_json::json!({ "text": "This product is amazing!" });

let compiled = compile_tasks(&function, &input)?;
println!("{:#?}", compiled);
```

## License

MIT
