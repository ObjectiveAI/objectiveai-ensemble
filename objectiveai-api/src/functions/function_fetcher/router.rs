//! Router that dispatches to GitHub or Filesystem fetchers based on Remote.

use crate::ctx;
use std::sync::Arc;

/// Routes Function fetch requests to the appropriate sub-fetcher based on [`Remote`].
///
/// [`Remote`]: objectiveai::functions::Remote
pub struct FetcherRouter<G, F> {
    /// GitHub sub-fetcher.
    pub github: Arc<G>,
    /// Filesystem sub-fetcher.
    pub filesystem: Arc<F>,
}

impl<G, F> FetcherRouter<G, F> {
    /// Creates a new FetcherRouter with GitHub and Filesystem sub-fetchers.
    pub fn new(github: Arc<G>, filesystem: Arc<F>) -> Self {
        Self { github, filesystem }
    }
}

#[async_trait::async_trait]
impl<CTXEXT, G, F> super::Fetcher<CTXEXT> for FetcherRouter<G, F>
where
    CTXEXT: Send + Sync + 'static,
    G: super::Fetcher<CTXEXT> + Send + Sync + 'static,
    F: super::Fetcher<CTXEXT> + Send + Sync + 'static,
{
    async fn fetch(
        &self,
        ctx: ctx::Context<CTXEXT>,
        remote: objectiveai::functions::Remote,
        owner: &str,
        repository: &str,
        commit: Option<&str>,
    ) -> Result<
        Option<objectiveai::functions::response::GetFunction>,
        objectiveai::error::ResponseError,
    > {
        match remote {
            objectiveai::functions::Remote::Github => {
                self.github.fetch(ctx, remote, owner, repository, commit).await
            }
            objectiveai::functions::Remote::Filesystem => {
                self.filesystem
                    .fetch(ctx, remote, owner, repository, commit)
                    .await
            }
        }
    }
}
