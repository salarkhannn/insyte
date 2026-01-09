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
