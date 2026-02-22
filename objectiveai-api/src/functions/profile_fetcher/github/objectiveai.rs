//! ObjectiveAI API implementation of the GitHub Profile fetcher.

use crate::ctx;
use objectiveai::error::StatusError;
use std::sync::Arc;

/// Fetches Profiles from GitHub via the ObjectiveAI API.
pub struct ObjectiveAiFetcher {
    /// The HTTP client for API requests.
    pub client: Arc<objectiveai::HttpClient>,
}

impl ObjectiveAiFetcher {
    /// Creates a new ObjectiveAI GitHub Profile fetcher.
    pub fn new(client: Arc<objectiveai::HttpClient>) -> Self {
        Self { client }
    }
}

#[async_trait::async_trait]
impl<CTXEXT> super::super::Fetcher<CTXEXT> for ObjectiveAiFetcher
where
    CTXEXT: Send + Sync + 'static,
{
    async fn fetch(
        &self,
        _ctx: ctx::Context<CTXEXT>,
        _remote: objectiveai::functions::Remote,
        owner: &str,
        repository: &str,
        commit: Option<&str>,
    ) -> Result<
        Option<objectiveai::functions::profiles::response::GetProfile>,
        objectiveai::error::ResponseError,
    > {
        match objectiveai::functions::profiles::get_profile(
            &self.client,
            objectiveai::functions::Remote::Github,
            owner,
            repository,
            commit,
        )
        .await
        {
            Ok(profile) => Ok(Some(profile)),
            Err(e) if e.status() == 404 => Ok(None),
            Err(e) => Err(objectiveai::error::ResponseError::from(&e)),
        }
    }
}
