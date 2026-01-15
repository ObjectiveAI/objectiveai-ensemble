use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum Object {
    #[serde(rename = "function.profile.compute.chunk")]
    FunctionOptimizeResponseChunk,
}
