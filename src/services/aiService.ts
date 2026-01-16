import { invoke } from "@tauri-apps/api/core";
import type { VisualizationSpec, ChartData, TableData, FilterSpec, ReductionReason, AIChatResponse, DataInsight } from "../types";

interface BackendVisualizationSpec {
    chartType: "bar" | "line" | "area" | "pie" | "scatter";
    xField: string;
    yField: string;
    aggregation: "sum" | "avg" | "count" | "min" | "max" | "median";
    groupBy: string | null;
    sortBy: "x" | "y" | "none";
    sortOrder: "asc" | "desc" | "none";
    title: string;
    filters: Array<{
        column: string;
        operator: string;
        value: unknown;
    }>;
    chartConfig?: unknown;
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
        // === REDUCTION FEEDBACK ===
        reduced?: boolean;
        reduction_reason?: string;
        original_row_estimate?: number;
        returned_points?: number;
        sample_ratio?: number | null;
        top_n_value?: number | null;
        warning_message?: string | null;
    };
}

interface BackendTableData {
    rows: unknown[][];
    total_rows: number;
    page: number;
    page_size: number;
    total_pages: number;
    warning: string | null;
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
        chartType: spec.chartType,
        xField: spec.xField,
        yField: spec.yField,
        aggregation: spec.aggregation,
        groupBy: spec.groupBy,
        sortBy: spec.sortBy,
        sortOrder: spec.sortOrder,
        title: spec.title,
        filters: spec.filters.map((f) => ({
            column: f.column,
            operator: f.operator as VisualizationSpec["filters"][0]["operator"],
            value: f.value as string | number | boolean | null,
        })),
        chartConfig: spec.chartConfig as VisualizationSpec["chartConfig"],
    };
}

function transformVisualizationSpecToBackend(spec: VisualizationSpec): BackendVisualizationSpec {
    return {
        chartType: spec.chartType,
        xField: spec.xField,
        yField: spec.yField,
        aggregation: spec.aggregation,
        groupBy: spec.groupBy,
        sortBy: spec.sortBy,
        sortOrder: spec.sortOrder,
        title: spec.title,
        filters: spec.filters.map((f) => ({
            column: f.column,
            operator: f.operator,
            value: f.value,
        })),
        chartConfig: spec.chartConfig,
    };
}

/**
 * Transform backend chart data to frontend format.
 * Includes reduction metadata for UI feedback.
 */
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
            // === REDUCTION FEEDBACK ===
            reduced: data.metadata.reduced ?? false,
            reductionReason: (data.metadata.reduction_reason as ReductionReason) ?? "none",
            originalRowEstimate: data.metadata.original_row_estimate ?? data.metadata.total_records,
            returnedPoints: data.metadata.returned_points ?? 0,
            sampleRatio: data.metadata.sample_ratio ?? undefined,
            topNValue: data.metadata.top_n_value ?? undefined,
            warningMessage: data.metadata.warning_message ?? undefined,
        },
    };
}

/**
 * Transform backend table data to frontend format.
 */
function transformTableData(data: BackendTableData): TableData {
    return {
        rows: data.rows,
        totalRows: data.total_rows,
        page: data.page,
        pageSize: data.page_size,
        totalPages: data.total_pages,
        warning: data.warning ?? undefined,
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

interface BackendChatResponse {
    type: "visualization" | "answer" | "error";
    spec?: BackendVisualizationSpec;
    explanation?: string;
    content?: string;
    insights?: DataInsight[];
    message?: string;
}

export async function processAiChat(query: string): Promise<AIChatResponse> {
    const response = await invoke<BackendChatResponse>("process_ai_chat", { query });

    if (response.type === "visualization" && response.spec) {
        return {
            type: "visualization",
            spec: transformVisualizationSpec(response.spec),
            explanation: response.explanation ?? "",
        };
    }

    if (response.type === "answer") {
        return {
            type: "answer",
            content: response.content ?? "",
            insights: response.insights,
        };
    }

    return {
        type: "error",
        message: response.message ?? "Unknown error occurred",
    };
}

/**
 * Execute a visualization query with full safety hardening.
 * Returns chart data with reduction metadata for UI feedback.
 */
export async function executeVisualizationQuery(spec: VisualizationSpec): Promise<ChartData> {
    const backendSpec = transformVisualizationSpecToBackend(spec);
    const data = await invoke<BackendChartData>("execute_visualization_query", { spec: backendSpec });
    return transformChartData(data);
}

/**
 * Execute a scatter plot query with deterministic sampling.
 * Use this for scatter plots to avoid memory issues with large datasets.
 */
export async function executeScatterQuery(spec: VisualizationSpec): Promise<ChartData> {
    const backendSpec = transformVisualizationSpecToBackend(spec);
    const data = await invoke<BackendChartData>("execute_scatter_query", { spec: backendSpec });
    return transformChartData(data);
}

/**
 * Execute a table query with mandatory pagination.
 * Tables never load all rows at once - this is a hard safety requirement.
 */
export async function executeTableQuery(
    columns: string[],
    page: number,
    pageSize: number,
    sortColumn?: string,
    sortDesc?: boolean,
    filters?: FilterSpec[]
): Promise<TableData> {
    const data = await invoke<BackendTableData>("execute_table_query", {
        columns,
        page,
        pageSize: Math.min(pageSize, 1000), // Safety: cap at 1000
        sortColumn: sortColumn ?? null,
        sortDesc: sortDesc ?? false,
        filters: filters?.map(f => ({
            column: f.column,
            operator: f.operator,
            value: f.value,
        })) ?? [],
    });
    return transformTableData(data);
}

/**
 * Execute a query with zoom-aware progressive disclosure.
 * Wide view returns fewer points; zooming in reveals more detail.
 */
export async function executeProgressiveQuery(
    spec: VisualizationSpec,
    zoomLevel: number,
    rangeStart?: number,
    rangeEnd?: number
): Promise<ChartData> {
    const backendSpec = transformVisualizationSpecToBackend(spec);
    const data = await invoke<BackendChartData>("execute_progressive_query", {
        spec: backendSpec,
        zoomLevel: Math.max(0, Math.min(1, zoomLevel)),
        rangeStart: rangeStart ?? null,
        rangeEnd: rangeEnd ?? null,
    });
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
