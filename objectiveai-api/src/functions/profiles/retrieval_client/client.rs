use crate::ctx;

#[async_trait::async_trait]
pub trait Client<CTXEXT> {
    async fn list_profiles(
        &self,
        ctx: ctx::Context<CTXEXT>,
    ) -> Result<
        objectiveai::functions::profiles::response::ListProfile,
        objectiveai::error::ResponseError,
    >;

    async fn get_profile_usage(
        &self,
        ctx: ctx::Context<CTXEXT>,
        owner: &str,
        repository: &str,
        commit: Option<&str>,
    ) -> Result<
        objectiveai::functions::profiles::response::UsageProfile,
        objectiveai::error::ResponseError,
    >;
}
