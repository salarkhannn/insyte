import { BarChart3, LineChart, AreaChart, PieChart, ScatterChart } from "lucide-react";
import { cn } from "../../utils";
import type { VisualizationSpec } from "../../types";

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

interface ChartTypeSelectorProps {
    value: VisualizationSpec["chartType"] | null;
    onChange: (type: VisualizationSpec["chartType"]) => void;
    disabled?: boolean;
}

export function ChartTypeSelector({ value, onChange, disabled }: ChartTypeSelectorProps) {
    return (
        <div className="grid grid-cols-5 gap-1.5">
            {chartTypes.map(({ id, icon: Icon, label }) => (
                <button
                    key={id}
                    onClick={() => onChange(id)}
                    disabled={disabled}
                    title={label}
                    className={cn(
                        "flex flex-col items-center gap-1.5 py-2.5 rounded border transition-colors",
                        value === id
                            ? "bg-blue-50 text-blue-600 border-blue-300"
                            : "text-neutral-500 border-neutral-200 bg-white",
                        !disabled && "hover:bg-neutral-50 hover:border-neutral-300 cursor-pointer",
                        disabled && "opacity-40 cursor-not-allowed"
                    )}
                >
                    <Icon size={18} strokeWidth={1.5} />
                    <span className="text-[10px] font-medium">{label}</span>
                </button>
            ))}
        </div>
    );
}
