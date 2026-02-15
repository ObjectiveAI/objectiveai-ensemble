//! Tests for the vector completion client.
//!
//! These tests mirror the style of `functions::executions::client_tests` and
//! set `from_rng: true` on all requests so that no upstream LLM calls are
//! performed. They assert that the response **shape** is correct, while
//! allowing the actual numeric values (scores/weights) to be random.

use crate::{chat, ctx, ensemble, ensemble_llm, vector};
use futures::StreamExt;
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
        ensemble_llm::fetcher::CachingFetcher::new(Arc::new(
            MockEnsembleLlmFetcher,
        )),
    );
    let usage_handler = Arc::new(MockChatUsageHandler);

    // Create OpenRouter client with dummy values (won't be used since from_rng=true)
    let openrouter_client = chat::completions::upstream::openrouter::Client::new(
        reqwest::Client::new(),
        "https://openrouter.ai/api/v1".to_string(),
        "dummy-api-key".to_string(),
        None, // user_agent
        None, // project_id
    );

    let upstream_client = chat::completions::upstream::Client::new(
        openrouter_client.into(),
        usage_handler.clone(),
    );

    Arc::new(chat::completions::Client::new(
        ensemble_llm_fetcher,
        upstream_client,
        usage_handler,
    ))
}

/// Creates a test vector completions client with mock dependencies.
fn create_test_vector_client(
    chat_client: Arc<TestChatClient>,
) -> Arc<TestVectorClient> {
    let ensemble_llm_fetcher = Arc::new(
        ensemble_llm::fetcher::CachingFetcher::new(Arc::new(
            MockEnsembleLlmFetcher,
        )),
    );
    let ensemble_fetcher = Arc::new(ensemble::fetcher::CachingFetcher::new(
        Arc::new(MockEnsembleFetcher),
    ));
    let completion_votes_fetcher = Arc::new(
        vector::completions::completion_votes_fetcher::CachingFetcher::new(
            Arc::new(MockCompletionVotesFetcher),
        ),
    );
    let cache_vote_fetcher = Arc::new(
        vector::completions::cache_vote_fetcher::CachingFetcher::new(
            Arc::new(MockCacheVoteFetcher),
        ),
    );
    let usage_handler = Arc::new(MockVectorUsageHandler);

    Arc::new(vector::completions::Client::new(
        chat_client,
        ensemble_llm_fetcher,
        completion_votes_fetcher,
        cache_vote_fetcher,
        ensemble_fetcher,
        usage_handler,
    ))
}

/// Creates a simple inline ensemble with two LLMs.
fn create_simple_ensemble(
) -> objectiveai::vector::completions::request::Ensemble {
    objectiveai::vector::completions::request::Ensemble::Provided(
        objectiveai::ensemble::EnsembleBase {
            llms: vec![
                objectiveai::ensemble_llm::EnsembleLlmBaseWithFallbacksAndCount {
                    count: 1,
                    inner: objectiveai::ensemble_llm::EnsembleLlm {
                        id: "test-llm-1".to_string(),
                        base: objectiveai::ensemble_llm::EnsembleLlmBase {
                            model: "openai/gpt-4o".to_string(),
                            ..Default::default()
                        },
                    },
                    fallbacks: None,
                },
                objectiveai::ensemble_llm::EnsembleLlmBaseWithFallbacksAndCount {
                    count: 1,
                    inner: objectiveai::ensemble_llm::EnsembleLlm {
                        id: "test-llm-2".to_string(),
                        base: objectiveai::ensemble_llm::EnsembleLlmBase {
                            model: "anthropic/claude-3-5-sonnet".to_string(),
                            ..Default::default()
                        },
                    },
                    fallbacks: None,
                },
            ],
        },
    )
}

/// Creates a basic vector completion request body with `from_rng: true`.
fn create_base_request(
) -> objectiveai::vector::completions::request::VectorCompletionCreateParams
{
    use objectiveai::chat::completions::request::{
        message::Message, message::Role, RichContent,
    };

    objectiveai::vector::completions::request::VectorCompletionCreateParams {
        retry: None,
        from_cache: None,
        from_rng: Some(true),
        messages: vec![Message {
            role: Role::User,
            name: None,
            content: vec![RichContent::Text(
                "Pick the best option".to_string(),
            )],
        }],
        provider: None,
        ensemble: create_simple_ensemble(),
        // Two LLM configs ⇒ profile has length 2
        profile: vec![Decimal::new(5, 1), Decimal::new(5, 1)],
        seed: None,
        stream: None,
        tools: None,
        responses: vec![
            RichContent::Text("Option A".to_string()),
            RichContent::Text("Option B".to_string()),
            RichContent::Text("Option C".to_string()),
        ],
        backoff_max_elapsed_time: None,
        first_chunk_timeout: None,
        other_chunk_timeout: None,
    }
}

// ============================================================================
// Tests
// ============================================================================

#[tokio::test]
async fn test_vector_completion_unary_from_rng_shape() {
    let chat_client = create_test_chat_client();
    let vector_client = create_test_vector_client(chat_client);
    let ctx = create_test_context();

    let request =
        Arc::new(create_base_request().clone()); // unary path will clone again

    let result = vector_client
        .clone()
        .create_unary_handle_usage(ctx, request)
        .await;

    let response = result.expect("vector completion unary request should succeed");

    // We expect exactly as many scores as there are responses
    assert_eq!(
        response.scores.len(),
        3,
        "scores length should match responses length"
    );
    assert_eq!(
        response.weights.len(),
        3,
        "weights length should match responses length"
    );
    assert!(
        !response.votes.is_empty(),
        "from_rng=true should produce at least one vote"
    );
}

#[tokio::test]
async fn test_vector_completion_streaming_from_rng_shape() {
    let chat_client = create_test_chat_client();
    let vector_client = create_test_vector_client(chat_client);
    let ctx = create_test_context();

    let mut request = create_base_request();
    request.stream = Some(true);
    let request = Arc::new(request);

    let mut stream = vector_client
        .clone()
        .create_streaming_handle_usage(ctx, request)
        .await
        .expect("streaming vector completion request should succeed");

    let mut last_chunk: Option<
        objectiveai::vector::completions::response::streaming::VectorCompletionChunk,
    > = None;

    while let Some(chunk) = stream.next().await {
        // intermediate chunks may not yet have votes/scores/weights populated
        assert_eq!(chunk.scores.len(), chunk.weights.len());
        last_chunk = Some(chunk);
    }

    let last_chunk =
        last_chunk.expect("streaming response should include at least one chunk");

    assert_eq!(
        last_chunk.scores.len(),
        3,
        "final scores length should match responses length"
    );
    assert_eq!(
        last_chunk.weights.len(),
        3,
        "final weights length should match responses length"
    );
    assert!(
        !last_chunk.votes.is_empty(),
        "from_rng=true should produce at least one vote in the final chunk"
    );
}

