import { ChevronDown, Rows, Columns } from "lucide-react";
import { cn } from "../../utils";
import type { Column, VisualizationSpec } from "../../types";

const aggregations: Array<{ id: VisualizationSpec["aggregation"]; label: string }> = [
    { id: "sum", label: "Sum" },
    { id: "avg", label: "Average" },
    { id: "count", label: "Count" },
    { id: "min", label: "Min" },
    { id: "max", label: "Max" },
];

interface ShelfDropdownProps {
    label: string;
    icon: React.ReactNode;
    value: string | null;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

function ShelfDropdown({
    label,
    icon,
    value,
    options,
    onChange,
    placeholder = "Drop field here",
    disabled,
}: ShelfDropdownProps) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                {icon}
                <span>{label}</span>
            </div>
            <div className="relative">
                <select
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className={cn(
                        "w-full h-8 px-3 pr-8 text-xs bg-white border rounded",
                        "appearance-none cursor-pointer",
                        "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
                        "transition-colors",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-50",
                        value
                            ? "border-blue-300 bg-blue-50 text-neutral-800"
                            : "border-neutral-300 text-neutral-400 border-dashed"
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
                    size={14}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
            </div>
        </div>
    );
}

function getFieldsByType(columns: Column[]) {
    const numeric = columns.filter((c) => c.dtype === "integer" || c.dtype === "float");
    const categorical = columns.filter((c) => c.dtype === "string" || c.dtype === "boolean");
    return { numeric, categorical, all: columns };
}

interface EncodingPanelProps {
    columns: Column[];
    xField: string | null;
    yField: string | null;
    aggregation: VisualizationSpec["aggregation"];
    onXFieldChange: (field: string) => void;
    onYFieldChange: (field: string) => void;
    onAggregationChange: (agg: VisualizationSpec["aggregation"]) => void;
    disabled?: boolean;
}

export function EncodingPanel({
    columns,
    xField,
    yField,
    aggregation,
    onXFieldChange,
    onYFieldChange,
    onAggregationChange,
    disabled,
}: EncodingPanelProps) {
    const { numeric, categorical, all } = getFieldsByType(columns);

    const rowOptions = [
        ...categorical.map((c) => ({ value: c.name, label: c.name })),
        ...all.filter((c) => !categorical.includes(c)).map((c) => ({ value: c.name, label: c.name })),
    ];

    const columnOptions = [
        ...numeric.map((c) => ({ value: c.name, label: c.name })),
        ...all.filter((c) => !numeric.includes(c)).map((c) => ({ value: c.name, label: c.name })),
    ];

    return (
        <div className="space-y-4">
            <ShelfDropdown
                label="ROWS"
                icon={<Rows size={14} />}
                value={xField}
                options={rowOptions}
                onChange={onXFieldChange}
                disabled={disabled}
            />

            <ShelfDropdown
                label="COLUMNS"
                icon={<Columns size={14} />}
                value={yField}
                options={columnOptions}
                onChange={onYFieldChange}
                disabled={disabled}
            />

            <div className="pt-2 border-t border-neutral-200">
                <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-500 font-medium">Aggregation</span>
                    <div className="relative flex-1">
                        <select
                            value={aggregation}
                            onChange={(e) => onAggregationChange(e.target.value as VisualizationSpec["aggregation"])}
                            disabled={disabled}
                            className={cn(
                                "w-full h-7 px-2 pr-7 text-xs bg-white border border-neutral-300 rounded",
                                "appearance-none cursor-pointer",
                                "focus:outline-none focus:ring-1 focus:ring-blue-500",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {aggregations.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={12}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
