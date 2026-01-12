import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type { ChartData, PieChartConfig } from "../../../types";
import { pieChartDefaults } from "./chartDefaults";
import { getChartColor, formatValue } from "./chartConfig";

interface PieChartProps {
    data: ChartData;
    config?: Partial<PieChartConfig>;
}

export function PieChart({ data, config }: PieChartProps) {
    const cfg = { ...pieChartDefaults, ...config };
    
    const dataset = data.datasets[0];
    if (!dataset) return null;

    const total = dataset.data.reduce((sum, val) => sum + val, 0);
    
    const processedData = data.labels.map((label, index) => ({
        name: label,
        value: dataset.data[index],
        percentage: total > 0 ? (dataset.data[index] / total) * 100 : 0,
    }));

    const renderLabel = (props: PieLabelRenderProps) => {
        const { cx, cy, midAngle, outerRadius, percent, name, value } = props;
        
        if (
            typeof cx !== "number" ||
            typeof cy !== "number" ||
            typeof midAngle !== "number" ||
            typeof outerRadius !== "number" ||
            typeof percent !== "number"
        ) {
            return null;
        }

        // Skip very small slices
        if (percent < 0.05) return null;

        const RADIAN = Math.PI / 180;
        const radius = outerRadius + 25;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        
        let labelText = "";
        switch (cfg.labelType) {
            case "name":
                labelText = String(name ?? "");
                break;
            case "value":
                labelText = formatValue(value as number);
                break;
            case "percent":
            default:
                labelText = `${(percent * 100).toFixed(1)}%`;
                break;
        }

        return (
            <text
                x={x}
                y={y}
                fill="#666"
                textAnchor={x > cx ? "start" : "end"}
                dominantBaseline="central"
                fontSize={12}
            >
                {labelText.length > 15 ? `${labelText.slice(0, 14)}…` : labelText}
            </text>
        );
    };

    // Convert innerRadius percentage (0-100) to actual ratio for Recharts
    const innerRadiusValue = cfg.innerRadius > 0 ? `${cfg.innerRadius}%` : 0;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <Pie
                    data={processedData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={innerRadiusValue}
                    outerRadius="70%"
                    label={cfg.showLabels ? renderLabel : undefined}
                    labelLine={cfg.showLabels}
                    animationDuration={cfg.animationDuration}
                >
                    {processedData.map((_, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={cfg.colorScheme[index % cfg.colorScheme.length] ?? getChartColor(index)} 
                        />
                    ))}
                </Pie>
                {cfg.tooltip.enabled && (
                    <Tooltip
                        formatter={(value, _name, props) => {
                            const payload = props.payload as { percentage?: number };
                            const pct = payload?.percentage ?? 0;
                            return [`${formatValue(value as number)} (${pct.toFixed(1)}%)`, ""];
                        }}
                        contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            fontSize: 12,
                        }}
                    />
                )}
                {cfg.legend.show && cfg.legend.position !== "none" && (
                    <Legend
                        layout={cfg.legend.position === "left" || cfg.legend.position === "right" ? "vertical" : "horizontal"}
                        align={cfg.legend.position === "left" ? "left" : cfg.legend.position === "right" ? "right" : "center"}
                        verticalAlign={cfg.legend.position === "top" ? "top" : cfg.legend.position === "bottom" ? "bottom" : "middle"}
                    />
                )}
            </RechartsPieChart>
        </ResponsiveContainer>
    );
}
