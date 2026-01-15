mod schema;

use crate::data::state::AppDataState;
use crate::error::ProjectError;
use schema::{
    DataSourceType, DatasetSchema, InsyteProject, OpenProjectResponse, ProjectData,
    QueryHistoryItem, RecentProject, Worksheet,
};
use std::fs;
use std::path::PathBuf;
use tauri::State;
use tauri_plugin_dialog::DialogExt;
use uuid::Uuid;

fn get_recent_projects_path() -> PathBuf {
    let dirs = directories::ProjectDirs::from("com", "insyte", "Insyte")
        .expect("Failed to get project directories");
    let data_dir = dirs.data_dir();
    fs::create_dir_all(data_dir).ok();
    data_dir.join("recent_projects.json")
}

fn load_recent_list() -> Vec<RecentProject> {
    let path = get_recent_projects_path();
    if path.exists() {
        fs::read_to_string(&path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default()
    } else {
        Vec::new()
    }
}

fn save_recent_list(projects: &[RecentProject]) {
    let path = get_recent_projects_path();
    if let Ok(json) = serde_json::to_string_pretty(projects) {
        fs::write(path, json).ok();
    }
}

#[tauri::command]
pub async fn save_project(
    app: tauri::AppHandle,
    state: State<'_, AppDataState>,
    path: Option<String>,
    worksheets: Vec<Worksheet>,
    active_worksheet_id: String,
    query_history: Vec<QueryHistoryItem>,
) -> Result<String, ProjectError> {
    let save_path = match path {
        Some(p) => PathBuf::from(p),
        None => {
            let file_path = app
                .dialog()
                .file()
                .add_filter("Insyte Project", &["insyte"])
                .set_file_name("project.insyte")
                .blocking_save_file();

            match file_path {
                Some(p) => p
                    .into_path()
                    .map_err(|e| ProjectError::WriteError(e.to_string()))?,
                None => return Err(ProjectError::Cancelled),
            }
        }
    };

    let data_state = state
        .lock()
        .map_err(|e| ProjectError::WriteError(e.to_string()))?;

    let df = data_state.get_dataframe().ok_or(ProjectError::NoData)?;
    let file_path = data_state.get_file_path().cloned();

    let columns: Vec<_> = df
        .get_columns()
        .iter()
        .map(|col| {
            let dtype = match col.dtype() {
                polars::prelude::DataType::Int8
                | polars::prelude::DataType::Int16
                | polars::prelude::DataType::Int32
                | polars::prelude::DataType::Int64
                | polars::prelude::DataType::UInt8
                | polars::prelude::DataType::UInt16
                | polars::prelude::DataType::UInt32
                | polars::prelude::DataType::UInt64 => "integer",
                polars::prelude::DataType::Float32 | polars::prelude::DataType::Float64 => "float",
                polars::prelude::DataType::Boolean => "boolean",
                polars::prelude::DataType::Date | polars::prelude::DataType::Datetime(_, _) => {
                    "date"
                }
                _ => "string",
            };
            schema::ColumnSchema {
                name: col.name().to_string(),
                dtype: dtype.to_string(),
                nullable: true,
            }
        })
        .collect();

    let schema = DatasetSchema {
        columns,
        row_count: df.height(),
    };

    let project = InsyteProject {
        version: "1.1".to_string(),
        created_at: chrono::Utc::now(),
        modified_at: chrono::Utc::now(),
        data: ProjectData {
            source_type: DataSourceType::Path,
            source_path: file_path,
            schema,
        },
        visualization: None,
        worksheets,
        active_worksheet_id: Some(active_worksheet_id),
        query_history,
    };

    let json = serde_json::to_string_pretty(&project)
        .map_err(|e| ProjectError::WriteError(e.to_string()))?;

    fs::write(&save_path, json).map_err(|e| ProjectError::WriteError(e.to_string()))?;

    let path_str = save_path.to_string_lossy().to_string();
    add_to_recent_internal(&path_str, &project);

    Ok(path_str)
}

#[tauri::command]
pub async fn save_project_as(
    app: tauri::AppHandle,
    state: State<'_, AppDataState>,
    worksheets: Vec<Worksheet>,
    active_worksheet_id: String,
    query_history: Vec<QueryHistoryItem>,
) -> Result<String, ProjectError> {
    save_project(
        app,
        state,
        None,
        worksheets,
        active_worksheet_id,
        query_history,
    )
    .await
}

#[tauri::command]
pub async fn open_project(
    app: tauri::AppHandle,
    path: Option<String>,
) -> Result<OpenProjectResponse, ProjectError> {
    let open_path = match path {
        Some(p) => PathBuf::from(p),
        None => {
            let file_path = app
                .dialog()
                .file()
                .add_filter("Insyte Project", &["insyte"])
                .blocking_pick_file();

            match file_path {
                Some(p) => p
                    .into_path()
                    .map_err(|e| ProjectError::ReadError(e.to_string()))?,
                None => return Err(ProjectError::Cancelled),
            }
        }
    };

    if !open_path.exists() {
        return Err(ProjectError::FileNotFound(
            open_path.to_string_lossy().to_string(),
        ));
    }

    let content =
        fs::read_to_string(&open_path).map_err(|e| ProjectError::ReadError(e.to_string()))?;

    let mut project: InsyteProject =
        serde_json::from_str(&content).map_err(|e| ProjectError::InvalidFormat(e.to_string()))?;

    if !project.version.starts_with("1.") {
        return Err(ProjectError::VersionMismatch {
            file_version: project.version.clone(),
            app_version: "1.0".to_string(),
        });
    }

    // Migration: If no worksheets, migrate legacy visualization
    if project.worksheets.is_empty() {
        let sheet_id = Uuid::new_v4().to_string();
        let viz = project.visualization.clone(); // Clone assuming we keep the deprecated field for now or just take it
        
        project.worksheets.push(Worksheet {
            id: sheet_id.clone(),
            name: "Sheet 1".to_string(),
            visualization: viz,
        });
        project.active_worksheet_id = Some(sheet_id);
    }

    let path_str = open_path.to_string_lossy().to_string();
    add_to_recent_internal(&path_str, &project);

    Ok(OpenProjectResponse {
        path: path_str,
        project,
    })
}

#[tauri::command]
pub async fn new_project(state: State<'_, AppDataState>) -> Result<(), ProjectError> {
    let mut data_state = state
        .lock()
        .map_err(|e| ProjectError::WriteError(e.to_string()))?;
    data_state.clear();
    Ok(())
}

#[tauri::command]
pub async fn get_recent_projects() -> Result<Vec<RecentProject>, ProjectError> {
    Ok(load_recent_list())
}

#[tauri::command]
pub async fn add_to_recent(path: String) -> Result<(), ProjectError> {
    let content = fs::read_to_string(&path).map_err(|e| ProjectError::ReadError(e.to_string()))?;
    let project: InsyteProject =
        serde_json::from_str(&content).map_err(|e| ProjectError::InvalidFormat(e.to_string()))?;
    add_to_recent_internal(&path, &project);
    Ok(())
}

fn add_to_recent_internal(path: &str, project: &InsyteProject) {
    let mut recent = load_recent_list();

    recent.retain(|p| p.path != path);

    let new_entry = RecentProject {
        path: path.to_string(),
        name: PathBuf::from(path)
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "Untitled".to_string()),
        last_opened: chrono::Utc::now(),
        data_source: project.data.source_path.clone(),
    };

    recent.insert(0, new_entry);
    recent.truncate(10);

    save_recent_list(&recent);
}
