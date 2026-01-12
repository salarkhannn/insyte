import {
    ScatterChart as RechartsScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ZAxis,
} from "recharts";
import type { ChartData } from "../../../types";
import { chartConfig, getChartColor, formatValue } from "./chartConfig";

interface ScatterChartProps {
    data: ChartData;
}

export function ScatterChart({ data }: ScatterChartProps) {
    const dataset = data.datasets[0];
    if (!dataset) return null;

    const chartData = data.labels.map((label, index) => ({
        x: index,
        y: dataset.data[index],
        name: label,
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartConfig.gridStroke}
                />
                <XAxis
                    type="number"
                    dataKey="x"
                    name="Index"
                    tick={{ fontSize: chartConfig.tickFontSize, fill: chartConfig.axisStroke }}
                    axisLine={{ stroke: chartConfig.axisStroke }}
                    tickLine={{ stroke: chartConfig.axisStroke }}
                />
                <YAxis
                    type="number"
                    dataKey="y"
                    name="Value"
                    tickFormatter={formatValue}
                    tick={{ fontSize: chartConfig.tickFontSize, fill: chartConfig.axisStroke }}
                    axisLine={{ stroke: chartConfig.axisStroke }}
                    tickLine={{ stroke: chartConfig.axisStroke }}
                />
                <ZAxis range={[50, 50]} />
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
                        backgroundColor: chartConfig.tooltipBackground,
                        border: `1px solid ${chartConfig.tooltipBorder}`,
                        borderRadius: 4,
                        fontSize: chartConfig.fontSize,
                        fontFamily: chartConfig.fontFamily,
                    }}
                />
                <Scatter
                    name={dataset.label}
                    data={chartData}
                    fill={dataset.color ?? getChartColor(0)}
                    animationDuration={chartConfig.animationDuration}
                />
            </RechartsScatterChart>
        </ResponsiveContainer>
    );
}
