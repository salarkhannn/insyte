import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import type { ChartData } from "../../../types";
import { chartConfig, getChartColor, formatValue, truncateLabel } from "./chartConfig";

interface BarChartProps {
    data: ChartData;
    horizontal?: boolean;
}

export function BarChart({ data, horizontal = false }: BarChartProps) {
    const chartData = data.labels.map((label, index) => ({
        name: label,
        ...data.datasets.reduce(
            (acc, dataset, datasetIndex) => ({
                ...acc,
                [dataset.label]: dataset.data[index],
                [`color_${datasetIndex}`]: dataset.color ?? getChartColor(datasetIndex),
            }),
            {} as Record<string, number | string>
        ),
    }));

    const layout = horizontal ? "vertical" : "horizontal";

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
                data={chartData}
                layout={layout}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartConfig.gridStroke}
                    vertical={!horizontal}
                    horizontal={horizontal}
                />
                {horizontal ? (
                    <>
                        <XAxis
                            type="number"
                            tickFormatter={formatValue}
                            tick={{ fontSize: chartConfig.tickFontSize, fill: chartConfig.axisStroke }}
                            axisLine={{ stroke: chartConfig.axisStroke }}
                            tickLine={{ stroke: chartConfig.axisStroke }}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: chartConfig.tickFontSize, fill: chartConfig.axisStroke }}
                            axisLine={{ stroke: chartConfig.axisStroke }}
                            tickLine={{ stroke: chartConfig.axisStroke }}
                            width={100}
                            tickFormatter={(value) => truncateLabel(String(value))}
                        />
                    </>
                ) : (
                    <>
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: chartConfig.tickFontSize, fill: chartConfig.axisStroke }}
                            axisLine={{ stroke: chartConfig.axisStroke }}
                            tickLine={{ stroke: chartConfig.axisStroke }}
                            tickFormatter={(value) => truncateLabel(String(value))}
                            interval={0}
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
                    </>
                )}
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
                {data.datasets.map((dataset, datasetIndex) => (
                    <Bar
                        key={dataset.label}
                        dataKey={dataset.label}
                        animationDuration={chartConfig.animationDuration}
                        radius={[2, 2, 0, 0]}
                    >
                        {chartData.map((_, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={dataset.color ?? getChartColor(datasetIndex)}
                            />
                        ))}
                    </Bar>
                ))}
            </RechartsBarChart>
        </ResponsiveContainer>
    );
}
