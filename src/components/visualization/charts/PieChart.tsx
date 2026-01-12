import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type { ChartData } from "../../../types";
import { chartConfig, getChartColor, formatValue } from "./chartConfig";

interface PieChartProps {
    data: ChartData;
    donut?: boolean;
    showLabels?: boolean;
}

export function PieChart({ data, donut = false, showLabels = true }: PieChartProps) {
    const dataset = data.datasets[0];
    if (!dataset) return null;

    const total = dataset.data.reduce((sum, val) => sum + val, 0);

    const chartData = data.labels.map((label, index) => ({
        name: label,
        value: dataset.data[index],
        percentage: total > 0 ? (dataset.data[index] / total) * 100 : 0,
    }));

    const renderLabel = (props: PieLabelRenderProps) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, percent, name } = props;
        
        if (
            typeof cx !== "number" ||
            typeof cy !== "number" ||
            typeof midAngle !== "number" ||
            typeof innerRadius !== "number" ||
            typeof outerRadius !== "number" ||
            typeof percent !== "number"
        ) {
            return null;
        }

        if (percent < 0.05) return null;

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        const displayName = String(name ?? "");

        return (
            <text
                x={x}
                y={y}
                fill={chartConfig.axisStroke}
                textAnchor={x > cx ? "start" : "end"}
                dominantBaseline="central"
                fontSize={chartConfig.tickFontSize}
                fontFamily={chartConfig.fontFamily}
            >
                {displayName.length > 12 ? `${displayName.slice(0, 11)}…` : displayName} ({(percent * 100).toFixed(0)}%)
            </text>
        );
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart margin={{ top: 20, right: 80, left: 80, bottom: 20 }}>
                <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={donut ? "50%" : 0}
                    outerRadius="70%"
                    paddingAngle={2}
                    label={showLabels ? renderLabel : undefined}
                    labelLine={showLabels}
                    animationDuration={chartConfig.animationDuration}
                >
                    {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value, _name, props) => {
                        const payload = props.payload as { percentage?: number };
                        const pct = payload?.percentage ?? 0;
                        return [`${formatValue(value as number)} (${pct.toFixed(1)}%)`, ""];
                    }}
                    contentStyle={{
                        backgroundColor: chartConfig.tooltipBackground,
                        border: `1px solid ${chartConfig.tooltipBorder}`,
                        borderRadius: 4,
                        fontSize: chartConfig.fontSize,
                        fontFamily: chartConfig.fontFamily,
                    }}
                />
                <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{
                        fontSize: chartConfig.fontSize,
                        fontFamily: chartConfig.fontFamily,
                    }}
                />
            </RechartsPieChart>
        </ResponsiveContainer>
    );
}
