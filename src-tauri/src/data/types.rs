use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColumnInfo {
    pub name: String,
    pub dtype: String,
    pub nullable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatasetInfo {
    pub file_name: String,
    pub file_path: String,
    pub file_size: u64,
    pub row_count: usize,
    pub columns: Vec<ColumnInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataPage {
    pub rows: Vec<Vec<serde_json::Value>>,
    pub total_rows: usize,
    pub offset: usize,
    pub limit: usize,
}

/// Reason for data reduction - used for UI feedback.
/// Matches the frontend enum for direct serialization.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum ReductionReason {
    /// Data was aggregated (grouped and summarized).
    AutoAggregation,
    /// Data was sampled to reduce point count.
    Sampling,
    /// High-cardinality field was reduced to Top-N + Others.
    TopN,
    /// Date field was auto-binned (year/month/day).
    DateBinning,
    /// Multiple reductions were applied.
    Combined,
    /// No reduction was necessary.
    None,
}

/// Individual reduction step for audit trail.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReductionStep {
    pub step_type: ReductionReason,
    pub input_rows: usize,
    pub output_rows: usize,
    pub description: String,
}

/// This allows the UI to inform users about data transformations.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReductionMetadata {
    /// Whether any reduction was applied.
    pub reduced: bool,

    /// Primary reason for reduction.
    pub reduction_reason: ReductionReason,

    /// Estimated row count before transformations.
    pub original_row_estimate: usize,

    /// Actual number of points returned.
    pub returned_points: usize,

    /// Sampling ratio if sampling was applied (0.0-1.0).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sample_ratio: Option<f64>,

    /// Top-N value if Top-N reduction was applied.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_n_value: Option<usize>,

    /// Binning granularity if date binning was applied.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub date_bin_granularity: Option<String>,

    /// Whether distribution shape was preserved.
    pub distribution_preserved: bool,

    /// Human-readable warning message for UI display.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub warning_message: Option<String>,

    /// Detailed breakdown of all reductions applied.
    pub reduction_steps: Vec<ReductionStep>,
}

impl Default for ReductionMetadata {
    fn default() -> Self {
        Self {
            reduced: false,
            reduction_reason: ReductionReason::None,
            original_row_estimate: 0,
            returned_points: 0,
            sample_ratio: None,
            top_n_value: None,
            date_bin_granularity: None,
            distribution_preserved: true,
            warning_message: None,
            reduction_steps: vec![],
        }
    }
}

impl ReductionMetadata {
    /// Create metadata indicating no reduction was applied.
    pub fn no_reduction(row_count: usize) -> Self {
        Self {
            reduced: false,
            reduction_reason: ReductionReason::None,
            original_row_estimate: row_count,
            returned_points: row_count,
            distribution_preserved: true,
            ..Default::default()
        }
    }
}

/// Extended chart metadata including reduction information.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtendedChartMetadata {
    /// Original chart metadata fields.
    pub title: String,
    pub x_label: String,
    pub y_label: String,
    pub total_records: usize,

    /// Reduction metadata for UI feedback.
    pub reduction: ReductionMetadata,

    /// Whether data was reduced (convenience field).
    pub data_reduced: bool,

    /// Warning message if applicable.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub warning: Option<String>,
}

impl ExtendedChartMetadata {
    pub fn new(
        title: String,
        x_label: String,
        y_label: String,
        total_records: usize,
        reduction: ReductionMetadata,
    ) -> Self {
        let data_reduced = reduction.reduced;
        let warning = reduction.warning_message.clone();

        Self {
            title,
            x_label,
            y_label,
            total_records,
            reduction,
            data_reduced,
            warning,
        }
    }
}
