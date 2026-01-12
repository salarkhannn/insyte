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
    const gridDasharray = cfg.xAxis.gridLineStyle === "dashed" ? "3 3" : cfg.xAxis.gridLineStyle === "dotted" ? "1 3" : "0";

    const getBarRadius = (): [number, number, number, number] => {
        if (isHorizontal) {
            return [0, cfg.barRadius[0], cfg.barRadius[1], 0];
        }
        return cfg.barRadius;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
                data={chartData}
                layout={layout}
                margin={cfg.padding}
                barGap={cfg.barSpacing}
                barCategoryGap={cfg.barCategoryGap}
            >
                <CartesianGrid
                    strokeDasharray={gridDasharray}
                    stroke={cfg.xAxis.gridLineColor}
                    vertical={!isHorizontal && cfg.xAxis.showGridLines}
                    horizontal={isHorizontal ? cfg.xAxis.showGridLines : cfg.yAxis.showGridLines}
                />
                {isHorizontal ? (
                    <>
                        <XAxis
                            type="number"
                            tickFormatter={formatValue}
                            tick={{ fontSize: cfg.xAxis.labelFontSize, fill: cfg.xAxis.labelFontColor }}
                            axisLine={cfg.xAxis.showAxisLine ? { stroke: cfg.xAxis.axisLineColor } : false}
                            tickLine={{ stroke: cfg.xAxis.axisLineColor }}
                            label={cfg.xAxis.title ? {
                                value: cfg.xAxis.title,
                                position: "insideBottom",
                                offset: -5,
                                fontSize: cfg.xAxis.titleFontSize,
                                fill: cfg.xAxis.titleFontColor,
                            } : undefined}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: cfg.yAxis.labelFontSize, fill: cfg.yAxis.labelFontColor }}
                            axisLine={cfg.yAxis.showAxisLine ? { stroke: cfg.yAxis.axisLineColor } : false}
                            tickLine={{ stroke: cfg.yAxis.axisLineColor }}
                            width={100}
                            tickFormatter={(value) => truncateLabel(String(value))}
                            label={cfg.yAxis.title ? {
                                value: cfg.yAxis.title,
                                angle: -90,
                                position: "insideLeft",
                                fontSize: cfg.yAxis.titleFontSize,
                                fill: cfg.yAxis.titleFontColor,
                            } : undefined}
                        />
                    </>
                ) : (
                    <>
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: cfg.xAxis.labelFontSize, fill: cfg.xAxis.labelFontColor }}
                            axisLine={cfg.xAxis.showAxisLine ? { stroke: cfg.xAxis.axisLineColor } : false}
                            tickLine={{ stroke: cfg.xAxis.axisLineColor }}
                            tickFormatter={(value) => truncateLabel(String(value))}
                            interval={0}
                            angle={cfg.xAxis.labelRotation}
                            textAnchor={cfg.xAxis.labelRotation < 0 ? "end" : "start"}
                            height={60}
                            label={cfg.xAxis.title ? {
                                value: cfg.xAxis.title,
                                position: "insideBottom",
                                offset: -5,
                                fontSize: cfg.xAxis.titleFontSize,
                                fill: cfg.xAxis.titleFontColor,
                            } : undefined}
                        />
                        <YAxis
                            tickFormatter={formatValue}
                            tick={{ fontSize: cfg.yAxis.labelFontSize, fill: cfg.yAxis.labelFontColor }}
                            axisLine={cfg.yAxis.showAxisLine ? { stroke: cfg.yAxis.axisLineColor } : false}
                            tickLine={{ stroke: cfg.yAxis.axisLineColor }}
                            domain={[
                                cfg.yAxis.min === "auto" ? "auto" : cfg.yAxis.min,
                                cfg.yAxis.max === "auto" ? "auto" : cfg.yAxis.max,
                            ]}
                            label={cfg.yAxis.title ? {
                                value: cfg.yAxis.title,
                                angle: -90,
                                position: "insideLeft",
                                fontSize: cfg.yAxis.titleFontSize,
                                fill: cfg.yAxis.titleFontColor,
                            } : undefined}
                        />
                    </>
                )}
                {cfg.tooltip.enabled && (
                    <Tooltip
                        cursor={cfg.highlightOnHover ? { fill: "rgba(0, 0, 0, 0.05)" } : false}
                        formatter={(value) => [formatValue(value as number), ""]}
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
                {cfg.legend.show && data.datasets.length > 1 && (
                    <Legend
                        verticalAlign={cfg.legend.position === "top" ? "top" : cfg.legend.position === "bottom" ? "bottom" : "middle"}
                        align={cfg.legend.position === "left" ? "left" : cfg.legend.position === "right" ? "right" : "center"}
                        wrapperStyle={{
                            fontSize: cfg.legend.fontSize,
                            fontFamily: cfg.legend.fontFamily,
                        }}
                    />
                )}
                {data.datasets.map((dataset, datasetIndex) => {
                    const barColor = dataset.color ?? cfg.colorScheme[datasetIndex % cfg.colorScheme.length] ?? getChartColor(datasetIndex);
                    const maxWidth = typeof cfg.barWidth === "number" ? cfg.barWidth : cfg.maxBarWidth;
                    
                    return (
                        <Bar
                            key={dataset.label}
                            dataKey={dataset.label}
                            fill={barColor}
                            stackId={cfg.stacked ? "stack" : undefined}
                            animationDuration={cfg.animationDuration}
                            radius={getBarRadius()}
                            maxBarSize={maxWidth}
                        >
                            {cfg.showValueLabels && (
                                <LabelList
                                    dataKey={dataset.label}
                                    position={cfg.valueLabelPosition}
                                    style={{
                                        fontSize: cfg.valueLabelFontSize,
                                        fill: cfg.valueLabelFontColor,
                                    }}
                                />
                            )}
                        </Bar>
                    );
                })}
            </RechartsBarChart>
        </ResponsiveContainer>
    );
}
