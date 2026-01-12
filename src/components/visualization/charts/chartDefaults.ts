import { colors, typography } from "../../../styles/theme";
import type {
    BarChartConfig,
    LineChartConfig,
    AreaChartConfig,
    PieChartConfig,
    ScatterChartConfig,
    AxisConfig,
    TooltipConfig,
    LegendConfig,
    ChartConfig,
    ChartType,
} from "../../../types/chartConfigs";

const defaultAxisConfig: AxisConfig = {
    title: "",
    titleFontSize: 12,
    titleFontFamily: typography.family,
    titleFontColor: colors.neutral[700],
    labelFontSize: 11,
    labelFontFamily: typography.family,
    labelFontColor: colors.neutral[500],
    labelRotation: 0,
    showGridLines: true,
    gridLineStyle: "dashed",
    gridLineColor: colors.neutral[200],
    showAxisLine: true,
    axisLineColor: colors.neutral[300],
    tickCount: "auto",
    tickFormat: "",
    min: "auto",
    max: "auto",
};

const defaultTooltipConfig: TooltipConfig = {
    enabled: true,
    format: "{value}",
    showSeriesName: true,
    showPercentage: false,
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[200],
    textColor: colors.neutral[700],
    fontSize: 11,
    fontFamily: typography.family,
};

const defaultLegendConfig: LegendConfig = {
    show: true,
    position: "bottom",
    fontSize: 11,
    fontFamily: typography.family,
    fontColor: colors.neutral[600],
    itemSpacing: 16,
    iconSize: 12,
};

const baseChartDefaults = {
    dataFieldX: null,
    dataFieldY: null,
    aggregation: "sum" as const,
    title: "",
    titleFontSize: 14,
    titleFontFamily: typography.family,
    titleFontColor: colors.neutral[800],
    colorScheme: [...colors.chart] as string[],
    maxPoints: 500,
    animationDuration: 300,
    tooltip: { ...defaultTooltipConfig },
    legend: { ...defaultLegendConfig },
    backgroundColor: "#FFFFFF",
    padding: { top: 24, right: 24, bottom: 48, left: 48 },
};

export const barChartDefaults: BarChartConfig = {
    ...baseChartDefaults,
    type: "bar",
    orientation: "vertical",
    stacked: false,
    grouped: false,
    barWidth: "auto",
    maxBarWidth: 48,
    barSpacing: 4,
    barCategoryGap: 16,
    barRadius: [2, 2, 0, 0],
    xAxis: {
        ...defaultAxisConfig,
        labelRotation: -45,
    },
    yAxis: { ...defaultAxisConfig },
    sortOrder: "none",
    sortBy: "none",
    showValueLabels: false,
    valueLabelPosition: "top",
    valueLabelFontSize: 10,
    valueLabelFontColor: colors.neutral[600],
    highlightOnHover: true,
    selectedBarIndex: null,
    selectedCategory: null,
};

export const lineChartDefaults: LineChartConfig = {
    ...baseChartDefaults,
    type: "line",
    curveType: "monotone",
    strokeWidth: 2,
    strokeStyle: "solid",
    showMarkers: true,
    markerShape: "circle",
    markerSize: 4,
    markerFill: true,
    markerBorderWidth: 2,
    xAxis: {
        ...defaultAxisConfig,
        labelRotation: -45,
    },
    yAxis: { ...defaultAxisConfig },
    sortOrder: "asc",
    sortBy: "x",
    multiSeries: false,
    seriesFields: [],
    areaFill: false,
    areaFillOpacity: 0.1,
    areaGradient: true,
    zoomable: false,
    pannable: false,
    connectNulls: false,
    showMinMax: false,
};

export const areaChartDefaults: AreaChartConfig = {
    ...baseChartDefaults,
    type: "area",
    curveType: "monotone",
    strokeWidth: 2,
    strokeStyle: "solid",
    showLineBorder: true,
    showMarkers: false,
    markerShape: "circle",
    markerSize: 4,
    stacked: false,
    stackOffset: "none",
    fillOpacity: 0.6,
    gradientFill: true,
    gradientDirection: "vertical",
    baselineValue: 0,
    xAxis: {
        ...defaultAxisConfig,
        labelRotation: -45,
    },
    yAxis: { ...defaultAxisConfig },
    sortOrder: "asc",
    sortBy: "x",
    multiSeries: false,
    seriesFields: [],
    zoomable: false,
    pannable: false,
    connectNulls: false,
};

export const pieChartDefaults: PieChartConfig = {
    ...baseChartDefaults,
    type: "pie",
    dataFieldCategory: null,
    dataFieldValue: null,
    innerRadius: 0,
    outerRadius: 0.7,
    startAngle: 90,
    endAngle: -270,
    padAngle: 2,
    cornerRadius: 0,
    sortOrder: "desc",
    showLabels: true,
    labelFormat: "{name}: {percent}%",
    labelPosition: "outside",
    labelMinAngle: 10,
    showLabelLines: true,
    labelLineLength: 16,
    maxSlices: 12,
    otherSliceLabel: "Other",
    explodeSliceIndex: null,
    explodeOffset: 8,
    centerLabel: "",
    centerLabelFontSize: 14,
    centerLabelFontColor: colors.neutral[700],
    legend: {
        ...defaultLegendConfig,
        position: "right",
    },
    tooltip: {
        ...defaultTooltipConfig,
        showPercentage: true,
        format: "{name}: {value} ({percent}%)",
    },
};

export const scatterChartDefaults: ScatterChartConfig = {
    ...baseChartDefaults,
    type: "scatter",
    aggregation: "count",
    dataFieldSize: null,
    dataFieldColor: null,
    pointSize: 6,
    minPointSize: 4,
    maxPointSize: 24,
    pointShape: "circle",
    pointOpacity: 0.7,
    pointBorderWidth: 1,
    pointBorderColor: "transparent",
    xAxis: { ...defaultAxisConfig },
    yAxis: { ...defaultAxisConfig },
    sampleMethod: "random",
    sampleSize: 1000,
    zoomable: true,
    pannable: true,
    showTrendLine: false,
    trendLineType: "none",
    trendLineColor: colors.neutral[400],
    trendLineWidth: 1.5,
    trendLineStyle: "dashed",
    showConfidenceInterval: false,
    confidenceLevel: 0.95,
    highlightOutliers: false,
    outlierThreshold: 2,
    outlierColor: colors.semantic.error,
    jitter: 0,
    showQuadrants: false,
    quadrantOriginX: "mean",
    quadrantOriginY: "mean",
    quadrantColors: [
        colors.chart[0] + "20",
        colors.chart[1] + "20",
        colors.chart[2] + "20",
        colors.chart[3] + "20",
    ],
};

export const chartDefaults: Record<ChartType, ChartConfig> = {
    bar: barChartDefaults,
    line: lineChartDefaults,
    area: areaChartDefaults,
    pie: pieChartDefaults,
    scatter: scatterChartDefaults,
};

export function getDefaultConfig(type: ChartType): ChartConfig {
    return JSON.parse(JSON.stringify(chartDefaults[type]));
}

export function getBarDefaults(): BarChartConfig {
    return JSON.parse(JSON.stringify(barChartDefaults));
}

export function getLineDefaults(): LineChartConfig {
    return JSON.parse(JSON.stringify(lineChartDefaults));
}

export function getAreaDefaults(): AreaChartConfig {
    return JSON.parse(JSON.stringify(areaChartDefaults));
}

export function getPieDefaults(): PieChartConfig {
    return JSON.parse(JSON.stringify(pieChartDefaults));
}

export function getScatterDefaults(): ScatterChartConfig {
    return JSON.parse(JSON.stringify(scatterChartDefaults));
}

export function mergeWithDefaults(
    partial: Partial<ChartConfig> & { type: ChartType }
): ChartConfig {
    const defaults = getDefaultConfig(partial.type);
    return deepMerge(defaults, partial);
}

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const result = { ...target };
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceVal = source[key];
            const targetVal = result[key];
            if (
                sourceVal !== null &&
                typeof sourceVal === "object" &&
                !Array.isArray(sourceVal) &&
                targetVal !== null &&
                typeof targetVal === "object" &&
                !Array.isArray(targetVal)
            ) {
                result[key] = deepMerge(targetVal as object, sourceVal as object) as T[typeof key];
            } else if (sourceVal !== undefined) {
                result[key] = sourceVal as T[typeof key];
            }
        }
    }
    return result;
}
