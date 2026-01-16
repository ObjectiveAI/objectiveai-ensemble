use crate::vector;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Profile {
    Remote(RemoteProfile),
    Inline(InlineProfile),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoteProfile {
    pub description: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub changelog: Option<String>,
    pub tasks: Vec<TaskProfile>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InlineProfile {
    pub tasks: Vec<TaskProfile>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum TaskProfile {
    RemoteFunction {
        owner: String,
        repository: String,
        commit: Option<String>,
    },
    InlineFunction(InlineProfile),
    VectorCompletion {
        ensemble: vector::completions::request::Ensemble,
        profile: Vec<rust_decimal::Decimal>,
    },
}

impl TaskProfile {
    // returns 'false' if any remote function is missing a commit
    pub fn validate_commit_required(&self) -> bool {
        match self {
            TaskProfile::RemoteFunction { commit, .. } => commit.is_some(),
            TaskProfile::InlineFunction(inline) => inline
                .tasks
                .iter()
                .all(TaskProfile::validate_commit_required),
            TaskProfile::VectorCompletion { .. } => true,
        }
    }
}
