use crate::data::state::AppDataState;
use crate::error::DataError;
use polars::prelude::*;
use rust_xlsxwriter::{Format, Workbook};
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use tauri::State;
use tauri_plugin_dialog::DialogExt;

fn df_to_csv_string(df: &DataFrame) -> Result<String, DataError> {
    let mut buffer: Vec<u8> = Vec::new();
    CsvWriter::new(&mut buffer)
        .include_header(true)
        .finish(&mut df.clone())
        .map_err(|e| DataError::WriteError(e.to_string()))?;
    String::from_utf8(buffer).map_err(|e| DataError::WriteError(e.to_string()))
}

#[tauri::command]
pub async fn export_csv(
    app: tauri::AppHandle,
    state: State<'_, AppDataState>,
    path: Option<String>,
) -> Result<String, DataError> {
    let data_state = state.lock().map_err(|e| DataError::ParseError(e.to_string()))?;
    let df = data_state.get_dataframe().ok_or(DataError::NoData)?;

    let save_path = match path {
        Some(p) => PathBuf::from(p),
        None => {
            let file_path = app
                .dialog()
                .file()
                .add_filter("CSV Files", &["csv"])
                .set_file_name("export.csv")
                .blocking_save_file();

            match file_path {
                Some(p) => p.into_path().map_err(|e| DataError::WriteError(e.to_string()))?,
                None => return Err(DataError::Cancelled),
            }
        }
    };

    let csv_content = df_to_csv_string(df)?;
    let mut file = File::create(&save_path).map_err(|e| DataError::WriteError(e.to_string()))?;
    file.write_all(csv_content.as_bytes())
        .map_err(|e| DataError::WriteError(e.to_string()))?;

    Ok(save_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn export_excel(
    app: tauri::AppHandle,
    state: State<'_, AppDataState>,
    path: Option<String>,
) -> Result<String, DataError> {
    let data_state = state.lock().map_err(|e| DataError::ParseError(e.to_string()))?;
    let df = data_state.get_dataframe().ok_or(DataError::NoData)?;

    let save_path = match path {
        Some(p) => PathBuf::from(p),
        None => {
            let file_path = app
                .dialog()
                .file()
                .add_filter("Excel Files", &["xlsx"])
                .set_file_name("export.xlsx")
                .blocking_save_file();

            match file_path {
                Some(p) => p.into_path().map_err(|e| DataError::WriteError(e.to_string()))?,
                None => return Err(DataError::Cancelled),
            }
        }
    };

    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();
    
    let header_format = Format::new().set_bold();

    let columns = df.get_columns();
    for (col_idx, col) in columns.iter().enumerate() {
        worksheet
            .write_string_with_format(0, col_idx as u16, col.name().to_string(), &header_format)
            .map_err(|e| DataError::WriteError(e.to_string()))?;
    }

    for row_idx in 0..df.height() {
        for (col_idx, col) in columns.iter().enumerate() {
            let cell_value = col.get(row_idx).ok();
            let row = (row_idx + 1) as u32;
            let col_num = col_idx as u16;

            match cell_value {
                Some(AnyValue::Null) => {
                    worksheet.write_string(row, col_num, "").ok();
                }
                Some(AnyValue::Int8(v)) => {
                    worksheet.write_number(row, col_num, v as f64).ok();
                }
                Some(AnyValue::Int16(v)) => {
                    worksheet.write_number(row, col_num, v as f64).ok();
                }
                Some(AnyValue::Int32(v)) => {
                    worksheet.write_number(row, col_num, v as f64).ok();
                }
                Some(AnyValue::Int64(v)) => {
                    worksheet.write_number(row, col_num, v as f64).ok();
                }
                Some(AnyValue::UInt8(v)) => {
                    worksheet.write_number(row, col_num, v as f64).ok();
                }
                Some(AnyValue::UInt16(v)) => {
                    worksheet.write_number(row, col_num, v as f64).ok();
                }
                Some(AnyValue::UInt32(v)) => {
                    worksheet.write_number(row, col_num, v as f64).ok();
                }
                Some(AnyValue::UInt64(v)) => {
                    worksheet.write_number(row, col_num, v as f64).ok();
                }
                Some(AnyValue::Float32(v)) => {
                    worksheet.write_number(row, col_num, v as f64).ok();
                }
                Some(AnyValue::Float64(v)) => {
                    worksheet.write_number(row, col_num, v).ok();
                }
                Some(AnyValue::Boolean(v)) => {
                    worksheet.write_boolean(row, col_num, v).ok();
                }
                Some(AnyValue::String(v)) => {
                    worksheet.write_string(row, col_num, v).ok();
                }
                Some(AnyValue::StringOwned(v)) => {
                    worksheet.write_string(row, col_num, v.to_string()).ok();
                }
                Some(v) => {
                    worksheet.write_string(row, col_num, v.to_string()).ok();
                }
                None => {
                    worksheet.write_string(row, col_num, "").ok();
                }
            }
        }
    }

    workbook
        .save(&save_path)
        .map_err(|e| DataError::WriteError(e.to_string()))?;

    Ok(save_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn export_chart_image(
    app: tauri::AppHandle,
    image_data: String,
) -> Result<String, DataError> {
    use base64::Engine;

    let save_path = {
        let file_path = app
            .dialog()
            .file()
            .add_filter("PNG Image", &["png"])
            .set_file_name("chart.png")
            .blocking_save_file();

        match file_path {
            Some(p) => p.into_path().map_err(|e| DataError::WriteError(e.to_string()))?,
            None => return Err(DataError::Cancelled),
        }
    };

    let decoded = base64::engine::general_purpose::STANDARD
        .decode(&image_data)
        .map_err(|e| DataError::WriteError(format!("Failed to decode image: {}", e)))?;

    let mut file = File::create(&save_path).map_err(|e| DataError::WriteError(e.to_string()))?;
    file.write_all(&decoded)
        .map_err(|e| DataError::WriteError(e.to_string()))?;

    Ok(save_path.to_string_lossy().to_string())
}
