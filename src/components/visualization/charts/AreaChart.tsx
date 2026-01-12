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
import type { ChartData } from "../../../types";
import { chartConfig, getChartColor, formatValue, truncateLabel } from "./chartConfig";

interface AreaChartProps {
    data: ChartData;
    stacked?: boolean;
}

export function AreaChart({ data, stacked = false }: AreaChartProps) {
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
            <RechartsAreaChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
                <defs>
                    {data.datasets.map((dataset, index) => {
                        const color = dataset.color ?? getChartColor(index);
                        return (
                            <linearGradient
                                key={`gradient-${index}`}
                                id={`gradient-${index}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                            </linearGradient>
                        );
                    })}
                </defs>
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
                    <Area
                        key={dataset.label}
                        type="monotone"
                        dataKey={dataset.label}
                        stroke={dataset.color ?? getChartColor(index)}
                        strokeWidth={2}
                        fill={`url(#gradient-${index})`}
                        stackId={stacked ? "stack" : undefined}
                        animationDuration={chartConfig.animationDuration}
                    />
                ))}
            </RechartsAreaChart>
        </ResponsiveContainer>
    );
}
