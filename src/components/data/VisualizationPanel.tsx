import { BarChart3, LineChart, PieChart, ScatterChart, AreaChart, ChartNoAxesColumn } from "lucide-react";
import { cn } from "../../utils";

const chartTypes = [
    { id: "bar", icon: BarChart3, label: "Bar" },
    { id: "line", icon: LineChart, label: "Line" },
    { id: "area", icon: AreaChart, label: "Area" },
    { id: "pie", icon: PieChart, label: "Pie" },
    { id: "scatter", icon: ScatterChart, label: "Scatter" },
    { id: "histogram", icon: ChartNoAxesColumn, label: "Histogram" }
] as const;

export function VisualizationPanel() {
    return (
        <section>
            <header className="px-3 py-2 text-[11px] font-medium text-text-muted uppercase tracking-wide">
                Visualizations
            </header>
            <div className="px-2 pb-2 grid grid-cols-3 gap-1">
                {chartTypes.map(({ id, icon: Icon, label }) => (
                    <button
                        key={id}
                        className={cn(
                            "flex flex-col items-center gap-1 py-2 rounded-sm text-text-secondary",
                            "hover:bg-neutral-200 hover:text-text"
                        )}
                    >
                        <Icon size={18} strokeWidth={1.5} />
                        <span className="text-[10px]">{label}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}