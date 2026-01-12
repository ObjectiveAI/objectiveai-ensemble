use crate::{HttpClient, HttpError};

pub async fn create_api_key(
    client: &HttpClient,
    request: super::request::CreateApiKeyRequest,
) -> Result<super::response::CreateApiKeyResponse, HttpError> {
    client
        .send_unary(reqwest::Method::POST, "auth/keys", Some(request))
        .await
}

pub async fn create_openrouter_byok_api_key(
    client: &HttpClient,
    request: super::request::CreateOpenRouterByokApiKeyRequest,
) -> Result<super::response::CreateOpenRouterByokApiKeyResponse, HttpError> {
    client
        .send_unary(
            reqwest::Method::POST,
            "auth/keys/openrouter",
            Some(request),
        )
        .await
}

pub async fn disable_api_key(
    client: &HttpClient,
    request: super::request::DisableApiKeyRequest,
) -> Result<super::response::DisableApiKeyResponse, HttpError> {
    client
        .send_unary(reqwest::Method::DELETE, "auth/keys", Some(request))
        .await
}

pub async fn delete_openrouter_byok_api_key(
    client: &HttpClient,
) -> Result<(), HttpError> {
    client
        .send_unary_no_response(
            reqwest::Method::DELETE,
            "auth/keys/openrouter",
            None::<String>,
        )
        .await
}

pub async fn list_api_keys(
    client: &HttpClient,
) -> Result<super::response::ListApiKeyResponse, HttpError> {
    client
        .send_unary(reqwest::Method::GET, "auth/keys", None::<String>)
        .await
}

pub async fn get_openrouter_byok_api_key(
    client: &HttpClient,
) -> Result<super::response::GetOpenRouterByokApiKeyResponse, HttpError> {
    client
        .send_unary(
            reqwest::Method::GET,
            "auth/keys/openrouter",
            None::<String>,
        )
        .await
}

pub async fn get_credits(
    client: &HttpClient,
) -> Result<super::response::GetCreditsResponse, HttpError> {
    client
        .send_unary(reqwest::Method::GET, "auth/credits", None::<String>)
        .await
}
