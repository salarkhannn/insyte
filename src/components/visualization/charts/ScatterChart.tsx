import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { ChartData, ScatterChartConfig } from "../../../types";
import { scatterChartDefaults } from "./chartDefaults";
import { getChartColor, formatValue, chartConfig as cfgStyle } from "./chartConfig";

interface ScatterChartProps {
    data: ChartData;
    config?: Partial<ScatterChartConfig>;
}

export function ScatterChart({ data, config }: ScatterChartProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<echarts.ECharts | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    const cfg = { ...scatterChartDefaults, ...config };

    const dataset = data.datasets[0];

    const buildOption = (): echarts.EChartsOption | null => {
        if (!dataset) return null;

        const scatterData = data.labels.map((label, index) => ({
            value: [index, dataset.data[index]],
            name: label,
        }));

        const legendPosition = cfg.legend.position;
        const legendShow = cfg.legend.show && legendPosition !== "none" && data.datasets.length > 1;
        const legendTop = legendPosition === "top" ? 10 : legendPosition === "bottom" ? undefined : "auto";
        const legendBottom = legendPosition === "bottom" ? 10 : undefined;
        const legendLeft = legendPosition === "left" ? "left" : legendPosition === "right" ? "right" : "center";
        const legendOrient = legendPosition === "left" || legendPosition === "right" ? "vertical" : "horizontal";

        const color = dataset.color ?? cfg.colorScheme[0] ?? getChartColor(0);

        return {
            animationDuration: cfg.animationDuration,
            color: cfg.colorScheme,
            textStyle: { fontFamily: cfgStyle.fontFamily, fontSize: cfgStyle.fontSize },
            tooltip: cfg.tooltip.enabled
                ? {
                      trigger: "item",
                      backgroundColor: cfgStyle.tooltipBackground,
                      borderColor: cfgStyle.tooltipBorder,
                      borderWidth: 1,
                      textStyle: { fontSize: cfgStyle.fontSize },
                      formatter: (params: any) => {
                          const name = params.name as string;
                          const val = params.value[1] as number;
                          return `${name}<br/>${formatValue(val)}`;
                      },
                  }
                : { show: false },
            legend: {
                show: legendShow,
                top: legendTop,
                bottom: legendBottom,
                left: legendLeft,
                orient: legendOrient,
                textStyle: { fontSize: cfgStyle.labelFontSize },
            },
            grid: {
                top: 20,
                right: 30,
                bottom: 20,
                left: 20,
                containLabel: true,
            },
            xAxis: {
                type: "value",
                axisLabel: {
                    color: "#666",
                    fontSize: cfgStyle.tickFontSize,
                },
                axisLine: { lineStyle: { color: cfgStyle.axisStroke } },
                splitLine: { show: true, lineStyle: { color: cfgStyle.gridStroke, type: "dashed" } },
            },
            yAxis: {
                type: "value",
                axisLabel: {
                    formatter: (v: number) => formatValue(Number(v)),
                    color: "#666",
                    fontSize: cfgStyle.tickFontSize,
                },
                axisLine: { lineStyle: { color: cfgStyle.axisStroke } },
                splitLine: { show: true, lineStyle: { color: cfgStyle.gridStroke, type: "dashed" } },
            },
            series: [
                {
                    name: dataset.label,
                    type: "scatter",
                    data: scatterData,
                    symbolSize: cfg.pointSize * 2,
                    itemStyle: {
                        color,
                        opacity: cfg.pointOpacity,
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowColor: "rgba(0, 0, 0, 0.2)",
                        },
                    },
                },
            ],
        };
    };

    useEffect(() => {
        if (!containerRef.current) return;
        if (!chartRef.current) {
            chartRef.current = echarts.init(containerRef.current, undefined, { renderer: "canvas" });
            const option = buildOption();
            if (option) chartRef.current.setOption(option, true);
            resizeObserverRef.current = new ResizeObserver(() => {
                chartRef.current?.resize();
            });
            resizeObserverRef.current.observe(containerRef.current);
        }
        return () => {
            resizeObserverRef.current?.disconnect();
            if (chartRef.current) {
                chartRef.current.dispose();
                chartRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!chartRef.current) return;
        const option = buildOption();
        if (option) chartRef.current.setOption(option, true);
    }, [data, config]);

    if (!dataset) return null;

    return (
        <div className="w-full h-full">
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
}
