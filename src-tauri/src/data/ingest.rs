use crate::data::state::AppDataState;
use crate::data::types::{ColumnInfo, DataPage, DatasetInfo};
use crate::error::DataError;
use calamine::{open_workbook, Reader, Xlsx};
use polars::prelude::*;
use std::fs;
use std::path::Path;
use tauri::State;

fn polars_dtype_to_string(dtype: &DataType) -> String {
    match dtype {
        DataType::Int8
        | DataType::Int16
        | DataType::Int32
        | DataType::Int64
        | DataType::UInt8
        | DataType::UInt16
        | DataType::UInt32
        | DataType::UInt64 => "integer".to_string(),
        DataType::Float32 | DataType::Float64 => "float".to_string(),
        DataType::Boolean => "boolean".to_string(),
        DataType::Date | DataType::Datetime(_, _) => "date".to_string(),
        _ => "string".to_string(),
    }
}

fn df_to_columns(df: &DataFrame) -> Vec<ColumnInfo> {
    df.get_columns()
        .iter()
        .map(|col| ColumnInfo {
            name: col.name().to_string(),
            dtype: polars_dtype_to_string(col.dtype()),
            nullable: true,
        })
        .collect()
}

fn df_to_rows(df: &DataFrame, offset: usize, limit: usize) -> Vec<Vec<serde_json::Value>> {
    let height = df.height();
    let end = (offset + limit).min(height);

    if offset >= height {
        return vec![];
    }

    let sliced = df.slice(offset as i64, end - offset);
    let mut rows = Vec::with_capacity(sliced.height());

    for i in 0..sliced.height() {
        let row: Vec<serde_json::Value> = sliced
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

#[tauri::command]
pub async fn load_csv(
    path: String,
    state: State<'_, AppDataState>,
) -> Result<DatasetInfo, DataError> {
    let file_path = Path::new(&path);

    if !file_path.exists() {
        return Err(DataError::FileNotFound(path));
    }

    let metadata = fs::metadata(&path)?;
    let file_size = metadata.len();
    let file_name = file_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    let df = CsvReadOptions::default()
        .with_has_header(true)
        .with_infer_schema_length(Some(1000))
        .try_into_reader_with_file_path(Some(path.clone().into()))?
        .finish()?;

    let columns = df_to_columns(&df);
    let row_count = df.height();

    let mut data_state = state
        .lock()
        .map_err(|e| DataError::ParseError(e.to_string()))?;
    data_state.set_dataframe(df, path.clone());

    Ok(DatasetInfo {
        file_name,
        file_path: path,
        file_size,
        row_count,
        columns,
    })
}

#[tauri::command]
pub async fn load_json(
    path: String,
    state: State<'_, AppDataState>,
) -> Result<DatasetInfo, DataError> {
    let file_path = Path::new(&path);

    if !file_path.exists() {
        return Err(DataError::FileNotFound(path));
    }

    let metadata = fs::metadata(&path)?;
    let file_size = metadata.len();
    let file_name = file_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    let file = fs::File::open(&path)?;
    let df = JsonReader::new(file).finish()?;

    let columns = df_to_columns(&df);
    let row_count = df.height();

    let mut data_state = state
        .lock()
        .map_err(|e| DataError::ParseError(e.to_string()))?;
    data_state.set_dataframe(df, path.clone());

    Ok(DatasetInfo {
        file_name,
        file_path: path,
        file_size,
        row_count,
        columns,
    })
}

#[tauri::command]
pub async fn list_excel_sheets(path: String) -> Result<Vec<String>, DataError> {
    let file_path = Path::new(&path);

    if !file_path.exists() {
        return Err(DataError::FileNotFound(path));
    }

    let workbook: Xlsx<_> = open_workbook(&path)?;
    let sheets = workbook.sheet_names().to_vec();

    Ok(sheets)
}

#[tauri::command]
pub async fn load_excel(
    path: String,
    sheet: Option<String>,
    state: State<'_, AppDataState>,
) -> Result<DatasetInfo, DataError> {
    let file_path = Path::new(&path);

    if !file_path.exists() {
        return Err(DataError::FileNotFound(path));
    }

    let metadata = fs::metadata(&path)?;
    let file_size = metadata.len();
    let file_name = file_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    let mut workbook: Xlsx<_> = open_workbook(&path)?;
    let sheets = workbook.sheet_names().to_vec();

    let sheet_name = match sheet {
        Some(s) => {
            if sheets.contains(&s) {
                s
            } else {
                return Err(DataError::InvalidSheet(s));
            }
        }
        None => sheets.first().cloned().ok_or(DataError::NoData)?,
    };

    let range = workbook
        .worksheet_range(&sheet_name)
        .map_err(|e| DataError::ReadError(e.to_string()))?;

    let mut headers: Vec<String> = Vec::new();
    let mut data: Vec<Vec<String>> = Vec::new();

    for (i, row) in range.rows().enumerate() {
        if i == 0 {
            headers = row.iter().map(|c| c.to_string()).collect();
        } else {
            let row_data: Vec<String> = row.iter().map(|c| c.to_string()).collect();
            data.push(row_data);
        }
    }

    if headers.is_empty() {
        return Err(DataError::NoData);
    }

    let mut columns_data: Vec<Series> = Vec::new();
    for (idx, header) in headers.iter().enumerate() {
        let col_values: Vec<Option<String>> =
            data.iter().map(|row| row.get(idx).cloned()).collect();

        let series = Series::new(header.into(), col_values);
        columns_data.push(series);
    }

    let df = DataFrame::new(columns_data).map_err(|e| DataError::ParseError(e.to_string()))?;
    let columns = df_to_columns(&df);
    let row_count = df.height();

    let mut data_state = state
        .lock()
        .map_err(|e| DataError::ParseError(e.to_string()))?;
    data_state.set_dataframe(df, path.clone());

    Ok(DatasetInfo {
        file_name,
        file_path: path,
        file_size,
        row_count,
        columns,
    })
}

#[tauri::command]
pub async fn get_data_page(
    offset: usize,
    limit: usize,
    state: State<'_, AppDataState>,
) -> Result<DataPage, DataError> {
    let data_state = state
        .lock()
        .map_err(|e| DataError::ParseError(e.to_string()))?;

    let df = data_state.get_dataframe().ok_or(DataError::NoData)?;
    let total_rows = df.height();
    let rows = df_to_rows(df, offset, limit);

    Ok(DataPage {
        rows,
        total_rows,
        offset,
        limit,
    })
}

#[tauri::command]
pub async fn clear_data(state: State<'_, AppDataState>) -> Result<(), DataError> {
    let mut data_state = state
        .lock()
        .map_err(|e| DataError::ParseError(e.to_string()))?;
    data_state.clear();
    Ok(())
}
