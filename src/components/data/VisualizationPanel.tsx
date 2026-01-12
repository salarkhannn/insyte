import { BarChart3, LineChart, PieChart, ScatterChart, AreaChart } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useVizBuilderStore } from "../../stores/vizBuilderStore";
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

export function VisualizationPanel() {
    const { dataLoaded } = useAppStore();
    const { open, setChartType } = useVizBuilderStore();

    const handleChartClick = (chartType: VisualizationSpec["chartType"]) => {
        setChartType(chartType);
        open();
    };

    return (
        <section>
            <header className="px-3 py-2 text-[11px] font-medium text-text-muted uppercase tracking-wide">
                Visualizations
            </header>
            <div className="px-2 pb-2 grid grid-cols-3 gap-1">
                {chartTypes.map(({ id, icon: Icon, label }) => (
                    <button
                        key={id}
                        onClick={() => handleChartClick(id)}
                        disabled={!dataLoaded}
                        className={cn(
                            "flex flex-col items-center gap-1 py-2 rounded-sm text-text-secondary",
                            dataLoaded
                                ? "hover:bg-neutral-200 hover:text-text cursor-pointer"
                                : "opacity-50 cursor-not-allowed"
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