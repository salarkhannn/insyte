import {
    ScatterChart as RechartsScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import type { ChartData, ScatterChartConfig } from "../../../types";
import { scatterChartDefaults } from "./chartDefaults";
import { getChartColor, formatValue } from "./chartConfig";

interface ScatterChartProps {
    data: ChartData;
    config?: Partial<ScatterChartConfig>;
}

export function ScatterChart({ data, config }: ScatterChartProps) {
    const cfg = { ...scatterChartDefaults, ...config };
    
    const dataset = data.datasets[0];
    if (!dataset) return null;

    const chartData = data.labels.map((label, index) => ({
        x: index,
        y: dataset.data[index],
        name: label,
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                    type="number"
                    dataKey="x"
                    name="X"
                    tick={{ fontSize: 12, fill: "#666" }}
                />
                <YAxis
                    type="number"
                    dataKey="y"
                    name="Y"
                    tickFormatter={formatValue}
                    tick={{ fontSize: 12, fill: "#666" }}
                />
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
                <Scatter
                    name={dataset.label}
                    data={chartData}
                    fill={dataset.color ?? cfg.colorScheme[0] ?? getChartColor(0)}
                    fillOpacity={cfg.pointOpacity}
                    animationDuration={cfg.animationDuration}
                >
                    {/* Point size controlled by shape size in Recharts */}
                </Scatter>
            </RechartsScatterChart>
        </ResponsiveContainer>
    );
}
