import {
    AreaChart as RechartsAreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import type { ChartData, AreaChartConfig } from "../../../types";
import { areaChartDefaults } from "./chartDefaults";
import { getChartColor, formatValue, truncateLabel } from "./chartConfig";

interface AreaChartProps {
    data: ChartData;
    config?: Partial<AreaChartConfig>;
}

const curveTypeMap = {
    linear: "linear",
    monotone: "monotone",
    step: "step",
    stepAfter: "stepAfter",
    stepBefore: "stepBefore",
    smooth: "natural",
} as const;

export function AreaChart({ data, config }: AreaChartProps) {
    const cfg = { ...areaChartDefaults, ...config };
    
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
    const stackOffset = cfg.stacked ? cfg.stackOffset : undefined;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsAreaChart
                data={chartData}
                margin={cfg.padding}
                stackOffset={stackOffset === "none" ? undefined : stackOffset}
            >
                <defs>
                    {data.datasets.map((dataset, index) => {
                        const color = dataset.color ?? cfg.colorScheme[index % cfg.colorScheme.length] ?? getChartColor(index);
                        if (cfg.gradientFill) {
                            return (
                                <linearGradient
                                    key={`gradient-${index}`}
                                    id={`area-gradient-${index}`}
                                    x1="0"
                                    y1="0"
                                    x2={cfg.gradientDirection === "horizontal" ? "1" : "0"}
                                    y2={cfg.gradientDirection === "vertical" ? "1" : "0"}
                                >
                                    <stop offset="5%" stopColor={color} stopOpacity={cfg.fillOpacity} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                                </linearGradient>
                            );
                        }
                        return null;
                    })}
                </defs>
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
                        cfg.yAxis.min === "auto" ? cfg.baselineValue : cfg.yAxis.min,
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
                {data.datasets.map((dataset, index) => {
                    const color = dataset.color ?? cfg.colorScheme[index % cfg.colorScheme.length] ?? getChartColor(index);
                    return (
                        <Area
                            key={dataset.label}
                            type={curveType as "linear" | "monotone" | "step" | "stepAfter" | "stepBefore" | "natural"}
                            dataKey={dataset.label}
                            stroke={cfg.showLineBorder ? color : "none"}
                            strokeWidth={cfg.showLineBorder ? cfg.strokeWidth : 0}
                            fill={cfg.gradientFill ? `url(#area-gradient-${index})` : color}
                            fillOpacity={cfg.gradientFill ? 1 : cfg.fillOpacity}
                            stackId={cfg.stacked ? "stack" : undefined}
                            animationDuration={cfg.animationDuration}
                            connectNulls={cfg.connectNulls}
                            dot={cfg.showMarkers ? {
                                r: cfg.markerSize,
                                fill: color,
                            } : false}
                        />
                    );
                })}
            </RechartsAreaChart>
        </ResponsiveContainer>
    );
}
