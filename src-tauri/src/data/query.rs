use crate::ai::types::{AggregationType, FilterOperator, FilterSpec, SortField, SortOrder, VisualizationSpec};
use crate::data::state::AppDataState;
use crate::error::DataError;
use polars::prelude::*;
use serde::{Deserialize, Serialize};
use tauri::State;

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChartMetadata {
    pub title: String,
    pub x_label: String,
    pub y_label: String,
    pub total_records: usize,
}

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
                return Err(DataError::ParseError("Unsupported filter value type".into()));
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
                return Err(DataError::ParseError("Unsupported filter value type".into()));
            }
        }
        FilterOperator::Gt => {
            if filter.value.is_f64() {
                col_expr.gt(lit(filter.value.as_f64().unwrap_or_default()))
            } else if filter.value.is_i64() {
                col_expr.gt(lit(filter.value.as_i64().unwrap_or_default()))
            } else {
                return Err(DataError::ParseError("GT filter requires numeric value".into()));
            }
        }
        FilterOperator::Lt => {
            if filter.value.is_f64() {
                col_expr.lt(lit(filter.value.as_f64().unwrap_or_default()))
            } else if filter.value.is_i64() {
                col_expr.lt(lit(filter.value.as_i64().unwrap_or_default()))
            } else {
                return Err(DataError::ParseError("LT filter requires numeric value".into()));
            }
        }
        FilterOperator::Gte => {
            if filter.value.is_f64() {
                col_expr.gt_eq(lit(filter.value.as_f64().unwrap_or_default()))
            } else if filter.value.is_i64() {
                col_expr.gt_eq(lit(filter.value.as_i64().unwrap_or_default()))
            } else {
                return Err(DataError::ParseError("GTE filter requires numeric value".into()));
            }
        }
        FilterOperator::Lte => {
            if filter.value.is_f64() {
                col_expr.lt_eq(lit(filter.value.as_f64().unwrap_or_default()))
            } else if filter.value.is_i64() {
                col_expr.lt_eq(lit(filter.value.as_i64().unwrap_or_default()))
            } else {
                return Err(DataError::ParseError("LTE filter requires numeric value".into()));
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
    };

    Ok(df.group_by([col(x_field)]).agg([agg_expr]))
}

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

fn extract_chart_data(df: DataFrame, x_field: &str) -> Result<(Vec<String>, Vec<f64>), DataError> {
    let x_col = df.column(x_field).map_err(|e| DataError::ParseError(e.to_string()))?;
    let y_col = df.column("value").map_err(|e| DataError::ParseError(e.to_string()))?;

    let labels: Vec<String> = x_col
        .iter()
        .map(|v| format!("{}", v))
        .collect();

    let data: Vec<f64> = y_col
        .cast(&DataType::Float64)
        .map_err(|e| DataError::ParseError(e.to_string()))?
        .f64()
        .map_err(|e| DataError::ParseError(e.to_string()))?
        .into_iter()
        .map(|v| v.unwrap_or(0.0))
        .collect();

    Ok((labels, data))
}

#[tauri::command]
pub async fn execute_visualization_query(
    spec: VisualizationSpec,
    state: State<'_, AppDataState>,
) -> Result<ChartData, DataError> {
    let data_state = state
        .lock()
        .map_err(|e| DataError::ParseError(e.to_string()))?;

    let df = data_state
        .get_dataframe()
        .ok_or(DataError::NoData)?
        .clone();

    let total_records = df.height();
    let mut lazy_df = df.lazy();

    for filter in &spec.filters {
        lazy_df = apply_filter(lazy_df, filter)?;
    }

    lazy_df = apply_aggregation(lazy_df, &spec.x_field, &spec.y_field, &spec.aggregation)?;
    lazy_df = apply_sorting(lazy_df, &spec.x_field, &spec.sort_by, &spec.sort_order);

    let result_df = lazy_df
        .collect()
        .map_err(|e| DataError::ParseError(e.to_string()))?;

    let (labels, data) = extract_chart_data(result_df, &spec.x_field)?;

    let agg_label = match spec.aggregation {
        AggregationType::Sum => format!("Sum of {}", spec.y_field),
        AggregationType::Avg => format!("Average of {}", spec.y_field),
        AggregationType::Count => format!("Count of {}", spec.y_field),
        AggregationType::Min => format!("Min of {}", spec.y_field),
        AggregationType::Max => format!("Max of {}", spec.y_field),
    };

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
        },
    })
}
