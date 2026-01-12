import { useCallback } from "react";
import {
    BarChart3,
    LineChart,
    PieChart,
    ScatterChart,
    AreaChart,
    X,
    ChevronDown,
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
}

function Select({ label, value, options, onChange, placeholder = "Select..." }: SelectProps) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide">
                {label}
            </label>
            <div className="relative">
                <select
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    className={cn(
                        "w-full h-7 px-2 pr-6 text-xs bg-white border border-border rounded-sm",
                        "appearance-none cursor-pointer",
                        "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
                        !value && "text-text-muted"
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
                    size={12}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
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

export function VizBuilder() {
    const { columns, setVisualization, setActiveView } = useAppStore();
    const {
        isOpen,
        close,
        chartType,
        xField,
        yField,
        aggregation,
        sortBy,
        sortOrder,
        title,
        setChartType,
        setXField,
        setYField,
        setAggregation,
        setSortBy,
        setSortOrder,
        setTitle,
        buildSpec,
        reset,
    } = useVizBuilderStore();

    const { numeric, categorical, all } = getFieldsByType(columns);

    const handleApply = useCallback(() => {
        const spec = buildSpec(columns);
        if (spec) {
            setVisualization(spec);
            setActiveView("chart");
            close();
        }
    }, [buildSpec, columns, setVisualization, setActiveView, close]);

    const handleClear = useCallback(() => {
        reset();
    }, [reset]);

    const canApply = xField && yField;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={close} />
            <div className="relative bg-white rounded-md shadow-xl w-full max-w-md mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h2 className="text-sm font-semibold text-text">Create Visualization</h2>
                    <button
                        onClick={close}
                        className="p-1 rounded-sm text-text-muted hover:text-text hover:bg-neutral-100"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide block mb-2">
                            Chart Type
                        </label>
                        <div className="flex gap-1">
                            {chartTypes.map(({ id, icon: Icon, label }) => (
                                <button
                                    key={id}
                                    onClick={() => setChartType(id)}
                                    className={cn(
                                        "flex-1 flex flex-col items-center gap-1 py-2 rounded-sm border transition-colors",
                                        chartType === id
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-border text-text-secondary hover:bg-neutral-50"
                                    )}
                                >
                                    <Icon size={18} strokeWidth={1.5} />
                                    <span className="text-[10px]">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label="Category (X-Axis)"
                            value={xField}
                            onChange={setXField}
                            placeholder="Select field..."
                            options={[
                                ...categorical.map((c) => ({ value: c.name, label: c.name })),
                                ...all
                                    .filter((c) => !categorical.includes(c))
                                    .map((c) => ({ value: c.name, label: c.name })),
                            ]}
                        />
                        <Select
                            label="Value (Y-Axis)"
                            value={yField}
                            onChange={setYField}
                            placeholder="Select field..."
                            options={[
                                ...numeric.map((c) => ({ value: c.name, label: c.name })),
                                ...all
                                    .filter((c) => !numeric.includes(c))
                                    .map((c) => ({ value: c.name, label: c.name })),
                            ]}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <Select
                            label="Aggregation"
                            value={aggregation}
                            onChange={(v) => setAggregation(v as typeof aggregation)}
                            options={aggregations.map((a) => ({ value: a.id, label: a.label }))}
                        />
                        <Select
                            label="Sort By"
                            value={sortBy}
                            onChange={(v) => setSortBy(v as typeof sortBy)}
                            options={sortOptions.map((s) => ({ value: s.id, label: s.label }))}
                        />
                        <Select
                            label="Order"
                            value={sortOrder}
                            onChange={(v) => setSortOrder(v as typeof sortOrder)}
                            options={[
                                { value: "asc", label: "Ascending" },
                                { value: "desc", label: "Descending" },
                            ]}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide">
                            Title (Optional)
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Auto-generated if empty"
                            className={cn(
                                "w-full h-7 px-2 text-xs bg-white border border-border rounded-sm",
                                "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
                                "placeholder:text-text-muted"
                            )}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-neutral-50">
                    <button
                        onClick={handleClear}
                        className="px-3 py-1.5 text-xs text-text-secondary hover:text-text"
                    >
                        Clear
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={close}
                            className="px-3 py-1.5 text-xs text-text-secondary border border-border rounded-sm hover:bg-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={!canApply}
                            className={cn(
                                "px-4 py-1.5 text-xs text-white rounded-sm",
                                canApply
                                    ? "bg-primary hover:bg-primary-hover"
                                    : "bg-primary/50 cursor-not-allowed"
                            )}
                        >
                            Create Chart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
