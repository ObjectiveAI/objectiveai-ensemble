use crate::ctx;
use std::sync::Arc;

pub struct Client<CTXEXT, PFN, RTRVL> {
    pub profile_fetcher: Arc<PFN>,
    pub retrieval_client: Arc<RTRVL>,
    pub _ctx_ext: std::marker::PhantomData<CTXEXT>,
}

impl<CTXEXT, PFN, RTRVL> Client<CTXEXT, PFN, RTRVL> {
    pub fn new(
        profile_fetcher: Arc<PFN>,
        retrieval_client: Arc<RTRVL>,
    ) -> Self {
        Self {
            profile_fetcher,
            retrieval_client,
            _ctx_ext: std::marker::PhantomData,
        }
    }
}

impl<CTXEXT, PFN, RTRVL> Client<CTXEXT, PFN, RTRVL>
where
    CTXEXT: Send + Sync + 'static,
    PFN: crate::functions::profile_fetcher::Fetcher<CTXEXT> + Send + Sync + 'static,
    RTRVL: super::retrieval_client::Client<CTXEXT> + Send + Sync + 'static,
{
    pub async fn list_profiles(
        &self,
        ctx: ctx::Context<CTXEXT>,
    ) -> Result<
        objectiveai::functions::profiles::response::ListProfile,
        objectiveai::error::ResponseError,
    > {
        self.retrieval_client.list_profiles(ctx).await
    }

    pub async fn get_profile(
        &self,
        ctx: ctx::Context<CTXEXT>,
        owner: &str,
        repository: &str,
        commit: Option<&str>,
    ) -> Result<
        objectiveai::functions::profiles::response::GetProfile,
        objectiveai::error::ResponseError,
    > {
        self.profile_fetcher
            .fetch(ctx, owner, repository, commit)
            .await?
            .ok_or_else(|| objectiveai::error::ResponseError {
                code: 404,
                message: serde_json::json!({
                    "kind": "profiles",
                    "error": "Profile not found"
                }),
            })
    }

    pub async fn get_profile_usage(
        &self,
        ctx: ctx::Context<CTXEXT>,
        owner: &str,
        repository: &str,
        commit: Option<&str>,
    ) -> Result<
        objectiveai::functions::profiles::response::UsageProfile,
        objectiveai::error::ResponseError,
    > {
        self.retrieval_client
            .get_profile_usage(ctx, owner, repository, commit)
            .await
    }
}
