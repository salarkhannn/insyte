use crate::data::state::AppDataState;
use crate::error::DataError;
use image::ImageReader;
use polars::prelude::*;
use rust_xlsxwriter::{Format, Workbook};
use serde::Deserialize;
use std::fs::File;
use std::io::{BufWriter, Cursor, Write};
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

fn estimate_column_width(col: &Series, max_rows_to_check: usize) -> f64 {
    let header_len = col.name().len();
    let mut max_len = header_len;

    let check_count = max_rows_to_check.min(col.len());
    for i in 0..check_count {
        if let Ok(val) = col.get(i) {
            let val_len = match val {
                AnyValue::Null => 0,
                AnyValue::String(s) => s.len(),
                AnyValue::StringOwned(s) => s.len(),
                v => v.to_string().len(),
            };
            if val_len > max_len {
                max_len = val_len;
            }
        }
    }

    (max_len as f64 * 1.1).max(8.0).min(50.0)
}

#[tauri::command]
pub async fn export_csv(
    app: tauri::AppHandle,
    state: State<'_, AppDataState>,
    path: Option<String>,
) -> Result<String, DataError> {
    let data_state = state.lock().map_err(|e| DataError::ParseError(e.to_string()))?;
    let df = data_state.get_active_dataframe().ok_or(DataError::NoData)?;

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
    let df = data_state.get_active_dataframe().ok_or(DataError::NoData)?;

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

    let columns: Vec<&Series> = df.get_columns().iter().map(|c| c.as_series()).collect();
    for (col_idx, col) in columns.iter().enumerate() {
        worksheet
            .write_string_with_format(0, col_idx as u16, col.name().to_string(), &header_format)
            .map_err(|e| DataError::WriteError(e.to_string()))?;

        let width = estimate_column_width(col, 100);
        worksheet
            .set_column_width(col_idx as u16, width)
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

#[derive(Deserialize)]
pub struct ChartExportMetadata {
    pub title: String,
    pub record_count: u64,
    pub x_label: Option<String>,
    pub y_label: Option<String>,
}

#[tauri::command]
pub async fn export_chart(
    app: tauri::AppHandle,
    image_data: String,
    metadata: ChartExportMetadata,
) -> Result<String, DataError> {
    use base64::Engine;

    let save_path = {
        let file_path = app
            .dialog()
            .file()
            .add_filter("PDF Document", &["pdf"])
            .add_filter("PNG Image", &["png"])
            .set_file_name("chart.pdf")
            .blocking_save_file();

        match file_path {
            Some(p) => p.into_path().map_err(|e| DataError::WriteError(e.to_string()))?,
            None => return Err(DataError::Cancelled),
        }
    };

    let decoded = base64::engine::general_purpose::STANDARD
        .decode(&image_data)
        .map_err(|e| DataError::WriteError(format!("Failed to decode image: {}", e)))?;

    let extension = save_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png")
        .to_lowercase();

    if extension == "pdf" {
        export_chart_as_pdf(&save_path, &decoded, &metadata)?;
    } else {
        let mut file =
            File::create(&save_path).map_err(|e| DataError::WriteError(e.to_string()))?;
        file.write_all(&decoded)
            .map_err(|e| DataError::WriteError(e.to_string()))?;
    }

    Ok(save_path.to_string_lossy().to_string())
}

fn export_chart_as_pdf(
    path: &PathBuf,
    image_bytes: &[u8],
    metadata: &ChartExportMetadata,
) -> Result<(), DataError> {
    use printpdf::*;

    let cursor = Cursor::new(image_bytes);
    let reader = ImageReader::new(cursor)
        .with_guessed_format()
        .map_err(|e| DataError::WriteError(format!("Failed to read image format: {}", e)))?;
    let img = reader
        .decode()
        .map_err(|e| DataError::WriteError(format!("Failed to decode image: {}", e)))?;
    let img_width = img.width() as f32;
    let img_height = img.height() as f32;

    let page_width_mm: f32 = 297.0;
    let page_height_mm: f32 = 210.0;
    let margin_mm: f32 = 15.0;
    let header_height: f32 = 20.0;

    let (doc, page1, layer1) = PdfDocument::new(
        &metadata.title,
        Mm(page_width_mm),
        Mm(page_height_mm),
        "Layer 1",
    );

    let current_layer = doc.get_page(page1).get_layer(layer1);

    let font = doc
        .add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|e| DataError::WriteError(format!("Failed to add font: {}", e)))?;
    let font_bold = doc
        .add_builtin_font(BuiltinFont::HelveticaBold)
        .map_err(|e| DataError::WriteError(format!("Failed to add font: {}", e)))?;

    let title_y = page_height_mm - margin_mm - 5.0;
    current_layer.use_text(&metadata.title, 16.0, Mm(margin_mm), Mm(title_y), &font_bold);

    let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M").to_string();
    let subtitle = format!(
        "{} records  •  Exported {}",
        metadata.record_count, timestamp
    );
    current_layer.use_text(&subtitle, 9.0, Mm(margin_mm), Mm(title_y - 7.0), &font);

    let content_top = page_height_mm - margin_mm - header_height;
    let content_bottom = margin_mm;
    let available_width = page_width_mm - (2.0 * margin_mm);
    let available_height = content_top - content_bottom;

    let img_aspect = img_width / img_height;
    let area_aspect = available_width / available_height;

    let (final_width_mm, final_height_mm) = if img_aspect > area_aspect {
        let w = available_width;
        let h = w / img_aspect;
        (w, h)
    } else {
        let h = available_height;
        let w = h * img_aspect;
        (w, h)
    };

    let img_x = margin_mm + (available_width - final_width_mm) / 2.0;
    let img_y = content_bottom + (available_height - final_height_mm) / 2.0;

    let rgb_img = img.to_rgb8();
    let raw_pixels = rgb_img.as_raw().clone();
    let image_xobj = ImageXObject {
        width: Px(img_width as usize),
        height: Px(img_height as usize),
        color_space: ColorSpace::Rgb,
        bits_per_component: ColorBits::Bit8,
        interpolate: true,
        image_data: raw_pixels,
        image_filter: None,
        smask: None,
        clipping_bbox: None,
    };

    let pdf_image = Image::from(image_xobj);

    let scale_x = final_width_mm / img_width;
    let scale_y = final_height_mm / img_height;

    let transform = ImageTransform {
        translate_x: Some(Mm(img_x)),
        translate_y: Some(Mm(img_y)),
        scale_x: Some(scale_x),
        scale_y: Some(scale_y),
        ..Default::default()
    };

    pdf_image.add_to_layer(current_layer.clone(), transform);

    let file = File::create(path).map_err(|e| DataError::WriteError(e.to_string()))?;
    let mut writer = BufWriter::new(file);
    doc.save(&mut writer)
        .map_err(|e| DataError::WriteError(format!("Failed to save PDF: {}", e)))?;

    Ok(())
}

