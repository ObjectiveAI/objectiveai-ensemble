//! HTTP functions for function management.

use crate::{HttpClient, HttpError};

/// Lists all functions accessible to the authenticated user.
///
/// # Arguments
///
/// * `client` - The HTTP client to use
///
/// # Returns
///
/// A list of functions with their GitHub repository information.
pub async fn list_functions(
    client: &HttpClient,
) -> Result<super::response::ListFunction, HttpError> {
    client
        .send_unary(reqwest::Method::GET, "functions", None::<String>)
        .await
}

/// Retrieves a function definition from a GitHub repository.
///
/// # Arguments
///
/// * `client` - The HTTP client to use
/// * `owner` - GitHub repository owner
/// * `repository` - GitHub repository name
/// * `commit` - Optional Git commit SHA (uses latest if not specified)
///
/// # Returns
///
/// The function definition including its tasks, input schema, and output configuration.
pub async fn get_function(
    client: &HttpClient,
    owner: &str,
    repository: &str,
    commit: Option<&str>,
) -> Result<super::response::GetFunction, HttpError> {
    let path = match commit {
        Some(commit) => {
            format!("functions/{}/{}/{}", owner, repository, commit)
        }
        None => format!("functions/{}/{}", owner, repository),
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
/// * `fowner` - GitHub repository owner
/// * `frepository` - GitHub repository name
/// * `fcommit` - Optional Git commit SHA (uses latest if not specified)
///
/// # Returns
///
/// Usage statistics including request count, token usage, and cost.
pub async fn get_function_usage(
    client: &HttpClient,
    fowner: &str,
    frepository: &str,
    fcommit: Option<&str>,
) -> Result<super::response::UsageFunction, HttpError> {
    let path = match fcommit {
        Some(fcommit) => {
            format!("functions/{}/{}/{}/usage", fowner, frepository, fcommit)
        }
        None => format!("functions/{}/{}/usage", fowner, frepository),
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
/// A list of function-profile pairs with their GitHub repository information.
pub async fn list_function_profile_pairs(
    client: &HttpClient,
) -> Result<super::response::ListFunctionProfilePair, HttpError> {
    client
        .send_unary(reqwest::Method::GET, "functions/profiles/pairs", None::<String>)
        .await
}

/// Retrieves a function-profile pair from GitHub repositories.
///
/// # Arguments
///
/// * `client` - The HTTP client to use
/// * `fowner` - Function GitHub repository owner
/// * `frepository` - Function GitHub repository name
/// * `fcommit` - Optional function Git commit SHA (uses latest if not specified)
/// * `powner` - Profile GitHub repository owner
/// * `prepository` - Profile GitHub repository name
/// * `pcommit` - Optional profile Git commit SHA (uses latest if not specified)
///
/// # Returns
///
/// The function and profile definitions.
pub async fn get_function_profile_pair(
    client: &HttpClient,
    fowner: &str,
    frepository: &str,
    fcommit: Option<&str>,
    powner: &str,
    prepository: &str,
    pcommit: Option<&str>,
) -> Result<super::response::GetFunctionProfilePair, HttpError> {
    let path = match (fcommit, pcommit) {
        (Some(fcommit), Some(pcommit)) => format!(
            "functions/{}/{}/{}/profiles/{}/{}/{}",
            fowner, frepository, fcommit, powner, prepository, pcommit
        ),
        (Some(fcommit), None) => format!(
            "functions/{}/{}/{}/profiles/{}/{}",
            fowner, frepository, fcommit, powner, prepository
        ),
        (None, Some(pcommit)) => format!(
            "functions/{}/{}/profiles/{}/{}/{}",
            fowner, frepository, powner, prepository, pcommit
        ),
        (None, None) => format!(
            "functions/{}/{}/profiles/{}/{}",
            fowner, frepository, powner, prepository
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
/// * `fowner` - Function GitHub repository owner
/// * `frepository` - Function GitHub repository name
/// * `fcommit` - Optional function Git commit SHA (uses latest if not specified)
/// * `powner` - Profile GitHub repository owner
/// * `prepository` - Profile GitHub repository name
/// * `pcommit` - Optional profile Git commit SHA (uses latest if not specified)
///
/// # Returns
///
/// Usage statistics including request count, token usage, and cost.
pub async fn get_function_profile_pair_usage(
    client: &HttpClient,
    fowner: &str,
    frepository: &str,
    fcommit: Option<&str>,
    powner: &str,
    prepository: &str,
    pcommit: Option<&str>,
) -> Result<super::response::UsageFunctionProfilePair, HttpError> {
    let path = match (fcommit, pcommit) {
        (Some(fcommit), Some(pcommit)) => format!(
            "functions/{}/{}/{}/profiles/{}/{}/{}/usage",
            fowner, frepository, fcommit, powner, prepository, pcommit
        ),
        (Some(fcommit), None) => format!(
            "functions/{}/{}/{}/profiles/{}/{}/usage",
            fowner, frepository, fcommit, powner, prepository
        ),
        (None, Some(pcommit)) => format!(
            "functions/{}/{}/profiles/{}/{}/{}/usage",
            fowner, frepository, powner, prepository, pcommit
        ),
        (None, None) => format!(
            "functions/{}/{}/profiles/{}/{}/usage",
            fowner, frepository, powner, prepository
        ),
    };
    client
        .send_unary(reqwest::Method::GET, &path, None::<String>)
        .await
}
