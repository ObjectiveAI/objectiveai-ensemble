use crate::ctx;

#[async_trait::async_trait]
pub trait Client<CTXEXT> {
    async fn create_api_key(
        &self,
        ctx: ctx::Context<CTXEXT>,
        request: objectiveai::auth::request::CreateApiKeyRequest,
    ) -> Result<
        objectiveai::auth::response::CreateApiKeyResponse,
        objectiveai::error::ResponseError,
    >;

    async fn create_openrouter_byok_api_key(
        &self,
        ctx: ctx::Context<CTXEXT>,
        request: objectiveai::auth::request::CreateOpenRouterByokApiKeyRequest,
    ) -> Result<
        objectiveai::auth::response::CreateOpenRouterByokApiKeyResponse,
        objectiveai::error::ResponseError,
    >;

    async fn disable_api_key(
        &self,
        ctx: ctx::Context<CTXEXT>,
        request: objectiveai::auth::request::DisableApiKeyRequest,
    ) -> Result<
        objectiveai::auth::response::DisableApiKeyResponse,
        objectiveai::error::ResponseError,
    >;

    async fn delete_openrouter_byok_api_key(
        &self,
        ctx: ctx::Context<CTXEXT>,
    ) -> Result<(), objectiveai::error::ResponseError>;

    async fn list_api_keys(
        &self,
        ctx: ctx::Context<CTXEXT>,
    ) -> Result<
        objectiveai::auth::response::ListApiKeyResponse,
        objectiveai::error::ResponseError,
    >;

    async fn get_openrouter_byok_api_key(
        &self,
        ctx: ctx::Context<CTXEXT>,
    ) -> Result<
        objectiveai::auth::response::GetOpenRouterByokApiKeyResponse,
        objectiveai::error::ResponseError,
    >;

    async fn get_credits(
        &self,
        ctx: ctx::Context<CTXEXT>,
    ) -> Result<
        objectiveai::auth::response::GetCreditsResponse,
        objectiveai::error::ResponseError,
    >;
}
