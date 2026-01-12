import {
    ScatterChart as RechartsScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ZAxis,
    ReferenceLine,
    Legend,
} from "recharts";
import type { ChartData, ScatterChartConfig } from "../../../types";
import { scatterChartDefaults } from "./chartDefaults";
import { getChartColor, formatValue } from "./chartConfig";

interface ScatterChartProps {
    data: ChartData;
    config?: Partial<ScatterChartConfig>;
}

const markerShapeMap: Record<string, string> = {
    circle: "circle",
    square: "square",
    triangle: "triangle",
    diamond: "diamond",
    cross: "cross",
    star: "star",
};

export function ScatterChart({ data, config }: ScatterChartProps) {
    const cfg = { ...scatterChartDefaults, ...config };
    
    const dataset = data.datasets[0];
    if (!dataset) return null;

    let chartData = data.labels.map((label, index) => ({
        x: index,
        y: dataset.data[index],
        name: label,
        size: cfg.pointSize,
    }));

    if (cfg.jitter > 0) {
        chartData = chartData.map(point => ({
            ...point,
            x: point.x + (Math.random() - 0.5) * cfg.jitter * 10,
            y: point.y + (Math.random() - 0.5) * cfg.jitter * point.y * 0.1,
        }));
    }

    const gridDasharray = cfg.xAxis.gridLineStyle === "dashed" ? "3 3" : cfg.xAxis.gridLineStyle === "dotted" ? "1 3" : "0";

    let meanX = 0;
    let meanY = 0;
    if (cfg.showQuadrants) {
        meanX = chartData.reduce((sum, p) => sum + p.x, 0) / chartData.length;
        meanY = chartData.reduce((sum, p) => sum + p.y, 0) / chartData.length;
    }

    let outlierIndices: Set<number> = new Set();
    if (cfg.highlightOutliers) {
        const yValues = chartData.map(p => p.y);
        const mean = yValues.reduce((a, b) => a + b, 0) / yValues.length;
        const stdDev = Math.sqrt(yValues.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / yValues.length);
        
        chartData.forEach((point, index) => {
            if (Math.abs(point.y - mean) > cfg.outlierThreshold * stdDev) {
                outlierIndices.add(index);
            }
        });
    }

    const shapeType = markerShapeMap[cfg.pointShape] ?? "circle";

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsScatterChart margin={cfg.padding}>
                <CartesianGrid
                    strokeDasharray={gridDasharray}
                    stroke={cfg.xAxis.gridLineColor}
                    vertical={cfg.xAxis.showGridLines}
                    horizontal={cfg.yAxis.showGridLines}
                />
                <XAxis
                    type="number"
                    dataKey="x"
                    name="X"
                    tick={{ fontSize: cfg.xAxis.labelFontSize, fill: cfg.xAxis.labelFontColor }}
                    axisLine={cfg.xAxis.showAxisLine ? { stroke: cfg.xAxis.axisLineColor } : false}
                    tickLine={{ stroke: cfg.xAxis.axisLineColor }}
                    domain={[
                        cfg.xAxis.min === "auto" ? "auto" : cfg.xAxis.min,
                        cfg.xAxis.max === "auto" ? "auto" : cfg.xAxis.max,
                    ]}
                    label={cfg.xAxis.title ? {
                        value: cfg.xAxis.title,
                        position: "insideBottom",
                        offset: -5,
                        fontSize: cfg.xAxis.titleFontSize,
                        fill: cfg.xAxis.titleFontColor,
                    } : undefined}
                />
                <YAxis
                    type="number"
                    dataKey="y"
                    name="Y"
                    tickFormatter={formatValue}
                    tick={{ fontSize: cfg.yAxis.labelFontSize, fill: cfg.yAxis.labelFontColor }}
                    axisLine={cfg.yAxis.showAxisLine ? { stroke: cfg.yAxis.axisLineColor } : false}
                    tickLine={{ stroke: cfg.yAxis.axisLineColor }}
                    domain={[
                        cfg.yAxis.min === "auto" ? "auto" : cfg.yAxis.min,
                        cfg.yAxis.max === "auto" ? "auto" : cfg.yAxis.max,
                    ]}
                    label={cfg.yAxis.title ? {
                        value: cfg.yAxis.title,
                        angle: -90,
                        position: "insideLeft",
                        fontSize: cfg.yAxis.titleFontSize,
                        fill: cfg.yAxis.titleFontColor,
                    } : undefined}
                />
                <ZAxis 
                    type="number" 
                    dataKey="size" 
                    range={[cfg.minPointSize * 10, cfg.maxPointSize * 10]} 
                />
                {cfg.showQuadrants && (
                    <>
                        <ReferenceLine x={meanX} stroke={cfg.xAxis.gridLineColor} strokeDasharray="5 5" />
                        <ReferenceLine y={meanY} stroke={cfg.yAxis.gridLineColor} strokeDasharray="5 5" />
                    </>
                )}
                {cfg.showTrendLine && cfg.trendLineType === "linear" && chartData.length > 1 && (() => {
                    const n = chartData.length;
                    const sumX = chartData.reduce((s, p) => s + p.x, 0);
                    const sumY = chartData.reduce((s, p) => s + p.y, 0);
                    const sumXY = chartData.reduce((s, p) => s + p.x * p.y, 0);
                    const sumX2 = chartData.reduce((s, p) => s + p.x * p.x, 0);
                    
                    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
                    const intercept = (sumY - slope * sumX) / n;
                    
                    const minX = Math.min(...chartData.map(p => p.x));
                    const maxX = Math.max(...chartData.map(p => p.x));
                    
                    return (
                        <ReferenceLine
                            segment={[
                                { x: minX, y: slope * minX + intercept },
                                { x: maxX, y: slope * maxX + intercept },
                            ]}
                            stroke={cfg.trendLineColor}
                            strokeWidth={cfg.trendLineWidth}
                            strokeDasharray={cfg.trendLineStyle === "dashed" ? "5 5" : cfg.trendLineStyle === "dotted" ? "2 2" : "0"}
                        />
                    );
                })()}
                {cfg.tooltip.enabled && (
                    <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        formatter={(value) => [formatValue(value as number), ""]}
                        labelFormatter={(_, payload) => {
                            if (payload && payload[0]) {
                                return payload[0].payload.name;
                            }
                            return "";
                        }}
                        contentStyle={{
                            backgroundColor: cfg.tooltip.backgroundColor,
                            border: `1px solid ${cfg.tooltip.borderColor}`,
                            borderRadius: 4,
                            fontSize: cfg.tooltip.fontSize,
                            fontFamily: cfg.tooltip.fontFamily,
                            color: cfg.tooltip.textColor,
                        }}
                    />
                )}
                {cfg.legend.show && data.datasets.length > 1 && (
                    <Legend
                        verticalAlign={cfg.legend.position === "top" ? "top" : cfg.legend.position === "bottom" ? "bottom" : "middle"}
                        align={cfg.legend.position === "left" ? "left" : cfg.legend.position === "right" ? "right" : "center"}
                        wrapperStyle={{
                            fontSize: cfg.legend.fontSize,
                            fontFamily: cfg.legend.fontFamily,
                        }}
                    />
                )}
                <Scatter
                    name={dataset.label}
                    data={chartData}
                    fill={dataset.color ?? cfg.colorScheme[0] ?? getChartColor(0)}
                    fillOpacity={cfg.pointOpacity}
                    shape={shapeType as "circle" | "square" | "triangle" | "diamond" | "cross" | "star"}
                    animationDuration={cfg.animationDuration}
                />
                {cfg.highlightOutliers && outlierIndices.size > 0 && (
                    <Scatter
                        name="Outliers"
                        data={chartData.filter((_, i) => outlierIndices.has(i))}
                        fill={cfg.outlierColor}
                        fillOpacity={1}
                        shape={shapeType as "circle" | "square" | "triangle" | "diamond" | "cross" | "star"}
                    />
                )}
            </RechartsScatterChart>
        </ResponsiveContainer>
    );
}
