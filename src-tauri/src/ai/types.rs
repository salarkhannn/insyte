use serde::{Deserialize, Serialize};
use crate::data::safety::DateBinGranularity;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VisualizationSpec {
    pub chart_type: ChartType,
    pub x_field: String,
    pub y_field: String,
    pub aggregation: AggregationType,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub x_date_binning: Option<DateBinGranularity>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub y_date_binning: Option<DateBinGranularity>,
    pub group_by: Option<String>,
    pub sort_by: SortField,
    pub sort_order: SortOrder,
    pub title: String,
    pub filters: Vec<FilterSpec>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chart_config: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ChartType {
    Bar,
    Line,
    Area,
    Pie,
    Scatter,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AggregationType {
    Sum,
    Avg,
    Count,
    Min,
    Max,
    Median,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SortField {
    X,
    Y,
    None,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SortOrder {
    Asc,
    Desc,
    None,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilterSpec {
    pub column: String,
    pub operator: FilterOperator,
    pub value: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum FilterOperator {
    Eq,
    Neq,
    Gt,
    Lt,
    Gte,
    Lte,
    Contains,
    StartsWith,
    EndsWith,
    IsNull,
    IsNotNull,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataInsight {
    pub label: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum AIChatResponse {
    #[serde(rename = "visualization")]
    Visualization {
        spec: VisualizationSpec,
        explanation: String,
    },
    #[serde(rename = "answer")]
    Answer {
        content: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        insights: Option<Vec<DataInsight>>,
    },
    #[serde(rename = "error")]
    Error { message: String },
}
