use crate::ctx;

#[async_trait::async_trait]
pub trait Client<CTXEXT> {
    async fn list(
        &self,
        ctx: ctx::Context<CTXEXT>,
    ) -> Result<
        objectiveai::ensemble::response::ListEnsemble,
        objectiveai::error::ResponseError,
    >;

    async fn get_usage(
        &self,
        ctx: ctx::Context<CTXEXT>,
        id: &str,
    ) -> Result<
        objectiveai::ensemble::response::UsageEnsemble,
        objectiveai::error::ResponseError,
    >;
}
