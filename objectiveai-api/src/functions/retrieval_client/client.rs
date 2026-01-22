use crate::ctx;

#[async_trait::async_trait]
pub trait Client<CTXEXT> {
    async fn list_functions(
        &self,
        ctx: ctx::Context<CTXEXT>,
    ) -> Result<
        objectiveai::functions::response::ListFunction,
        objectiveai::error::ResponseError,
    >;

    async fn get_function_usage(
        &self,
        ctx: ctx::Context<CTXEXT>,
        owner: &str,
        repository: &str,
        commit: Option<&str>,
    ) -> Result<
        objectiveai::functions::response::UsageFunction,
        objectiveai::error::ResponseError,
    >;
}
