import { colors } from "../../../styles/theme";

export const CHART_COLORS = colors.chart;

export const chartConfig = {
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
    fontSize: 11,
    tickFontSize: 10,
    labelFontSize: 11,
    titleFontSize: 13,
    animationDuration: 300,
    gridStroke: "#E5E5E5",
    axisStroke: "#A3A3A3",
    tooltipBackground: "#FFFFFF",
    tooltipBorder: "#E5E5E5",
};

export function getChartColor(index: number): string {
    return CHART_COLORS[index % CHART_COLORS.length];
}

export function formatValue(value: number): string {
    if (Math.abs(value) >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`;
    }
    if (Number.isInteger(value)) {
        return value.toString();
    }
    return value.toFixed(2);
}

export function truncateLabel(label: string, maxLength: number = 15): string {
    if (label.length <= maxLength) return label;
    return `${label.slice(0, maxLength - 1)}…`;
}
