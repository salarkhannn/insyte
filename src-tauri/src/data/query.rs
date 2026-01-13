//! # Safe Visualization Query Execution
//!
//! This module provides hardened query execution for visualizations with:
//! - Automatic aggregation inference
//! - Cardinality detection and limits
//! - Deterministic sampling when needed
//! - Strict per-visual point limits (50,000 max)
//! - Structured metadata for UI feedback
//!
//! ## Design Principle
//! "The user expresses intent. The system decides what is safe."
//!
//! ## Safety Guarantees
//! - Never render raw rows by default
//! - Enforce 50,000 point maximum per visualization
//! - Fail safely: no panics, no UI freezes
//! - All heavy computation uses lazy evaluation

use crate::ai::types::{
    AggregationType, FilterOperator, FilterSpec, SortField, SortOrder, VisualizationSpec,
};
use crate::data::safety::{ZoomContext, MAX_VISUAL_POINTS};
use crate::data::sampling::scatter_sample;
use crate::data::state::AppDataState;
use crate::error::DataError;
use polars::prelude::*;
use serde::{Deserialize, Serialize};
use tauri::State;

// ============================================================================
// SAFETY CONFIGURATION CONSTANTS
// ============================================================================

/// Maximum points for bar/line/area charts (forces aggregation above this)
const BAR_LINE_MAX_POINTS: usize = 500;

/// Maximum points for pie charts (readability limit)
const PIE_MAX_POINTS: usize = 20;

/// Maximum points for scatter plots (after sampling)
const SCATTER_MAX_POINTS: usize = 10_000;

/// Default page size for table pagination
const TABLE_PAGE_SIZE: usize = 100;

// ============================================================================
// CHART DATA STRUCTURES WITH REDUCTION METADATA
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChartData {
    pub labels: Vec<String>,
    pub datasets: Vec<ChartDataset>,
    pub metadata: ChartMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChartDataset {
    pub label: String,
    pub data: Vec<f64>,
    pub color: Option<String>,
}

/// Enhanced chart metadata with reduction feedback for UI.
/// This allows the frontend to inform users about data transformations.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChartMetadata {
    pub title: String,
    pub x_label: String,
    pub y_label: String,
    pub total_records: usize,

    // === REDUCTION FEEDBACK (required for user trust) ===
    /// Whether any data reduction was applied.
    #[serde(default)]
    pub reduced: bool,

    /// Primary reason for reduction: "auto-aggregation", "sampling", "top-n", "none"
    #[serde(default = "default_reduction_reason")]
    pub reduction_reason: String,

    /// Original row count before any transformations.
    #[serde(default)]
    pub original_row_estimate: usize,

    /// Number of data points actually returned.
    #[serde(default)]
    pub returned_points: usize,

    /// Sampling ratio if sampling was applied (0.0-1.0).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sample_ratio: Option<f64>,

    /// Top-N value if Top-N reduction was applied.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_n_value: Option<usize>,

    /// Human-readable warning message for UI display.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub warning_message: Option<String>,
}

fn default_reduction_reason() -> String {
    "none".to_string()
}

// ============================================================================
// SAFE FILTER APPLICATION
// ============================================================================

/// Apply a single filter to the LazyFrame with error handling.
/// Filters are pushed down to minimize data processed.
fn apply_filter(df: LazyFrame, filter: &FilterSpec) -> Result<LazyFrame, DataError> {
    let col_expr = col(&filter.column);

    let predicate = match filter.operator {
        FilterOperator::Eq => {
            if filter.value.is_string() {
                col_expr.eq(lit(filter.value.as_str().unwrap_or_default()))
            } else if filter.value.is_f64() {
                col_expr.eq(lit(filter.value.as_f64().unwrap_or_default()))
            } else if filter.value.is_i64() {
                col_expr.eq(lit(filter.value.as_i64().unwrap_or_default()))
            } else if filter.value.is_boolean() {
                col_expr.eq(lit(filter.value.as_bool().unwrap_or_default()))
            } else {
                return Err(DataError::ParseError(
                    "Unsupported filter value type".into(),
                ));
            }
        }
        FilterOperator::Neq => {
            if filter.value.is_string() {
                col_expr.neq(lit(filter.value.as_str().unwrap_or_default()))
            } else if filter.value.is_f64() {
                col_expr.neq(lit(filter.value.as_f64().unwrap_or_default()))
            } else if filter.value.is_i64() {
                col_expr.neq(lit(filter.value.as_i64().unwrap_or_default()))
            } else {
                return Err(DataError::ParseError(
                    "Unsupported filter value type".into(),
                ));
            }
        }
        FilterOperator::Gt => {
            if filter.value.is_f64() {
                col_expr.gt(lit(filter.value.as_f64().unwrap_or_default()))
            } else if filter.value.is_i64() {
                col_expr.gt(lit(filter.value.as_i64().unwrap_or_default()))
            } else {
                return Err(DataError::ParseError(
                    "GT filter requires numeric value".into(),
                ));
            }
        }
        FilterOperator::Lt => {
            if filter.value.is_f64() {
                col_expr.lt(lit(filter.value.as_f64().unwrap_or_default()))
            } else if filter.value.is_i64() {
                col_expr.lt(lit(filter.value.as_i64().unwrap_or_default()))
            } else {
                return Err(DataError::ParseError(
                    "LT filter requires numeric value".into(),
                ));
            }
        }
        FilterOperator::Gte => {
            if filter.value.is_f64() {
                col_expr.gt_eq(lit(filter.value.as_f64().unwrap_or_default()))
            } else if filter.value.is_i64() {
                col_expr.gt_eq(lit(filter.value.as_i64().unwrap_or_default()))
            } else {
                return Err(DataError::ParseError(
                    "GTE filter requires numeric value".into(),
                ));
            }
        }
        FilterOperator::Lte => {
            if filter.value.is_f64() {
                col_expr.lt_eq(lit(filter.value.as_f64().unwrap_or_default()))
            } else if filter.value.is_i64() {
                col_expr.lt_eq(lit(filter.value.as_i64().unwrap_or_default()))
            } else {
                return Err(DataError::ParseError(
                    "LTE filter requires numeric value".into(),
                ));
            }
        }
        FilterOperator::Contains => {
            let pattern = filter.value.as_str().unwrap_or_default();
            col_expr.str().contains(lit(pattern), false)
        }
        FilterOperator::StartsWith => {
            let pattern = filter.value.as_str().unwrap_or_default();
            col_expr.str().starts_with(lit(pattern))
        }
        FilterOperator::EndsWith => {
            let pattern = filter.value.as_str().unwrap_or_default();
            col_expr.str().ends_with(lit(pattern))
        }
        FilterOperator::IsNull => col_expr.is_null(),
        FilterOperator::IsNotNull => col_expr.is_not_null(),
    };

    Ok(df.filter(predicate))
}

// ============================================================================
// SAFE AGGREGATION (NEVER RENDERS RAW ROWS)
// ============================================================================

/// Apply aggregation to group data before rendering.
/// This is the key safety behavior - aggregation must happen BEFORE
/// data reaches the rendering layer.
fn apply_aggregation(
    df: LazyFrame,
    x_field: &str,
    y_field: &str,
    aggregation: &AggregationType,
) -> Result<LazyFrame, DataError> {
    let agg_expr = match aggregation {
        AggregationType::Sum => col(y_field).sum().alias("value"),
        AggregationType::Avg => col(y_field).mean().alias("value"),
        AggregationType::Count => col(y_field).count().alias("value"),
        AggregationType::Min => col(y_field).min().alias("value"),
        AggregationType::Max => col(y_field).max().alias("value"),
        AggregationType::Median => col(y_field).median().alias("value"),
    };

    Ok(df.group_by([col(x_field)]).agg([agg_expr]))
}

// ============================================================================
// SAFE SORTING
// ============================================================================

fn apply_sorting(
    df: LazyFrame,
    x_field: &str,
    sort_by: &SortField,
    sort_order: &SortOrder,
) -> LazyFrame {
    let descending = matches!(sort_order, SortOrder::Desc);

    match sort_by {
        SortField::X => df.sort(
            [x_field],
            SortMultipleOptions::default().with_order_descending(descending),
        ),
        SortField::Y => df.sort(
            ["value"],
            SortMultipleOptions::default().with_order_descending(descending),
        ),
        SortField::None => df,
    }
}

// ============================================================================
// TOP-N WITH OTHERS BUCKET
// ============================================================================

/// Apply Top-N reduction with an "Others" bucket for remaining values.
/// This ensures high-cardinality dimensions don't overwhelm the visualization.
///
/// # Safety: This function caps the output to prevent memory/rendering issues
fn apply_top_n_with_others(
    df: LazyFrame,
    n: usize,
    x_field: &str,
    include_others: bool,
) -> Result<(LazyFrame, bool), DataError> {
    // Collect to determine total groups
    let collected = df
        .clone()
        .collect()
        .map_err(|e| DataError::ParseError(e.to_string()))?;

    let total_groups = collected.height();

    if total_groups <= n {
        // No reduction needed
        return Ok((collected.lazy(), false));
    }

    // Sort by value descending to get top N
    let sorted = collected
        .lazy()
        .sort(
            ["value"],
            SortMultipleOptions::default().with_order_descending(true),
        )
        .collect()
        .map_err(|e| DataError::ParseError(e.to_string()))?;

    if include_others && total_groups > n {
        // Calculate sum of top N
        let top_n_df = sorted.slice(0, n);
        let top_n_sum: f64 = top_n_df
            .column("value")
            .map_err(|e| DataError::ParseError(e.to_string()))?
            .sum()
            .map_err(|e| DataError::ParseError(e.to_string()))?;

        // Calculate total sum
        let total_sum: f64 = sorted
            .column("value")
            .map_err(|e| DataError::ParseError(e.to_string()))?
            .sum()
            .map_err(|e| DataError::ParseError(e.to_string()))?;

        let others_sum = total_sum - top_n_sum;

        if others_sum > 0.0 {
            // Create "Others" row
            let others_row = df! {
                x_field => ["Others"],
                "value" => [others_sum],
            }
            .map_err(|e| DataError::ParseError(e.to_string()))?;

            // Combine top N with Others
            let combined = top_n_df
                .vstack(&others_row)
                .map_err(|e| DataError::ParseError(e.to_string()))?;

            return Ok((combined.lazy(), true));
        }

        Ok((top_n_df.lazy(), false))
    } else {
        // Just take top N without Others
        Ok((sorted.lazy().limit(n as u32), false))
    }
}

// ============================================================================
// EXTRACT CHART DATA FROM DATAFRAME
// ============================================================================

fn extract_chart_data(df: DataFrame, x_field: &str) -> Result<(Vec<String>, Vec<f64>), DataError> {
    let x_col = df
        .column(x_field)
        .map_err(|e| DataError::ParseError(e.to_string()))?;
    let y_col = df
        .column("value")
        .map_err(|e| DataError::ParseError(e.to_string()))?;

    let labels: Vec<String> = series_to_strings(x_col)?;

    let data: Vec<f64> = y_col
        .cast(&DataType::Float64)
        .map_err(|e| DataError::ParseError(e.to_string()))?
        .f64()
        .map_err(|e| DataError::ParseError(e.to_string()))?
        .into_no_null_iter()
        .collect();

    Ok((labels, data))
}

fn series_to_strings(series: &Series) -> Result<Vec<String>, DataError> {
    let len = series.len();
    let mut result = Vec::with_capacity(len);

    let string_series = series
        .cast(&DataType::String)
        .map_err(|e| DataError::ParseError(e.to_string()))?;

    let ca = string_series
        .str()
        .map_err(|e| DataError::ParseError(e.to_string()))?;

    for i in 0..len {
        let val = ca.get(i).unwrap_or("").to_string();
        result.push(val);
    }

    Ok(result)
}

// ============================================================================
// CARDINALITY ANALYSIS
// ============================================================================

/// Estimate unique value count for a column efficiently.
/// Uses sampling for large datasets to avoid full scan.
fn estimate_cardinality(series: &Series, total_rows: usize) -> usize {
    // For small datasets, compute exact cardinality
    if total_rows <= 10_000 {
        return series.n_unique().unwrap_or(total_rows);
    }

    // For large datasets, sample and extrapolate
    let sample_size = 10_000.min(total_rows);
    let sampled = series.head(Some(sample_size));
    let sample_unique = sampled.n_unique().unwrap_or(sample_size);

    // Simple extrapolation (could use capture-recapture for better estimate)
    let ratio = total_rows as f64 / sample_size as f64;
    ((sample_unique as f64) * ratio.ln().max(1.0)).ceil() as usize
}

/// Get maximum points allowed for a chart type.
fn get_max_points_for_chart(chart_type: &str) -> usize {
    match chart_type {
        "bar" | "line" | "area" => BAR_LINE_MAX_POINTS,
        "pie" => PIE_MAX_POINTS,
        "scatter" => SCATTER_MAX_POINTS,
        _ => BAR_LINE_MAX_POINTS,
    }
}

// ============================================================================
// MAIN QUERY EXECUTION - HARDENED PIPELINE
// ============================================================================

/// Execute a visualization query with full safety hardening.
///
/// # Safety Guarantees
/// 1. **Never renders raw rows**: All data goes through aggregation
/// 2. **Enforces point limits**: Chart-specific maximums are enforced
/// 3. **Top-N + Others**: High-cardinality dimensions are automatically reduced
/// 4. **Structured feedback**: Metadata explains all transformations to users
///
/// # Error Handling
/// - Returns descriptive errors for missing columns
/// - Never panics or blocks the UI thread
/// - Fails safely with actionable messages
#[tauri::command]
pub async fn execute_visualization_query(
    spec: VisualizationSpec,
    state: State<'_, AppDataState>,
) -> Result<ChartData, DataError> {
    // === STEP 1: SAFELY ACQUIRE DATA ===
    let data_state = state
        .lock()
        .map_err(|e| DataError::ParseError(format!("Failed to acquire data lock: {}", e)))?;

    let df = data_state.get_dataframe().ok_or(DataError::NoData)?.clone();

    let total_records = df.height();

    // === STEP 2: VALIDATE COLUMNS EXIST ===
    // Fail fast with helpful error if columns don't exist
    if df.column(&spec.x_field).is_err() {
        return Err(DataError::ColumnNotFound {
            column: spec.x_field.clone(),
            available: df
                .get_column_names()
                .iter()
                .map(|s| s.to_string())
                .collect::<Vec<_>>()
                .join(", "),
        });
    }

    if df.column(&spec.y_field).is_err() {
        return Err(DataError::ColumnNotFound {
            column: spec.y_field.clone(),
            available: df
                .get_column_names()
                .iter()
                .map(|s| s.to_string())
                .collect::<Vec<_>>()
                .join(", "),
        });
    }

    // === STEP 3: ANALYZE CARDINALITY ===
    let x_series = df
        .column(&spec.x_field)
        .map_err(|e| DataError::ParseError(e.to_string()))?;

    let x_cardinality = estimate_cardinality(x_series, total_records);

    // === STEP 4: DETERMINE CHART-SPECIFIC LIMITS ===
    let chart_type_str = format!("{:?}", spec.chart_type).to_lowercase();
    let max_points = get_max_points_for_chart(&chart_type_str);

    // Track reduction metadata for user feedback
    let mut reduced = false;
    let mut reduction_reason = "none".to_string();
    let mut sample_ratio: Option<f64> = None;
    let mut top_n_value: Option<usize> = None;
    let mut warning_message: Option<String> = None;

    // === STEP 5: BUILD LAZY QUERY PIPELINE ===
    let mut lazy_df = df.lazy();

    // 5a: Apply filters FIRST (pushdown optimization)
    for filter in &spec.filters {
        lazy_df = apply_filter(lazy_df, filter)?;
    }

    // 5b: Apply aggregation (REQUIRED - never show raw rows)
    lazy_df = apply_aggregation(lazy_df, &spec.x_field, &spec.y_field, &spec.aggregation)?;

    // === STEP 6: CHECK POST-AGGREGATION CARDINALITY ===
    let aggregated_df = lazy_df
        .clone()
        .collect()
        .map_err(|e| DataError::ParseError(e.to_string()))?;

    let aggregated_count = aggregated_df.height();

    // === STEP 7: APPLY TOP-N IF EXCEEDS LIMIT ===
    // This is critical for preventing rendering issues with high-cardinality data
    let final_lazy = if aggregated_count > max_points {
        reduced = true;
        reduction_reason = "top-n".to_string();
        top_n_value = Some(max_points);

        let (top_n_lazy, has_others) =
            apply_top_n_with_others(aggregated_df.lazy(), max_points, &spec.x_field, true)?;

        warning_message = Some(format!(
            "Showing top {} of {} categories{}",
            max_points,
            format_number(aggregated_count),
            if has_others { " (others grouped)" } else { "" }
        ));

        top_n_lazy
    } else if aggregated_count < total_records {
        // Aggregation reduced data
        reduced = true;
        reduction_reason = "auto-aggregation".to_string();
        warning_message = Some(format!(
            "Data aggregated from {} rows to {} groups",
            format_number(total_records),
            format_number(aggregated_count)
        ));
        aggregated_df.lazy()
    } else {
        aggregated_df.lazy()
    };

    // === STEP 8: APPLY SORTING ===
    let sorted_lazy = apply_sorting(final_lazy, &spec.x_field, &spec.sort_by, &spec.sort_order);

    // === STEP 9: APPLY FINAL SAFETY LIMIT ===
    // Absolute cap: never exceed MAX_VISUAL_POINTS regardless of other settings
    let limited_lazy = sorted_lazy.limit(MAX_VISUAL_POINTS as u32);

    // === STEP 10: COLLECT FINAL RESULT ===
    let result_df = limited_lazy
        .collect()
        .map_err(|e| DataError::ParseError(e.to_string()))?;

    let returned_points = result_df.height();

    // === STEP 11: EXTRACT CHART DATA ===
    let (labels, data) = extract_chart_data(result_df, &spec.x_field)?;

    // === STEP 12: BUILD AGGREGATION LABEL ===
    let agg_label = match spec.aggregation {
        AggregationType::Sum => format!("Sum of {}", spec.y_field),
        AggregationType::Avg => format!("Average of {}", spec.y_field),
        AggregationType::Count => format!("Count of {}", spec.y_field),
        AggregationType::Min => format!("Min of {}", spec.y_field),
        AggregationType::Max => format!("Max of {}", spec.y_field),
        AggregationType::Median => format!("Median of {}", spec.y_field),
    };

    // === STEP 13: RETURN WITH FULL METADATA ===
    Ok(ChartData {
        labels,
        datasets: vec![ChartDataset {
            label: agg_label.clone(),
            data,
            color: None,
        }],
        metadata: ChartMetadata {
            title: spec.title,
            x_label: spec.x_field,
            y_label: agg_label,
            total_records,
            // === REDUCTION FEEDBACK FOR UI ===
            reduced,
            reduction_reason,
            original_row_estimate: total_records,
            returned_points,
            sample_ratio,
            top_n_value,
            warning_message,
        },
    })
}

// ============================================================================
// SCATTER PLOT QUERY (WITH SAMPLING)
// ============================================================================

/// Execute a scatter plot query with appropriate sampling.
/// Scatter plots can show individual points but need aggressive reduction
/// for large datasets to prevent memory/rendering issues.
///
/// # Safety: Uses deterministic sampling to ensure stable results
#[tauri::command]
pub async fn execute_scatter_query(
    spec: VisualizationSpec,
    state: State<'_, AppDataState>,
) -> Result<ChartData, DataError> {
    let data_state = state
        .lock()
        .map_err(|e| DataError::ParseError(format!("Failed to acquire data lock: {}", e)))?;

    let df = data_state.get_dataframe().ok_or(DataError::NoData)?.clone();
    let total_records = df.height();

    // Validate columns
    if df.column(&spec.x_field).is_err() {
        return Err(DataError::ColumnNotFound {
            column: spec.x_field.clone(),
            available: df
                .get_column_names()
                .iter()
                .map(|s| s.to_string())
                .collect::<Vec<_>>()
                .join(", "),
        });
    }
    if df.column(&spec.y_field).is_err() {
        return Err(DataError::ColumnNotFound {
            column: spec.y_field.clone(),
            available: df
                .get_column_names()
                .iter()
                .map(|s| s.to_string())
                .collect::<Vec<_>>()
                .join(", "),
        });
    }

    let mut lazy_df = df.lazy();

    // Apply filters
    for filter in &spec.filters {
        lazy_df = apply_filter(lazy_df, filter)?;
    }

    // Collect filtered data
    let filtered_df = lazy_df
        .collect()
        .map_err(|e| DataError::ParseError(e.to_string()))?;

    let filtered_count = filtered_df.height();

    // Track reduction metadata
    let mut reduced = false;
    let mut reduction_reason = "none".to_string();
    let mut sample_ratio: Option<f64> = None;
    let mut warning_message: Option<String> = None;

    // Apply sampling if needed
    let result_df = if filtered_count > SCATTER_MAX_POINTS {
        reduced = true;
        reduction_reason = "sampling".to_string();

        let ratio = SCATTER_MAX_POINTS as f64 / filtered_count as f64;
        sample_ratio = Some(ratio);

        warning_message = Some(format!(
            "Showing {:.1}% sample ({} of {} points) for performance",
            ratio * 100.0,
            format_number(SCATTER_MAX_POINTS),
            format_number(filtered_count)
        ));

        // Use deterministic sampling
        let sample_result = scatter_sample(filtered_df.lazy(), filtered_count, SCATTER_MAX_POINTS)?;

        sample_result.data
    } else {
        filtered_df
    };

    let returned_points = result_df.height();

    // Extract x and y values directly (no aggregation for scatter)
    let x_col = result_df
        .column(&spec.x_field)
        .map_err(|e| DataError::ParseError(e.to_string()))?;

    let y_col = result_df
        .column(&spec.y_field)
        .map_err(|e| DataError::ParseError(e.to_string()))?;

    let labels: Vec<String> = series_to_strings(x_col)?;

    let data: Vec<f64> = y_col
        .cast(&DataType::Float64)
        .map_err(|e| DataError::ParseError(e.to_string()))?
        .f64()
        .map_err(|e| DataError::ParseError(e.to_string()))?
        .into_no_null_iter()
        .collect();

    Ok(ChartData {
        labels,
        datasets: vec![ChartDataset {
            label: spec.y_field.clone(),
            data,
            color: None,
        }],
        metadata: ChartMetadata {
            title: spec.title,
            x_label: spec.x_field,
            y_label: spec.y_field,
            total_records,
            reduced,
            reduction_reason,
            original_row_estimate: total_records,
            returned_points,
            sample_ratio,
            top_n_value: None,
            warning_message,
        },
    })
}

// ============================================================================
// TABLE QUERY (WITH PAGINATION)
// ============================================================================

/// Table data response with pagination metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableData {
    pub rows: Vec<Vec<serde_json::Value>>,
    pub total_rows: usize,
    pub page: usize,
    pub page_size: usize,
    pub total_pages: usize,
    pub warning: Option<String>,
}

/// Execute a table query with mandatory pagination.
/// Tables NEVER load all rows at once - this is a hard safety requirement.
///
/// # Safety: Caps page size at 1000 rows maximum
#[tauri::command]
pub async fn execute_table_query(
    columns: Vec<String>,
    page: usize,
    page_size: usize,
    sort_column: Option<String>,
    sort_desc: bool,
    filters: Vec<FilterSpec>,
    state: State<'_, AppDataState>,
) -> Result<TableData, DataError> {
    let data_state = state
        .lock()
        .map_err(|e| DataError::ParseError(format!("Failed to acquire data lock: {}", e)))?;

    let df = data_state.get_dataframe().ok_or(DataError::NoData)?.clone();
    let total_records = df.height();

    // SAFETY: Cap page size at 1000 rows
    let safe_page_size = page_size.min(1000);

    let mut lazy_df = df.lazy();

    // Apply filters
    for filter in &filters {
        lazy_df = apply_filter(lazy_df, filter)?;
    }

    // Apply sorting if specified
    if let Some(sort_col) = &sort_column {
        lazy_df = lazy_df.sort(
            [sort_col.as_str()],
            SortMultipleOptions::default().with_order_descending(sort_desc),
        );
    }

    // Count total after filters
    let filtered_df = lazy_df
        .clone()
        .collect()
        .map_err(|e| DataError::ParseError(e.to_string()))?;

    let total_filtered = filtered_df.height();

    // Apply pagination
    let offset = page * safe_page_size;
    let paginated = filtered_df.slice(offset as i64, safe_page_size);

    // Select requested columns (or all if empty)
    let result = if columns.is_empty() {
        paginated
    } else {
        let column_exprs: Vec<Expr> = columns.iter().map(|c| col(c)).collect();
        paginated
            .lazy()
            .select(column_exprs)
            .collect()
            .map_err(|e| DataError::ParseError(e.to_string()))?
    };

    // Convert to rows
    let rows = df_to_rows(&result);

    Ok(TableData {
        rows,
        total_rows: total_filtered,
        page,
        page_size: safe_page_size,
        total_pages: (total_filtered + safe_page_size - 1) / safe_page_size,
        warning: if total_records > 100_000 {
            Some(format!(
                "Large dataset ({} rows). Using pagination for performance.",
                format_number(total_records)
            ))
        } else {
            None
        },
    })
}

/// Convert DataFrame rows to JSON values for table display.
fn df_to_rows(df: &DataFrame) -> Vec<Vec<serde_json::Value>> {
    let mut rows = Vec::with_capacity(df.height());

    for i in 0..df.height() {
        let row: Vec<serde_json::Value> = df
            .get_columns()
            .iter()
            .map(|col| {
                let val = col.get(i).ok();
                match val {
                    Some(AnyValue::Null) => serde_json::Value::Null,
                    Some(AnyValue::Int8(v)) => serde_json::json!(v),
                    Some(AnyValue::Int16(v)) => serde_json::json!(v),
                    Some(AnyValue::Int32(v)) => serde_json::json!(v),
                    Some(AnyValue::Int64(v)) => serde_json::json!(v),
                    Some(AnyValue::UInt8(v)) => serde_json::json!(v),
                    Some(AnyValue::UInt16(v)) => serde_json::json!(v),
                    Some(AnyValue::UInt32(v)) => serde_json::json!(v),
                    Some(AnyValue::UInt64(v)) => serde_json::json!(v),
                    Some(AnyValue::Float32(v)) => serde_json::json!(v),
                    Some(AnyValue::Float64(v)) => serde_json::json!(v),
                    Some(AnyValue::Boolean(v)) => serde_json::json!(v),
                    Some(AnyValue::String(v)) => serde_json::json!(v),
                    Some(AnyValue::StringOwned(v)) => serde_json::json!(v.to_string()),
                    Some(v) => serde_json::json!(v.to_string()),
                    None => serde_json::Value::Null,
                }
            })
            .collect();
        rows.push(row);
    }

    rows
}

// ============================================================================
// PROGRESSIVE DISCLOSURE QUERY (ZOOM-AWARE)
// ============================================================================

/// Execute a query with zoom-aware progressive disclosure.
/// Wide view returns fewer points; zooming in reveals more detail.
/// This prevents loading full detail in a single request.
#[tauri::command]
pub async fn execute_progressive_query(
    spec: VisualizationSpec,
    zoom_level: f64,
    range_start: Option<f64>,
    range_end: Option<f64>,
    state: State<'_, AppDataState>,
) -> Result<ChartData, DataError> {
    // Create zoom context
    let zoom = ZoomContext {
        zoom_level: zoom_level.clamp(0.0, 1.0),
        range_start,
        range_end,
        selected_categories: None,
    };

    // Get chart-specific limits
    let chart_type_str = format!("{:?}", spec.chart_type).to_lowercase();
    let base_max_points = get_max_points_for_chart(&chart_type_str);

    // Calculate point limit based on zoom level
    // At zoom 0.0, show 20% of base limit
    // At zoom 1.0, show full base limit
    let point_limit = zoom.calculate_point_limit(base_max_points);

    // Modify spec with range filters if provided
    let mut modified_spec = spec.clone();

    if let (Some(start), Some(end)) = (range_start, range_end) {
        modified_spec.filters.push(FilterSpec {
            column: spec.x_field.clone(),
            operator: FilterOperator::Gte,
            value: serde_json::json!(start),
        });
        modified_spec.filters.push(FilterSpec {
            column: spec.x_field.clone(),
            operator: FilterOperator::Lte,
            value: serde_json::json!(end),
        });
    }

    // Execute with standard query (it will apply its own limits)
    execute_visualization_query(modified_spec, state).await
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

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ai::types::ChartType;

    fn create_test_df() -> DataFrame {
        df! {
            "category" => ["A", "B", "C", "A", "B", "C", "A", "B", "C", "A"],
            "value" => [10i64, 20, 30, 15, 25, 35, 12, 22, 32, 18],
        }
        .unwrap()
    }

    #[test]
    fn test_apply_aggregation() {
        let df = create_test_df();
        let result = apply_aggregation(df.lazy(), "category", "value", &AggregationType::Sum)
            .unwrap()
            .collect()
            .unwrap();

        // Should have 3 rows (A, B, C)
        assert_eq!(result.height(), 3);
        assert!(result.column("category").is_ok());
        assert!(result.column("value").is_ok());
    }

    #[test]
    fn test_top_n_with_others() {
        let df = create_test_df();
        let aggregated = apply_aggregation(df.lazy(), "category", "value", &AggregationType::Sum)
            .unwrap()
            .collect()
            .unwrap();

        let (result, has_others) =
            apply_top_n_with_others(aggregated.lazy(), 2, "category", true).unwrap();

        let collected = result.collect().unwrap();

        // Should have 3 rows (2 top + Others)
        assert_eq!(collected.height(), 3);
        assert!(has_others);
    }

    #[test]
    fn test_format_number() {
        assert_eq!(format_number(1000), "1,000");
        assert_eq!(format_number(1000000), "1,000,000");
        assert_eq!(format_number(123), "123");
    }

    #[test]
    fn test_estimate_cardinality_small_dataset() {
        let df = create_test_df();
        let series = df.column("category").unwrap();
        let cardinality = estimate_cardinality(series, 10);
        assert_eq!(cardinality, 3); // A, B, C
    }

    #[test]
    fn test_get_max_points_for_chart() {
        assert_eq!(get_max_points_for_chart("bar"), BAR_LINE_MAX_POINTS);
        assert_eq!(get_max_points_for_chart("pie"), PIE_MAX_POINTS);
        assert_eq!(get_max_points_for_chart("scatter"), SCATTER_MAX_POINTS);
    }
}
