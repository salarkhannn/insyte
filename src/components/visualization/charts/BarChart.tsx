import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { ChartData, BarChartConfig } from "../../../types";
import { barChartDefaults } from "./chartDefaults";
import { getChartColor, formatValue, truncateLabel, chartConfig as cfgStyle } from "./chartConfig";
import { useChartInstanceStore } from "../../../stores/chartInstanceStore";
import { ScrollableChartWrapper } from "./ScrollableChartWrapper";

interface BarChartProps {
    data: ChartData;
    config?: Partial<BarChartConfig>;
}

export function BarChart({ data, config }: BarChartProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<echarts.ECharts | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const setInstance = useChartInstanceStore((state) => state.setInstance);

    const cfg = { ...barChartDefaults, ...config };
    const isHorizontal = data.metadata?.swapped === true;

    const buildOption = (): any => {
        const legendPosition = cfg.legend.position;
        const legendShow = cfg.legend.show && legendPosition !== "none" && data.datasets.length > 1;
        const legendTop = legendPosition === "top" ? 10 : legendPosition === "bottom" ? "bottom" : "auto";
        const legendBottom = legendPosition === "bottom" ? 10 : "auto";
        const legendLeft = legendPosition === "left" ? "left" : legendPosition === "right" ? "right" : "center";
        const legendOrient = legendPosition === "left" || legendPosition === "right" ? "vertical" : "horizontal";

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
                bottom: isHorizontal ? 20 : 60,
                left: isHorizontal ? 100 : 20,
                containLabel: true,
            },
            xAxis: isHorizontal
                ? {
                      type: "value",
                      axisLabel: {
                          formatter: (v: number) => formatValue(Number(v)),
                          color: "#666",
                          fontSize: cfgStyle.tickFontSize,
                      },
                      axisLine: { lineStyle: { color: cfgStyle.axisStroke } },
                      splitLine: { show: true, lineStyle: { color: cfgStyle.gridStroke, type: "dashed" } },
                  }
                : {
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
            yAxis: isHorizontal
                ? {
                      type: "category",
                      data: data.labels,
                      axisLabel: {
                          formatter: (v: string) => truncateLabel(String(v)),
                          color: "#666",
                          fontSize: cfgStyle.tickFontSize,
                      },
                      axisLine: { lineStyle: { color: cfgStyle.axisStroke } },
                  }
                : {
                      type: "value",
                      axisLabel: {
                          formatter: (v: number) => formatValue(Number(v)),
                          color: "#666",
                          fontSize: cfgStyle.tickFontSize,
                      },
                      axisLine: { lineStyle: { color: cfgStyle.axisStroke } },
                      splitLine: { show: true, lineStyle: { color: cfgStyle.gridStroke, type: "dashed" } },
                  },
            series: data.datasets.map((dataset, idx) => ({
                name: dataset.label,
                type: "bar",
                data: dataset.data,
                stack: cfg.stacked ? "stack" : undefined,
                itemStyle: {
                    color: dataset.color ?? cfg.colorScheme[idx % cfg.colorScheme.length] ?? getChartColor(idx),
                    borderRadius: isHorizontal ? [0, cfg.barRadius, cfg.barRadius, 0] : [cfg.barRadius, cfg.barRadius, 0, 0],
                },
                label: cfg.showValueLabels
                    ? {
                          show: true,
                          position: isHorizontal ? "right" : "top",
                          color: "#666",
                          fontSize: 10,
                          formatter: (p: any) => formatValue(Number(p.value)),
                      }
                    : undefined,
                emphasis: { focus: "series" },
            })),
        };
    };

    useEffect(() => {
        if (!containerRef.current) return;
        if (!chartRef.current) {
            chartRef.current = echarts.init(containerRef.current, undefined, { renderer: "canvas" });
            const option = buildOption();
            chartRef.current.setOption(option, true);
            setInstance(chartRef.current);
            resizeObserverRef.current = new ResizeObserver(() => {
                chartRef.current && chartRef.current.resize();
            });
            resizeObserverRef.current.observe(containerRef.current);
        }
        return () => {
            resizeObserverRef.current && resizeObserverRef.current.disconnect();
            if (chartRef.current) {
                setInstance(null);
                chartRef.current.dispose();
                chartRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!chartRef.current) return;
        const option = buildOption();
        chartRef.current.setOption(option, true);
    }, [data, config]);

    return (
        <ScrollableChartWrapper
            dataPointCount={data.labels.length}
            scrollDirection={isHorizontal ? "vertical" : "horizontal"}
        >
            <div ref={containerRef} className="w-full h-full" />
        </ScrollableChartWrapper>
    );
}
