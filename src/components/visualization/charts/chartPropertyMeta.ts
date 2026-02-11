/**
 * Simplified Property Metadata for MVP
 * Essential properties only - matching Power BI/Tableau basics
 */

import type { ChartType } from "../../../types/chartConfigs";

type PropertyType = "boolean" | "number" | "enum";

interface PropertyMetadata {
    key: string;
    label: string;
    type: PropertyType;
    default: unknown;
    group: string;
    min?: number;
    max?: number;
    step?: number;
    options?: { value: string; label: string }[];
}

// ============================================================================
// BAR CHART PROPERTIES
// ============================================================================

export const barChartProperties: PropertyMetadata[] = [
    {
        key: "stacked",
        label: "Stacked",
        type: "boolean",
        default: false,
        group: "Layout",
    },
    {
        key: "showValueLabels",
        label: "Show Value Labels",
        type: "boolean",
        default: false,
        group: "Labels",
    },
    {
        key: "barRadius",
        label: "Corner Radius",
        type: "number",
        default: 2,
        group: "Style",
        min: 0,
        max: 20,
        step: 1,
    },
];

// ============================================================================
// LINE CHART PROPERTIES
// ============================================================================

export const lineChartProperties: PropertyMetadata[] = [
    {
        key: "curveType",
        label: "Line Style",
        type: "enum",
        default: "monotone",
        group: "Style",
        options: [
            { value: "linear", label: "Straight" },
            { value: "monotone", label: "Smooth" },
            { value: "step", label: "Stepped" },
        ],
    },
    {
        key: "strokeWidth",
        label: "Line Width",
        type: "number",
        default: 2,
        group: "Style",
        min: 1,
        max: 6,
        step: 0.5,
    },
    {
        key: "showMarkers",
        label: "Show Markers",
        type: "boolean",
        default: true,
        group: "Markers",
    },
    {
        key: "markerSize",
        label: "Marker Size",
        type: "number",
        default: 4,
        group: "Markers",
        min: 2,
        max: 12,
        step: 1,
    },
    {
        key: "connectNulls",
        label: "Connect Null Points",
        type: "boolean",
        default: false,
        group: "Style",
    },
];

// ============================================================================
// AREA CHART PROPERTIES
// ============================================================================

export const areaChartProperties: PropertyMetadata[] = [
    {
        key: "curveType",
        label: "Line Style",
        type: "enum",
        default: "monotone",
        group: "Style",
        options: [
            { value: "linear", label: "Straight" },
            { value: "monotone", label: "Smooth" },
            { value: "step", label: "Stepped" },
        ],
    },
    {
        key: "stacked",
        label: "Stacked",
        type: "boolean",
        default: false,
        group: "Layout",
    },
    {
        key: "fillOpacity",
        label: "Fill Opacity",
        type: "number",
        default: 0.3,
        group: "Style",
        min: 0.1,
        max: 1,
        step: 0.1,
    },
    {
        key: "showLine",
        label: "Show Border Line",
        type: "boolean",
        default: true,
        group: "Style",
    },
    {
        key: "strokeWidth",
        label: "Border Width",
        type: "number",
        default: 2,
        group: "Style",
        min: 0,
        max: 4,
        step: 0.5,
    },
];

// ============================================================================
// PIE CHART PROPERTIES
// ============================================================================

export const pieChartProperties: PropertyMetadata[] = [
    {
        key: "innerRadius",
        label: "Inner Radius (Donut)",
        type: "number",
        default: 0,
        group: "Layout",
        min: 0,
        max: 80,
        step: 5,
    },
    {
        key: "showLabels",
        label: "Show Labels",
        type: "boolean",
        default: true,
        group: "Labels",
    },
    {
        key: "labelType",
        label: "Label Type",
        type: "enum",
        default: "percent",
        group: "Labels",
        options: [
            { value: "name", label: "Name" },
            { value: "value", label: "Value" },
            { value: "percent", label: "Percentage" },
        ],
    },
];

// ============================================================================
// SCATTER CHART PROPERTIES
// ============================================================================

export const scatterChartProperties: PropertyMetadata[] = [
    {
        key: "pointSize",
        label: "Point Size",
        type: "number",
        default: 6,
        group: "Style",
        min: 2,
        max: 20,
        step: 1,
    },
    {
        key: "pointOpacity",
        label: "Point Opacity",
        type: "number",
        default: 0.7,
        group: "Style",
        min: 0.1,
        max: 1,
        step: 0.1,
    },
];

// ============================================================================
// COMMON PROPERTIES (applied to all charts)
// ============================================================================

export const commonProperties: PropertyMetadata[] = [
    {
        key: "legend.show",
        label: "Show Legend",
        type: "boolean",
        default: true,
        group: "Legend",
    },
    {
        key: "legend.position",
        label: "Legend Position",
        type: "enum",
        default: "bottom",
        group: "Legend",
        options: [
            { value: "top", label: "Top" },
            { value: "bottom", label: "Bottom" },
            { value: "left", label: "Left" },
            { value: "right", label: "Right" },
        ],
    },
];

// ============================================================================
// EXPORT HELPERS
// ============================================================================

export const chartPropertyMap: Record<ChartType, PropertyMetadata[]> = {
    bar: [...barChartProperties, ...commonProperties],
    line: [...lineChartProperties, ...commonProperties],
    area: [...areaChartProperties, ...commonProperties],
    pie: [...pieChartProperties, ...commonProperties],
    scatter: [...scatterChartProperties, ...commonProperties],
};

export function getPropertiesForChartType(type: ChartType): PropertyMetadata[] {
    return chartPropertyMap[type] || [];
}

export function getPropertyGroups(type: ChartType): string[] {
    const props = getPropertiesForChartType(type);
    const groups = new Set<string>();
    props.forEach((p) => groups.add(p.group));
    return Array.from(groups);
}

export function getPropertiesByGroup(type: ChartType, group: string): PropertyMetadata[] {
    return getPropertiesForChartType(type).filter((p) => p.group === group);
}
