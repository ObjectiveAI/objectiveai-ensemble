//! Tests for the function execution client.
//!
//! These tests use mock implementations of all fetcher traits and set
//! `from_rng: true` on all requests to avoid network traffic.

use crate::{chat, ctx, ensemble, ensemble_llm, functions, vector};
use futures::StreamExt;
use indexmap::IndexMap;
use rust_decimal::Decimal;
use std::sync::Arc;

// ============================================================================
// Mock Types
// ============================================================================

/// Mock context extension that provides no BYOK keys.
#[derive(Debug, Clone)]
struct MockContextExt;

#[async_trait::async_trait]
impl ctx::ContextExt for MockContextExt {
    async fn get_byok(
        &self,
        _upstream: chat::completions::upstream::Upstream,
    ) -> Result<Option<String>, objectiveai::error::ResponseError> {
        Ok(None)
    }
}

/// Mock ensemble LLM fetcher that always returns None.
#[derive(Debug, Clone)]
struct MockEnsembleLlmFetcher;

#[async_trait::async_trait]
impl ensemble_llm::fetcher::Fetcher<MockContextExt> for MockEnsembleLlmFetcher {
    async fn fetch(
        &self,
        _ctx: ctx::Context<MockContextExt>,
        _id: &str,
    ) -> Result<
        Option<(objectiveai::ensemble_llm::EnsembleLlm, u64)>,
        objectiveai::error::ResponseError,
    > {
        Ok(None)
    }
}

/// Mock ensemble fetcher that always returns None.
#[derive(Debug, Clone)]
struct MockEnsembleFetcher;

#[async_trait::async_trait]
impl ensemble::fetcher::Fetcher<MockContextExt> for MockEnsembleFetcher {
    async fn fetch(
        &self,
        _ctx: ctx::Context<MockContextExt>,
        _id: &str,
    ) -> Result<
        Option<(objectiveai::ensemble::Ensemble, u64)>,
        objectiveai::error::ResponseError,
    > {
        Ok(None)
    }
}

/// Mock completion votes fetcher that returns None.
#[derive(Debug, Clone)]
struct MockCompletionVotesFetcher;

#[async_trait::async_trait]
impl vector::completions::completion_votes_fetcher::Fetcher<MockContextExt>
    for MockCompletionVotesFetcher
{
    async fn fetch(
        &self,
        _ctx: ctx::Context<MockContextExt>,
        _id: &str,
    ) -> Result<
        Option<Vec<objectiveai::vector::completions::response::Vote>>,
        objectiveai::error::ResponseError,
    > {
        Ok(None)
    }
}

/// Mock cache vote fetcher that returns None.
#[derive(Debug, Clone)]
struct MockCacheVoteFetcher;

#[async_trait::async_trait]
impl vector::completions::cache_vote_fetcher::Fetcher<MockContextExt>
    for MockCacheVoteFetcher
{
    async fn fetch(
        &self,
        _ctx: ctx::Context<MockContextExt>,
        _model: &objectiveai::chat::completions::request::Model,
        _models: Option<&[objectiveai::chat::completions::request::Model]>,
        _messages: &[objectiveai::chat::completions::request::Message],
        _tools: Option<&[objectiveai::chat::completions::request::Tool]>,
        _responses: &[objectiveai::chat::completions::request::RichContent],
    ) -> Result<
        Option<objectiveai::vector::completions::response::Vote>,
        objectiveai::error::ResponseError,
    > {
        Ok(None)
    }
}

/// Mock function fetcher that always returns None.
#[derive(Debug, Clone)]
struct MockFunctionFetcher;

#[async_trait::async_trait]
impl functions::function_fetcher::Fetcher<MockContextExt> for MockFunctionFetcher {
    async fn fetch(
        &self,
        _ctx: ctx::Context<MockContextExt>,
        _owner: &str,
        _repository: &str,
        _commit: Option<&str>,
    ) -> Result<
        Option<objectiveai::functions::response::GetFunction>,
        objectiveai::error::ResponseError,
    > {
        Ok(None)
    }
}

/// Mock profile fetcher that always returns None.
#[derive(Debug, Clone)]
struct MockProfileFetcher;

#[async_trait::async_trait]
impl functions::profile_fetcher::Fetcher<MockContextExt> for MockProfileFetcher {
    async fn fetch(
        &self,
        _ctx: ctx::Context<MockContextExt>,
        _owner: &str,
        _repository: &str,
        _commit: Option<&str>,
    ) -> Result<
        Option<objectiveai::functions::profiles::response::GetProfile>,
        objectiveai::error::ResponseError,
    > {
        Ok(None)
    }
}

/// Mock chat completions usage handler that does nothing.
#[derive(Debug, Clone)]
struct MockChatUsageHandler;

#[async_trait::async_trait]
impl chat::completions::usage_handler::UsageHandler<MockContextExt>
    for MockChatUsageHandler
{
    async fn handle_usage(
        &self,
        _ctx: ctx::Context<MockContextExt>,
        _request: Option<
            Arc<objectiveai::chat::completions::request::ChatCompletionCreateParams>,
        >,
        _response: objectiveai::chat::completions::response::unary::ChatCompletion,
    ) {
        // Do nothing
    }
}

/// Mock vector completions usage handler that does nothing.
#[derive(Debug, Clone)]
struct MockVectorUsageHandler;

#[async_trait::async_trait]
impl vector::completions::usage_handler::UsageHandler<MockContextExt>
    for MockVectorUsageHandler
{
    async fn handle_usage(
        &self,
        _ctx: ctx::Context<MockContextExt>,
        _request: Arc<
            objectiveai::vector::completions::request::VectorCompletionCreateParams,
        >,
        _response: objectiveai::vector::completions::response::unary::VectorCompletion,
    ) {
        // Do nothing
    }
}

/// Mock function execution usage handler that does nothing.
#[derive(Debug, Clone)]
struct MockFunctionUsageHandler;

#[async_trait::async_trait]
impl super::usage_handler::UsageHandler<MockContextExt> for MockFunctionUsageHandler {
    async fn handle_usage(
        &self,
        _ctx: ctx::Context<MockContextExt>,
        _request: Arc<objectiveai::functions::executions::request::Request>,
        _response: objectiveai::functions::executions::response::unary::FunctionExecution,
    ) {
        // Do nothing
    }
}

// ============================================================================
// Type Aliases
// ============================================================================

type TestChatClient = chat::completions::Client<
    MockContextExt,
    MockEnsembleLlmFetcher,
    MockChatUsageHandler,
>;

type TestVectorClient = vector::completions::Client<
    MockContextExt,
    MockEnsembleLlmFetcher,
    MockChatUsageHandler,
    MockEnsembleFetcher,
    MockCompletionVotesFetcher,
    MockCacheVoteFetcher,
    MockVectorUsageHandler,
>;

type TestFunctionClient = super::Client<
    MockContextExt,
    MockEnsembleLlmFetcher,
    MockChatUsageHandler,
    MockEnsembleFetcher,
    MockCompletionVotesFetcher,
    MockCacheVoteFetcher,
    MockVectorUsageHandler,
    MockFunctionFetcher,
    MockProfileFetcher,
    MockFunctionUsageHandler,
>;

// ============================================================================
// Helper Functions
// ============================================================================

/// Creates a test context with mock extension.
fn create_test_context() -> ctx::Context<MockContextExt> {
    ctx::Context::new(Arc::new(MockContextExt), Decimal::ONE)
}

/// Creates a test chat completions client with mock dependencies.
fn create_test_chat_client() -> Arc<TestChatClient> {
    let ensemble_llm_fetcher = Arc::new(
        ensemble_llm::fetcher::CachingFetcher::new(Arc::new(MockEnsembleLlmFetcher)),
    );
    let usage_handler = Arc::new(MockChatUsageHandler);

    // Create OpenRouter client with dummy values (won't be used since from_rng=true)
    let openrouter_client = chat::completions::upstream::openrouter::Client::new(
        reqwest::Client::new(),
        "https://openrouter.ai/api/v1".to_string(),
        "dummy-api-key".to_string(),
        None, // user_agent
        None, // x_title
        None, // referer
    );
    let upstream_client = chat::completions::upstream::Client::new(openrouter_client);

    Arc::new(chat::completions::Client::new(
        ensemble_llm_fetcher,
        usage_handler,
        upstream_client,
        std::time::Duration::from_millis(500),
        std::time::Duration::from_millis(500),
        0.5,
        1.5,
        std::time::Duration::from_secs(60),
        std::time::Duration::from_secs(300),
    ))
}

/// Creates a test vector completions client with mock dependencies.
fn create_test_vector_client(
    chat_client: Arc<TestChatClient>,
) -> Arc<TestVectorClient> {
    let ensemble_fetcher = Arc::new(ensemble::fetcher::CachingFetcher::new(Arc::new(
        MockEnsembleFetcher,
    )));
    let completion_votes_fetcher = Arc::new(MockCompletionVotesFetcher);
    let cache_vote_fetcher = Arc::new(MockCacheVoteFetcher);
    let usage_handler = Arc::new(MockVectorUsageHandler);

    Arc::new(vector::completions::Client::new(
        chat_client,
        ensemble_fetcher,
        completion_votes_fetcher,
        cache_vote_fetcher,
        usage_handler,
    ))
}

/// Creates a test function execution client with mock dependencies.
fn create_test_function_client(
    chat_client: Arc<TestChatClient>,
    vector_client: Arc<TestVectorClient>,
) -> Arc<TestFunctionClient> {
    let ensemble_fetcher = Arc::new(ensemble::fetcher::CachingFetcher::new(Arc::new(
        MockEnsembleFetcher,
    )));
    let function_fetcher = Arc::new(MockFunctionFetcher);
    let profile_fetcher = Arc::new(MockProfileFetcher);
    let usage_handler = Arc::new(MockFunctionUsageHandler);

    Arc::new(super::Client::new(
        chat_client,
        ensemble_fetcher,
        vector_client,
        function_fetcher,
        profile_fetcher,
        usage_handler,
    ))
}

/// Creates a simple inline ensemble with a single LLM.
fn create_simple_ensemble() -> objectiveai::vector::completions::request::Ensemble {
    objectiveai::vector::completions::request::Ensemble::Provided(
        objectiveai::ensemble::EnsembleBase {
            llms: vec![objectiveai::ensemble_llm::EnsembleLlmBaseWithFallbacksAndCount {
                count: 1,
                inner: objectiveai::ensemble_llm::EnsembleLlmBase {
                    model: "openai/gpt-4o".to_string(),
                    ..Default::default()
                },
                fallbacks: None,
            }],
        },
    )
}

/// Creates an empty Input object.
fn empty_input() -> objectiveai::functions::expression::Input {
    objectiveai::functions::expression::Input::Object(IndexMap::new())
}

/// Creates a simple inline vector function with one vector completion task.
fn create_simple_vector_function() -> objectiveai::functions::InlineFunction {
    objectiveai::functions::InlineFunction::Vector {
        input_maps: None,
        tasks: vec![objectiveai::functions::TaskExpression::VectorCompletion(
            objectiveai::functions::VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: objectiveai::functions::expression::WithExpression::Value(vec![
                    objectiveai::functions::expression::WithExpression::Value(
                        objectiveai::chat::completions::request::MessageExpression::User(
                            objectiveai::chat::completions::request::UserMessageExpression {
                                content: objectiveai::functions::expression::WithExpression::Value(
                                    objectiveai::chat::completions::request::RichContentExpression::Text(
                                        "Which is better?".to_string(),
                                    ),
                                ),
                                name: None,
                            },
                        ),
                    ),
                ]),
                tools: None,
                responses: objectiveai::functions::expression::WithExpression::Value(vec![
                    objectiveai::functions::expression::WithExpression::Value(
                        objectiveai::chat::completions::request::RichContentExpression::Text(
                            "Option A".to_string(),
                        ),
                    ),
                    objectiveai::functions::expression::WithExpression::Value(
                        objectiveai::chat::completions::request::RichContentExpression::Text(
                            "Option B".to_string(),
                        ),
                    ),
                ]),
                output: objectiveai::functions::expression::Expression::Starlark(
                    "output['scores']".to_string(),
                ),
            },
        )],
        input_split: None,
        input_merge: None,
    }
}

/// Creates a simple inline profile for a function with one vector completion task.
fn create_simple_profile() -> objectiveai::functions::InlineProfile {
    objectiveai::functions::InlineProfile {
        tasks: vec![objectiveai::functions::TaskProfile::VectorCompletion {
            ensemble: create_simple_ensemble(),
            profile: vec![Decimal::ONE],
        }],
        profile: vec![Decimal::ONE],
    }
}

/// Creates a simple inline scalar function with one vector completion task.
fn create_simple_scalar_function() -> objectiveai::functions::InlineFunction {
    objectiveai::functions::InlineFunction::Scalar {
        input_maps: None,
        tasks: vec![objectiveai::functions::TaskExpression::VectorCompletion(
            objectiveai::functions::VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: objectiveai::functions::expression::WithExpression::Value(vec![
                    objectiveai::functions::expression::WithExpression::Value(
                        objectiveai::chat::completions::request::MessageExpression::User(
                            objectiveai::chat::completions::request::UserMessageExpression {
                                content: objectiveai::functions::expression::WithExpression::Value(
                                    objectiveai::chat::completions::request::RichContentExpression::Text(
                                        "Rate this on a scale of 0 to 1".to_string(),
                                    ),
                                ),
                                name: None,
                            },
                        ),
                    ),
                ]),
                tools: None,
                responses: objectiveai::functions::expression::WithExpression::Value(vec![
                    objectiveai::functions::expression::WithExpression::Value(
                        objectiveai::chat::completions::request::RichContentExpression::Text(
                            "Good".to_string(),
                        ),
                    ),
                    objectiveai::functions::expression::WithExpression::Value(
                        objectiveai::chat::completions::request::RichContentExpression::Text(
                            "Bad".to_string(),
                        ),
                    ),
                ]),
                // For scalar functions, we take the first score as the output
                output: objectiveai::functions::expression::Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    }
}

/// Creates a simple inline scalar profile.
fn create_simple_scalar_profile() -> objectiveai::functions::InlineProfile {
    objectiveai::functions::InlineProfile {
        tasks: vec![objectiveai::functions::TaskProfile::VectorCompletion {
            ensemble: create_simple_ensemble(),
            profile: vec![Decimal::ONE],
        }],
        profile: vec![Decimal::ONE],
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    /// Tests that a simple vector function execution with from_rng produces valid output.
    #[tokio::test]
    async fn test_vector_function_execution_with_rng() {
        let chat_client = create_test_chat_client();
        let vector_client = create_test_vector_client(chat_client.clone());
        let function_client =
            create_test_function_client(chat_client, vector_client);

        let ctx = create_test_context();

        let request = Arc::new(objectiveai::functions::executions::request::Request::FunctionInlineProfileInline {
            body: objectiveai::functions::executions::request::FunctionInlineProfileInlineRequestBody {
                function: create_simple_vector_function(),
                profile: create_simple_profile(),
                base: objectiveai::functions::executions::request::FunctionRemoteProfileRemoteRequestBody {
                    retry_token: None,
                    from_cache: None,
                    from_rng: Some(true), // Use RNG instead of network calls
                    reasoning: None,
                    strategy: None,
                    input: empty_input(),
                    provider: None,
                    seed: None,
                    stream: None,
                    backoff_max_elapsed_time: None,
                    first_chunk_timeout: None,
                    other_chunk_timeout: None,
                },
            },
        });

        let result = function_client
            .create_unary_handle_usage(ctx, request)
            .await;

        assert!(result.is_ok(), "Function execution should succeed: {:?}", result.err());

        let response = result.unwrap();

        // Verify the output is a vector that sums to approximately 1
        match &response.output {
            objectiveai::functions::expression::FunctionOutput::Vector(scores) => {
                assert_eq!(scores.len(), 2, "Should have 2 scores for 2 responses");
                let sum: Decimal = scores.iter().cloned().sum();
                assert!(
                    sum >= Decimal::new(99, 2) && sum <= Decimal::new(101, 2),
                    "Scores should sum to approximately 1, got {}",
                    sum
                );
            }
            other => panic!("Expected vector output, got {:?}", other),
        }
    }

    /// Tests that a simple scalar function execution with from_rng produces valid output.
    #[tokio::test]
    async fn test_scalar_function_execution_with_rng() {
        let chat_client = create_test_chat_client();
        let vector_client = create_test_vector_client(chat_client.clone());
        let function_client =
            create_test_function_client(chat_client, vector_client);

        let ctx = create_test_context();

        let request = Arc::new(objectiveai::functions::executions::request::Request::FunctionInlineProfileInline {
            body: objectiveai::functions::executions::request::FunctionInlineProfileInlineRequestBody {
                function: create_simple_scalar_function(),
                profile: create_simple_scalar_profile(),
                base: objectiveai::functions::executions::request::FunctionRemoteProfileRemoteRequestBody {
                    retry_token: None,
                    from_cache: None,
                    from_rng: Some(true),
                    reasoning: None,
                    strategy: None,
                    input: empty_input(),
                    provider: None,
                    seed: None,
                    stream: None,
                    backoff_max_elapsed_time: None,
                    first_chunk_timeout: None,
                    other_chunk_timeout: None,
                },
            },
        });

        let result = function_client
            .create_unary_handle_usage(ctx, request)
            .await;

        assert!(result.is_ok(), "Function execution should succeed: {:?}", result.err());

        let response = result.unwrap();

        // Verify the output is a scalar between 0 and 1
        match &response.output {
            objectiveai::functions::expression::FunctionOutput::Scalar(score) => {
                assert!(
                    *score >= Decimal::ZERO && *score <= Decimal::ONE,
                    "Scalar score should be between 0 and 1, got {}",
                    score
                );
            }
            other => panic!("Expected scalar output, got {:?}", other),
        }
    }

    /// Tests streaming function execution with from_rng.
    #[tokio::test]
    async fn test_streaming_function_execution_with_rng() {
        let chat_client = create_test_chat_client();
        let vector_client = create_test_vector_client(chat_client.clone());
        let function_client =
            create_test_function_client(chat_client, vector_client);

        let ctx = create_test_context();

        let request = Arc::new(objectiveai::functions::executions::request::Request::FunctionInlineProfileInline {
            body: objectiveai::functions::executions::request::FunctionInlineProfileInlineRequestBody {
                function: create_simple_vector_function(),
                profile: create_simple_profile(),
                base: objectiveai::functions::executions::request::FunctionRemoteProfileRemoteRequestBody {
                    retry_token: None,
                    from_cache: None,
                    from_rng: Some(true),
                    reasoning: None,
                    strategy: None,
                    input: empty_input(),
                    provider: None,
                    seed: None,
                    stream: Some(true),
                    backoff_max_elapsed_time: None,
                    first_chunk_timeout: None,
                    other_chunk_timeout: None,
                },
            },
        });

        let stream_result = function_client
            .clone()
            .create_streaming_handle_usage(ctx, request)
            .await;

        assert!(stream_result.is_ok(), "Streaming should start: {:?}", stream_result.err());

        let mut stream = stream_result.unwrap();
        let mut chunks = Vec::new();

        while let Some(chunk) = stream.next().await {
            chunks.push(chunk);
        }

        assert!(!chunks.is_empty(), "Should receive at least one chunk");

        // Aggregate chunks to get final response
        let mut aggregate = chunks[0].clone();
        for chunk in chunks.iter().skip(1) {
            aggregate.push(chunk);
        }

        let response: objectiveai::functions::executions::response::unary::FunctionExecution =
            aggregate.into();

        // Verify the output
        match &response.output {
            objectiveai::functions::expression::FunctionOutput::Vector(scores) => {
                assert_eq!(scores.len(), 2, "Should have 2 scores");
            }
            other => panic!("Expected vector output, got {:?}", other),
        }
    }

    /// Tests that multiple vector completion tasks are combined correctly.
    #[tokio::test]
    async fn test_multi_task_function_execution_with_rng() {
        let chat_client = create_test_chat_client();
        let vector_client = create_test_vector_client(chat_client.clone());
        let function_client =
            create_test_function_client(chat_client, vector_client);

        let ctx = create_test_context();

        // Create a function with two tasks
        let function = objectiveai::functions::InlineFunction::Vector {
            input_maps: None,
            tasks: vec![
                objectiveai::functions::TaskExpression::VectorCompletion(
                    objectiveai::functions::VectorCompletionTaskExpression {
                        skip: None,
                        map: None,
                        messages: objectiveai::functions::expression::WithExpression::Value(vec![
                            objectiveai::functions::expression::WithExpression::Value(
                                objectiveai::chat::completions::request::MessageExpression::User(
                                    objectiveai::chat::completions::request::UserMessageExpression {
                                        content: objectiveai::functions::expression::WithExpression::Value(
                                            objectiveai::chat::completions::request::RichContentExpression::Text(
                                                "Task 1: Which is better?".to_string(),
                                            ),
                                        ),
                                        name: None,
                                    },
                                ),
                            ),
                        ]),
                        tools: None,
                        responses: objectiveai::functions::expression::WithExpression::Value(vec![
                            objectiveai::functions::expression::WithExpression::Value(
                                objectiveai::chat::completions::request::RichContentExpression::Text(
                                    "A".to_string(),
                                ),
                            ),
                            objectiveai::functions::expression::WithExpression::Value(
                                objectiveai::chat::completions::request::RichContentExpression::Text(
                                    "B".to_string(),
                                ),
                            ),
                        ]),
                        output: objectiveai::functions::expression::Expression::Starlark(
                            "output['scores']".to_string(),
                        ),
                    },
                ),
                objectiveai::functions::TaskExpression::VectorCompletion(
                    objectiveai::functions::VectorCompletionTaskExpression {
                        skip: None,
                        map: None,
                        messages: objectiveai::functions::expression::WithExpression::Value(vec![
                            objectiveai::functions::expression::WithExpression::Value(
                                objectiveai::chat::completions::request::MessageExpression::User(
                                    objectiveai::chat::completions::request::UserMessageExpression {
                                        content: objectiveai::functions::expression::WithExpression::Value(
                                            objectiveai::chat::completions::request::RichContentExpression::Text(
                                                "Task 2: Which is better?".to_string(),
                                            ),
                                        ),
                                        name: None,
                                    },
                                ),
                            ),
                        ]),
                        tools: None,
                        responses: objectiveai::functions::expression::WithExpression::Value(vec![
                            objectiveai::functions::expression::WithExpression::Value(
                                objectiveai::chat::completions::request::RichContentExpression::Text(
                                    "A".to_string(),
                                ),
                            ),
                            objectiveai::functions::expression::WithExpression::Value(
                                objectiveai::chat::completions::request::RichContentExpression::Text(
                                    "B".to_string(),
                                ),
                            ),
                        ]),
                        output: objectiveai::functions::expression::Expression::Starlark(
                            "output['scores']".to_string(),
                        ),
                    },
                ),
            ],
            input_split: None,
            input_merge: None,
        };

        // Create a profile with equal weights for both tasks
        let profile = objectiveai::functions::InlineProfile {
            tasks: vec![
                objectiveai::functions::TaskProfile::VectorCompletion {
                    ensemble: create_simple_ensemble(),
                    profile: vec![Decimal::ONE],
                },
                objectiveai::functions::TaskProfile::VectorCompletion {
                    ensemble: create_simple_ensemble(),
                    profile: vec![Decimal::ONE],
                },
            ],
            profile: vec![Decimal::new(5, 1), Decimal::new(5, 1)], // 0.5, 0.5
        };

        let request = Arc::new(objectiveai::functions::executions::request::Request::FunctionInlineProfileInline {
            body: objectiveai::functions::executions::request::FunctionInlineProfileInlineRequestBody {
                function,
                profile,
                base: objectiveai::functions::executions::request::FunctionRemoteProfileRemoteRequestBody {
                    retry_token: None,
                    from_cache: None,
                    from_rng: Some(true),
                    reasoning: None,
                    strategy: None,
                    input: empty_input(),
                    provider: None,
                    seed: None,
                    stream: None,
                    backoff_max_elapsed_time: None,
                    first_chunk_timeout: None,
                    other_chunk_timeout: None,
                },
            },
        });

        let result = function_client
            .create_unary_handle_usage(ctx, request)
            .await;

        assert!(result.is_ok(), "Multi-task function should succeed: {:?}", result.err());

        let response = result.unwrap();

        // Verify the output is a valid vector
        match &response.output {
            objectiveai::functions::expression::FunctionOutput::Vector(scores) => {
                assert_eq!(scores.len(), 2, "Should have 2 scores");
                let sum: Decimal = scores.iter().cloned().sum();
                assert!(
                    sum >= Decimal::new(99, 2) && sum <= Decimal::new(101, 2),
                    "Scores should sum to approximately 1, got {}",
                    sum
                );
            }
            other => panic!("Expected vector output, got {:?}", other),
        }
    }

    /// Tests function execution with a multi-LLM ensemble.
    #[tokio::test]
    async fn test_multi_llm_ensemble_with_rng() {
        let chat_client = create_test_chat_client();
        let vector_client = create_test_vector_client(chat_client.clone());
        let function_client =
            create_test_function_client(chat_client, vector_client);

        let ctx = create_test_context();

        // Create an ensemble with multiple LLMs
        let ensemble = objectiveai::vector::completions::request::Ensemble::Provided(
            objectiveai::ensemble::EnsembleBase {
                llms: vec![
                    objectiveai::ensemble_llm::EnsembleLlmBaseWithFallbacksAndCount {
                        count: 2,
                        inner: objectiveai::ensemble_llm::EnsembleLlmBase {
                            model: "openai/gpt-4o".to_string(),
                            ..Default::default()
                        },
                        fallbacks: None,
                    },
                    objectiveai::ensemble_llm::EnsembleLlmBaseWithFallbacksAndCount {
                        count: 1,
                        inner: objectiveai::ensemble_llm::EnsembleLlmBase {
                            model: "anthropic/claude-3-5-sonnet".to_string(),
                            ..Default::default()
                        },
                        fallbacks: None,
                    },
                ],
            },
        );

        let profile = objectiveai::functions::InlineProfile {
            tasks: vec![objectiveai::functions::TaskProfile::VectorCompletion {
                ensemble,
                // Profile weights are per-LLM-config, not per-instance
                // We have 2 distinct LLM configs (gpt-4o and claude)
                profile: vec![
                    Decimal::new(6, 1), // 0.6 for gpt-4o (covers both instances)
                    Decimal::new(4, 1), // 0.4 for claude
                ],
            }],
            profile: vec![Decimal::ONE],
        };

        let request = Arc::new(objectiveai::functions::executions::request::Request::FunctionInlineProfileInline {
            body: objectiveai::functions::executions::request::FunctionInlineProfileInlineRequestBody {
                function: create_simple_vector_function(),
                profile,
                base: objectiveai::functions::executions::request::FunctionRemoteProfileRemoteRequestBody {
                    retry_token: None,
                    from_cache: None,
                    from_rng: Some(true),
                    reasoning: None,
                    strategy: None,
                    input: empty_input(),
                    provider: None,
                    seed: None,
                    stream: None,
                    backoff_max_elapsed_time: None,
                    first_chunk_timeout: None,
                    other_chunk_timeout: None,
                },
            },
        });

        let result = function_client
            .create_unary_handle_usage(ctx, request)
            .await;

        assert!(result.is_ok(), "Multi-LLM ensemble should succeed: {:?}", result.err());

        let response = result.unwrap();

        // Verify the output
        match &response.output {
            objectiveai::functions::expression::FunctionOutput::Vector(scores) => {
                assert_eq!(scores.len(), 2, "Should have 2 scores");
            }
            other => panic!("Expected vector output, got {:?}", other),
        }

        // Verify we got a valid response with tasks
        assert_eq!(
            response.tasks.len(),
            1,
            "Should have 1 task"
        );
    }
}
