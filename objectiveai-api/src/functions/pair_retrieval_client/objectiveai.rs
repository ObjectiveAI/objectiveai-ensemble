//! ObjectiveAI API implementation of the pair retrieval client.

use crate::ctx;
use std::sync::Arc;

/// Lists Function-Profile pairs and retrieves usage via the ObjectiveAI API.
pub struct ObjectiveAiClient {
    /// The HTTP client for API requests.
    pub client: Arc<objectiveai::HttpClient>,
}

impl ObjectiveAiClient {
    /// Creates a new ObjectiveAI pair retrieval client.
    pub fn new(client: Arc<objectiveai::HttpClient>) -> Self {
        Self { client }
    }
}

#[async_trait::async_trait]
impl<CTXEXT> super::Client<CTXEXT> for ObjectiveAiClient
where
    CTXEXT: Send + Sync + 'static,
{
    async fn list_function_profile_pairs(
        &self,
        _ctx: ctx::Context<CTXEXT>,
    ) -> Result<
        objectiveai::functions::response::ListFunctionProfilePair,
        objectiveai::error::ResponseError,
    > {
        objectiveai::functions::list_function_profile_pairs(&self.client)
            .await
            .map_err(|e| objectiveai::error::ResponseError::from(&e))
    }

    async fn get_function_profile_pair(
        &self,
        _ctx: ctx::Context<CTXEXT>,
        fremote: objectiveai::functions::Remote,
        fowner: &str,
        frepository: &str,
        fcommit: Option<&str>,
        premote: objectiveai::functions::Remote,
        powner: &str,
        prepository: &str,
        pcommit: Option<&str>,
    ) -> Result<
        objectiveai::functions::response::GetFunctionProfilePair,
        objectiveai::error::ResponseError,
    > {
        objectiveai::functions::get_function_profile_pair(
            &self.client,
            fremote,
            fowner,
            frepository,
            fcommit,
            premote,
            powner,
            prepository,
            pcommit,
        )
        .await
        .map_err(|e| objectiveai::error::ResponseError::from(&e))
    }

    async fn get_function_profile_pair_usage(
        &self,
        _ctx: ctx::Context<CTXEXT>,
        fremote: objectiveai::functions::Remote,
        fowner: &str,
        frepository: &str,
        fcommit: Option<&str>,
        premote: objectiveai::functions::Remote,
        powner: &str,
        prepository: &str,
        pcommit: Option<&str>,
    ) -> Result<
        objectiveai::functions::response::UsageFunctionProfilePair,
        objectiveai::error::ResponseError,
    > {
        objectiveai::functions::get_function_profile_pair_usage(
            &self.client,
            fremote,
            fowner,
            frepository,
            fcommit,
            premote,
            powner,
            prepository,
            pcommit,
        )
        .await
        .map_err(|e| objectiveai::error::ResponseError::from(&e))
    }
}
