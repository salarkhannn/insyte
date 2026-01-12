import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { useChartConfigStore } from "../../stores/chartConfigStore";
import { useAppStore } from "../../stores/appStore";
import {
    getPropertyGroups,
    getPropertiesByGroup,
    filterVisibleProperties,
} from "./charts/chartPropertyMeta";
import { cn } from "../../utils";
import type { ChartType, ChartConfig } from "../../types";

interface PropertyEditorProps {
    onApply?: (config: ChartConfig) => void;
}

export function PropertyEditor({ onApply }: PropertyEditorProps) {
    const { config, isDirty, setChartType, resetToDefaults, applyConfig } = useChartConfigStore();
    const { columns } = useAppStore();
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Data", "Layout"]));

    const chartType = config.type;
    const groups = getPropertyGroups(chartType);

    const toggleGroup = useCallback((group: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(group)) {
                next.delete(group);
            } else {
                next.add(group);
            }
            return next;
        });
    }, []);

    const handleApply = useCallback(() => {
        applyConfig();
        onApply?.(config);
    }, [applyConfig, config, onApply]);

    const numericFields = columns.filter(c => c.dtype === "integer" || c.dtype === "float");
    const categoricalFields = columns.filter(c => c.dtype === "string" || c.dtype === "boolean");
    const allFields = columns;

    const getFieldOptions = (fieldType?: string) => {
        switch (fieldType) {
            case "numeric":
                return numericFields.map(f => ({ value: f.name, label: f.name }));
            case "categorical":
                return categoricalFields.map(f => ({ value: f.name, label: f.name }));
            default:
                return allFields.map(f => ({ value: f.name, label: f.name }));
        }
    };

    const getValue = (key: string): unknown => {
        const parts = key.split(".");
        let value: unknown = config;
        for (const part of parts) {
            if (value && typeof value === "object") {
                value = (value as Record<string, unknown>)[part];
            } else {
                return undefined;
            }
        }
        return value;
    };

    const setValue = (key: string, newValue: unknown) => {
        const store = useChartConfigStore.getState();
        
        if (key.startsWith("xAxis.")) {
            const axisKey = key.replace("xAxis.", "");
            store.setXAxis({ [axisKey]: newValue });
            return;
        }
        if (key.startsWith("yAxis.")) {
            const axisKey = key.replace("yAxis.", "");
            store.setYAxis({ [axisKey]: newValue });
            return;
        }
        if (key.startsWith("tooltip.")) {
            const tooltipKey = key.replace("tooltip.", "");
            store.setTooltip({ [tooltipKey]: newValue });
            return;
        }
        if (key.startsWith("legend.")) {
            const legendKey = key.replace("legend.", "");
            store.setLegend({ [legendKey]: newValue });
            return;
        }

        const setterMap: Record<string, (val: unknown) => void> = {
            dataFieldX: (v) => store.setDataFieldX(v as string | null),
            dataFieldY: (v) => store.setDataFieldY(v as string | null),
            aggregation: (v) => store.setAggregation(v as ChartConfig["aggregation"]),
            title: (v) => store.setTitle(v as string),
            colorScheme: (v) => store.setColorScheme(v as string[]),
            maxPoints: (v) => store.setMaxPoints(v as number),
            animationDuration: (v) => store.setAnimationDuration(v as number),
            backgroundColor: (v) => store.setBackgroundColor(v as string),
            orientation: (v) => store.setBarOrientation(v as "vertical" | "horizontal"),
            stacked: (v) => chartType === "bar" ? store.setBarStacked(v as boolean) : store.setAreaStacked(v as boolean),
            grouped: (v) => store.setBarGrouped(v as boolean),
            barWidth: (v) => store.setBarWidth(v as number | "auto"),
            maxBarWidth: (v) => store.setBarMaxWidth(v as number),
            barSpacing: (v) => store.setBarSpacing(v as number),
            barCategoryGap: (v) => store.setBarCategoryGap(v as number),
            sortOrder: (v) => store.setBarSortOrder(v as "asc" | "desc" | "none"),
            sortBy: (v) => store.setBarSortBy(v as "x" | "y" | "none"),
            showValueLabels: (v) => store.setBarShowValueLabels(v as boolean),
            valueLabelPosition: (v) => store.setBarValueLabelPosition(v as "top" | "center" | "bottom"),
            highlightOnHover: (v) => store.setBarHighlightOnHover(v as boolean),
            curveType: (v) => chartType === "line" ? store.setLineCurveType(v as "linear" | "step" | "stepAfter" | "stepBefore" | "smooth" | "monotone") : store.setAreaCurveType(v as "linear" | "step" | "stepAfter" | "stepBefore" | "smooth" | "monotone"),
            strokeWidth: (v) => chartType === "line" ? store.setLineStrokeWidth(v as number) : store.setAreaStrokeWidth(v as number),
            strokeStyle: (v) => store.setLineStrokeStyle(v as "solid" | "dashed" | "dotted"),
            showMarkers: (v) => chartType === "line" ? store.setLineShowMarkers(v as boolean) : store.setAreaShowMarkers(v as boolean),
            markerShape: (v) => store.setLineMarkerShape(v as "circle" | "square" | "triangle" | "diamond" | "cross" | "star"),
            markerSize: (v) => store.setLineMarkerSize(v as number),
            areaFill: (v) => store.setLineAreaFill(v as boolean),
            areaFillOpacity: (v) => store.setLineAreaFillOpacity(v as number),
            areaGradient: (v) => store.setLineAreaGradient(v as boolean),
            connectNulls: (v) => store.setLineConnectNulls(v as boolean),
            showMinMax: (v) => store.setLineShowMinMax(v as boolean),
            zoomable: (v) => chartType === "line" ? store.setLineZoomable(v as boolean) : chartType === "area" ? store.setAreaZoomable(v as boolean) : store.setScatterZoomable(v as boolean),
            pannable: (v) => chartType === "line" ? store.setLinePannable(v as boolean) : chartType === "area" ? store.setAreaPannable(v as boolean) : store.setScatterPannable(v as boolean),
            showLineBorder: (v) => store.setAreaShowLineBorder(v as boolean),
            stackOffset: (v) => store.setAreaStackOffset(v as "none" | "expand" | "silhouette" | "wiggle"),
            fillOpacity: (v) => store.setAreaFillOpacity(v as number),
            gradientFill: (v) => store.setAreaGradientFill(v as boolean),
            baselineValue: (v) => store.setAreaBaselineValue(v as number),
            innerRadius: (v) => store.setPieInnerRadius(v as number),
            outerRadius: (v) => store.setPieOuterRadius(v as number),
            startAngle: (v) => store.setPieStartAngle(v as number),
            endAngle: (v) => store.setPieEndAngle(v as number),
            padAngle: (v) => store.setPiePadAngle(v as number),
            cornerRadius: (v) => store.setPieCornerRadius(v as number),
            showLabels: (v) => store.setPieShowLabels(v as boolean),
            labelFormat: (v) => store.setPieLabelFormat(v as string),
            labelPosition: (v) => store.setPieLabelPosition(v as "inside" | "outside" | "center"),
            maxSlices: (v) => store.setPieMaxSlices(v as number),
            otherSliceLabel: (v) => store.setPieOtherSliceLabel(v as string),
            explodeSliceIndex: (v) => store.setPieExplodeSliceIndex(v as number | null),
            explodeOffset: (v) => store.setPieExplodeOffset(v as number),
            centerLabel: (v) => store.setPieCenterLabel(v as string),
            dataFieldSize: (v) => store.setScatterDataFieldSize(v as string | null),
            dataFieldColor: (v) => store.setScatterDataFieldColor(v as string | null),
            pointSize: (v) => store.setScatterPointSize(v as number),
            minPointSize: (v) => store.setScatterMinPointSize(v as number),
            maxPointSize: (v) => store.setScatterMaxPointSize(v as number),
            pointShape: (v) => store.setScatterPointShape(v as "circle" | "square" | "triangle" | "diamond" | "cross" | "star"),
            pointOpacity: (v) => store.setScatterPointOpacity(v as number),
            sampleMethod: (v) => store.setScatterSampleMethod(v as "random" | "stratified" | "systematic"),
            sampleSize: (v) => store.setScatterSampleSize(v as number),
            showTrendLine: (v) => store.setScatterShowTrendLine(v as boolean),
            trendLineType: (v) => store.setScatterTrendLineType(v as "none" | "linear" | "polynomial" | "exponential" | "logarithmic" | "loess"),
            highlightOutliers: (v) => store.setScatterHighlightOutliers(v as boolean),
            outlierThreshold: (v) => store.setScatterOutlierThreshold(v as number),
            jitter: (v) => store.setScatterJitter(v as number),
            showQuadrants: (v) => store.setScatterShowQuadrants(v as boolean),
        };

        const setter = setterMap[key];
        if (setter) {
            setter(newValue);
        }
    };

    const renderControl = (prop: { key: string; label: string; type: string; options?: { value: string; label: string }[]; min?: number; max?: number; step?: number; fieldType?: string; default: unknown }): React.ReactNode => {
        const value = getValue(prop.key);
        const id = `prop-${prop.key}`;

        switch (prop.type) {
            case "boolean":
                return (
                    <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-xs text-neutral-700">{prop.label}</span>
                        <input
                            type="checkbox"
                            checked={value as boolean ?? false}
                            onChange={(e) => setValue(prop.key, e.target.checked)}
                            className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                        />
                    </label>
                );

            case "number":
            case "range":
                const displayValue = typeof value === "number" 
                    ? (prop.step && prop.step < 1 ? value.toFixed(2) : String(value)) 
                    : String(prop.default);
                return (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <label htmlFor={id} className="text-xs text-neutral-700">{prop.label}</label>
                            <span className="text-[10px] text-neutral-500 font-mono">
                                {displayValue}
                            </span>
                        </div>
                        <input
                            id={id}
                            type="range"
                            min={prop.min ?? 0}
                            max={prop.max ?? 100}
                            step={prop.step ?? 1}
                            value={value as number ?? prop.default}
                            onChange={(e) => setValue(prop.key, parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                );

            case "enum":
                return (
                    <div className="flex flex-col gap-1">
                        <label htmlFor={id} className="text-xs text-neutral-700">{prop.label}</label>
                        <select
                            id={id}
                            value={value as string ?? ""}
                            onChange={(e) => setValue(prop.key, e.target.value)}
                            className="w-full h-7 px-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {prop.options?.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                );

            case "field":
                const fieldOptions = getFieldOptions(prop.fieldType);
                return (
                    <div className="flex flex-col gap-1">
                        <label htmlFor={id} className="text-xs text-neutral-700">{prop.label}</label>
                        <select
                            id={id}
                            value={value as string ?? ""}
                            onChange={(e) => setValue(prop.key, e.target.value || null)}
                            className="w-full h-7 px-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Select field...</option>
                            {fieldOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                );

            case "color":
                return (
                    <div className="flex items-center justify-between">
                        <label htmlFor={id} className="text-xs text-neutral-700">{prop.label}</label>
                        <div className="flex items-center gap-2">
                            <input
                                id={id}
                                type="color"
                                value={value as string ?? "#000000"}
                                onChange={(e) => setValue(prop.key, e.target.value)}
                                className="w-6 h-6 p-0 border border-neutral-300 rounded cursor-pointer"
                            />
                            <span className="text-[10px] text-neutral-500 font-mono w-16">
                                {value as string ?? "#000000"}
                            </span>
                        </div>
                    </div>
                );

            case "string":
                return (
                    <div className="flex flex-col gap-1">
                        <label htmlFor={id} className="text-xs text-neutral-700">{prop.label}</label>
                        <input
                            id={id}
                            type="text"
                            value={value as string ?? ""}
                            onChange={(e) => setValue(prop.key, e.target.value)}
                            className="w-full h-7 px-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <header className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 bg-neutral-50">
                <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Chart Properties
                </span>
                <div className="flex items-center gap-1">
                    {isDirty && (
                        <span className="text-[10px] text-amber-600 mr-2">Unsaved</span>
                    )}
                    <button
                        onClick={resetToDefaults}
                        className="p-1 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded"
                        title="Reset to defaults"
                    >
                        <RotateCcw size={12} />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                <div className="px-3 py-2 border-b border-neutral-200">
                    <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">
                        Chart Type
                    </label>
                    <div className="mt-1.5 grid grid-cols-5 gap-1">
                        {(["bar", "line", "area", "pie", "scatter"] as ChartType[]).map(type => (
                            <button
                                key={type}
                                onClick={() => setChartType(type)}
                                className={cn(
                                    "py-1.5 text-[10px] font-medium rounded border transition-colors",
                                    chartType === type
                                        ? "bg-blue-50 text-blue-600 border-blue-300"
                                        : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                                )}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {groups.map(group => {
                    const allProps = getPropertiesByGroup(chartType, group);
                    const visibleProps = filterVisibleProperties(allProps, config as unknown as Record<string, unknown>);
                    
                    if (visibleProps.length === 0) return null;

                    const isExpanded = expandedGroups.has(group);

                    return (
                        <div key={group} className="border-b border-neutral-100">
                            <button
                                onClick={() => toggleGroup(group)}
                                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-neutral-600 uppercase tracking-wider hover:bg-neutral-50"
                            >
                                <span>{group}</span>
                                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </button>
                            {isExpanded && (
                                <div className="px-3 pb-3 space-y-3">
                                    {visibleProps.map(prop => (
                                        <div key={prop.key}>
                                            {renderControl(prop)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <footer className="px-3 py-2 border-t border-neutral-200 bg-neutral-50">
                <button
                    onClick={handleApply}
                    disabled={!isDirty}
                    className={cn(
                        "w-full py-1.5 text-xs font-medium rounded transition-colors",
                        isDirty
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                    )}
                >
                    Apply Changes
                </button>
            </footer>
        </div>
    );
}
