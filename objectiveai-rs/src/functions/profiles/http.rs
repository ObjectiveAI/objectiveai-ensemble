//! HTTP functions for profile management.

use crate::functions::Remote;
use crate::{HttpClient, HttpError};

/// Lists all profiles accessible to the authenticated user.
///
/// # Arguments
///
/// * `client` - The HTTP client to use
///
/// # Returns
///
/// A list of profiles with their repository information.
pub async fn list_profiles(
    client: &HttpClient,
) -> Result<super::response::ListProfile, HttpError> {
    client
        .send_unary(reqwest::Method::GET, "functions/profiles", None::<String>)
        .await
}

/// Retrieves a profile definition from a remote source.
///
/// # Arguments
///
/// * `client` - The HTTP client to use
/// * `remote` - The remote source type
/// * `owner` - Repository owner
/// * `repository` - Repository name
/// * `commit` - Optional Git commit SHA (uses latest if not specified)
///
/// # Returns
///
/// The profile definition including its learned weights and associated function.
pub async fn get_profile(
    client: &HttpClient,
    remote: Remote,
    owner: &str,
    repository: &str,
    commit: Option<&str>,
) -> Result<super::response::GetProfile, HttpError> {
    let path = match commit {
        Some(commit) => {
            format!(
                "functions/profiles/{}/{}/{}/{}",
                remote, owner, repository, commit
            )
        }
        None => format!("functions/profiles/{}/{}/{}", remote, owner, repository),
    };
    client
        .send_unary(reqwest::Method::GET, &path, None::<String>)
        .await
}

/// Gets usage statistics for a specific profile.
///
/// # Arguments
///
/// * `client` - The HTTP client to use
/// * `premote` - The profile remote source type
/// * `powner` - Repository owner
/// * `prepository` - Repository name
/// * `pcommit` - Optional Git commit SHA (uses latest if not specified)
///
/// # Returns
///
/// Usage statistics including request count, token usage, and cost.
pub async fn get_profile_usage(
    client: &HttpClient,
    premote: Remote,
    powner: &str,
    prepository: &str,
    pcommit: Option<&str>,
) -> Result<super::response::UsageProfile, HttpError> {
    let path = match pcommit {
        Some(pcommit) => {
            format!(
                "functions/profiles/{}/{}/{}/{}/usage",
                premote, powner, prepository, pcommit
            )
        }
        None => {
            format!(
                "functions/profiles/{}/{}/{}/usage",
                premote, powner, prepository
            )
        }
    };
    client
        .send_unary(reqwest::Method::GET, &path, None::<String>)
        .await
}
