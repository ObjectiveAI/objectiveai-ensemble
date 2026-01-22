use crate::ctx;
use std::sync::Arc;

pub struct ObjectiveAiClient {
    pub client: Arc<objectiveai::HttpClient>,
}

impl ObjectiveAiClient {
    pub fn new(client: Arc<objectiveai::HttpClient>) -> Self {
        Self { client }
    }
}

#[async_trait::async_trait]
impl<CTXEXT> super::Client<CTXEXT> for ObjectiveAiClient
where
    CTXEXT: Send + Sync + 'static,
{
    async fn list_functions(
        &self,
        _ctx: ctx::Context<CTXEXT>,
    ) -> Result<
        objectiveai::functions::response::ListFunction,
        objectiveai::error::ResponseError,
    > {
        objectiveai::functions::list_functions(&self.client)
            .await
            .map_err(|e| objectiveai::error::ResponseError::from(&e))
    }

    async fn get_function_usage(
        &self,
        _ctx: ctx::Context<CTXEXT>,
        owner: &str,
        repository: &str,
        commit: Option<&str>,
    ) -> Result<
        objectiveai::functions::response::UsageFunction,
        objectiveai::error::ResponseError,
    > {
        objectiveai::functions::get_function_usage(&self.client, owner, repository, commit)
            .await
            .map_err(|e| objectiveai::error::ResponseError::from(&e))
    }
}
