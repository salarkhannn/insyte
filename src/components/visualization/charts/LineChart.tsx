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
import type { ChartData } from "../../../types";
import { chartConfig, getChartColor, formatValue, truncateLabel } from "./chartConfig";

interface LineChartProps {
    data: ChartData;
    curved?: boolean;
    showDots?: boolean;
}

export function LineChart({ data, curved = true, showDots = true }: LineChartProps) {
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

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartConfig.gridStroke}
                />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: chartConfig.tickFontSize, fill: chartConfig.axisStroke }}
                    axisLine={{ stroke: chartConfig.axisStroke }}
                    tickLine={{ stroke: chartConfig.axisStroke }}
                    tickFormatter={(value) => truncateLabel(String(value))}
                    interval="preserveStartEnd"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                />
                <YAxis
                    tickFormatter={formatValue}
                    tick={{ fontSize: chartConfig.tickFontSize, fill: chartConfig.axisStroke }}
                    axisLine={{ stroke: chartConfig.axisStroke }}
                    tickLine={{ stroke: chartConfig.axisStroke }}
                />
                <Tooltip
                    formatter={(value) => [formatValue(value as number), ""]}
                    contentStyle={{
                        backgroundColor: chartConfig.tooltipBackground,
                        border: `1px solid ${chartConfig.tooltipBorder}`,
                        borderRadius: 4,
                        fontSize: chartConfig.fontSize,
                        fontFamily: chartConfig.fontFamily,
                    }}
                />
                {data.datasets.length > 1 && (
                    <Legend
                        wrapperStyle={{
                            fontSize: chartConfig.fontSize,
                            fontFamily: chartConfig.fontFamily,
                        }}
                    />
                )}
                {data.datasets.map((dataset, index) => (
                    <Line
                        key={dataset.label}
                        type={curved ? "monotone" : "linear"}
                        dataKey={dataset.label}
                        stroke={dataset.color ?? getChartColor(index)}
                        strokeWidth={2}
                        dot={showDots ? { r: 3, fill: dataset.color ?? getChartColor(index) } : false}
                        activeDot={{ r: 5 }}
                        animationDuration={chartConfig.animationDuration}
                    />
                ))}
            </RechartsLineChart>
        </ResponsiveContainer>
    );
}
