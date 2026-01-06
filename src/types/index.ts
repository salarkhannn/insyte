export interface Column {
    name: string;
    dtype: "string" | "integer" | "float" | "date" | "boolean";
    nullable: boolean;
}

export interface VisualizationSpec {
    chartType: "bar" | "line" | "area" | "pie" | "scatter" | "histogram";
    xField: string;
    yField: string;
    aggregation: "sum" | "avg" | "count" | "max" | "min";
    groupBy: string | null;
    sortBy: "x" | "y" | "none";
    sortOrder: "asc" | "desc";
    title: string;
    filters: FilterSpec[];
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
}

export interface Dataset {
    label: string;
    data: number[];
    color?: string;
}