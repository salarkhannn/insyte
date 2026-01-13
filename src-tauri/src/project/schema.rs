use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::ai::types::VisualizationSpec;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InsyteProject {
    pub version: String,
    pub created_at: DateTime<Utc>,
    pub modified_at: DateTime<Utc>,
    pub data: ProjectData,
    pub visualization: Option<VisualizationSpec>,
    pub query_history: Vec<QueryHistoryItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectData {
    pub source_type: DataSourceType,
    pub source_path: Option<String>,
    pub schema: DatasetSchema,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DataSourceType {
    Path,
    Embedded,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatasetSchema {
    pub columns: Vec<ColumnSchema>,
    pub row_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColumnSchema {
    pub name: String,
    pub dtype: String,
    pub nullable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryHistoryItem {
    pub id: String,
    pub query: String,
    pub timestamp: i64,
    pub visualization: Option<VisualizationSpec>,
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentProject {
    pub path: String,
    pub name: String,
    pub last_opened: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data_source: Option<String>,
}
