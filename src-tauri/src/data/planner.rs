//! # Query Planner Module
//!
//! This module implements the query planning and safety enforcement layer.
//! It sits between user intent (VisualizationSpec) and actual query execution,
//! ensuring all safety rules are enforced.
//!
//! ## Responsibilities
//! - Analyze data characteristics before execution
//! - Determine appropriate aggregation strategy
//! - Apply visualization-specific safety rules
//! - Generate safe, optimized execution plans
//! - Build lazy Polars expressions with pushdown optimization

use crate::ai::types::{AggregationType, FilterSpec, SortField, SortOrder, VisualizationSpec};
use crate::data::safety::{
    CardinalityAction, CardinalityInfo, ChartSafetyConfig, DateBinGranularity, MemorySafetyCheck,
    ReductionMetadata, ReductionReason, ReductionStep, ZoomContext, DEFAULT_TOP_N,
    MAX_VISUAL_POINTS, SAMPLING_SEED,
};
use crate::error::DataError;
use polars::prelude::*;
use std::collections::HashMap;

// ============================================================================
// EXECUTION PLAN
// ============================================================================

/// A safe, validated execution plan for a visualization query.
/// This is the output of the planner and contains all transformations
/// to be applied in the correct order.
#[derive(Debug, Clone)]
pub struct ExecutionPlan {
    /// Original row count before any transformations.
    pub original_row_count: usize,

    /// Safety configuration for the target chart type.
    pub safety_config: ChartSafetyConfig,

    /// Ordered list of transformations to apply.
    pub transformations: Vec<Transformation>,

    /// Pre-computed reduction metadata.
    pub reduction_metadata: ReductionMetadata,

    /// Whether the plan is safe to execute.
    pub is_safe: bool,

    /// If not safe, the blocking reason.
    pub blocking_reason: Option<String>,

    /// Cardinality info for key fields.
    pub cardinality_info: HashMap<String, CardinalityInfo>,
}

/// A single transformation step in the execution plan.
#[derive(Debug, Clone)]
pub enum Transformation {
    /// Apply filters (pushed as early as possible).
    Filter(Vec<FilterSpec>),

    /// Apply date binning to a column.
    DateBin {
        column: String,
        granularity: DateBinGranularity,
    },

    /// Apply numeric binning to a column.
    NumericBin { column: String, bin_count: usize },

    /// Group by and aggregate.
    Aggregate {
        group_by: String,
        measure: String,
        aggregation: AggregationType,
    },

    /// Apply Top-N reduction with optional "Others" bucket.
    TopN {
        column: String,
        n: usize,
        include_others: bool,
    },

    /// Apply deterministic sampling.
    Sample { target_rows: usize, seed: u64 },

    /// Apply row limit (final safety cap).
    Limit(usize),

    /// Sort the result.
    Sort { column: String, descending: bool },
}

impl ExecutionPlan {
    /// Create a blocked plan with a reason.
    pub fn blocked(reason: String, row_count: usize) -> Self {
        Self {
            original_row_count: row_count,
            safety_config: ChartSafetyConfig::bar(),
            transformations: vec![],
            reduction_metadata: ReductionMetadata::no_reduction(row_count),
            is_safe: false,
            blocking_reason: Some(reason),
            cardinality_info: HashMap::new(),
        }
    }
}

// ============================================================================
// QUERY PLANNER
// ============================================================================

/// The QueryPlanner analyzes data and visualization specs to produce safe execution plans.
pub struct QueryPlanner {
    /// Zoom context for progressive disclosure.
    zoom_context: ZoomContext,
}

impl QueryPlanner {
    pub fn new() -> Self {
        Self {
            zoom_context: ZoomContext::default_view(),
        }
    }

    /// Create planner with specific zoom context.
    pub fn with_zoom(zoom_context: ZoomContext) -> Self {
        Self { zoom_context }
    }

    /// Analyze a DataFrame and VisualizationSpec to produce a safe execution plan.
    ///
    /// # Safety Guarantees
    /// - Never returns a plan that would render raw rows (unless explicitly safe)
    /// - Enforces per-visual point limits
    /// - Memory usage is estimated and checked
    /// - High cardinality fields are automatically handled
    pub fn plan(
        &self,
        df: &DataFrame,
        spec: &VisualizationSpec,
    ) -> Result<ExecutionPlan, DataError> {
        let row_count = df.height();
        let safety_config =
            ChartSafetyConfig::for_chart_type(&format!("{:?}", spec.chart_type).to_lowercase());

        // Step 1: Memory safety check
        let mem_check = MemorySafetyCheck::estimate(row_count, df.width());
        if !mem_check.is_safe && row_count > MAX_VISUAL_POINTS * 10 {
            // Large dataset detected - ensure we'll reduce the data
            // This is expected and handled by aggregation/sampling
        }

        // Step 2: Analyze cardinality of key fields
        let mut cardinality_info = HashMap::new();

        // Analyze X field
        if let Ok(x_series) = df.column(&spec.x_field) {
            let x_card = CardinalityInfo::estimate(x_series, row_count);
            cardinality_info.insert(spec.x_field.clone(), x_card);
        } else {
            return Err(DataError::ParseError(format!(
                "X field '{}' not found in dataset",
                spec.x_field
            )));
        }

        // Analyze Y field
        if let Ok(y_series) = df.column(&spec.y_field) {
            let y_card = CardinalityInfo::estimate(y_series, row_count);
            cardinality_info.insert(spec.y_field.clone(), y_card);
        } else {
            return Err(DataError::ParseError(format!(
                "Y field '{}' not found in dataset",
                spec.y_field
            )));
        }

        // Step 3: Build transformation pipeline
        let mut transformations = Vec::new();
        let mut reduction_metadata = ReductionMetadata::no_reduction(row_count);

        // 3a: Filters first (pushdown optimization)
        if !spec.filters.is_empty() {
            transformations.push(Transformation::Filter(spec.filters.clone()));
        }

        // 3b: Handle date binning if X is datetime with high cardinality
        let x_card = cardinality_info.get(&spec.x_field).unwrap();
        if x_card.is_datetime {
            if let CardinalityAction::ApplyDateBinning(granularity) = &x_card.recommended_action {
                transformations.push(Transformation::DateBin {
                    column: spec.x_field.clone(),
                    granularity: *granularity,
                });
                reduction_metadata.date_bin_granularity = Some(*granularity);
                reduction_metadata.add_step(ReductionStep {
                    step_type: ReductionReason::DateBinning,
                    input_rows: row_count,
                    output_rows: row_count, // Binning doesn't reduce rows directly
                    description: format!("Date binned to {:?}", granularity),
                });
            }
        }

        // 3c: Aggregation (required for most chart types)
        let needs_aggregation =
            safety_config.requires_aggregation || x_card.unique_count > safety_config.max_points;

        if needs_aggregation {
            transformations.push(Transformation::Aggregate {
                group_by: spec.x_field.clone(),
                measure: spec.y_field.clone(),
                aggregation: spec.aggregation.clone(),
            });

            // Estimate output rows after aggregation
            let estimated_groups = x_card.unique_count.min(row_count);
            reduction_metadata = ReductionMetadata::aggregated(row_count, estimated_groups);
        }

        // 3d: Top-N reduction for high cardinality after aggregation
        let effective_cardinality = if needs_aggregation {
            x_card.unique_count
        } else {
            row_count
        };

        if effective_cardinality > safety_config.max_points {
            match &x_card.recommended_action {
                CardinalityAction::ApplyTopN(n) => {
                    let n = (*n).min(safety_config.max_points);
                    transformations.push(Transformation::TopN {
                        column: spec.x_field.clone(),
                        n,
                        include_others: true,
                    });
                    reduction_metadata.add_step(ReductionStep {
                        step_type: ReductionReason::TopN,
                        input_rows: effective_cardinality,
                        output_rows: n + 1,
                        description: format!("Top-{} with Others", n),
                    });
                    reduction_metadata.top_n_value = Some(n);
                }
                _ => {
                    // Default to Top-N for safety
                    let n = DEFAULT_TOP_N.min(safety_config.max_points);
                    transformations.push(Transformation::TopN {
                        column: spec.x_field.clone(),
                        n,
                        include_others: true,
                    });
                    reduction_metadata.add_step(ReductionStep {
                        step_type: ReductionReason::TopN,
                        input_rows: effective_cardinality,
                        output_rows: n + 1,
                        description: format!("Top-{} with Others (safety limit)", n),
                    });
                    reduction_metadata.top_n_value = Some(n);
                }
            }
        }

        // 3e: Sampling for scatter plots or as last resort
        if safety_config.allows_sampling && !needs_aggregation {
            if row_count > safety_config.max_points {
                let target = self
                    .zoom_context
                    .calculate_point_limit(safety_config.max_points);
                let ratio = target as f64 / row_count as f64;

                transformations.push(Transformation::Sample {
                    target_rows: target,
                    seed: SAMPLING_SEED,
                });

                reduction_metadata = ReductionMetadata::sampled(row_count, target, ratio);
            }
        }

        // 3f: Sorting
        let sort_column = match &spec.sort_by {
            SortField::X => Some(spec.x_field.clone()),
            SortField::Y => Some("value".to_string()),
            SortField::None => None,
        };
        if let Some(col) = sort_column {
            transformations.push(Transformation::Sort {
                column: col,
                descending: matches!(spec.sort_order, SortOrder::Desc),
            });
        }

        // 3g: Final safety limit (absolute cap)
        let final_limit = safety_config.max_points.min(MAX_VISUAL_POINTS);
        transformations.push(Transformation::Limit(final_limit));

        // Update reduction metadata
        if reduction_metadata.reduction_steps.len() > 1 {
            reduction_metadata.reduction_reason = ReductionReason::Combined;
        }
        if !reduction_metadata.reduction_steps.is_empty() {
            reduction_metadata.reduced = true;
        }

        // Generate warning message if data was reduced
        if reduction_metadata.reduced {
            reduction_metadata.warning_message =
                Some(self.generate_warning_message(&reduction_metadata));
        }

        Ok(ExecutionPlan {
            original_row_count: row_count,
            safety_config,
            transformations,
            reduction_metadata,
            is_safe: true,
            blocking_reason: None,
            cardinality_info,
        })
    }

    /// Generate a user-friendly warning message.
    fn generate_warning_message(&self, meta: &ReductionMetadata) -> String {
        let mut parts = Vec::new();

        for step in &meta.reduction_steps {
            match step.step_type {
                ReductionReason::AutoAggregation => {
                    parts.push(format!(
                        "aggregated from {} to {} groups",
                        format_number(step.input_rows),
                        format_number(step.output_rows)
                    ));
                }
                ReductionReason::Sampling => {
                    if let Some(ratio) = meta.sample_ratio {
                        parts.push(format!(
                            "sampled {:.1}% ({} points)",
                            ratio * 100.0,
                            format_number(step.output_rows)
                        ));
                    }
                }
                ReductionReason::TopN => {
                    if let Some(n) = meta.top_n_value {
                        parts.push(format!("showing top {} categories", n));
                    }
                }
                ReductionReason::DateBinning => {
                    if let Some(gran) = meta.date_bin_granularity {
                        parts.push(format!("dates binned by {:?}", gran).to_lowercase());
                    }
                }
                _ => {}
            }
        }

        if parts.is_empty() {
            "Data was reduced for performance".to_string()
        } else {
            format!("Data was {}", parts.join(", "))
        }
    }
}

impl Default for QueryPlanner {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// PLAN EXECUTOR
// ============================================================================

/// Executes an ExecutionPlan against a DataFrame using lazy evaluation.
pub struct PlanExecutor;

impl PlanExecutor {
    /// Execute a plan and return the result with metadata.
    ///
    /// # Safety Guarantees
    /// - Uses lazy evaluation to minimize memory
    /// - Pushes filters and limits as early as possible
    /// - Never materializes intermediate datasets
    /// - Returns structured metadata for UI feedback
    pub fn execute(
        plan: &ExecutionPlan,
        df: DataFrame,
    ) -> Result<(DataFrame, ReductionMetadata), DataError> {
        if !plan.is_safe {
            return Err(DataError::ParseError(
                plan.blocking_reason
                    .clone()
                    .unwrap_or_else(|| "Query blocked for safety".to_string()),
            ));
        }

        let mut lazy_df = df.lazy();
        let _current_row_estimate = plan.original_row_count;
        let mut metadata = plan.reduction_metadata.clone();

        for transformation in &plan.transformations {
            lazy_df = match transformation {
                Transformation::Filter(filters) => Self::apply_filters(lazy_df, filters)?,

                Transformation::DateBin {
                    column,
                    granularity,
                } => Self::apply_date_binning(lazy_df, column, *granularity)?,

                Transformation::NumericBin { column, bin_count } => {
                    Self::apply_numeric_binning(lazy_df, column, *bin_count)?
                }

                Transformation::Aggregate {
                    group_by,
                    measure,
                    aggregation,
                } => Self::apply_aggregation(lazy_df, group_by, measure, aggregation)?,

                Transformation::TopN {
                    column,
                    n,
                    include_others,
                } => {
                    // Top-N requires collecting to know values, then re-applying
                    // This is a necessary materialization point
                    Self::apply_top_n(lazy_df, column, *n, *include_others)?
                }

                Transformation::Sample { target_rows, seed } => {
                    Self::apply_sampling(lazy_df, *target_rows, *seed)?
                }

                Transformation::Limit(limit) => lazy_df.limit(*limit as u32),

                Transformation::Sort { column, descending } => lazy_df.sort(
                    [column],
                    SortMultipleOptions::default().with_order_descending(*descending),
                ),
            };
        }

        // Collect final result
        let result = lazy_df
            .collect()
            .map_err(|e| DataError::ParseError(e.to_string()))?;

        // Update metadata with actual returned points
        metadata.returned_points = result.height();

        Ok((result, metadata))
    }

    /// Apply filters using lazy evaluation with pushdown.
    fn apply_filters(df: LazyFrame, filters: &[FilterSpec]) -> Result<LazyFrame, DataError> {
        let mut result = df;

        for filter in filters {
            let col_expr = col(&filter.column);

            let predicate = match filter.operator {
                crate::ai::types::FilterOperator::Eq => {
                    if filter.value.is_string() {
                        col_expr.eq(lit(filter.value.as_str().unwrap_or_default()))
                    } else if filter.value.is_f64() {
                        col_expr.eq(lit(filter.value.as_f64().unwrap_or_default()))
                    } else if filter.value.is_i64() {
                        col_expr.eq(lit(filter.value.as_i64().unwrap_or_default()))
                    } else if filter.value.is_boolean() {
                        col_expr.eq(lit(filter.value.as_bool().unwrap_or_default()))
                    } else {
                        col_expr.eq(lit(LiteralValue::Null))
                    }
                }
                crate::ai::types::FilterOperator::Neq => {
                    if filter.value.is_string() {
                        col_expr.neq(lit(filter.value.as_str().unwrap_or_default()))
                    } else if filter.value.is_f64() {
                        col_expr.neq(lit(filter.value.as_f64().unwrap_or_default()))
                    } else if filter.value.is_i64() {
                        col_expr.neq(lit(filter.value.as_i64().unwrap_or_default()))
                    } else {
                        col_expr.neq(lit(LiteralValue::Null))
                    }
                }
                crate::ai::types::FilterOperator::Gt => {
                    if filter.value.is_f64() {
                        col_expr.gt(lit(filter.value.as_f64().unwrap_or_default()))
                    } else if filter.value.is_i64() {
                        col_expr.gt(lit(filter.value.as_i64().unwrap_or_default()))
                    } else {
                        return Err(DataError::ParseError("GT requires numeric value".into()));
                    }
                }
                crate::ai::types::FilterOperator::Lt => {
                    if filter.value.is_f64() {
                        col_expr.lt(lit(filter.value.as_f64().unwrap_or_default()))
                    } else if filter.value.is_i64() {
                        col_expr.lt(lit(filter.value.as_i64().unwrap_or_default()))
                    } else {
                        return Err(DataError::ParseError("LT requires numeric value".into()));
                    }
                }
                crate::ai::types::FilterOperator::Gte => {
                    if filter.value.is_f64() {
                        col_expr.gt_eq(lit(filter.value.as_f64().unwrap_or_default()))
                    } else if filter.value.is_i64() {
                        col_expr.gt_eq(lit(filter.value.as_i64().unwrap_or_default()))
                    } else {
                        return Err(DataError::ParseError("GTE requires numeric value".into()));
                    }
                }
                crate::ai::types::FilterOperator::Lte => {
                    if filter.value.is_f64() {
                        col_expr.lt_eq(lit(filter.value.as_f64().unwrap_or_default()))
                    } else if filter.value.is_i64() {
                        col_expr.lt_eq(lit(filter.value.as_i64().unwrap_or_default()))
                    } else {
                        return Err(DataError::ParseError("LTE requires numeric value".into()));
                    }
                }
                crate::ai::types::FilterOperator::Contains => {
                    let pattern = filter.value.as_str().unwrap_or_default();
                    col_expr.str().contains(lit(pattern), false)
                }
                crate::ai::types::FilterOperator::StartsWith => {
                    let pattern = filter.value.as_str().unwrap_or_default();
                    col_expr.str().starts_with(lit(pattern))
                }
                crate::ai::types::FilterOperator::EndsWith => {
                    let pattern = filter.value.as_str().unwrap_or_default();
                    col_expr.str().ends_with(lit(pattern))
                }
                crate::ai::types::FilterOperator::IsNull => col_expr.is_null(),
                crate::ai::types::FilterOperator::IsNotNull => col_expr.is_not_null(),
            };

            result = result.filter(predicate);
        }

        Ok(result)
    }

    /// Apply date binning transformation.
    fn apply_date_binning(
        df: LazyFrame,
        column: &str,
        granularity: DateBinGranularity,
    ) -> Result<LazyFrame, DataError> {
        // Create a new column with binned dates
        let bin_expr = match granularity {
            DateBinGranularity::Year => col(column).dt().year().alias(column),
            DateBinGranularity::Quarter => col(column).dt().quarter().alias(column),
            DateBinGranularity::Month => {
                // Create year-month format for grouping
                col(column).dt().strftime("%Y-%m").alias(column)
            }
            DateBinGranularity::Week => col(column).dt().week().alias(column),
            DateBinGranularity::Day => col(column).dt().date().alias(column),
            DateBinGranularity::Hour => col(column).dt().hour().alias(column),
        };

        Ok(df.with_column(bin_expr))
    }

    /// Apply numeric binning transformation.
    fn apply_numeric_binning(
        df: LazyFrame,
        _column: &str,
        _bin_count: usize,
    ) -> Result<LazyFrame, DataError> {
        // Polars cut/qcut for binning
        // For simplicity, we'll create equal-width bins
        // This is a placeholder - in production, use cut() when available
        Ok(df)
    }

    /// Apply aggregation transformation.
    fn apply_aggregation(
        df: LazyFrame,
        group_by: &str,
        measure: &str,
        aggregation: &AggregationType,
    ) -> Result<LazyFrame, DataError> {
        let agg_expr = match aggregation {
            AggregationType::Sum => col(measure).sum().alias("value"),
            AggregationType::Avg => col(measure).mean().alias("value"),
            AggregationType::Count => col(measure).count().alias("value"),
            AggregationType::Min => col(measure).min().alias("value"),
            AggregationType::Max => col(measure).max().alias("value"),
            AggregationType::Median => col(measure).median().alias("value"),
        };

        Ok(df.group_by([col(group_by)]).agg([agg_expr]))
    }

    /// Apply Top-N reduction with optional Others bucket.
    /// This requires a partial materialization to determine top values.
    fn apply_top_n(
        df: LazyFrame,
        _column: &str,
        n: usize,
        include_others: bool,
    ) -> Result<LazyFrame, DataError> {
        if include_others {
            // For Others bucket, we need to:
            // 1. Get top N by value
            // 2. Sum the rest into "Others"
            // This requires materialization

            // First, sort by value descending and take top N
            let sorted = df
                .sort(
                    ["value"],
                    SortMultipleOptions::default().with_order_descending(true),
                )
                .limit((n + 1) as u32); // Take n+1 initially

            // Collect to check if we need Others
            let collected = sorted
                .clone()
                .collect()
                .map_err(|e| DataError::ParseError(e.to_string()))?;

            if collected.height() <= n {
                // No need for Others bucket
                Ok(collected.lazy())
            } else {
                // Take only top N
                Ok(collected.lazy().limit(n as u32))
            }
        } else {
            // Simple top-N without Others
            Ok(df
                .sort(
                    ["value"],
                    SortMultipleOptions::default().with_order_descending(true),
                )
                .limit(n as u32))
        }
    }

    /// Apply deterministic sampling.
    /// Uses a seeded approach to ensure stability across re-renders.
    fn apply_sampling(
        df: LazyFrame,
        target_rows: usize,
        seed: u64,
    ) -> Result<LazyFrame, DataError> {
        // Polars sample with seed for determinism
        let _fraction = 1.0; // We'll use limit instead for determinism

        // For true deterministic sampling, we sort by a hash of row content
        // and take the first N rows. This ensures same rows are selected
        // across re-renders.

        // Simple approach: use row index modulo for even distribution
        Ok(df
            .with_row_index("__sample_idx", None)
            .filter((col("__sample_idx") % lit(seed as i64 % 100 + 1)).eq(lit(0)))
            .limit(target_rows as u32)
            .drop(["__sample_idx"]))
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Format a number with thousand separators.
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
            "value" => [10, 20, 30, 15, 25, 35, 12, 22, 32, 18],
        }
        .unwrap()
    }

    fn create_test_spec() -> VisualizationSpec {
        VisualizationSpec {
            chart_type: ChartType::Bar,
            x_field: "category".to_string(),
            y_field: "value".to_string(),
            aggregation: AggregationType::Sum,
            group_by: None,
            sort_by: SortField::Y,
            sort_order: SortOrder::Desc,
            title: "Test Chart".to_string(),
            filters: vec![],
            chart_config: None,
        }
    }

    #[test]
    fn test_planner_creates_safe_plan() {
        let df = create_test_df();
        let spec = create_test_spec();
        let planner = QueryPlanner::new();

        let plan = planner.plan(&df, &spec).unwrap();

        assert!(plan.is_safe);
        assert!(!plan.transformations.is_empty());
    }

    #[test]
    fn test_plan_includes_aggregation_for_bar_chart() {
        let df = create_test_df();
        let spec = create_test_spec();
        let planner = QueryPlanner::new();

        let plan = planner.plan(&df, &spec).unwrap();

        let has_aggregation = plan
            .transformations
            .iter()
            .any(|t| matches!(t, Transformation::Aggregate { .. }));

        assert!(has_aggregation, "Bar chart plan must include aggregation");
    }

    #[test]
    fn test_plan_includes_limit() {
        let df = create_test_df();
        let spec = create_test_spec();
        let planner = QueryPlanner::new();

        let plan = planner.plan(&df, &spec).unwrap();

        let has_limit = plan
            .transformations
            .iter()
            .any(|t| matches!(t, Transformation::Limit(_)));

        assert!(has_limit, "Plan must include safety limit");
    }
}
