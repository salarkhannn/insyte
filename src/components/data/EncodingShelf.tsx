import { useState, useEffect, type DragEvent } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "../../utils";
import type { Column, VisualizationSpec, DateBinning } from "../../types";

const AGGREGATIONS: Array<{ value: VisualizationSpec["aggregation"]; label: string }> = [
    { value: "sum", label: "Sum" },
    { value: "avg", label: "Average" },
    { value: "count", label: "Count" },
    { value: "min", label: "Min" },
    { value: "max", label: "Max" },
];

const DATE_BINNINGS: Array<{ value: DateBinning; label: string }> = [
    { value: "year", label: "Year" },
    { value: "quarter", label: "Quarter" },
    { value: "month", label: "Month" },
    { value: "day", label: "Day" },
];

function parseDropData(e: DragEvent): string | null {
    try {
        const json = e.dataTransfer.getData("application/json");
        if (json) {
            const data = JSON.parse(json);
            return data?.name ?? null;
        }
    } catch { /* fallback to plain text */ }
    return e.dataTransfer.getData("text/plain") || null;
}

function sortedFieldNames(columns: Column[], preferType: "categorical" | "numeric"): string[] {
    const primary = preferType === "categorical"
        ? columns.filter(c => c.dtype === "string" || c.dtype === "boolean" || c.dtype === "date")
        : columns.filter(c => c.dtype === "integer" || c.dtype === "float");
    const rest = columns.filter(c => !primary.includes(c));
    return [...primary, ...rest].map(c => c.name);
}

interface ShelfRowProps {
    label: string;
    field: string | null;
    columns: Column[];
    aggregation: VisualizationSpec["aggregation"];
    dateBinning: DateBinning;
    onFieldChange: (field: string | null) => void;
    onAggregationChange: (agg: VisualizationSpec["aggregation"]) => void;
    onDateBinningChange: (binning: DateBinning) => void;
}

function ShelfRow({ label, field, columns, aggregation, dateBinning, onFieldChange, onAggregationChange, onDateBinningChange }: ShelfRowProps) {
    const [isDragTarget, setIsDragTarget] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const fieldColumn = field ? columns.find(c => c.name === field) : null;
    const fieldType = fieldColumn?.dtype;
    const isNumeric = fieldType === "integer" || fieldType === "float";
    const isDate = fieldType === "date";

    const sortedOptions = sortedFieldNames(columns, label === "Rows" ? "categorical" : "numeric");

    useEffect(() => {
        const onDragStart = () => setIsDragging(true);
        const onDragEnd = () => { setIsDragging(false); setIsDragTarget(false); };
        window.addEventListener("dragstart", onDragStart);
        window.addEventListener("dragend", onDragEnd);
        window.addEventListener("drop", onDragEnd);
        return () => {
            window.removeEventListener("dragstart", onDragStart);
            window.removeEventListener("dragend", onDragEnd);
            window.removeEventListener("drop", onDragEnd);
        };
    }, [label]);

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
        if (!isDragTarget) {
            setIsDragTarget(true);
        }
    };

    const handleDragLeave = (e: DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragTarget(false);
        }
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragTarget(false);
        setIsDragging(false);
        const name = parseDropData(e);
        if (name) onFieldChange(name);
    };

    return (
        <div className="flex items-center gap-2 min-h-7">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider w-14 shrink-0 text-right select-none">
                {label}
            </span>
            <div
                className="relative flex-1 min-w-0 max-w-[220px]"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <select
                    value={field ?? ""}
                    onChange={(e) => onFieldChange(e.target.value || null)}
                    className={cn(
                        "w-full h-7 pl-2 pr-7 text-xs rounded appearance-none cursor-pointer",
                        "focus:outline-none focus:ring-1 focus:ring-blue-500",
                        isDragTarget
                            ? "ring-2 ring-blue-400 bg-blue-50 border border-blue-300"
                            : field
                                ? "bg-neutral-50 border border-neutral-200 text-neutral-900"
                                : "border border-dashed border-neutral-300 text-neutral-400 bg-white"
                    )}
                >
                    <option value="">Drop or select a field</option>
                    {sortedOptions.map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
                {isDragging && (
                    <div
                        className="absolute inset-0 z-10"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    />
                )}
                <ChevronDown
                    size={11}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
            </div>
            {field && (
                <button
                    onClick={() => onFieldChange(null)}
                    className="shrink-0 p-0.5 text-neutral-400 hover:text-neutral-600 rounded hover:bg-neutral-100"
                >
                    <X size={12} />
                </button>
            )}
            {isNumeric && (
                <div className="relative shrink-0">
                    <select
                        value={aggregation}
                        onChange={(e) => onAggregationChange(e.target.value as VisualizationSpec["aggregation"])}
                        className={cn(
                            "h-7 pl-2 pr-5 text-[11px] bg-white border border-neutral-200 rounded",
                            "appearance-none cursor-pointer",
                            "focus:outline-none focus:ring-1 focus:ring-blue-500"
                        )}
                    >
                        {AGGREGATIONS.map(a => (
                            <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                    </select>
                    <ChevronDown
                        size={10}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                    />
                </div>
            )}
            {isDate && (
                <div className="relative shrink-0">
                    <select
                        value={dateBinning}
                        onChange={(e) => onDateBinningChange(e.target.value as DateBinning)}
                        className={cn(
                            "h-7 pl-2 pr-5 text-[11px] bg-white border border-neutral-200 rounded",
                            "appearance-none cursor-pointer",
                            "focus:outline-none focus:ring-1 focus:ring-blue-500"
                        )}
                    >
                        {DATE_BINNINGS.map(b => (
                            <option key={b.value} value={b.value}>{b.label}</option>
                        ))}
                    </select>
                    <ChevronDown
                        size={10}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                    />
                </div>
            )}
        </div>
    );
}

interface EncodingShelfProps {
    columns: Column[];
    xField: string | null;
    yField: string | null;
    xAggregation: VisualizationSpec["aggregation"];
    yAggregation: VisualizationSpec["aggregation"];
    xDateBinning: DateBinning;
    yDateBinning: DateBinning;
    onXFieldChange: (field: string | null) => void;
    onYFieldChange: (field: string | null) => void;
    onXAggregationChange: (agg: VisualizationSpec["aggregation"]) => void;
    onYAggregationChange: (agg: VisualizationSpec["aggregation"]) => void;
    onXDateBinningChange: (binning: DateBinning) => void;
    onYDateBinningChange: (binning: DateBinning) => void;
}

export function EncodingShelf({
    columns,
    xField,
    yField,
    xAggregation,
    yAggregation,
    xDateBinning,
    yDateBinning,
    onXFieldChange,
    onYFieldChange,
    onXAggregationChange,
    onYAggregationChange,
    onXDateBinningChange,
    onYDateBinningChange,
}: EncodingShelfProps) {
    if (columns.length === 0) return null;

    return (
        <div className="bg-white border-b border-neutral-200 px-3 py-1.5 shrink-0 space-y-0.5">
            <ShelfRow
                label="Rows"
                field={xField}
                columns={columns}
                aggregation={xAggregation}
                dateBinning={xDateBinning}
                onFieldChange={onXFieldChange}
                onAggregationChange={onXAggregationChange}
                onDateBinningChange={onXDateBinningChange}
            />
            <ShelfRow
                label="Columns"
                field={yField}
                columns={columns}
                aggregation={yAggregation}
                dateBinning={yDateBinning}
                onFieldChange={onYFieldChange}
                onAggregationChange={onYAggregationChange}
                onDateBinningChange={onYDateBinningChange}
            />
        </div>
    );
}
