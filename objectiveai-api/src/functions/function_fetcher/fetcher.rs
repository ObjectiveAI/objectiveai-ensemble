//! Trait for fetching Function definitions.

use crate::ctx;

/// Fetches Function definitions from remote sources.
///
/// Functions are stored as `function.json` at repository root and referenced
/// by remote/owner/repository (optionally with commit SHA).
#[async_trait::async_trait]
pub trait Fetcher<CTXEXT> {
    /// Fetches a Function by remote/owner/repository/commit.
    ///
    /// Returns None if the Function is not found.
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
    >;
}
