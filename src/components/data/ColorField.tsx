import { useState, useEffect, useRef, type DragEvent } from "react";
import { X, Palette } from "lucide-react";
import { cn } from "../../utils";
import type { Column, VisualizationSpec, DateBinning } from "../../types";
import { useChartConfigStore } from "../../stores/chartConfigStore";

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

const COLOR_PALETTES = [
    { name: "Default", colors: ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#f43f5e", "#84cc16"] },
    { name: "Tableau 10", colors: ["#4e79a7", "#f28e2c", "#e15759", "#76b7b2", "#59a14f", "#edc949", "#af7aa1", "#ff9da7"] },
    { name: "Pastel", colors: ["#a8dadc", "#457b9d", "#f4a261", "#e76f51", "#2a9d8f", "#264653", "#e9c46a", "#f1faee"] },
    { name: "Bold", colors: ["#e63946", "#f77f00", "#fcbf49", "#06d6a0", "#118ab2", "#073b4c", "#ef476f", "#ffd166"] },
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

interface ColorFieldProps {
    columns: Column[];
    field: string | null;
    aggregation: VisualizationSpec["aggregation"];
    dateBinning: DateBinning;
    onFieldChange: (field: string | null) => void;
    onAggregationChange: (agg: VisualizationSpec["aggregation"]) => void;
    onDateBinningChange: (binning: DateBinning) => void;
}

export function ColorField({
    columns,
    field,
    aggregation,
    dateBinning,
    onFieldChange,
    onAggregationChange,
    onDateBinningChange,
}: ColorFieldProps) {
    const [isDragTarget, setIsDragTarget] = useState(false);
    const [showPalette, setShowPalette] = useState(false);
    const [showOpacity, setShowOpacity] = useState(false);
    const paletteRef = useRef<HTMLDivElement>(null);
    
    const chartConfigStore = useChartConfigStore();

    const fieldColumn = field ? columns.find(c => c.name === field) : null;
    const fieldType = fieldColumn?.dtype;
    const isNumeric = fieldType === "integer" || fieldType === "float";
    const isDate = fieldType === "date";

    useEffect(() => {
        const onDragEnd = () => setIsDragTarget(false);
        window.addEventListener("dragend", onDragEnd);
        window.addEventListener("drop", onDragEnd);
        return () => {
            window.removeEventListener("dragend", onDragEnd);
            window.removeEventListener("drop", onDragEnd);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
                setShowPalette(false);
                setShowOpacity(false);
            }
        };
        if (showPalette || showOpacity) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [showPalette, showOpacity]);

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
        const name = parseDropData(e);
        if (name) onFieldChange(name);
    };

    const handleFieldDragStart = (e: DragEvent) => {
        if (field) {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("application/json", JSON.stringify({ name: field }));
        }
    };

    const handleRemoveField = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFieldChange(null);
    };

    return (
        <div className="flex items-center gap-2 min-h-7">
            <div className="text-xs font-medium text-neutral-600 w-14 shrink-0">Color</div>
            
            <div
                className={cn(
                    "flex-1 flex items-center gap-1.5 min-h-7 px-1.5 rounded border transition-colors",
                    isDragTarget
                        ? "border-blue-400 bg-blue-50"
                        : field
                        ? "border-neutral-300 bg-white"
                        : "border-dashed border-neutral-300 bg-neutral-50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {field ? (
                    <>
                        <div
                            className="flex-1 flex items-center gap-1.5 cursor-move"
                            draggable
                            onDragStart={handleFieldDragStart}
                        >
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700">
                                <span>{field}</span>
                                <button
                                    onClick={handleRemoveField}
                                    className="hover:bg-blue-100 rounded p-0.5"
                                    title="Remove field"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                            
                            {isNumeric && (
                                <select
                                    value={aggregation}
                                    onChange={(e) => onAggregationChange(e.target.value as VisualizationSpec["aggregation"])}
                                    className="text-xs border border-neutral-300 rounded px-1.5 py-0.5 bg-white h-5"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {AGGREGATIONS.map((agg) => (
                                        <option key={agg.value} value={agg.value}>
                                            {agg.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                            
                            {isDate && (
                                <select
                                    value={dateBinning}
                                    onChange={(e) => onDateBinningChange(e.target.value as DateBinning)}
                                    className="text-xs border border-neutral-300 rounded px-1.5 py-0.5 bg-white h-5"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {DATE_BINNINGS.map((bin) => (
                                        <option key={bin.value} value={bin.value}>
                                            {bin.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="h-4 w-px bg-neutral-200"></div>
                    </>
                ) : (
                    <div className="flex-1 text-xs text-neutral-400 select-none">
                        Drop field or click to set colors
                    </div>
                )}

                <button
                    onClick={() => {
                        setShowPalette(!showPalette);
                        setShowOpacity(false);
                    }}
                    className="p-0.5 hover:bg-neutral-100 rounded"
                    title="Color palette"
                >
                    <Palette size={14} className="text-neutral-600" />
                </button>

                <button
                    onClick={() => {
                        setShowOpacity(!showOpacity);
                        setShowPalette(false);
                    }}
                    className="px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 hover:bg-neutral-100 rounded"
                    title="Opacity"
                >
                    {Math.round((chartConfigStore.config.opacity || 1) * 100)}%
                </button>
            </div>

            {(showPalette || showOpacity) && (
                <div
                    ref={paletteRef}
                    className="absolute z-50 mt-1 bg-white border border-neutral-200 rounded shadow-lg p-2"
                    style={{
                        top: "100%",
                        right: 0,
                        minWidth: "200px",
                    }}
                >
                    {showPalette && (
                        <div className="space-y-2">
                            <div className="text-xs font-medium text-neutral-700 mb-2">Color Palette</div>
                            {COLOR_PALETTES.map((palette) => (
                                <button
                                    key={palette.name}
                                    onClick={() => {
                                        chartConfigStore.setColorScheme(palette.colors);
                                        setShowPalette(false);
                                    }}
                                    className="w-full flex items-center gap-2 p-1.5 hover:bg-neutral-50 rounded"
                                >
                                    <div className="flex gap-0.5">
                                        {palette.colors.slice(0, 6).map((color, idx) => (
                                            <div
                                                key={idx}
                                                className="w-4 h-4 rounded-sm"
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs text-neutral-700">{palette.name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {showOpacity && (
                        <div className="space-y-2">
                            <div className="text-xs font-medium text-neutral-700">Opacity</div>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                step="5"
                                value={Math.round((chartConfigStore.config.opacity || 1) * 100)}
                                onChange={(e) => chartConfigStore.setOpacity(parseInt(e.target.value) / 100)}
                                className="w-full"
                            />
                            <div className="text-xs text-neutral-500 text-center">
                                {Math.round((chartConfigStore.config.opacity || 1) * 100)}%
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
