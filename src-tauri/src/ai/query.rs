use crate::ai::groq::GroqClient;
use crate::ai::prompts::build_visualization_prompt;
use crate::ai::types::VisualizationSpec;
use crate::data::state::AppDataState;
use crate::data::types::ColumnInfo;
use crate::error::AIError;
use crate::settings::AppSettings;
use tauri::State;

fn validate_spec(spec: &VisualizationSpec, columns: &[ColumnInfo]) -> Result<(), AIError> {
    let column_names: Vec<&str> = columns.iter().map(|c| c.name.as_str()).collect();

    if !column_names.contains(&spec.x_field.as_str()) {
        return Err(AIError::RequestFailed(format!(
            "Column '{}' not found in dataset",
            spec.x_field
        )));
    }

    if !column_names.contains(&spec.y_field.as_str()) {
        return Err(AIError::RequestFailed(format!(
            "Column '{}' not found in dataset",
            spec.y_field
        )));
    }

    if let Some(ref group_by) = spec.group_by {
        if !column_names.contains(&group_by.as_str()) {
            return Err(AIError::RequestFailed(format!(
                "Group by column '{}' not found in dataset",
                group_by
            )));
        }
    }

    for filter in &spec.filters {
        if !column_names.contains(&filter.column.as_str()) {
            return Err(AIError::RequestFailed(format!(
                "Filter column '{}' not found in dataset",
                filter.column
            )));
        }
    }

    Ok(())
}

fn extract_json(response: &str) -> Option<&str> {
    let trimmed = response.trim();
    
    if trimmed.starts_with('{') && trimmed.ends_with('}') {
        return Some(trimmed);
    }
    
    if let Some(start) = trimmed.find('{') {
        if let Some(end) = trimmed.rfind('}') {
            if end > start {
                return Some(&trimmed[start..=end]);
            }
        }
    }
    
    None
}

fn get_api_key() -> Result<String, AIError> {
    if let Ok(key) = std::env::var("GROQ_API_KEY") {
        if !key.is_empty() {
            return Ok(key);
        }
    }

    let settings = AppSettings::load().map_err(|e| AIError::RequestFailed(e))?;
    settings.groq_api_key.ok_or(AIError::ApiKeyNotSet)
}

fn get_model() -> String {
    std::env::var("GROQ_MODEL").unwrap_or_else(|_| {
        AppSettings::load()
            .map(|s| s.groq_model)
            .unwrap_or_else(|_| "llama-3.3-70b-versatile".to_string())
    })
}

#[tauri::command]
pub async fn process_ai_query(
    query: String,
    state: State<'_, AppDataState>,
) -> Result<VisualizationSpec, AIError> {
    let api_key = get_api_key()?;
    let model = get_model();

    let (columns, row_count) = {
        let data_state = state
            .lock()
            .map_err(|e| AIError::RequestFailed(e.to_string()))?;

        let df = data_state
            .get_dataframe()
            .ok_or_else(|| AIError::RequestFailed("No data loaded".to_string()))?;

        let cols: Vec<ColumnInfo> = df
            .get_columns()
            .iter()
            .map(|col| ColumnInfo {
                name: col.name().to_string(),
                dtype: format!("{:?}", col.dtype()),
                nullable: true,
            })
            .collect();

        (cols, df.height())
    };

    let prompt = build_visualization_prompt(&query, &columns, row_count);

    let client = GroqClient::new(api_key).with_model(model);
    let response = client.complete(prompt).await?;

    let json_str = extract_json(&response)
        .ok_or_else(|| AIError::ParseError("No valid JSON found in response".to_string()))?;

    let spec: VisualizationSpec =
        serde_json::from_str(json_str).map_err(|e| AIError::ParseError(e.to_string()))?;

    validate_spec(&spec, &columns)?;

    Ok(spec)
}
