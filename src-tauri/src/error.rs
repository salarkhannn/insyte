use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error, Serialize)]
pub enum DataError {
    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("Unsupported file format: {0}")]
    UnsupportedFormat(String),

    #[error("Failed to read file: {0}")]
    ReadError(String),

    #[error("Failed to parse data: {0}")]
    ParseError(String),

    #[error("No data available")]
    NoData,

    #[error("Invalid sheet: {0}")]
    InvalidSheet(String),

    // ============================================================================
    // SAFETY-RELATED ERRORS
    // ============================================================================
    /// Query was blocked due to safety concerns (too many rows, high cardinality, etc.)
    #[error("Query blocked: {reason}")]
    SafetyBlock {
        reason: String,
        original_rows: usize,
        max_allowed: usize,
    },

    /// Cardinality of dimension exceeds safe threshold.
    #[error("High cardinality detected in '{column}': {unique_count} unique values exceeds limit of {threshold}")]
    CardinalityExceeded {
        column: String,
        unique_count: usize,
        threshold: usize,
    },

    /// Memory estimate exceeds safe threshold.
    #[error("Estimated memory usage ({estimated_mb}MB) exceeds budget ({budget_mb}MB)")]
    MemoryBudgetExceeded {
        estimated_mb: usize,
        budget_mb: usize,
    },

    /// Query would produce too many points for visualization.
    #[error("Query would produce {estimated_points} points, exceeding limit of {max_points}")]
    TooManyPoints {
        estimated_points: usize,
        max_points: usize,
    },

    /// Required column not found in dataset.
    #[error("Column '{column}' not found in dataset. Available columns: {available}")]
    ColumnNotFound { column: String, available: String },

    /// Incompatible data type for requested operation.
    #[error("Column '{column}' has type '{actual_type}' but operation requires '{expected_type}'")]
    TypeMismatch {
        column: String,
        actual_type: String,
        expected_type: String,
    },

    /// Query cancelled by user or timeout.
    #[error("Query cancelled: {reason}")]
    QueryCancelled { reason: String },

    #[error("Failed to write data: {0}")]
    WriteError(String),

    #[error("Operation cancelled")]
    Cancelled,
}

impl From<std::io::Error> for DataError {
    fn from(err: std::io::Error) -> Self {
        DataError::ReadError(err.to_string())
    }
}

impl From<polars::prelude::PolarsError> for DataError {
    fn from(err: polars::prelude::PolarsError) -> Self {
        DataError::ParseError(err.to_string())
    }
}

impl From<calamine::Error> for DataError {
    fn from(err: calamine::Error) -> Self {
        DataError::ReadError(err.to_string())
    }
}

impl From<calamine::XlsxError> for DataError {
    fn from(err: calamine::XlsxError) -> Self {
        DataError::ReadError(err.to_string())
    }
}

#[derive(Debug, thiserror::Error)]
pub enum AIError {
    #[error("API request failed: {0}")]
    RequestFailed(String),

    #[error("Invalid API key")]
    InvalidApiKey,

    #[error("API key not configured")]
    ApiKeyNotSet,

    #[error("Failed to parse API response: {0}")]
    ParseError(String),

    #[error("Rate limit exceeded")]
    RateLimitExceeded,

    #[error("Model not available: {0}")]
    ModelNotAvailable(String),
}

impl serde::Serialize for AIError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ProjectError {
    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("Invalid project format: {0}")]
    InvalidFormat(String),

    #[error("Version mismatch: file version {file_version}, app version {app_version}")]
    VersionMismatch {
        file_version: String,
        app_version: String,
    },

    #[error("Failed to read project: {0}")]
    ReadError(String),

    #[error("Failed to write project: {0}")]
    WriteError(String),

    #[error("No data loaded")]
    NoData,

    #[error("Operation cancelled")]
    Cancelled,
}

impl serde::Serialize for ProjectError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
