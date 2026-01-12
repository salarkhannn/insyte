import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
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

    const curveType = curveTypeMap[cfg.curveType] ?? "monotone";

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
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
                        <Line
                            key={dataset.label}
                            type={curveType as "linear" | "monotone" | "step"}
                            dataKey={dataset.label}
                            stroke={color}
                            strokeWidth={cfg.strokeWidth}
                            dot={cfg.showMarkers ? { 
                                r: cfg.markerSize, 
                                fill: "#fff",
                                strokeWidth: 2,
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
