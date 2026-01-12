# ObjectiveAI Rust SDK

The official Rust SDK for the [ObjectiveAI](https://objective-ai.io) API.

ObjectiveAI provides a REST API for **scoring, ranking, and simulating preferences** using ensembles of large language models (LLMs).

## Features

The `objectiveai` crate serves multiple purposes:

### 1. Core Data Structures & Validation

- **Ensemble LLM Validation**: Validate and compute deterministic, content-addressed IDs for Ensemble LLMs
- **Ensemble Validation**: Validate and compute deterministic IDs for Ensembles
- **Type Definitions**: Complete type definitions for all ObjectiveAI API objects
  - Chat Completions (messages, tools, responses)
  - Vector Completions (voting, scoring)
  - Functions (tasks, expressions, profiles)
  - Authentication (API keys)

### 2. Client-Side Function Compilation

- **Function Task Compilation**: Compile Function Tasks from expressions with runtime input
  - Evaluates JMESPath expressions against input data
  - Resolves task dependencies and conditionals
  - Handles mapped tasks (parallel execution patterns)
  - Produces executable task definitions ready for API execution

- **Function Output Compilation**: Compile Function Outputs after task execution
  - Evaluates output expressions with input and task results
  - Validates output constraints (scalar bounds, vector normalization)
  - Ensures type safety and correctness

### 3. Full SDK with HTTP Client (Optional)

When compiled with the `http` feature (enabled by default):

- **API Client**: Fully-featured HTTP client for the ObjectiveAI API
- **Streaming Support**: Server-Sent Events (SSE) for real-time responses
- **Authentication**: Built-in API key management
- **Type-Safe Requests**: Compile-time checked API calls

### 4. WebAssembly Support

The companion [`objectiveai-wasm-js`](../objectiveai-wasm-js) crate provides WebAssembly bindings, enabling:

- **Browser-based validation**: Validate Ensemble LLMs and Ensembles client-side
- **Client-side compilation**: Compile Function Tasks and Outputs in the browser
- **Zero server round-trips**: Perform validation and compilation without API calls
- **Instant feedback**: Real-time validation in web UIs

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
objectiveai = "0.1"
```

### Optional Features

- **`http`** (enabled by default): Includes the HTTP client for making API requests
  - Disable with `default-features = false` if you only need data structures and validation

```toml
# Data structures and validation only (no HTTP client)
[dependencies]
objectiveai = { version = "0.1", default-features = false }
```

## Usage Examples

### Validating an Ensemble LLM

```rust
use objectiveai::ensemble_llm::{EnsembleLlmBase, EnsembleLlm};

let llm_base = EnsembleLlmBase {
    model: "gpt-4".to_string(),
    temperature: Some(0.7),
    max_completion_tokens: Some(1000),
    ..Default::default()
};

// Validate and compute ID
let llm: EnsembleLlm = llm_base.try_into()?;
println!("Ensemble LLM ID: {}", llm.id);
```

### Validating an Ensemble

```rust
use objectiveai::ensemble::{EnsembleBase, Ensemble};

let ensemble_base = EnsembleBase {
    llms: vec![
        // ... your Ensemble LLMs with counts and fallbacks
    ],
};

// Validate, deduplicate, and compute ID
let ensemble: Ensemble = ensemble_base.try_into()?;
println!("Ensemble ID: {}", ensemble.id);
```

### Compiling Function Tasks

```rust
use objectiveai::functions::{Function, expression::Input};
use serde_json::json;

// Load a Function definition (from function.json)
let function: Function = serde_json::from_str(&function_json)?;

// Provide input data
let input: Input = json!({
    "text": "This product is amazing!",
    "context": "product review"
});

// Compile tasks with the input
let compiled_tasks = function.compile_tasks(&input)?;

// compiled_tasks are now ready to be executed via the API
```

### Compiling Function Output

```rust
use objectiveai::functions::expression::TaskOutput;

// After executing the tasks and receiving results...
let task_outputs: Vec<Option<TaskOutput>> = vec![
    // ... task execution results
];

// Compile the final output
let compiled_output = function.compile_output(&input, &task_outputs)?;

// Check if output is valid
if compiled_output.valid {
    println!("Function output: {:?}", compiled_output.output);
}
```

### Using the HTTP Client

```rust
use objectiveai::{Client, chat::completions::request::ChatCompletionCreateParams};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create a client with your API key
    let client = Client::new("your-api-key");

    // Create a chat completion request
    let params = ChatCompletionCreateParams {
        model: "gpt-4".to_string(),
        messages: vec![
            // ... your messages
        ],
        ..Default::default()
    };

    // Make the request
    let response = client.chat().completions().create(params).await?;

    println!("{:?}", response);
    Ok(())
}
```

## WebAssembly Usage

The [`objectiveai-wasm-js`](../objectiveai-wasm-js) crate exposes WebAssembly bindings for use in JavaScript/TypeScript:

```javascript
import init, {
  validateEnsembleLlm,
  validateEnsemble,
  compileFunctionTasks,
  compileFunctionOutput
} from 'objectiveai-wasm';

// Initialize WASM module
await init();

// Validate an Ensemble LLM
const llm = validateEnsembleLlm({
  model: "gpt-4",
  temperature: 0.7,
  max_completion_tokens: 1000
});
console.log("Ensemble LLM ID:", llm.id);

// Compile Function Tasks in the browser
const tasks = compileFunctionTasks(functionDef, inputData);

// Compile Function Output in the browser
const output = compileFunctionOutput(functionDef, inputData, taskOutputs);
```

## Key Concepts

### Deterministic IDs

All core objects (Ensemble LLMs, Ensembles, Functions) use **deterministic, content-addressed identifiers**:

- IDs are computed from the complete definition using XXHash3-128
- Identical definitions always produce identical IDs
- IDs can be computed anywhere (server, client, browser, Rust, JS)
- Enables reproducibility and caching

### Client-Side Compilation

Functions use **JMESPath expressions** to define dynamic behavior:

- **Input Maps**: Transform input data into multiple task instances
- **Task Expressions**: Define tasks with conditional execution and mapping
- **Output Expressions**: Compute final results from task outputs

Compilation resolves these expressions **before API execution**, enabling:

- **Validation**: Catch errors before making API calls
- **Optimization**: Reduce API round-trips by resolving logic client-side
- **Transparency**: See exactly what tasks will be executed
- **Efficiency**: Skip unnecessary tasks based on runtime conditions

### Expression System

The expression system uses [JMESPath](https://jmespath.org/) for powerful data transformations:

```json
{
  "$jmespath": "input.items[?score > `5`].name"
}
```

Expressions can:
- Query and filter input data
- Reference task outputs
- Compute conditional values
- Transform data structures

## Architecture

```
objectiveai/
├── objectiveai/              # Main Rust crate (this package)
│   ├── auth/                 # API authentication
│   ├── chat/                 # Chat completion types
│   ├── ensemble/             # Ensemble validation & ID computation
│   ├── ensemble_llm/         # Ensemble LLM validation & ID computation
│   ├── functions/            # Function compilation & execution
│   │   ├── expression/       # JMESPath expression evaluation
│   │   ├── compute_profile/  # Profile computation
│   │   └── executions/       # Function execution tracking
│   ├── vector/               # Vector completion types
│   ├── http/                 # HTTP client (optional feature)
│   └── error.rs              # Error types
│
└── objectiveai-wasm-js/      # WebAssembly bindings
    └── JavaScript/TypeScript browser support
```

## Design Principles

1. **Immutability**: All definitions are immutable once created
2. **Determinism**: Same input always produces same output/ID
3. **Type Safety**: Compile-time checks for correctness
4. **Zero-Copy**: Efficient serialization and deserialization
5. **Optional HTTP**: Use as data structure library or full SDK

## Feature Flags

- **`http`** (default): Include HTTP client and async runtime dependencies
  - Adds `reqwest`, `reqwest-eventsource`, `futures`, `serde_path_to_error`
  - Required for making API calls
  - Disable for data structures and validation only

## Platform Support

- **Rust**: Native support on all platforms (Linux, macOS, Windows)
- **WebAssembly**: Browser support via `objectiveai-wasm-js`
  - Enables validation and compilation in web applications
  - Zero dependency on server for validation logic

## Documentation

- [ObjectiveAI API Documentation](https://api.objective-ai.io)
- [ObjectiveAI Website](https://objective-ai.io)
- [Root README](../../README.md) - Project overview and concepts

## License

MIT

## Contributing

Contributions are welcome! This crate is part of the ObjectiveAI open-source ecosystem.
