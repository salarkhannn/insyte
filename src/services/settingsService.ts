import { invoke } from "@tauri-apps/api/core";

export interface AppSettings {
    groq_api_key: string | null;
    groq_model: string;
    auto_save: boolean;
    theme: string;
    max_preview_rows: number;
}

export async function getSettings(): Promise<AppSettings> {
    return invoke<AppSettings>("get_settings");
}

export async function updateSettings(settings: AppSettings): Promise<void> {
    return invoke("update_settings", { settings });
}

export async function setApiKey(key: string): Promise<void> {
    return invoke("set_api_key", { key });
}

export async function validateApiKey(apiKey?: string): Promise<boolean> {
    return invoke<boolean>("validate_api_key", { apiKey: apiKey ?? null });
}

