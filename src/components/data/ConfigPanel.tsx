import { useCallback, useEffect, useState } from "react";
import {
    BarChart3,
    LineChart,
    PieChart,
    ScatterChart,
    AreaChart,
    ChevronDown,
    ChevronRight,
    Play,
    RotateCcw,
    Rows,
    Columns,
} from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useVizBuilderStore } from "../../stores/vizBuilderStore";
import { useChartConfigStore } from "../../stores/chartConfigStore";
import {
    getPropertyGroups,
    getPropertiesByGroup,
} from "../visualization/charts/chartPropertyMeta";
import { cn } from "../../utils";
import type { VisualizationSpec, Column, ChartType } from "../../types";

const chartTypes: Array<{
    id: VisualizationSpec["chartType"];
    icon: typeof BarChart3;
    label: string;
}> = [
    { id: "bar", icon: BarChart3, label: "Bar" },
    { id: "line", icon: LineChart, label: "Line" },
    { id: "area", icon: AreaChart, label: "Area" },
    { id: "pie", icon: PieChart, label: "Pie" },
    { id: "scatter", icon: ScatterChart, label: "Scatter" },
];

const aggregations: Array<{ id: VisualizationSpec["aggregation"]; label: string }> = [
    { id: "sum", label: "Sum" },
    { id: "avg", label: "Average" },
    { id: "count", label: "Count" },
    { id: "min", label: "Min" },
    { id: "max", label: "Max" },
];

const sortOptions: Array<{ id: VisualizationSpec["sortBy"]; label: string }> = [
    { id: "none", label: "None" },
    { id: "x", label: "By Category" },
    { id: "y", label: "By Value" },
];

interface SelectProps {
    label: string;
    value: string | null;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

function Select({ label, value, options, onChange, placeholder = "Select...", disabled }: SelectProps) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className={cn(
                        "w-full h-8 px-2.5 pr-7 text-xs bg-white border border-neutral-300 rounded",
                        "appearance-none cursor-pointer font-medium text-neutral-800",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        "hover:border-neutral-400 transition-colors",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-50",
                        !value && "text-neutral-400"
                    )}
                >
                    <option value="" disabled>
                        {placeholder}
                    </option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    size={13}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
                />
            </div>
        </div>
    );
}

function getFieldsByType(columns: Column[]) {
    const numeric = columns.filter((c) => c.dtype === "integer" || c.dtype === "float");
    const categorical = columns.filter((c) => c.dtype === "string" || c.dtype === "boolean");
    const temporal = columns.filter((c) => c.dtype === "date");
    return { numeric, categorical, temporal, all: columns };
}

export function ConfigPanel() {
    const { columns, dataLoaded, currentVisualization, setVisualization, setActiveView } = useAppStore();
    const {
        chartType,
        xField,
        yField,
        aggregation,
        sortBy,
        sortOrder,
        setChartType,
        setXField,
        setYField,
        setAggregation,
        setSortBy,
        setSortOrder,
        buildSpec,
        reset,
        loadFromSpec,
    } = useVizBuilderStore();

    const chartConfig = useChartConfigStore((state) => state.config);
    const chartConfigStore = useChartConfigStore();
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Layout", "Style"]));

    useEffect(() => {
        if (currentVisualization) {
            loadFromSpec(currentVisualization);
        }
    }, [currentVisualization, loadFromSpec]);

    // Sync chart type with config store
    useEffect(() => {
        if (chartType && chartType !== chartConfig.type) {
            chartConfigStore.setChartType(chartType as ChartType);
        }
    }, [chartType, chartConfig.type, chartConfigStore]);

    const { numeric, categorical, all } = getFieldsByType(columns);

    const handleApply = useCallback(() => {
        const spec = buildSpec(columns);
        if (spec) {
            setVisualization(spec);
            setActiveView("chart");
        }
    }, [buildSpec, columns, setVisualization, setActiveView]);

    const canApply = dataLoaded && xField && yField;

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

    // Get chart-type-specific property groups
    const propertyGroups = chartType ? getPropertyGroups(chartType as ChartType) : [];

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
        const type = chartType as ChartType;

        // Handle legend properties
        if (key.startsWith("legend.")) {
            const legendKey = key.replace("legend.", "");
            chartConfigStore.setLegend({ [legendKey]: newValue });
            return;
        }

        // Bar chart properties
        if (type === "bar") {
            const setters: Record<string, () => void> = {
                orientation: () => chartConfigStore.setBarOrientation(newValue as "vertical" | "horizontal"),
                stacked: () => chartConfigStore.setBarStacked(newValue as boolean),
                showValueLabels: () => chartConfigStore.setBarShowValueLabels(newValue as boolean),
                barRadius: () => chartConfigStore.setBarRadius(newValue as number),
            };
            if (setters[key]) { setters[key](); return; }
        }

        // Line chart properties
        if (type === "line") {
            const setters: Record<string, () => void> = {
                curveType: () => chartConfigStore.setLineCurveType(newValue as "linear" | "monotone" | "step"),
                strokeWidth: () => chartConfigStore.setLineStrokeWidth(newValue as number),
                showMarkers: () => chartConfigStore.setLineShowMarkers(newValue as boolean),
                markerSize: () => chartConfigStore.setLineMarkerSize(newValue as number),
                connectNulls: () => chartConfigStore.setLineConnectNulls(newValue as boolean),
            };
            if (setters[key]) { setters[key](); return; }
        }

        // Area chart properties
        if (type === "area") {
            const setters: Record<string, () => void> = {
                curveType: () => chartConfigStore.setAreaCurveType(newValue as "linear" | "monotone" | "step"),
                stacked: () => chartConfigStore.setAreaStacked(newValue as boolean),
                fillOpacity: () => chartConfigStore.setAreaFillOpacity(newValue as number),
                showLine: () => chartConfigStore.setAreaShowLine(newValue as boolean),
                strokeWidth: () => chartConfigStore.setAreaStrokeWidth(newValue as number),
            };
            if (setters[key]) { setters[key](); return; }
        }

        // Pie chart properties
        if (type === "pie") {
            const setters: Record<string, () => void> = {
                innerRadius: () => chartConfigStore.setPieInnerRadius(newValue as number),
                showLabels: () => chartConfigStore.setPieShowLabels(newValue as boolean),
                labelType: () => chartConfigStore.setPieLabelType(newValue as "name" | "value" | "percent"),
            };
            if (setters[key]) { setters[key](); return; }
        }

        // Scatter chart properties
        if (type === "scatter") {
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
                            checked={value as boolean ?? prop.default as boolean}
                            onChange={(e) => setConfigValue(prop.key, e.target.checked)}
                            className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                        />
                    </label>
                );

            case "number":
                const numValue = typeof value === "number" ? value : prop.default as number;
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
                            className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                );

            case "enum":
                return (
                    <div key={prop.key} className="py-1.5">
                        <label htmlFor={id} className="block text-xs text-neutral-700 mb-1">{prop.label}</label>
                        <div className="relative">
                            <select
                                id={id}
                                value={value as string ?? prop.default as string}
                                onChange={(e) => setConfigValue(prop.key, e.target.value)}
                                className="w-full h-7 px-2 pr-7 text-xs bg-white border border-neutral-300 rounded appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                {prop.options?.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                {/* Chart Type Selection */}
                <section className="border-b border-neutral-200">
                    <header className="px-3 py-2.5 text-[11px] font-semibold text-neutral-600 uppercase tracking-wider bg-neutral-50">
                        Chart Type
                    </header>
                    <div className="px-3 py-3 grid grid-cols-5 gap-1.5">
                        {chartTypes.map(({ id, icon: Icon, label }) => (
                            <button
                                key={id}
                                onClick={() => setChartType(id)}
                                disabled={!dataLoaded}
                                title={label}
                                className={cn(
                                    "flex flex-col items-center gap-1 py-2.5 rounded border transition-all",
                                    chartType === id
                                        ? "bg-blue-50 text-blue-600 border-blue-400 shadow-sm"
                                        : "text-neutral-600 border-neutral-300 bg-white",
                                    dataLoaded
                                        ? "hover:bg-neutral-50 hover:border-neutral-400 cursor-pointer"
                                        : "opacity-40 cursor-not-allowed"
                                )}
                            >
                                <Icon size={16} strokeWidth={1.5} />
                                <span className="text-[9px] font-medium">{label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Field Mapping */}
                <section className="border-b border-neutral-200 p-3 space-y-3">
                    <header className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider -mx-3 px-3 -mt-3 pt-2.5 pb-2 bg-neutral-50 border-b border-neutral-200 mb-3">
                        Field Mapping
                    </header>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-medium mb-1">
                            <Rows size={11} />
                            <span>ROWS</span>
                        </div>
                        <Select
                            label=""
                            value={xField}
                            onChange={setXField}
                            placeholder="Select field"
                            disabled={!dataLoaded}
                            options={[
                                ...categorical.map((c) => ({ value: c.name, label: c.name })),
                                ...all
                                    .filter((c) => !categorical.includes(c))
                                    .map((c) => ({ value: c.name, label: c.name })),
                            ]}
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-medium mb-1">
                            <Columns size={11} />
                            <span>VALUES</span>
                        </div>
                        <Select
                            label=""
                            value={yField}
                            onChange={setYField}
                            placeholder="Select field"
                            disabled={!dataLoaded}
                            options={[
                                ...numeric.map((c) => ({ value: c.name, label: c.name })),
                                ...all
                                    .filter((c) => !numeric.includes(c))
                                    .map((c) => ({ value: c.name, label: c.name })),
                            ]}
                        />
                    </div>
                </section>

                {/* Aggregation & Sorting */}
                <section className="border-b border-neutral-200 p-3 space-y-3">
                    <header className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider -mx-3 px-3 -mt-3 pt-2.5 pb-2 bg-neutral-50 border-b border-neutral-200 mb-3">
                        Options
                    </header>
                    <Select
                        label="Aggregation"
                        value={aggregation}
                        onChange={(v) => setAggregation(v as typeof aggregation)}
                        disabled={!dataLoaded}
                        options={aggregations.map((a) => ({ value: a.id, label: a.label }))}
                    />
                    <div className="grid grid-cols-2 gap-2.5">
                        <Select
                            label="Sort By"
                            value={sortBy}
                            onChange={(v) => setSortBy(v as typeof sortBy)}
                            disabled={!dataLoaded}
                            options={sortOptions.map((s) => ({ value: s.id, label: s.label }))}
                        />
                        <Select
                            label="Order"
                            value={sortOrder}
                            onChange={(v) => setSortOrder(v as typeof sortOrder)}
                            disabled={!dataLoaded}
                            options={[
                                { value: "asc", label: "Ascending" },
                                { value: "desc", label: "Descending" },
                            ]}
                        />
                    </div>
                </section>

                {/* Chart-specific Properties */}
                {dataLoaded && chartType && propertyGroups.map(group => {
                    const properties = getPropertiesByGroup(chartType as ChartType, group);
                    if (properties.length === 0) return null;

                    const isExpanded = expandedGroups.has(group);

                    return (
                        <section key={group} className="border-b border-neutral-200">
                            <button
                                onClick={() => toggleGroup(group)}
                                className="w-full px-3 py-2.5 flex items-center justify-between text-[11px] font-semibold text-neutral-600 uppercase tracking-wider bg-neutral-50 hover:bg-neutral-100 transition-colors"
                            >
                                <span>{group}</span>
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            {isExpanded && (
                                <div className="px-3 py-2">
                                    {properties.map(prop => renderPropertyControl(prop))}
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>

            {/* Action Buttons */}
            <div className="p-3 border-t border-neutral-200 flex gap-2 bg-neutral-50">
                <button
                    onClick={reset}
                    disabled={!dataLoaded}
                    className={cn(
                        "flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-semibold rounded border",
                        dataLoaded
                            ? "text-neutral-700 border-neutral-300 bg-white hover:bg-neutral-100 hover:border-neutral-400"
                            : "opacity-50 cursor-not-allowed bg-neutral-100 border-neutral-200"
                    )}
                >
                    <RotateCcw size={13} />
                    Reset
                </button>
                <button
                    onClick={handleApply}
                    disabled={!canApply}
                    className={cn(
                        "flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-semibold rounded text-white",
                        canApply
                            ? "bg-blue-600 hover:bg-blue-700 shadow-sm"
                            : "bg-blue-300 cursor-not-allowed"
                    )}
                >
                    <Play size={13} />
                    Apply
                </button>
            </div>
        </div>
    );
}
