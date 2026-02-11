use crate::data::state::AppDataState;
use crate::data::types::{ColumnInfo, DataPage, DatasetInfo};
use crate::error::DataError;
use calamine::{open_workbook, Reader, Xlsx, Data as CalamineData};
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

fn try_parse_dates(df: DataFrame) -> DataFrame {
    let mut df = df;
    let date_formats = vec![
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%m/%d/%Y",
        "%m-%d-%Y",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%Y-%m-%d %H:%M:%S",
        "%Y/%m/%d %H:%M:%S",
    ];

    let string_cols: Vec<(usize, String)> = df
        .get_columns()
        .iter()
        .enumerate()
        .filter(|(_, col)| matches!(col.dtype(), DataType::String))
        .map(|(idx, col)| (idx, col.name().to_string()))
        .collect();

    for (idx, col_name) in string_cols {
        let col = df.column(&col_name).unwrap();
        
        let sample_size = 100.min(col.len());
        let mut successful_parses = 0;
        let mut found_format: Option<&str> = None;

        for format in &date_formats {
            let mut parses = 0;
            for i in 0..sample_size {
                if let Ok(AnyValue::String(s)) = col.get(i) {
                    if s.is_empty() {
                        continue;
                    }
                    if chrono::NaiveDate::parse_from_str(s, format).is_ok()
                        || chrono::NaiveDateTime::parse_from_str(s, format).is_ok()
                    {
                        parses += 1;
                    }
                }
            }
            
            if parses > successful_parses {
                successful_parses = parses;
                found_format = Some(format);
            }
        }

        if successful_parses > 0 && successful_parses as f64 / sample_size as f64 > 0.8 {
            if let Some(format) = found_format {
                if let Ok(parsed) = col
                    .str()
                    .and_then(|ca| ca.as_date(Some(format), false))
                {
                    df.replace(&col_name, parsed.into_series()).ok();
                }
            }
        }
    }

    df
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
                    Some(AnyValue::Date(d)) => serde_json::json!(d.to_string()),
                    Some(AnyValue::Datetime(dt, _, _)) => serde_json::json!(dt.to_string()),
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
    let file_path = std::path::PathBuf::from(&path);

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
        .with_ignore_errors(true)
        .try_into_reader_with_file_path(Some(file_path.clone()))?
        .finish()?;

    // Try to detect and parse date columns
    let df = try_parse_dates(df);

    let columns = df_to_columns(&df);
    let row_count = df.height();

    let mut data_state = state
        .lock()
        .map_err(|e| DataError::ParseError(e.to_string()))?;
    
    data_state.clear();
    let table_name = "default".to_string();
    data_state.add_dataframe(table_name.clone(), df);
    data_state.set_active_table(table_name.clone()).map_err(|e| DataError::ParseError(e))?;
    data_state.set_file_path(path.clone());

    Ok(DatasetInfo {
        file_name,
        file_path: path,
        file_size,
        row_count,
        columns,
        tables: vec![table_name],
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

    // Try to detect and parse date columns
    let df = try_parse_dates(df);

    let columns = df_to_columns(&df);
    let row_count = df.height();

    let mut data_state = state
        .lock()
        .map_err(|e| DataError::ParseError(e.to_string()))?;
    
    data_state.clear();
    let table_name = "default".to_string();
    data_state.add_dataframe(table_name.clone(), df);
    data_state.set_active_table(table_name.clone()).map_err(|e| DataError::ParseError(e))?;
    data_state.set_file_path(path.clone());

    Ok(DatasetInfo {
        file_name,
        file_path: path,
        file_size,
        row_count,
        columns,
        tables: vec![table_name],
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

    if sheets.is_empty() {
        return Err(DataError::NoData);
    }

    let mut data_state = state
        .lock()
        .map_err(|e| DataError::ParseError(e.to_string()))?;
    
    data_state.clear();
    data_state.set_file_path(path.clone());

    let mut first_valid_sheet: Option<(String, usize, Vec<ColumnInfo>)> = None;
    let mut loaded_tables = Vec::new();

    for sheet_name in sheets {
        let range_result = workbook.worksheet_range(&sheet_name);
        if let Ok(range) = range_result {
            let mut headers: Vec<String> = Vec::new();
            let mut data: Vec<Vec<CalamineData>> = Vec::new();

            for (i, row) in range.rows().enumerate() {
                if i == 0 {
                    headers = row.iter().map(|c| c.to_string()).collect();
                } else {
                    data.push(row.to_vec());
                }
            }

            if !headers.is_empty() {
                let mut columns_data: Vec<Series> = Vec::new();
                for (idx, header) in headers.iter().enumerate() {
                    let col_data: Vec<&CalamineData> = data.iter().map(|row| &row[idx]).collect();
                    
                    let mut has_string = false;
                    let mut has_float = false;
                    let mut has_bool = false;
                    
                    for val in &col_data {
                        match val {
                            CalamineData::String(_) => has_string = true,
                            CalamineData::Float(_) | CalamineData::Int(_) => has_float = true,
                            CalamineData::Bool(_) => has_bool = true,
                            _ => {}
                        }
                    }

                    let series = if has_string {
                        let values: Vec<Option<String>> = col_data.iter().map(|v| match v {
                            CalamineData::String(s) => Some(s.clone()),
                            CalamineData::Int(i) => Some(i.to_string()),
                            CalamineData::Float(f) => Some(f.to_string()),
                            CalamineData::Bool(b) => Some(b.to_string()),
                            CalamineData::DateTime(f) => Some(f.to_string()),
                            _ => None,
                        }).collect();
                        Series::new(header.into(), values)
                    } else if has_float {
                        let values: Vec<Option<f64>> = col_data.iter().map(|v| match v {
                            CalamineData::Int(i) => Some(*i as f64),
                            CalamineData::Float(f) => Some(*f),
                            CalamineData::DateTime(dt) => Some(dt.as_f64()),
                            _ => None,
                        }).collect();
                        Series::new(header.into(), values)
                    } else if has_bool {
                        let values: Vec<Option<bool>> = col_data.iter().map(|v| match v {
                            CalamineData::Bool(b) => Some(*b),
                            _ => None,
                        }).collect();
                        Series::new(header.into(), values)
                    } else {
                        Series::new_null(header.into(), col_data.len())
                    };

                    columns_data.push(series);
                }

                if let Ok(df) = DataFrame::new(columns_data) {
                    // Try to detect and parse date columns
                    let df = try_parse_dates(df);
                    
                    let row_count = df.height();
                    let columns = df_to_columns(&df);
                    
                    data_state.add_dataframe(sheet_name.clone(), df);
                    loaded_tables.push(sheet_name.clone());

                    if first_valid_sheet.is_none() {
                        first_valid_sheet = Some((sheet_name.clone(), row_count, columns));
                    }
                }
            }
        }
    }

    if let Some((first_sheet_name, row_count, columns)) = first_valid_sheet {
         data_state.set_active_table(first_sheet_name).map_err(|e| DataError::ParseError(e))?;

         Ok(DatasetInfo {
            file_name,
            file_path: path,
            file_size,
            row_count,
            columns,
            tables: loaded_tables,
        })
    } else {
        Err(DataError::NoData)
    }
}

#[tauri::command]
pub async fn set_active_table(
    table_name: String,
    state: State<'_, AppDataState>,
) -> Result<DatasetInfo, DataError> {
    let mut data_state = state
        .lock()
        .map_err(|e| DataError::ParseError(e.to_string()))?;

    data_state.set_active_table(table_name.clone()).map_err(|e| DataError::ParseError(e))?;
    
    let df = data_state.get_active_dataframe().ok_or(DataError::NoData)?;
    let row_count = df.height();
    let columns = df_to_columns(df);
    let path = data_state.get_file_path().cloned().unwrap_or_default();
    
    // Recalculate basic info
    let file_path = Path::new(&path);
    let file_name = file_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();
    
    // We assume file size is same for now, or fetch it again
    let file_size = if file_path.exists() {
        fs::metadata(&path)?.len()
    } else {
        0
    };

    Ok(DatasetInfo {
        file_name,
        file_path: path,
        file_size,
        row_count,
        columns,
        tables: data_state.get_tables(),
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

    let df = data_state.get_active_dataframe().ok_or(DataError::NoData)?;
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