//! Function listing and usage response types.

use crate::functions;
use serde::{Deserialize, Serialize};

/// Response from listing functions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListFunction {
    /// List of available functions.
    pub data: Vec<ListFunctionItem>,
}

/// A function in a list response.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListFunctionItem {
    /// GitHub repository owner.
    pub owner: String,
    /// GitHub repository name.
    pub repository: String,
    /// Git commit SHA.
    pub commit: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetFunction {
    pub owner: String,
    pub repository: String,
    pub commit: String,
    #[serde(flatten)]
    pub inner: functions::RemoteFunction,
}

/// Usage statistics for a function.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageFunction {
    /// Total number of requests made with this function.
    pub requests: u64,
    /// Total completion tokens used.
    pub completion_tokens: u64,
    /// Total prompt tokens used.
    pub prompt_tokens: u64,
    /// Total cost incurred.
    pub total_cost: rust_decimal::Decimal,
}

/// Response from listing function-profile pairs.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListFunctionProfilePair {
    /// List of available function-profile pairs.
    pub data: Vec<ListFunctionProfilePairItem>,
}

/// A function-profile pair in a list response.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListFunctionProfilePairItem {
    /// The function.
    pub function: ListFunctionItem,
    /// The profile.
    pub profile: functions::profiles::response::ListProfileItem,
}

/// Response from getting a function-profile pair.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetFunctionProfilePair {
    /// The function.
    pub function: GetFunction,
    /// The profile.
    pub profile: functions::profiles::response::GetProfile,
}

/// Usage statistics for a function-profile pair.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageFunctionProfilePair {
    /// Total number of requests made with this function-profile pair.
    pub requests: u64,
    /// Total completion tokens used.
    pub completion_tokens: u64,
    /// Total prompt tokens used.
    pub prompt_tokens: u64,
    /// Total cost incurred.
    pub total_cost: rust_decimal::Decimal,
}
