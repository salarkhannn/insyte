mod data;
mod error;

use data::ingest::{clear_data, get_data_page, list_excel_sheets, load_csv, load_excel, load_json};
use data::state::{AppDataState, DataState};
use std::sync::Mutex;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(Mutex::new(DataState::new()) as AppDataState)
        .invoke_handler(tauri::generate_handler![
            greet,
            load_csv,
            load_json,
            load_excel,
            list_excel_sheets,
            get_data_page,
            clear_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
