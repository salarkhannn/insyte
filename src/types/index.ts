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
    title: string;
}

export interface DatasetInfo {
    fileName: string;
    rowCount: number;
    columns: Column[];
}