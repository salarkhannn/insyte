import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useChartConfigStore } from "../../stores/chartConfigStore";
import {
    getPropertyGroups,
    getPropertiesByGroup,
} from "../visualization/charts/chartPropertyMeta";
import type { ChartType } from "../../types";

interface ChartOptionsPanelProps {
    chartType: ChartType | null;
    disabled?: boolean;
}

export function ChartOptionsPanel({ chartType, disabled }: ChartOptionsPanelProps) {
    const chartConfig = useChartConfigStore((state) => state.config);
    const chartConfigStore = useChartConfigStore();
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Layout"]));

    const toggleGroup = useCallback((group: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(group)) {
                next.delete(group);
            } else {
                next.add(group);
            }
            return next;
        });
    }, []);

    if (!chartType) {
        return (
            <div className="text-xs text-neutral-400 text-center py-2">
                Select a chart type first
            </div>
        );
    }

    const propertyGroups = getPropertyGroups(chartType);

    const getConfigValue = (key: string): unknown => {
        const parts = key.split(".");
        let value: unknown = chartConfig;
        for (const part of parts) {
            if (value && typeof value === "object") {
                value = (value as Record<string, unknown>)[part];
            } else {
                return undefined;
            }
        }
        return value;
    };

    const setConfigValue = (key: string, newValue: unknown) => {
        if (key.startsWith("legend.")) {
            const legendKey = key.replace("legend.", "");
            chartConfigStore.setLegend({ [legendKey]: newValue });
            return;
        }

        if (chartType === "bar") {
            const setters: Record<string, () => void> = {
                orientation: () => chartConfigStore.setBarOrientation(newValue as "vertical" | "horizontal"),
                stacked: () => chartConfigStore.setBarStacked(newValue as boolean),
                showValueLabels: () => chartConfigStore.setBarShowValueLabels(newValue as boolean),
                barRadius: () => chartConfigStore.setBarRadius(newValue as number),
            };
            if (setters[key]) { setters[key](); return; }
        }

        if (chartType === "line") {
            const setters: Record<string, () => void> = {
                curveType: () => chartConfigStore.setLineCurveType(newValue as "linear" | "monotone" | "step"),
                strokeWidth: () => chartConfigStore.setLineStrokeWidth(newValue as number),
                showMarkers: () => chartConfigStore.setLineShowMarkers(newValue as boolean),
                markerSize: () => chartConfigStore.setLineMarkerSize(newValue as number),
                connectNulls: () => chartConfigStore.setLineConnectNulls(newValue as boolean),
            };
            if (setters[key]) { setters[key](); return; }
        }

        if (chartType === "area") {
            const setters: Record<string, () => void> = {
                curveType: () => chartConfigStore.setAreaCurveType(newValue as "linear" | "monotone" | "step"),
                stacked: () => chartConfigStore.setAreaStacked(newValue as boolean),
                fillOpacity: () => chartConfigStore.setAreaFillOpacity(newValue as number),
                showLine: () => chartConfigStore.setAreaShowLine(newValue as boolean),
                strokeWidth: () => chartConfigStore.setAreaStrokeWidth(newValue as number),
            };
            if (setters[key]) { setters[key](); return; }
        }

        if (chartType === "pie") {
            const setters: Record<string, () => void> = {
                innerRadius: () => chartConfigStore.setPieInnerRadius(newValue as number),
                showLabels: () => chartConfigStore.setPieShowLabels(newValue as boolean),
                labelType: () => chartConfigStore.setPieLabelType(newValue as "name" | "value" | "percent"),
            };
            if (setters[key]) { setters[key](); return; }
        }

        if (chartType === "scatter") {
            const setters: Record<string, () => void> = {
                pointSize: () => chartConfigStore.setScatterPointSize(newValue as number),
                pointOpacity: () => chartConfigStore.setScatterPointOpacity(newValue as number),
            };
            if (setters[key]) { setters[key](); return; }
        }
    };

    const renderPropertyControl = (prop: {
        key: string;
        label: string;
        type: string;
        options?: { value: string; label: string }[];
        min?: number;
        max?: number;
        step?: number;
        default: unknown;
    }) => {
        const value = getConfigValue(prop.key);
        const id = `config-${prop.key}`;

        switch (prop.type) {
            case "boolean":
                return (
                    <label key={prop.key} className="flex items-center justify-between py-1.5 cursor-pointer">
                        <span className="text-xs text-neutral-700">{prop.label}</span>
                        <input
                            type="checkbox"
                            checked={(value as boolean) ?? (prop.default as boolean)}
                            onChange={(e) => setConfigValue(prop.key, e.target.checked)}
                            disabled={disabled}
                            className="w-3.5 h-3.5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                        />
                    </label>
                );

            case "number": {
                const numValue = typeof value === "number" ? value : (prop.default as number);
                return (
                    <div key={prop.key} className="py-1.5">
                        <div className="flex items-center justify-between mb-1">
                            <label htmlFor={id} className="text-xs text-neutral-700">{prop.label}</label>
                            <span className="text-[10px] text-neutral-500 font-mono">
                                {prop.step && prop.step < 1 ? numValue.toFixed(1) : numValue}
                            </span>
                        </div>
                        <input
                            id={id}
                            type="range"
                            min={prop.min ?? 0}
                            max={prop.max ?? 100}
                            step={prop.step ?? 1}
                            value={numValue}
                            onChange={(e) => setConfigValue(prop.key, parseFloat(e.target.value))}
                            disabled={disabled}
                            className="w-full h-1 bg-neutral-200 rounded appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                );
            }

            case "enum":
                return (
                    <div key={prop.key} className="py-1.5">
                        <label htmlFor={id} className="block text-xs text-neutral-700 mb-1">{prop.label}</label>
                        <div className="relative">
                            <select
                                id={id}
                                value={(value as string) ?? (prop.default as string)}
                                onChange={(e) => setConfigValue(prop.key, e.target.value)}
                                disabled={disabled}
                                className="w-full h-7 px-2 pr-6 text-xs bg-white border border-neutral-300 rounded appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                {prop.options?.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (propertyGroups.length === 0) {
        return (
            <div className="text-xs text-neutral-400 text-center py-2">
                No options for this chart type
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {propertyGroups.map((group) => {
                const properties = getPropertiesByGroup(chartType, group);
                if (properties.length === 0) return null;

                const isExpanded = expandedGroups.has(group);

                return (
                    <div key={group} className="border border-neutral-100 rounded">
                        <button
                            onClick={() => toggleGroup(group)}
                            className="w-full px-2 py-1.5 flex items-center gap-1.5 text-[11px] font-medium text-neutral-600 hover:bg-neutral-50 rounded-t"
                        >
                            <span className="text-neutral-400">
                                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </span>
                            <span>{group}</span>
                        </button>
                        {isExpanded && (
                            <div className="px-2 pb-2">
                                {properties.map((prop) => renderPropertyControl(prop))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
