use crate::error::AIError;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub groq_api_key: Option<String>,
    pub groq_model: String,
    pub auto_save: bool,
    pub theme: String,
    pub max_preview_rows: usize,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            groq_api_key: None,
            groq_model: "meta-llama/llama-4-maverick-17b-128e-instruct".to_string(),
            auto_save: true,
            theme: "light".to_string(),
            max_preview_rows: 100,
        }
    }
}

impl AppSettings {
    fn settings_path() -> Result<PathBuf, String> {
        directories::ProjectDirs::from("com", "insyte", "Insyte")
            .map(|dirs| dirs.config_dir().join("settings.json"))
            .ok_or_else(|| "Failed to determine settings path".to_string())
    }

    pub fn load() -> Result<Self, String> {
        let path = Self::settings_path()?;
        
        if !path.exists() {
            return Ok(Self::default());
        }

        let contents = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read settings: {}", e))?;
        
        serde_json::from_str(&contents)
            .map_err(|e| format!("Failed to parse settings: {}", e))
    }

    pub fn save(&self) -> Result<(), String> {
        let path = Self::settings_path()?;
        
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create settings directory: {}", e))?;
        }

        let contents = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;
        
        fs::write(&path, contents)
            .map_err(|e| format!("Failed to write settings: {}", e))
    }
}

#[tauri::command]
pub async fn get_settings() -> Result<AppSettings, String> {
    AppSettings::load()
}

#[tauri::command]
pub async fn update_settings(settings: AppSettings) -> Result<(), String> {
    settings.save()
}

#[tauri::command]
pub async fn set_api_key(key: String) -> Result<(), String> {
    let mut settings = AppSettings::load()?;
    settings.groq_api_key = Some(key);
    settings.save()
}

#[tauri::command]
pub async fn validate_api_key() -> Result<bool, AIError> {
    let settings = AppSettings::load()
        .map_err(|e| AIError::RequestFailed(e))?;
    
    let api_key = settings.groq_api_key
        .ok_or(AIError::ApiKeyNotSet)?;
    
    let client = crate::ai::GroqClient::new(api_key)
        .with_model(settings.groq_model);
    
    client.validate().await
}