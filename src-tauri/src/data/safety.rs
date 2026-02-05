//! # Safety Module for Visualization Query Pipeline
//!
//! This module implements all safety checks and transformations required to prevent
//! crashes, UI freezes, and memory explosions when rendering visualizations with
//! potentially millions of rows.
//!
//! ## Design Principle
//! "The user expresses intent. The system decides what is safe."
//!
//! ## Non-negotiable Constraints
//! - Never render raw rows by default
//! - Enforce strict per-visual point limits (50,000 max)
//! - Always fail safely: no panics, no blocking the UI thread
//! - All heavy computation must be cancellable

use polars::prelude::*;
use serde::{Deserialize, Serialize};
// Safety configuration and types for hardened query pipeline

// ============================================================================
// SAFETY CONFIGURATION CONSTANTS
// ============================================================================

/// Maximum number of points any visualization can render.
/// Beyond this, even aggregated data must be further reduced.
pub const MAX_VISUAL_POINTS: usize = 50_000;

/// Default point limit for bar/line charts (aggregated bins).
pub const DEFAULT_BAR_LINE_LIMIT: usize = 500;

/// Default point limit for scatter plots (after sampling).
pub const DEFAULT_SCATTER_LIMIT: usize = 10_000;

/// Default row limit for table pagination.
pub const DEFAULT_TABLE_PAGE_SIZE: usize = 100;

/// Maximum cardinality before forcing Top-N + Others aggregation.
pub const HIGH_CARDINALITY_THRESHOLD: usize = 1_000;

/// Cardinality threshold for categorical fields before auto-aggregation.
pub const CATEGORICAL_CARDINALITY_THRESHOLD: usize = 100;

/// Default number of top categories to show (rest becomes "Others").
pub const DEFAULT_TOP_N: usize = 20;

/// Seed for deterministic sampling to ensure stable results across re-renders.
pub const SAMPLING_SEED: u64 = 42;

/// Memory budget estimate per row (bytes) for safety calculations.
pub const ESTIMATED_BYTES_PER_ROW: usize = 256;

/// Maximum memory budget (bytes) before forcing reduction.
pub const MAX_MEMORY_BUDGET: usize = 100 * 1024 * 1024; // 100MB

// ============================================================================
// REDUCTION METADATA
// ============================================================================

/// Reason for data reduction - used for UI feedback.
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

/// Structured metadata returned with every plot result.
/// This metadata allows the UI to clearly inform the user about data transformations.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReductionMetadata {
    /// Whether any reduction was applied.
    pub reduced: bool,

    /// Primary reason for reduction (or None if no reduction).
    pub reduction_reason: ReductionReason,

    /// Estimated row count before any transformations.
    pub original_row_estimate: usize,

    /// Actual number of points/rows returned.
    pub returned_points: usize,

    /// Sampling ratio if sampling was applied (0.0-1.0).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sample_ratio: Option<f64>,

    /// Top-N value if Top-N reduction was applied.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_n_value: Option<usize>,

    /// Binning granularity if date binning was applied.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub date_bin_granularity: Option<DateBinGranularity>,

    /// Whether distribution shape was preserved (for sampling).
    pub distribution_preserved: bool,

    /// Human-readable warning message for the UI.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub warning_message: Option<String>,

    /// Detailed breakdown of all reductions applied.
    pub reduction_steps: Vec<ReductionStep>,
}

/// Individual reduction step for detailed audit trail.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReductionStep {
    pub step_type: ReductionReason,
    pub input_rows: usize,
    pub output_rows: usize,
    pub description: String,
}

impl ReductionMetadata {
    /// Create metadata indicating no reduction was applied.
    pub fn no_reduction(row_count: usize) -> Self {
        Self {
            reduced: false,
            reduction_reason: ReductionReason::None,
            original_row_estimate: row_count,
            returned_points: row_count,
            sample_ratio: None,
            top_n_value: None,
            date_bin_granularity: None,
            distribution_preserved: true,
            warning_message: None,
            reduction_steps: vec![],
        }
    }

    /// Create metadata for aggregation reduction.
    pub fn aggregated(original: usize, returned: usize) -> Self {
        Self {
            reduced: true,
            reduction_reason: ReductionReason::AutoAggregation,
            original_row_estimate: original,
            returned_points: returned,
            sample_ratio: None,
            top_n_value: None,
            date_bin_granularity: None,
            distribution_preserved: true,
            warning_message: Some(format!(
                "Data was automatically aggregated from {} to {} groups",
                format_number(original),
                format_number(returned)
            )),
            reduction_steps: vec![ReductionStep {
                step_type: ReductionReason::AutoAggregation,
                input_rows: original,
                output_rows: returned,
                description: "Auto-aggregation applied".to_string(),
            }],
        }
    }

    /// Create metadata for sampling reduction.
    pub fn sampled(original: usize, returned: usize, ratio: f64) -> Self {
        Self {
            reduced: true,
            reduction_reason: ReductionReason::Sampling,
            original_row_estimate: original,
            returned_points: returned,
            sample_ratio: Some(ratio),
            top_n_value: None,
            date_bin_granularity: None,
            distribution_preserved: true,
            warning_message: Some(format!(
                "Showing {:.1}% sample ({} of {} rows) for performance",
                ratio * 100.0,
                format_number(returned),
                format_number(original)
            )),
            reduction_steps: vec![ReductionStep {
                step_type: ReductionReason::Sampling,
                input_rows: original,
                output_rows: returned,
                description: format!("Deterministic sampling at {:.1}% ratio", ratio * 100.0),
            }],
        }
    }

    /// Create metadata for Top-N reduction.
    pub fn top_n(original: usize, n: usize, has_others: bool) -> Self {
        let returned = if has_others { n + 1 } else { n };
        Self {
            reduced: true,
            reduction_reason: ReductionReason::TopN,
            original_row_estimate: original,
            returned_points: returned,
            sample_ratio: None,
            top_n_value: Some(n),
            date_bin_granularity: None,
            distribution_preserved: true,
            warning_message: Some(format!(
                "Showing top {} categories{} from {} unique values",
                n,
                if has_others { " (+ Others)" } else { "" },
                format_number(original)
            )),
            reduction_steps: vec![ReductionStep {
                step_type: ReductionReason::TopN,
                input_rows: original,
                output_rows: returned,
                description: format!("Top-{} with Others bucket", n),
            }],
        }
    }

    /// Add a reduction step to existing metadata.
    pub fn add_step(&mut self, step: ReductionStep) {
        self.reduction_steps.push(step);
        if self.reduction_steps.len() > 1 {
            self.reduction_reason = ReductionReason::Combined;
        }
    }

    /// Merge another reduction metadata into this one.
    pub fn merge(&mut self, other: ReductionMetadata) {
        if other.reduced {
            self.reduced = true;
            self.reduction_steps.extend(other.reduction_steps);
            if let Some(ratio) = other.sample_ratio {
                self.sample_ratio = Some(ratio);
            }
            if let Some(n) = other.top_n_value {
                self.top_n_value = Some(n);
            }
            if let Some(gran) = other.date_bin_granularity {
                self.date_bin_granularity = Some(gran);
            }
            if self.reduction_steps.len() > 1 {
                self.reduction_reason = ReductionReason::Combined;
            }
        }
    }
}

// ============================================================================
// CARDINALITY DETECTION
// ============================================================================

/// Represents the cardinality level of a field.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CardinalityLevel {
    /// Very few unique values (< 10) - safe for any visualization.
    Low,
    /// Moderate unique values (10-100) - safe for most visualizations.
    Medium,
    /// Many unique values (100-1000) - may need Top-N reduction.
    High,
    /// Too many unique values (> 1000) - requires aggregation or sampling.
    VeryHigh,
    /// Continuous values (numeric) - needs binning.
    Continuous,
}

/// Detailed cardinality information for a column.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CardinalityInfo {
    pub column_name: String,
    pub unique_count: usize,
    pub total_count: usize,
    pub cardinality_level: CardinalityLevel,
    pub is_numeric: bool,
    pub is_datetime: bool,
    pub null_count: usize,
    /// Recommended action based on cardinality analysis.
    pub recommended_action: CardinalityAction,
}

/// Recommended action based on cardinality analysis.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CardinalityAction {
    /// Field is safe to use as-is.
    NoAction,
    /// Apply Top-N reduction with specified N.
    ApplyTopN(usize),
    /// Apply numeric binning with specified bin count.
    ApplyBinning(usize),
    /// Apply date binning with specified granularity.
    ApplyDateBinning(DateBinGranularity),
    /// Apply sampling with specified ratio.
    ApplySampling(f64),
    /// Block visualization with actionable warning.
    BlockWithWarning(String),
}

/// Date binning granularity options.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum DateBinGranularity {
    Year,
    Quarter,
    Month,
    Week,
    Day,
    Hour,
}

impl CardinalityInfo {
    /// Estimate cardinality for a column using efficient sampling.
    /// Uses head sampling for estimation to avoid scanning entire dataset.
    pub fn estimate(series: &Series, total_rows: usize) -> Self {
        let column_name = series.name().to_string();
        let is_numeric = matches!(
            series.dtype(),
            DataType::Int8
                | DataType::Int16
                | DataType::Int32
                | DataType::Int64
                | DataType::UInt8
                | DataType::UInt16
                | DataType::UInt32
                | DataType::UInt64
                | DataType::Float32
                | DataType::Float64
        );
        let is_datetime = matches!(
            series.dtype(),
            DataType::Date | DataType::Datetime(_, _) | DataType::Time
        );

        // For large datasets, sample to estimate cardinality efficiently
        let sample_size = 10_000.min(total_rows);
        let sampled = if total_rows > sample_size {
            series.head(Some(sample_size))
        } else {
            series.clone()
        };

        let unique_count = sampled.n_unique().unwrap_or(0);
        let null_count = sampled.null_count();

        // Extrapolate unique count for full dataset
        let estimated_unique = if total_rows > sample_size {
            // Use capture-recapture estimation
            let ratio = total_rows as f64 / sample_size as f64;
            ((unique_count as f64) * ratio.ln().max(1.0)).ceil() as usize
        } else {
            unique_count
        };

        let cardinality_level = if is_numeric && !is_datetime {
            CardinalityLevel::Continuous
        } else if estimated_unique <= 10 {
            CardinalityLevel::Low
        } else if estimated_unique <= 100 {
            CardinalityLevel::Medium
        } else if estimated_unique <= HIGH_CARDINALITY_THRESHOLD {
            CardinalityLevel::High
        } else {
            CardinalityLevel::VeryHigh
        };

        // Determine recommended action
        let recommended_action = Self::determine_action(
            cardinality_level,
            is_numeric,
            is_datetime,
            estimated_unique,
            total_rows,
        );

        Self {
            column_name,
            unique_count: estimated_unique,
            total_count: total_rows,
            cardinality_level,
            is_numeric,
            is_datetime,
            null_count,
            recommended_action,
        }
    }

    fn determine_action(
        level: CardinalityLevel,
        _is_numeric: bool,
        is_datetime: bool,
        unique_count: usize,
        total_rows: usize,
    ) -> CardinalityAction {
        match level {
            CardinalityLevel::Low | CardinalityLevel::Medium => CardinalityAction::NoAction,

            CardinalityLevel::High => {
                if is_datetime {
                    CardinalityAction::ApplyDateBinning(DateBinGranularity::Month)
                } else {
                    CardinalityAction::ApplyTopN(DEFAULT_TOP_N)
                }
            }

            CardinalityLevel::VeryHigh => {
                if is_datetime {
                    // Auto-select granularity based on cardinality
                    let granularity = if unique_count > 10_000 {
                        DateBinGranularity::Year
                    } else if unique_count > 1_000 {
                        DateBinGranularity::Month
                    } else {
                        DateBinGranularity::Day
                    };
                    CardinalityAction::ApplyDateBinning(granularity)
                } else {
                    // Force Top-N for very high cardinality categorical
                    CardinalityAction::ApplyTopN(DEFAULT_TOP_N)
                }
            }

            CardinalityLevel::Continuous => {
                if is_datetime {
                    CardinalityAction::ApplyDateBinning(DateBinGranularity::Month)
                } else if total_rows > MAX_VISUAL_POINTS {
                    // For continuous numeric with many rows, apply binning
                    let bin_count = (total_rows as f64).sqrt().ceil() as usize;
                    CardinalityAction::ApplyBinning(bin_count.min(100))
                } else {
                    CardinalityAction::NoAction
                }
            }
        }
    }
}

// ============================================================================
// VISUALIZATION-SPECIFIC SAFETY RULES
// ============================================================================

/// Safety configuration for different chart types.
#[derive(Debug, Clone)]
pub struct ChartSafetyConfig {
    /// Maximum number of data points allowed.
    pub max_points: usize,
    /// Whether aggregation is required (never show raw rows).
    pub requires_aggregation: bool,
    /// Whether sampling is allowed as a fallback.
    pub allows_sampling: bool,
    /// Whether pagination is supported.
    pub supports_pagination: bool,
    /// Maximum bin count for aggregated charts.
    pub max_bins: usize,
    /// Description for warning messages.
    pub chart_type_name: &'static str,
}

impl ChartSafetyConfig {
    /// Get safety configuration for bar charts.
    /// Bar charts MUST be aggregated - never show raw rows.
    pub fn bar() -> Self {
        Self {
            max_points: DEFAULT_BAR_LINE_LIMIT,
            requires_aggregation: true,
            allows_sampling: false,
            supports_pagination: false,
            max_bins: 500,
            chart_type_name: "Bar chart",
        }
    }

    /// Get safety configuration for line charts.
    /// Line charts require aggregation for time series.
    pub fn line() -> Self {
        Self {
            max_points: DEFAULT_BAR_LINE_LIMIT,
            requires_aggregation: true,
            allows_sampling: false,
            supports_pagination: false,
            max_bins: 1000,
            chart_type_name: "Line chart",
        }
    }

    /// Get safety configuration for area charts.
    pub fn area() -> Self {
        Self {
            max_points: DEFAULT_BAR_LINE_LIMIT,
            requires_aggregation: true,
            allows_sampling: false,
            supports_pagination: false,
            max_bins: 500,
            chart_type_name: "Area chart",
        }
    }

    /// Get safety configuration for pie charts.
    /// Pie charts have strict limits due to visual clarity.
    pub fn pie() -> Self {
        Self {
            max_points: 20, // Pie charts become unreadable with many slices
            requires_aggregation: true,
            allows_sampling: false,
            supports_pagination: false,
            max_bins: 20,
            chart_type_name: "Pie chart",
        }
    }

    /// Get safety configuration for scatter plots.
    /// Scatter plots allow sampling for dense point clouds.
    pub fn scatter() -> Self {
        Self {
            max_points: DEFAULT_SCATTER_LIMIT,
            requires_aggregation: false, // Scatter can show individual points
            allows_sampling: true,
            supports_pagination: false,
            max_bins: 0, // No binning for scatter
            chart_type_name: "Scatter plot",
        }
    }

    /// Get safety configuration for heatmaps.
    /// Heatmaps require binning on both axes.
    pub fn heatmap() -> Self {
        Self {
            max_points: 10_000, // 100x100 grid max
            requires_aggregation: true,
            allows_sampling: false,
            supports_pagination: false,
            max_bins: 100,
            chart_type_name: "Heatmap",
        }
    }

    /// Get safety configuration for tables.
    /// Tables use pagination only - never load all rows.
    pub fn table() -> Self {
        Self {
            max_points: DEFAULT_TABLE_PAGE_SIZE,
            requires_aggregation: false,
            allows_sampling: false,
            supports_pagination: true,
            max_bins: 0,
            chart_type_name: "Table",
        }
    }

    /// Get configuration for a chart type string.
    pub fn for_chart_type(chart_type: &str) -> Self {
        match chart_type.to_lowercase().as_str() {
            "bar" => Self::bar(),
            "line" => Self::line(),
            "area" => Self::area(),
            "pie" => Self::pie(),
            "scatter" => Self::scatter(),
            "heatmap" => Self::heatmap(),
            "table" => Self::table(),
            _ => Self::bar(), // Default to safe bar chart config
        }
    }
}

// ============================================================================
// MEMORY SAFETY ESTIMATION
// ============================================================================

/// Estimate memory usage and determine if processing is safe.
#[derive(Debug, Clone)]
pub struct MemorySafetyCheck {
    pub estimated_bytes: usize,
    pub is_safe: bool,
    pub recommendation: String,
}

impl MemorySafetyCheck {
    /// Estimate memory usage for a query result.
    pub fn estimate(row_count: usize, column_count: usize) -> Self {
        let estimated_bytes = row_count * column_count * ESTIMATED_BYTES_PER_ROW / column_count.max(1);
        let is_safe = estimated_bytes < MAX_MEMORY_BUDGET;

        let recommendation = if is_safe {
            "Query is within memory budget".to_string()
        } else {
            format!(
                "Query would use ~{}MB, exceeding {}MB budget. Apply aggregation or sampling.",
                estimated_bytes / (1024 * 1024),
                MAX_MEMORY_BUDGET / (1024 * 1024)
            )
        };

        Self {
            estimated_bytes,
            is_safe,
            recommendation,
        }
    }
}

// ============================================================================
// PROGRESSIVE DISCLOSURE SUPPORT
// ============================================================================

/// Zoom level for progressive disclosure queries.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ZoomContext {
    /// Current zoom level (0.0 = full view, 1.0 = maximum detail).
    pub zoom_level: f64,
    /// Visible range start (for numeric/date fields).
    pub range_start: Option<f64>,
    /// Visible range end (for numeric/date fields).
    pub range_end: Option<f64>,
    /// Selected categories (for categorical fields).
    pub selected_categories: Option<Vec<String>>,
}

impl ZoomContext {
    /// Calculate appropriate point limit based on zoom level.
    /// Wide view returns fewer points, zoomed view returns more.
    pub fn calculate_point_limit(&self, base_limit: usize) -> usize {
        // At zoom level 0.0, return 20% of base limit
        // At zoom level 1.0, return full base limit
        let min_ratio = 0.2;
        let ratio = min_ratio + (1.0 - min_ratio) * self.zoom_level;
        ((base_limit as f64) * ratio).ceil() as usize
    }

    /// Default (no zoom) context.
    pub fn default_view() -> Self {
        Self {
            zoom_level: 0.0,
            range_start: None,
            range_end: None,
            selected_categories: None,
        }
    }
}

// ============================================================================
// AGGREGATION INFERENCE
// ============================================================================

/// Inferred aggregation strategy based on data types and cardinality.
#[derive(Debug, Clone)]
pub struct InferredAggregation {
    pub aggregation_type: InferredAggregationType,
    pub group_by_field: Option<String>,
    pub measure_field: String,
    pub description: String,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum InferredAggregationType {
    Sum,
    Average,
    Count,
    Min,
    Max,
    CountDistinct,
}

impl InferredAggregation {
    /// Infer appropriate aggregation for a measure field.
    /// Numeric measures default to SUM.
    pub fn infer_for_numeric(field_name: &str) -> Self {
        Self {
            aggregation_type: InferredAggregationType::Sum,
            group_by_field: None,
            measure_field: field_name.to_string(),
            description: format!("Sum of {}", field_name),
        }
    }

    /// Infer aggregation for date fields - default to count by date bin.
    pub fn infer_for_date(field_name: &str, granularity: DateBinGranularity) -> Self {
        Self {
            aggregation_type: InferredAggregationType::Count,
            group_by_field: Some(field_name.to_string()),
            measure_field: field_name.to_string(),
            description: format!("Count by {:?}", granularity),
        }
    }

    /// Infer aggregation for high-cardinality categorical - Top-N.
    pub fn infer_for_categorical(field_name: &str, top_n: usize) -> Self {
        Self {
            aggregation_type: InferredAggregationType::Count,
            group_by_field: Some(field_name.to_string()),
            measure_field: field_name.to_string(),
            description: format!("Top {} {} by count", top_n, field_name),
        }
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Format a number with thousand separators for display.
fn format_number(n: usize) -> String {
    let s = n.to_string();
    let mut result = String::new();
    for (i, c) in s.chars().rev().enumerate() {
        if i > 0 && i % 3 == 0 {
            result.push(',');
        }
        result.push(c);
    }
    result.chars().rev().collect()
}

/// Check if a data type is numeric.
pub fn is_numeric_dtype(dtype: &DataType) -> bool {
    matches!(
        dtype,
        DataType::Int8
            | DataType::Int16
            | DataType::Int32
            | DataType::Int64
            | DataType::UInt8
            | DataType::UInt16
            | DataType::UInt32
            | DataType::UInt64
            | DataType::Float32
            | DataType::Float64
    )
}

/// Check if a data type is datetime.
pub fn is_datetime_dtype(dtype: &DataType) -> bool {
    matches!(
        dtype,
        DataType::Date | DataType::Datetime(_, _) | DataType::Time
    )
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_number() {
        assert_eq!(format_number(1000), "1,000");
        assert_eq!(format_number(1000000), "1,000,000");
        assert_eq!(format_number(123), "123");
    }

    #[test]
    fn test_chart_safety_config() {
        let bar = ChartSafetyConfig::bar();
        assert!(bar.requires_aggregation);
        assert!(!bar.allows_sampling);

        let scatter = ChartSafetyConfig::scatter();
        assert!(!scatter.requires_aggregation);
        assert!(scatter.allows_sampling);
    }

    #[test]
    fn test_reduction_metadata() {
        let meta = ReductionMetadata::sampled(1_000_000, 10_000, 0.01);
        assert!(meta.reduced);
        assert_eq!(meta.sample_ratio, Some(0.01));
    }

    #[test]
    fn test_zoom_context_point_limit() {
        let full_zoom = ZoomContext {
            zoom_level: 1.0,
            ..ZoomContext::default_view()
        };
        let no_zoom = ZoomContext::default_view();

        assert_eq!(full_zoom.calculate_point_limit(1000), 1000);
        assert_eq!(no_zoom.calculate_point_limit(1000), 200);
    }

    #[test]
    fn test_memory_safety_check() {
        let safe = MemorySafetyCheck::estimate(10_000, 10);
        assert!(safe.is_safe);

        let unsafe_check = MemorySafetyCheck::estimate(10_000_000, 100);
        assert!(!unsafe_check.is_safe);
    }
}
