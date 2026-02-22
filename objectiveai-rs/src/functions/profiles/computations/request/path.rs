use crate::functions::Remote;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionRemoteRequestPath {
    pub fremote: Remote,
    pub fowner: String,
    pub frepository: String,
    pub fcommit: Option<String>,
}
