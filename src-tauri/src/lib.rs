mod ai;
mod data;
mod error;
mod export;
mod project;
mod settings;

use ai::{process_ai_chat, process_ai_query};
use data::ingest::{
    clear_data, get_data_page, list_excel_sheets, load_csv, load_excel, load_json, set_active_table,
};
use data::state::AppDataState;
use data::{
    execute_progressive_query, execute_scatter_query, execute_table_query,
    execute_visualization_query,
};
use export::{export_chart, export_csv, export_excel};
use project::{
    add_to_recent, get_recent_projects, new_project, open_project, save_project, save_project_as,
};
use settings::{get_settings, set_api_key, update_settings, validate_api_key};
use tauri::Manager;

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
            set_active_table,
            get_data_page,
            clear_data,
            get_settings,
            update_settings,
            set_api_key,
            validate_api_key,
            process_ai_query,
            process_ai_chat,
            execute_visualization_query,
            execute_scatter_query,
            execute_table_query,
            execute_progressive_query,
            save_project,
            save_project_as,
            open_project,
            new_project,
            get_recent_projects,
            add_to_recent,
            export_csv,
            export_excel,
            export_chart,
        ])
        .setup(|app| {
            let data_state = AppDataState::default();
            app.manage(data_state);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
