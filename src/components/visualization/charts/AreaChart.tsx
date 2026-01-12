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

    const curveType = curveTypeMap[cfg.curveType] ?? "monotone";

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsAreaChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
                <defs>
                    {data.datasets.map((dataset, index) => {
                        const color = dataset.color ?? cfg.colorScheme[index % cfg.colorScheme.length] ?? getChartColor(index);
                        return (
                            <linearGradient
                                key={`gradient-${index}`}
                                id={`area-gradient-${index}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="5%" stopColor={color} stopOpacity={cfg.fillOpacity} />
                                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                            </linearGradient>
                        );
                    })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#666" }}
                    tickFormatter={(value) => truncateLabel(String(value))}
                    interval="preserveStartEnd"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                />
                <YAxis
                    tickFormatter={formatValue}
                    tick={{ fontSize: 12, fill: "#666" }}
                />
                {cfg.tooltip.enabled && (
                    <Tooltip
                        formatter={(value) => [formatValue(value as number), ""]}
                        contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            fontSize: 12,
                        }}
                    />
                )}
                {cfg.legend.show && cfg.legend.position !== "none" && data.datasets.length > 1 && (
                    <Legend
                        verticalAlign={cfg.legend.position === "top" ? "top" : cfg.legend.position === "bottom" ? "bottom" : "middle"}
                        align={cfg.legend.position === "left" ? "left" : cfg.legend.position === "right" ? "right" : "center"}
                    />
                )}
                {data.datasets.map((dataset, index) => {
                    const color = dataset.color ?? cfg.colorScheme[index % cfg.colorScheme.length] ?? getChartColor(index);
                    return (
                        <Area
                            key={dataset.label}
                            type={curveType as "linear" | "monotone" | "step"}
                            dataKey={dataset.label}
                            stroke={cfg.showLine ? color : "none"}
                            strokeWidth={cfg.showLine ? cfg.strokeWidth : 0}
                            fill={`url(#area-gradient-${index})`}
                            fillOpacity={1}
                            stackId={cfg.stacked ? "stack" : undefined}
                            animationDuration={cfg.animationDuration}
                        />
                    );
                })}
            </RechartsAreaChart>
        </ResponsiveContainer>
    );
}
