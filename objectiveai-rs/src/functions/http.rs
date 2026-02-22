//! HTTP functions for function management.

use super::Remote;
use crate::{HttpClient, HttpError};

/// Lists all functions accessible to the authenticated user.
///
/// # Arguments
///
/// * `client` - The HTTP client to use
///
/// # Returns
///
/// A list of functions with their repository information.
pub async fn list_functions(
    client: &HttpClient,
) -> Result<super::response::ListFunction, HttpError> {
    client
        .send_unary(reqwest::Method::GET, "functions", None::<String>)
        .await
}

/// Retrieves a function definition from a remote source.
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
/// The function definition including its tasks, input schema, and output configuration.
pub async fn get_function(
    client: &HttpClient,
    remote: Remote,
    owner: &str,
    repository: &str,
    commit: Option<&str>,
) -> Result<super::response::GetFunction, HttpError> {
    let path = match commit {
        Some(commit) => {
            format!("functions/{}/{}/{}/{}", remote, owner, repository, commit)
        }
        None => format!("functions/{}/{}/{}", remote, owner, repository),
    };
    client
        .send_unary(reqwest::Method::GET, &path, None::<String>)
        .await
}

/// Gets usage statistics for a specific function.
///
/// # Arguments
///
/// * `client` - The HTTP client to use
/// * `fremote` - The function remote source type
/// * `fowner` - Repository owner
/// * `frepository` - Repository name
/// * `fcommit` - Optional Git commit SHA (uses latest if not specified)
///
/// # Returns
///
/// Usage statistics including request count, token usage, and cost.
pub async fn get_function_usage(
    client: &HttpClient,
    fremote: Remote,
    fowner: &str,
    frepository: &str,
    fcommit: Option<&str>,
) -> Result<super::response::UsageFunction, HttpError> {
    let path = match fcommit {
        Some(fcommit) => {
            format!(
                "functions/{}/{}/{}/{}/usage",
                fremote, fowner, frepository, fcommit
            )
        }
        None => format!("functions/{}/{}/{}/usage", fremote, fowner, frepository),
    };
    client
        .send_unary(reqwest::Method::GET, &path, None::<String>)
        .await
}

/// Lists all function-profile pairs accessible to the authenticated user.
///
/// # Arguments
///
/// * `client` - The HTTP client to use
///
/// # Returns
///
/// A list of function-profile pairs with their repository information.
pub async fn list_function_profile_pairs(
    client: &HttpClient,
) -> Result<super::response::ListFunctionProfilePair, HttpError> {
    client
        .send_unary(
            reqwest::Method::GET,
            "functions/profiles/pairs",
            None::<String>,
        )
        .await
}

/// Retrieves a function-profile pair from remote sources.
///
/// # Arguments
///
/// * `client` - The HTTP client to use
/// * `fremote` - Function remote source type
/// * `fowner` - Function repository owner
/// * `frepository` - Function repository name
/// * `fcommit` - Optional function Git commit SHA (uses latest if not specified)
/// * `premote` - Profile remote source type
/// * `powner` - Profile repository owner
/// * `prepository` - Profile repository name
/// * `pcommit` - Optional profile Git commit SHA (uses latest if not specified)
///
/// # Returns
///
/// The function and profile definitions.
pub async fn get_function_profile_pair(
    client: &HttpClient,
    fremote: Remote,
    fowner: &str,
    frepository: &str,
    fcommit: Option<&str>,
    premote: Remote,
    powner: &str,
    prepository: &str,
    pcommit: Option<&str>,
) -> Result<super::response::GetFunctionProfilePair, HttpError> {
    let path = match (fcommit, pcommit) {
        (Some(fcommit), Some(pcommit)) => format!(
            "functions/{}/{}/{}/{}/profiles/{}/{}/{}/{}",
            fremote, fowner, frepository, fcommit, premote, powner, prepository, pcommit
        ),
        (Some(fcommit), None) => format!(
            "functions/{}/{}/{}/{}/profiles/{}/{}/{}",
            fremote, fowner, frepository, fcommit, premote, powner, prepository
        ),
        (None, Some(pcommit)) => format!(
            "functions/{}/{}/{}/profiles/{}/{}/{}/{}",
            fremote, fowner, frepository, premote, powner, prepository, pcommit
        ),
        (None, None) => format!(
            "functions/{}/{}/{}/profiles/{}/{}/{}",
            fremote, fowner, frepository, premote, powner, prepository
        ),
    };
    client
        .send_unary(reqwest::Method::GET, &path, None::<String>)
        .await
}

/// Gets usage statistics for a specific function-profile pair.
///
/// # Arguments
///
/// * `client` - The HTTP client to use
/// * `fremote` - Function remote source type
/// * `fowner` - Function repository owner
/// * `frepository` - Function repository name
/// * `fcommit` - Optional function Git commit SHA (uses latest if not specified)
/// * `premote` - Profile remote source type
/// * `powner` - Profile repository owner
/// * `prepository` - Profile repository name
/// * `pcommit` - Optional profile Git commit SHA (uses latest if not specified)
///
/// # Returns
///
/// Usage statistics including request count, token usage, and cost.
pub async fn get_function_profile_pair_usage(
    client: &HttpClient,
    fremote: Remote,
    fowner: &str,
    frepository: &str,
    fcommit: Option<&str>,
    premote: Remote,
    powner: &str,
    prepository: &str,
    pcommit: Option<&str>,
) -> Result<super::response::UsageFunctionProfilePair, HttpError> {
    let path = match (fcommit, pcommit) {
        (Some(fcommit), Some(pcommit)) => format!(
            "functions/{}/{}/{}/{}/profiles/{}/{}/{}/{}/usage",
            fremote, fowner, frepository, fcommit, premote, powner, prepository, pcommit
        ),
        (Some(fcommit), None) => format!(
            "functions/{}/{}/{}/{}/profiles/{}/{}/{}/usage",
            fremote, fowner, frepository, fcommit, premote, powner, prepository
        ),
        (None, Some(pcommit)) => format!(
            "functions/{}/{}/{}/profiles/{}/{}/{}/{}/usage",
            fremote, fowner, frepository, premote, powner, prepository, pcommit
        ),
        (None, None) => format!(
            "functions/{}/{}/{}/profiles/{}/{}/{}/usage",
            fremote, fowner, frepository, premote, powner, prepository
        ),
    };
    client
        .send_unary(reqwest::Method::GET, &path, None::<String>)
        .await
}
