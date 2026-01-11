import { invoke } from "@tauri-apps/api/core";
import type { VisualizationSpec, ChartData } from "../types";

interface BackendVisualizationSpec {
    chart_type: "bar" | "line" | "area" | "pie" | "scatter";
    x_field: string;
    y_field: string;
    aggregation: "sum" | "avg" | "count" | "min" | "max";
    group_by: string | null;
    sort_by: "x" | "y" | "none";
    sort_order: "asc" | "desc";
    title: string;
    filters: Array<{
        column: string;
        operator: string;
        value: unknown;
    }>;
}

interface BackendChartData {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
        color: string | null;
    }>;
    metadata: {
        title: string;
        x_label: string;
        y_label: string;
        total_records: number;
    };
}

interface BackendSettings {
    groq_api_key: string | null;
    groq_model: string;
    auto_save: boolean;
    theme: string;
    max_preview_rows: number;
}

export interface AppSettings {
    groqApiKey: string | null;
    groqModel: string;
    autoSave: boolean;
    theme: string;
    maxPreviewRows: number;
}

function transformVisualizationSpec(spec: BackendVisualizationSpec): VisualizationSpec {
    return {
        chartType: spec.chart_type,
        xField: spec.x_field,
        yField: spec.y_field,
        aggregation: spec.aggregation,
        groupBy: spec.group_by,
        sortBy: spec.sort_by,
        sortOrder: spec.sort_order,
        title: spec.title,
        filters: spec.filters.map((f) => ({
            column: f.column,
            operator: f.operator as VisualizationSpec["filters"][0]["operator"],
            value: f.value as string | number | boolean | null,
        })),
    };
}

function transformVisualizationSpecToBackend(spec: VisualizationSpec): BackendVisualizationSpec {
    return {
        chart_type: spec.chartType as BackendVisualizationSpec["chart_type"],
        x_field: spec.xField,
        y_field: spec.yField,
        aggregation: spec.aggregation,
        group_by: spec.groupBy,
        sort_by: spec.sortBy,
        sort_order: spec.sortOrder,
        title: spec.title,
        filters: spec.filters.map((f) => ({
            column: f.column,
            operator: f.operator,
            value: f.value,
        })),
    };
}

function transformChartData(data: BackendChartData): ChartData {
    return {
        labels: data.labels,
        datasets: data.datasets.map((d) => ({
            label: d.label,
            data: d.data,
            color: d.color ?? undefined,
        })),
        metadata: {
            title: data.metadata.title,
            xLabel: data.metadata.x_label,
            yLabel: data.metadata.y_label,
            totalRecords: data.metadata.total_records,
        },
    };
}

function transformSettingsFromBackend(settings: BackendSettings): AppSettings {
    return {
        groqApiKey: settings.groq_api_key,
        groqModel: settings.groq_model,
        autoSave: settings.auto_save,
        theme: settings.theme,
        maxPreviewRows: settings.max_preview_rows,
    };
}

function transformSettingsToBackend(settings: AppSettings): BackendSettings {
    return {
        groq_api_key: settings.groqApiKey,
        groq_model: settings.groqModel,
        auto_save: settings.autoSave,
        theme: settings.theme,
        max_preview_rows: settings.maxPreviewRows,
    };
}

export async function processAiQuery(query: string): Promise<VisualizationSpec> {
    const spec = await invoke<BackendVisualizationSpec>("process_ai_query", { query });
    return transformVisualizationSpec(spec);
}

export async function executeVisualizationQuery(spec: VisualizationSpec): Promise<ChartData> {
    const backendSpec = transformVisualizationSpecToBackend(spec);
    const data = await invoke<BackendChartData>("execute_visualization_query", { spec: backendSpec });
    return transformChartData(data);
}

export async function getSettings(): Promise<AppSettings> {
    const settings = await invoke<BackendSettings>("get_settings");
    return transformSettingsFromBackend(settings);
}

export async function updateSettings(settings: AppSettings): Promise<void> {
    await invoke("update_settings", { settings: transformSettingsToBackend(settings) });
}

export async function setApiKey(key: string): Promise<void> {
    await invoke("set_api_key", { key });
}

export async function validateApiKey(): Promise<boolean> {
    return invoke<boolean>("validate_api_key");
}
