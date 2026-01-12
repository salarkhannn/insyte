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
    
    let processedData = data.labels.map((label, index) => ({
        name: label,
        value: dataset.data[index],
        percentage: total > 0 ? (dataset.data[index] / total) * 100 : 0,
    }));

    if (cfg.sortOrder !== "none") {
        processedData.sort((a, b) => 
            cfg.sortOrder === "desc" ? b.value - a.value : a.value - b.value
        );
    }

    if (processedData.length > cfg.maxSlices) {
        const topSlices = processedData.slice(0, cfg.maxSlices - 1);
        const otherSlices = processedData.slice(cfg.maxSlices - 1);
        const otherValue = otherSlices.reduce((sum, item) => sum + item.value, 0);
        const otherPercentage = otherSlices.reduce((sum, item) => sum + item.percentage, 0);
        
        processedData = [
            ...topSlices,
            { name: cfg.otherSliceLabel, value: otherValue, percentage: otherPercentage },
        ];
    }

    const formatLabel = (template: string, name: string, value: number, percent: number) => {
        return template
            .replace("{name}", name)
            .replace("{value}", formatValue(value))
            .replace("{percent}", percent.toFixed(1));
    };

    const renderLabel = (props: PieLabelRenderProps) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, percent, name, value } = props;
        
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

        const minAngle = (cfg.labelMinAngle / 360);
        if (percent < minAngle) return null;

        const RADIAN = Math.PI / 180;
        
        if (cfg.labelPosition === "inside") {
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);
            
            return (
                <text
                    x={x}
                    y={y}
                    fill="#fff"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={cfg.tooltip.fontSize}
                    fontFamily={cfg.tooltip.fontFamily}
                >
                    {(percent * 100).toFixed(0)}%
                </text>
            );
        }

        const radius = outerRadius + cfg.labelLineLength;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        const displayName = String(name ?? "");
        const labelText = formatLabel(cfg.labelFormat, displayName, value as number, percent * 100);

        return (
            <text
                x={x}
                y={y}
                fill={cfg.tooltip.textColor}
                textAnchor={x > cx ? "start" : "end"}
                dominantBaseline="central"
                fontSize={cfg.tooltip.fontSize}
                fontFamily={cfg.tooltip.fontFamily}
            >
                {labelText.length > 20 ? `${labelText.slice(0, 19)}…` : labelText}
            </text>
        );
    };

    const isDonut = cfg.innerRadius > 0;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart margin={cfg.padding}>
                <Pie
                    data={processedData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={`${cfg.innerRadius * 100}%`}
                    outerRadius={`${cfg.outerRadius * 100}%`}
                    startAngle={cfg.startAngle}
                    endAngle={cfg.endAngle}
                    paddingAngle={cfg.padAngle}
                    cornerRadius={cfg.cornerRadius}
                    label={cfg.showLabels ? renderLabel : undefined}
                    labelLine={cfg.showLabels && cfg.showLabelLines && cfg.labelPosition === "outside"}
                    animationDuration={cfg.animationDuration}
                >
                    {processedData.map((_, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={cfg.colorScheme[index % cfg.colorScheme.length] ?? getChartColor(index)} 
                        />
                    ))}
                </Pie>
                {isDonut && cfg.centerLabel && (
                    <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={cfg.centerLabelFontSize}
                        fill={cfg.centerLabelFontColor}
                        fontFamily={cfg.tooltip.fontFamily}
                    >
                        {cfg.centerLabel}
                    </text>
                )}
                {cfg.tooltip.enabled && (
                    <Tooltip
                        formatter={(value, _name, props) => {
                            const payload = props.payload as { percentage?: number };
                            const pct = payload?.percentage ?? 0;
                            if (cfg.tooltip.showPercentage) {
                                return [`${formatValue(value as number)} (${pct.toFixed(1)}%)`, ""];
                            }
                            return [formatValue(value as number), ""];
                        }}
                        contentStyle={{
                            backgroundColor: cfg.tooltip.backgroundColor,
                            border: `1px solid ${cfg.tooltip.borderColor}`,
                            borderRadius: 4,
                            fontSize: cfg.tooltip.fontSize,
                            fontFamily: cfg.tooltip.fontFamily,
                            color: cfg.tooltip.textColor,
                        }}
                    />
                )}
                {cfg.legend.show && (
                    <Legend
                        layout={cfg.legend.position === "left" || cfg.legend.position === "right" ? "vertical" : "horizontal"}
                        align={cfg.legend.position === "left" ? "left" : cfg.legend.position === "right" ? "right" : "center"}
                        verticalAlign={cfg.legend.position === "top" ? "top" : cfg.legend.position === "bottom" ? "bottom" : "middle"}
                        wrapperStyle={{
                            fontSize: cfg.legend.fontSize,
                            fontFamily: cfg.legend.fontFamily,
                        }}
                    />
                )}
            </RechartsPieChart>
        </ResponsiveContainer>
    );
}
