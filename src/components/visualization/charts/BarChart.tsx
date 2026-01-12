import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LabelList,
} from "recharts";
import type { ChartData, BarChartConfig } from "../../../types";
import { barChartDefaults } from "./chartDefaults";
import { getChartColor, formatValue, truncateLabel } from "./chartConfig";

interface BarChartProps {
    data: ChartData;
    config?: Partial<BarChartConfig>;
}

export function BarChart({ data, config }: BarChartProps) {
    const cfg = { ...barChartDefaults, ...config };
    
    const chartData = data.labels.map((label, index) => ({
        name: label,
        ...data.datasets.reduce(
            (acc, dataset) => ({
                ...acc,
                [dataset.label]: dataset.data[index],
            }),
            {} as Record<string, number | string>
        ),
    }));

    const isHorizontal = cfg.orientation === "horizontal";
    const layout = isHorizontal ? "vertical" : "horizontal";

    // Convert single radius number to array format for Recharts
    const getBarRadius = (): [number, number, number, number] => {
        const r = cfg.barRadius;
        if (isHorizontal) {
            return [0, r, r, 0]; // Right corners rounded for horizontal
        }
        return [r, r, 0, 0]; // Top corners rounded for vertical
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
                data={chartData}
                layout={layout}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                {isHorizontal ? (
                    <>
                        <XAxis
                            type="number"
                            tickFormatter={formatValue}
                            tick={{ fontSize: 12, fill: "#666" }}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 12, fill: "#666" }}
                            width={100}
                            tickFormatter={(value) => truncateLabel(String(value))}
                        />
                    </>
                ) : (
                    <>
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: "#666" }}
                            tickFormatter={(value) => truncateLabel(String(value))}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                        />
                        <YAxis
                            tickFormatter={formatValue}
                            tick={{ fontSize: 12, fill: "#666" }}
                        />
                    </>
                )}
                {cfg.tooltip.enabled && (
                    <Tooltip
                        cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
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
                {data.datasets.map((dataset, datasetIndex) => {
                    const barColor = dataset.color ?? cfg.colorScheme[datasetIndex % cfg.colorScheme.length] ?? getChartColor(datasetIndex);
                    
                    return (
                        <Bar
                            key={dataset.label}
                            dataKey={dataset.label}
                            fill={barColor}
                            stackId={cfg.stacked ? "stack" : undefined}
                            animationDuration={cfg.animationDuration}
                            radius={getBarRadius()}
                        >
                            {cfg.showValueLabels && (
                                <LabelList
                                    dataKey={dataset.label}
                                    position={isHorizontal ? "right" : "top"}
                                    style={{ fontSize: 10, fill: "#666" }}
                                />
                            )}
                        </Bar>
                    );
                })}
            </RechartsBarChart>
        </ResponsiveContainer>
    );
}
