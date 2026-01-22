use crate::ctx;
use std::sync::Arc;

pub struct Client<CTXEXT, FENS, RTRVL> {
    pub ensemble_fetcher: Arc<
        super::fetcher::CachingFetcher<CTXEXT, FENS>,
    >,
    pub retrieval_client: Arc<RTRVL>,
    pub _ctx_ext: std::marker::PhantomData<CTXEXT>,
}

impl<CTXEXT, FENS, RTRVL> Client<CTXEXT, FENS, RTRVL> {
    pub fn new(
        ensemble_fetcher: Arc<
            super::fetcher::CachingFetcher<CTXEXT, FENS>,
        >,
        retrieval_client: Arc<RTRVL>,
    ) -> Self {
        Self {
            ensemble_fetcher,
            retrieval_client,
            _ctx_ext: std::marker::PhantomData,
        }
    }
}

impl<CTXEXT, FENS, RTRVL> Client<CTXEXT, FENS, RTRVL>
where
    CTXEXT: Send + Sync + 'static,
    FENS: super::fetcher::Fetcher<CTXEXT>
        + Send
        + Sync
        + 'static,
    RTRVL: super::retrieval_client::Client<CTXEXT> + Send + Sync + 'static,
{
    pub async fn list(
        &self,
        ctx: ctx::Context<CTXEXT>,
    ) -> Result<
        objectiveai::ensemble::response::ListEnsemble,
        objectiveai::error::ResponseError,
    > {
        self.retrieval_client.list(ctx).await
    }

    pub async fn get(
        &self,
        ctx: ctx::Context<CTXEXT>,
        id: &str,
    ) -> Result<
        objectiveai::ensemble::response::GetEnsemble,
        objectiveai::error::ResponseError,
    > {
        self.ensemble_fetcher
            .fetch(ctx, id)
            .await?
            .ok_or_else(|| objectiveai::error::ResponseError {
                code: 404,
                message: serde_json::json!({
                    "kind": "ensemble",
                    "error": "Ensemble not found"
                }),
            })
            .map(|(inner, created)| {
                objectiveai::ensemble::response::GetEnsemble { created, inner }
            })
    }

    pub async fn get_usage(
        &self,
        ctx: ctx::Context<CTXEXT>,
        id: &str,
    ) -> Result<
        objectiveai::ensemble::response::UsageEnsemble,
        objectiveai::error::ResponseError,
    > {
        self.retrieval_client.get_usage(ctx, id).await
    }
}
