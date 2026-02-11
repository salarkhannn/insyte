export * from "./chartConfigs";

export interface Column {
    name: string;
    dtype: "string" | "integer" | "float" | "date" | "boolean";
    nullable: boolean;
}

export type DateBinning = "year" | "quarter" | "month" | "day";

export interface FieldEncoding {
    field: string;
    aggregation?: "sum" | "avg" | "count" | "max" | "min" | "median";
    dateBinning?: DateBinning;
}

export interface VisualizationSpec {
    chartType: "bar" | "line" | "area" | "pie" | "scatter";
    xField: string;
    yField: string;
    aggregation: "sum" | "avg" | "count" | "max" | "min" | "median";
    xDateBinning?: DateBinning;
    yDateBinning?: DateBinning;
    groupBy: string | null;
    sortBy: "x" | "y" | "none";
    sortOrder: "asc" | "desc" | "none";
    title: string;
    filters: FilterSpec[];
    chartConfig?: import("./chartConfigs").ChartConfig;
}

export interface FilterSpec {
    column: string;
    operator: FilterOperator;
    value: string | number | boolean | null;
}

export type FilterOperator =
    | "eq"
    | "neq"
    | "gt"
    | "lt"
    | "gte"
    | "lte"
    | "contains"
    | "startsWith"
    | "endsWith"
    | "isNull"
    | "isNotNull";

export interface DatasetInfo {
    fileName: string;
    filePath: string;
    fileSize: number;
    rowCount: number;
    columns: Column[];
}

export interface QueryHistoryItem {
    id: string;
    query: string;
    timestamp: number;
    visualization: VisualizationSpec | null;
    success: boolean;
    error?: string;
}

export interface ChartData {
    labels: string[];
    datasets: Dataset[];
    metadata?: ChartMetadata;
}

export interface Dataset {
    label: string;
    data: number[];
    color?: string;
}

// ============================================================================
// ENHANCED METADATA WITH REDUCTION FEEDBACK
// ============================================================================

export interface ChartMetadata {
    title: string;
    xLabel: string;
    yLabel: string;
    totalRecords: number;

    // === REDUCTION FEEDBACK (for user transparency) ===
    /** Whether any data reduction was applied */
    reduced?: boolean;
    /** Primary reason: "auto-aggregation" | "sampling" | "top-n" | "none" */
    reductionReason?: ReductionReason;
    /** Original row count before transformations */
    originalRowEstimate?: number;
    /** Actual number of points returned */
    returnedPoints?: number;
    /** Sampling ratio if sampling was applied (0.0-1.0) */
    sampleRatio?: number;
    /** Top-N value if Top-N was applied */
    topNValue?: number;
    /** Human-readable warning for UI display */
    warningMessage?: string;
    swapped?: boolean;
}

/** Reason for data reduction - used for UI feedback */
export type ReductionReason =
    | "auto-aggregation"
    | "sampling"
    | "top-n"
    | "date-binning"
    | "combined"
    | "none";

// ============================================================================
// TABLE DATA WITH PAGINATION
// ============================================================================

export interface TableData {
    rows: unknown[][];
    totalRows: number;
    page: number;
    pageSize: number;
    totalPages: number;
    warning?: string;
}

// ============================================================================
// PROGRESSIVE DISCLOSURE CONTEXT
// ============================================================================

export interface ZoomContext {
    /** Current zoom level (0.0 = full view, 1.0 = maximum detail) */
    zoomLevel: number;
    /** Visible range start for numeric/date fields */
    rangeStart?: number;
    /** Visible range end for numeric/date fields */
    rangeEnd?: number;
    /** Selected categories for filtering */
    selectedCategories?: string[];
}

export interface Worksheet {
    id: string;
    name: string;
    visualization: VisualizationSpec | null;
}

export interface DataInsight {
    label: string;
    value: string;
}

export type AIChatResponse =
    | { type: "visualization"; spec: VisualizationSpec; explanation: string }
    | { type: "answer"; content: string; insights?: DataInsight[] }
    | { type: "error"; message: string };