//! Trait for listing Function-Profile pairs and getting usage statistics.

use crate::ctx;

/// Client for listing Function-Profile pairs and retrieving usage statistics.
#[async_trait::async_trait]
pub trait Client<CTXEXT> {
    /// Lists Function-Profile pairs.
    async fn list_function_profile_pairs(
        &self,
        ctx: ctx::Context<CTXEXT>,
    ) -> Result<
        objectiveai::functions::response::ListFunctionProfilePair,
        objectiveai::error::ResponseError,
    >;

    /// Retrieves a Function-Profile pair.
    async fn get_function_profile_pair(
        &self,
        ctx: ctx::Context<CTXEXT>,
        fowner: &str,
        frepository: &str,
        fcommit: Option<&str>,
        powner: &str,
        prepository: &str,
        pcommit: Option<&str>,
    ) -> Result<
        objectiveai::functions::response::GetFunctionProfilePair,
        objectiveai::error::ResponseError,
    >;

    /// Retrieves usage statistics for a Function-Profile pair.
    async fn get_function_profile_pair_usage(
        &self,
        ctx: ctx::Context<CTXEXT>,
        fowner: &str,
        frepository: &str,
        fcommit: Option<&str>,
        powner: &str,
        prepository: &str,
        pcommit: Option<&str>,
    ) -> Result<
        objectiveai::functions::response::UsageFunctionProfilePair,
        objectiveai::error::ResponseError,
    >;
}
