import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { ChartData, LineChartConfig } from "../../../types";
import { lineChartDefaults } from "./chartDefaults";
import { getChartColor, formatValue, truncateLabel, chartConfig as cfgStyle } from "./chartConfig";
import { useChartInstanceStore } from "../../../stores/chartInstanceStore";

interface LineChartProps {
    data: ChartData;
    config?: Partial<LineChartConfig>;
}

const curveTypeMap: Record<string, boolean> = {
    linear: false,
    monotone: true,
    step: false,
};

const stepTypeMap: Record<string, string | undefined> = {
    linear: undefined,
    monotone: undefined,
    step: "middle",
};

export function LineChart({ data, config }: LineChartProps) {
    console.log("[DEBUG] LineChart - Rendering with data:", data);
    console.log("[DEBUG] LineChart - Config:", config);
    
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<echarts.ECharts | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const setInstance = useChartInstanceStore((state) => state.setInstance);

    const cfg = { ...lineChartDefaults, ...config };

    const buildOption = (): echarts.EChartsOption => {
        const legendPosition = cfg.legend.position;
        const legendShow = cfg.legend.show && legendPosition !== "none" && data.datasets.length > 1;
        const legendTop = legendPosition === "top" ? 10 : legendPosition === "bottom" ? undefined : "auto";
        const legendBottom = legendPosition === "bottom" ? 10 : undefined;
        const legendLeft = legendPosition === "left" ? "left" : legendPosition === "right" ? "right" : "center";
        const legendOrient = legendPosition === "left" || legendPosition === "right" ? "vertical" : "horizontal";

        const smooth = curveTypeMap[cfg.curveType] ?? false;
        const step = stepTypeMap[cfg.curveType];

        return {
            animationDuration: cfg.animationDuration,
            color: cfg.colorScheme,
            textStyle: { fontFamily: cfgStyle.fontFamily, fontSize: cfgStyle.fontSize },
            tooltip: cfg.tooltip.enabled
                ? {
                      trigger: "axis",
                      backgroundColor: cfgStyle.tooltipBackground,
                      borderColor: cfgStyle.tooltipBorder,
                      borderWidth: 1,
                      textStyle: { fontSize: cfgStyle.fontSize },
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
                bottom: 60,
                left: 20,
                containLabel: true,
            },
            xAxis: {
                type: "category",
                data: data.labels,
                axisLabel: {
                    formatter: (v: string) => truncateLabel(String(v)),
                    rotate: -45,
                    color: "#666",
                    fontSize: cfgStyle.tickFontSize,
                },
                axisLine: { lineStyle: { color: cfgStyle.axisStroke } },
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
            series: data.datasets.map((dataset, idx) => {
                const color = dataset.color ?? cfg.colorScheme[idx % cfg.colorScheme.length] ?? getChartColor(idx);
                return {
                    name: dataset.label,
                    type: "line" as const,
                    data: dataset.data,
                    smooth,
                    step: step as any,
                    lineStyle: { width: cfg.strokeWidth, color },
                    itemStyle: { color },
                    showSymbol: cfg.showMarkers,
                    symbol: "circle",
                    symbolSize: cfg.markerSize * 2,
                    connectNulls: cfg.connectNulls,
                    emphasis: { focus: "series" },
                };
            }),
        };
    };

    useEffect(() => {
        if (!containerRef.current) return;
        if (!chartRef.current) {
            chartRef.current = echarts.init(containerRef.current, undefined, { renderer: "canvas" });
            chartRef.current.setOption(buildOption(), true);
            setInstance(chartRef.current);
            resizeObserverRef.current = new ResizeObserver(() => {
                chartRef.current?.resize();
            });
            resizeObserverRef.current.observe(containerRef.current);
        }
        return () => {
            resizeObserverRef.current?.disconnect();
            if (chartRef.current) {
                setInstance(null);
                chartRef.current.dispose();
                chartRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!chartRef.current) return;
        chartRef.current.setOption(buildOption(), true);
    }, [data, config]);

    return (
        <div className="w-full h-full">
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
}
