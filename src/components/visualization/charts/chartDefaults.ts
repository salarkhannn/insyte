import { colors } from "../../../styles/theme";
import type {
    BarChartConfig,
    LineChartConfig,
    AreaChartConfig,
    PieChartConfig,
    ScatterChartConfig,
    TooltipConfig,
    LegendConfig,
    ChartConfig,
    ChartType,
} from "../../../types/chartConfigs";

const defaultTooltipConfig: TooltipConfig = {
    enabled: true,
};

const defaultLegendConfig: LegendConfig = {
    show: true,
    position: "bottom",
};

const baseChartDefaults = {
    colorScheme: [...colors.chart] as string[],
    animationDuration: 300,
    tooltip: { ...defaultTooltipConfig },
    legend: { ...defaultLegendConfig },
};

export const barChartDefaults: BarChartConfig = {
    ...baseChartDefaults,
    type: "bar",
    orientation: "vertical",
    stacked: false,
    showValueLabels: false,
    barRadius: 2,
};

export const lineChartDefaults: LineChartConfig = {
    ...baseChartDefaults,
    type: "line",
    curveType: "monotone",
    strokeWidth: 2,
    showMarkers: true,
    markerSize: 4,
    connectNulls: false,
};

export const areaChartDefaults: AreaChartConfig = {
    ...baseChartDefaults,
    type: "area",
    curveType: "monotone",
    stacked: false,
    fillOpacity: 0.3,
    showLine: true,
    strokeWidth: 2,
};

export const pieChartDefaults: PieChartConfig = {
    ...baseChartDefaults,
    type: "pie",
    innerRadius: 0,
    showLabels: true,
    labelType: "percent",
};

export const scatterChartDefaults: ScatterChartConfig = {
    ...baseChartDefaults,
    type: "scatter",
    pointSize: 6,
    pointOpacity: 0.7,
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
