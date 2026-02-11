/**
 * Simplified Chart Configuration Types
 * MVP-level features based on Power BI and Tableau standards
 */

export type ChartType = "bar" | "line" | "area" | "pie" | "scatter";
export type Orientation = "vertical" | "horizontal";
export type CurveType = "linear" | "monotone" | "step";
export type LegendPosition = "top" | "bottom" | "left" | "right" | "none";

// ============================================================================
// COMMON CONFIGURATION
// ============================================================================

export interface TooltipConfig {
    enabled: boolean;
}

export interface LegendConfig {
    show: boolean;
    position: LegendPosition;
}

export interface BaseChartConfig {
    type: ChartType;
    colorScheme: string[];
    animationDuration: number;
    tooltip: TooltipConfig;
    legend: LegendConfig;
}

// ============================================================================
// BAR CHART
// ============================================================================

export interface BarChartConfig extends BaseChartConfig {
    type: "bar";
    stacked: boolean;
    showValueLabels: boolean;
    barRadius: number;
}

// ============================================================================
// LINE CHART
// ============================================================================

export interface LineChartConfig extends BaseChartConfig {
    type: "line";
    curveType: CurveType;
    strokeWidth: number;
    showMarkers: boolean;
    markerSize: number;
    connectNulls: boolean;
}

// ============================================================================
// AREA CHART
// ============================================================================

export interface AreaChartConfig extends BaseChartConfig {
    type: "area";
    curveType: CurveType;
    stacked: boolean;
    fillOpacity: number;
    showLine: boolean;
    strokeWidth: number;
}

// ============================================================================
// PIE CHART
// ============================================================================

export interface PieChartConfig extends BaseChartConfig {
    type: "pie";
    innerRadius: number; // 0 = pie, >0 = donut
    showLabels: boolean;
    labelType: "name" | "value" | "percent";
}

// ============================================================================
// SCATTER CHART
// ============================================================================

export interface ScatterChartConfig extends BaseChartConfig {
    type: "scatter";
    pointSize: number;
    pointOpacity: number;
}

// ============================================================================
// UNION TYPE
// ============================================================================

export type ChartConfig =
    | BarChartConfig
    | LineChartConfig
    | AreaChartConfig
    | PieChartConfig
    | ScatterChartConfig;
