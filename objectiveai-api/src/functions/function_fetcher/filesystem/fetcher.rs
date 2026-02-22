//! Local filesystem Function fetcher using git2.

use crate::ctx;

/// Fetches Functions from the local filesystem.
///
/// Functions are stored as `function.json` at the root of local git repositories
/// under `{base_dir}/{owner}/{repository}/`.
pub struct FilesystemFetcher {
    /// Base directory for function repositories (e.g. `$HOME/.objectiveai/functions`).
    pub base_dir: std::path::PathBuf,
}

impl FilesystemFetcher {
    /// Creates a new filesystem Function fetcher.
    pub fn new(base_dir: std::path::PathBuf) -> Self {
        Self { base_dir }
    }
}

#[async_trait::async_trait]
impl<CTXEXT> super::super::Fetcher<CTXEXT> for FilesystemFetcher
where
    CTXEXT: Send + Sync + 'static,
{
    async fn fetch(
        &self,
        _ctx: ctx::Context<CTXEXT>,
        _remote: objectiveai::functions::Remote,
        owner: &str,
        repository: &str,
        commit: Option<&str>,
    ) -> Result<
        Option<objectiveai::functions::response::GetFunction>,
        objectiveai::error::ResponseError,
    > {
        let repo_path = self.base_dir.join(owner).join(repository);

        // Read function.json content (from specific commit or working tree)
        let content = match commit {
            Some(commit_sha) => match read_file_at_commit(&repo_path, "function.json", commit_sha)
            {
                Ok(content) => content,
                Err(_) => return Ok(None),
            },
            None => {
                let file_path = repo_path.join("function.json");
                match tokio::fs::read_to_string(&file_path).await {
                    Ok(content) => content,
                    Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
                    Err(e) => return Err(response_error(500, format!("Failed to read function.json: {}", e))),
                }
            }
        };

        // Parse as RemoteFunction
        let function: objectiveai::functions::RemoteFunction =
            serde_json::from_str(&content).map_err(|e| {
                response_error(400, format!("Failed to parse function.json: {}", e))
            })?;

        // Resolve commit SHA (if not provided, get HEAD)
        let resolved_commit = match commit {
            Some(c) => c.to_string(),
            None => resolve_head(&repo_path).unwrap_or_else(|_| "HEAD".to_string()),
        };

        Ok(Some(objectiveai::functions::response::GetFunction {
            remote: objectiveai::functions::Remote::Filesystem,
            owner: owner.to_string(),
            repository: repository.to_string(),
            commit: resolved_commit,
            inner: function,
        }))
    }
}

fn response_error(code: u16, message: String) -> objectiveai::error::ResponseError {
    objectiveai::error::ResponseError {
        code,
        message: serde_json::Value::String(message),
    }
}

/// Reads a file from a git repository at a specific commit.
fn read_file_at_commit(
    repo_path: &std::path::Path,
    file_name: &str,
    commit_sha: &str,
) -> Result<String, objectiveai::error::ResponseError> {
    let repo = git2::Repository::open(repo_path).map_err(|e| {
        response_error(404, format!("Repository not found at {}: {}", repo_path.display(), e))
    })?;

    let oid = git2::Oid::from_str(commit_sha).map_err(|e| {
        response_error(400, format!("Invalid commit SHA: {}", e))
    })?;

    let commit = repo.find_commit(oid).map_err(|e| {
        response_error(404, format!("Commit not found: {}", e))
    })?;

    let tree = commit.tree().map_err(|e| {
        response_error(500, format!("Failed to get tree: {}", e))
    })?;

    let entry = tree.get_name(file_name).ok_or_else(|| {
        response_error(404, format!("{} not found at commit {}", file_name, commit_sha))
    })?;

    let blob = repo.find_blob(entry.id()).map_err(|e| {
        response_error(500, format!("Failed to read blob: {}", e))
    })?;

    let content = std::str::from_utf8(blob.content()).map_err(|e| {
        response_error(500, format!("Invalid UTF-8 content: {}", e))
    })?;

    Ok(content.to_string())
}

/// Resolves the HEAD commit SHA for a repository.
fn resolve_head(
    repo_path: &std::path::Path,
) -> Result<String, objectiveai::error::ResponseError> {
    let repo = git2::Repository::open(repo_path).map_err(|e| {
        response_error(404, format!("Repository not found at {}: {}", repo_path.display(), e))
    })?;

    let head = repo.head().map_err(|e| {
        response_error(500, format!("Failed to get HEAD: {}", e))
    })?;

    let commit = head.peel_to_commit().map_err(|e| {
        response_error(500, format!("Failed to resolve HEAD: {}", e))
    })?;

    Ok(commit.id().to_string())
}
