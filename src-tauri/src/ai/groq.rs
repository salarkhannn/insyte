use crate::error::AIError;
use reqwest::Client;
use serde::{Deserialize, Serialize};

const GROQ_API_BASE: &str = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL: &str = "meta-llama/llama-4-maverick-17b-128e-instruct";

#[derive(Clone)]
pub struct GroqClient {
    api_key: String,
    base_url: String,
    model: String,
    client: Client,
}

#[derive(Serialize)]
struct ChatCompletionRequest {
    model: String,
    messages: Vec<Message>,
    temperature: f32,
    max_tokens: u32,
}

#[derive(Serialize, Deserialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct ChatCompletionResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: Message,
}

#[derive(Deserialize)]
struct ErrorResponse {
    error: ErrorDetail,
}

#[derive(Deserialize)]
struct ErrorDetail {
    message: String,
    #[serde(rename = "type")]
    error_type: Option<String>,
}

impl GroqClient {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            base_url: GROQ_API_BASE.to_string(),
            model: DEFAULT_MODEL.to_string(),
            client: Client::new(),
        }
    }

    pub fn with_model(mut self, model: String) -> Self {
        self.model = model;
        self
    }

    pub async fn complete(&self, prompt: String) -> Result<String, AIError> {
        let request = ChatCompletionRequest {
            model: self.model.clone(),
            messages: vec![Message {
                role: "user".to_string(),
                content: prompt,
            }],
            temperature: 0.2,
            max_tokens: 2048,
        };

        let response = self
            .client
            .post(format!("{}/chat/completions", self.base_url))
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| AIError::RequestFailed(e.to_string()))?;

        let status = response.status();

        if status == 401 {
            return Err(AIError::InvalidApiKey);
        }

        if status == 429 {
            return Err(AIError::RateLimitExceeded);
        }

        if !status.is_success() {
            let error_body = response
                .json::<ErrorResponse>()
                .await
                .map_err(|e| AIError::RequestFailed(e.to_string()))?;
            return Err(AIError::RequestFailed(error_body.error.message));
        }

        let completion = response
            .json::<ChatCompletionResponse>()
            .await
            .map_err(|e| AIError::ParseError(e.to_string()))?;

        completion
            .choices
            .first()
            .map(|choice| choice.message.content.clone())
            .ok_or_else(|| AIError::ParseError("No completion returned".to_string()))
    }

    pub async fn validate(&self) -> Result<bool, AIError> {
        let test_request = ChatCompletionRequest {
            model: self.model.clone(),
            messages: vec![Message {
                role: "user".to_string(),
                content: "test".to_string(),
            }],
            temperature: 0.0,
            max_tokens: 1,
        };

        let response = self
            .client
            .post(format!("{}/chat/completions", self.base_url))
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&test_request)
            .send()
            .await
            .map_err(|e| AIError::RequestFailed(e.to_string()))?;

        match response.status() {
            status if status.is_success() => Ok(true),
            status if status == 401 => Err(AIError::InvalidApiKey),
            _ => Ok(false),
        }
    }
}