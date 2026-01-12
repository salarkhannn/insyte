import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Area,
    ReferenceLine,
} from "recharts";
import type { ChartData, LineChartConfig } from "../../../types";
import { lineChartDefaults } from "./chartDefaults";
import { getChartColor, formatValue, truncateLabel } from "./chartConfig";

interface LineChartProps {
    data: ChartData;
    config?: Partial<LineChartConfig>;
}

const curveTypeMap = {
    linear: "linear",
    monotone: "monotone",
    step: "step",
    stepAfter: "stepAfter",
    stepBefore: "stepBefore",
    smooth: "natural",
} as const;

const strokeDashMap = {
    solid: "0",
    dashed: "5 5",
    dotted: "2 2",
} as const;

export function LineChart({ data, config }: LineChartProps) {
    const cfg = { ...lineChartDefaults, ...config };
    
    const chartData = data.labels.map((label, index) => ({
        name: label,
        ...data.datasets.reduce(
            (acc, dataset) => ({
                ...acc,
                [dataset.label]: dataset.data[index],
            }),
            {} as Record<string, number>
        ),
    }));

    const gridDasharray = cfg.xAxis.gridLineStyle === "dashed" ? "3 3" : cfg.xAxis.gridLineStyle === "dotted" ? "1 3" : "0";
    const curveType = curveTypeMap[cfg.curveType] ?? "monotone";

    let minValue: number | undefined;
    let maxValue: number | undefined;
    if (cfg.showMinMax) {
        const allValues = data.datasets.flatMap(d => d.data);
        minValue = Math.min(...allValues);
        maxValue = Math.max(...allValues);
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
                data={chartData}
                margin={cfg.padding}
            >
                {cfg.areaFill && (
                    <defs>
                        {data.datasets.map((dataset, index) => {
                            const color = dataset.color ?? cfg.colorScheme[index % cfg.colorScheme.length] ?? getChartColor(index);
                            return (
                                <linearGradient
                                    key={`area-gradient-${index}`}
                                    id={`line-area-gradient-${index}`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop offset="5%" stopColor={color} stopOpacity={cfg.areaGradient ? cfg.areaFillOpacity : cfg.areaFillOpacity} />
                                    <stop offset="95%" stopColor={color} stopOpacity={cfg.areaGradient ? 0.05 : cfg.areaFillOpacity} />
                                </linearGradient>
                            );
                        })}
                    </defs>
                )}
                <CartesianGrid
                    strokeDasharray={gridDasharray}
                    stroke={cfg.xAxis.gridLineColor}
                    vertical={cfg.xAxis.showGridLines}
                    horizontal={cfg.yAxis.showGridLines}
                />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: cfg.xAxis.labelFontSize, fill: cfg.xAxis.labelFontColor }}
                    axisLine={cfg.xAxis.showAxisLine ? { stroke: cfg.xAxis.axisLineColor } : false}
                    tickLine={{ stroke: cfg.xAxis.axisLineColor }}
                    tickFormatter={(value) => truncateLabel(String(value))}
                    interval="preserveStartEnd"
                    angle={cfg.xAxis.labelRotation}
                    textAnchor={cfg.xAxis.labelRotation < 0 ? "end" : "start"}
                    height={60}
                    label={cfg.xAxis.title ? {
                        value: cfg.xAxis.title,
                        position: "insideBottom",
                        offset: -5,
                        fontSize: cfg.xAxis.titleFontSize,
                        fill: cfg.xAxis.titleFontColor,
                    } : undefined}
                />
                <YAxis
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
                {cfg.tooltip.enabled && (
                    <Tooltip
                        formatter={(value) => [formatValue(value as number), ""]}
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
                {cfg.showMinMax && minValue !== undefined && (
                    <ReferenceLine y={minValue} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `Min: ${formatValue(minValue)}`, position: "right", fontSize: 10 }} />
                )}
                {cfg.showMinMax && maxValue !== undefined && (
                    <ReferenceLine y={maxValue} stroke="#22c55e" strokeDasharray="3 3" label={{ value: `Max: ${formatValue(maxValue)}`, position: "right", fontSize: 10 }} />
                )}
                {cfg.areaFill && data.datasets.map((dataset, index) => {
                    const color = dataset.color ?? cfg.colorScheme[index % cfg.colorScheme.length] ?? getChartColor(index);
                    return (
                        <Area
                            key={`area-${dataset.label}`}
                            type={curveType as "linear" | "monotone" | "step" | "stepAfter" | "stepBefore" | "natural"}
                            dataKey={dataset.label}
                            stroke="none"
                            fill={cfg.areaGradient ? `url(#line-area-gradient-${index})` : color}
                            fillOpacity={cfg.areaGradient ? 1 : cfg.areaFillOpacity}
                            connectNulls={cfg.connectNulls}
                        />
                    );
                })}
                {data.datasets.map((dataset, index) => {
                    const color = dataset.color ?? cfg.colorScheme[index % cfg.colorScheme.length] ?? getChartColor(index);
                    const strokeDash = strokeDashMap[cfg.strokeStyle] ?? "0";
                    
                    return (
                        <Line
                            key={dataset.label}
                            type={curveType as "linear" | "monotone" | "step" | "stepAfter" | "stepBefore" | "natural"}
                            dataKey={dataset.label}
                            stroke={color}
                            strokeWidth={cfg.strokeWidth}
                            strokeDasharray={strokeDash}
                            dot={cfg.showMarkers ? { 
                                r: cfg.markerSize, 
                                fill: cfg.markerFill ? color : cfg.backgroundColor,
                                strokeWidth: cfg.markerBorderWidth,
                                stroke: color,
                            } : false}
                            activeDot={{ r: cfg.markerSize + 2 }}
                            animationDuration={cfg.animationDuration}
                            connectNulls={cfg.connectNulls}
                        />
                    );
                })}
            </RechartsLineChart>
        </ResponsiveContainer>
    );
}
