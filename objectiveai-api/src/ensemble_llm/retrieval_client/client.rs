use crate::ctx;

#[async_trait::async_trait]
pub trait Client<CTXEXT> {
    async fn list(
        &self,
        ctx: ctx::Context<CTXEXT>,
    ) -> Result<
        objectiveai::ensemble_llm::response::ListEnsembleLlm,
        objectiveai::error::ResponseError,
    >;

    async fn get_usage(
        &self,
        ctx: ctx::Context<CTXEXT>,
        id: &str,
    ) -> Result<
        objectiveai::ensemble_llm::response::UsageEnsembleLlm,
        objectiveai::error::ResponseError,
    >;
}
