import { useCallback, useEffect } from "react";
import {
    BarChart3,
    LineChart,
    PieChart,
    ScatterChart,
    AreaChart,
    ChevronDown,
    Play,
    RotateCcw,
    Rows,
    Columns,
} from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useVizBuilderStore } from "../../stores/vizBuilderStore";
import { cn } from "../../utils";
import type { VisualizationSpec, Column } from "../../types";

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
            <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">
                {label}
            </label>
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

    useEffect(() => {
        if (currentVisualization) {
            loadFromSpec(currentVisualization);
        }
    }, [currentVisualization, loadFromSpec]);

    const { numeric, categorical, all } = getFieldsByType(columns);

    const handleApply = useCallback(() => {
        const spec = buildSpec(columns);
        if (spec) {
            setVisualization(spec);
            setActiveView("chart");
        }
    }, [buildSpec, columns, setVisualization, setActiveView]);

    const canApply = dataLoaded && xField && yField;

    return (
        <div className="flex flex-col h-full bg-white">
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
                        placeholder="Drop field here"
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
                        <span>COLUMNS</span>
                    </div>
                    <Select
                        label=""
                        value={yField}
                        onChange={setYField}
                        placeholder="Drop field here"
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

            <div className="mt-auto p-3 border-t border-neutral-200 flex gap-2 bg-neutral-50">
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
