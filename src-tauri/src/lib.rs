mod data;
mod error;
mod ai;
mod settings;

use ai::process_ai_query;
use data::execute_visualization_query;
use data::ingest::{clear_data, get_data_page, list_excel_sheets, load_csv, load_excel, load_json};
use data::state::AppDataState;
use settings::{get_settings, update_settings, set_api_key, validate_api_key};
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = dotenvy::from_filename(".env");
    let _ = dotenvy::dotenv();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            load_csv,
            load_excel,
            load_json,
            list_excel_sheets,
            get_data_page,
            clear_data,
            get_settings,
            update_settings,
            set_api_key,
            validate_api_key,
            process_ai_query,
            execute_visualization_query,
        ])
        .setup(|app| {
            let data_state = AppDataState::default();
            app.manage(data_state);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
