import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { ChartData, PieChartConfig } from "../../../types";
import { pieChartDefaults } from "./chartDefaults";
import { getChartColor, formatValue, chartConfig as cfgStyle } from "./chartConfig";
import { useChartInstanceStore } from "../../../stores/chartInstanceStore";

interface PieChartProps {
    data: ChartData;
    config?: Partial<PieChartConfig>;
}

export function PieChart({ data, config }: PieChartProps) {
    console.log("[DEBUG] PieChart - Rendering with data:", data);
    console.log("[DEBUG] PieChart - Config:", config);
    
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<echarts.ECharts | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const setInstance = useChartInstanceStore((state) => state.setInstance);

    const cfg = { ...pieChartDefaults, ...config };

    const dataset = data.datasets[0];

    const buildOption = (): echarts.EChartsOption | null => {
        if (!dataset) return null;

        const total = dataset.data.reduce((sum, val) => sum + val, 0);

        const pieData = data.labels.map((label, index) => ({
            name: label,
            value: dataset.data[index],
            percentage: total > 0 ? (dataset.data[index] / total) * 100 : 0,
            itemStyle: {
                color: cfg.colorScheme[index % cfg.colorScheme.length] ?? getChartColor(index),
            },
        }));

        const legendPosition = cfg.legend.position;
        const legendShow = cfg.legend.show && legendPosition !== "none";
        const legendTop = legendPosition === "top" ? 10 : legendPosition === "bottom" ? undefined : "middle";
        const legendBottom = legendPosition === "bottom" ? 10 : undefined;
        const legendLeft = legendPosition === "left" ? "left" : legendPosition === "right" ? "right" : "center";
        const legendOrient = legendPosition === "left" || legendPosition === "right" ? "vertical" : "horizontal";

        const labelFormatter = (params: any) => {
            const name = params.name as string;
            const value = params.value as number;
            const percent = params.percent as number;
            switch (cfg.labelType) {
                case "name":
                    return name.length > 15 ? `${name.slice(0, 14)}…` : name;
                case "value":
                    return formatValue(value);
                case "percent":
                default:
                    return `${percent.toFixed(1)}%`;
            }
        };

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
                          const value = params.value as number;
                          const percent = params.percent as number;
                          return `${name}<br/>${formatValue(value)} (${percent.toFixed(1)}%)`;
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
            series: [
                {
                    type: "pie",
                    radius: cfg.innerRadius > 0 ? [`${cfg.innerRadius}%`, "70%"] : ["0%", "70%"],
                    center: ["50%", "50%"],
                    data: pieData,
                    label: cfg.showLabels
                        ? {
                              show: true,
                              formatter: labelFormatter,
                              color: "#666",
                              fontSize: 12,
                          }
                        : { show: false },
                    labelLine: cfg.showLabels ? { show: true } : { show: false },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
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
