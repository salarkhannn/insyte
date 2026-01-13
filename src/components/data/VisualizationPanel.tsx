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
            <header className="px-4 py-3 text-xs font-semibold text-neutral-600 uppercase tracking-wider bg-neutral-50 border-b border-neutral-200">
                Visualizations
            </header>
            <div className="p-4 grid grid-cols-3 gap-2">
                {chartTypes.map(({ id, icon: Icon, label }) => (
                    <button
                        key={id}
                        onClick={() => handleChartClick(id)}
                        disabled={!dataLoaded}
                        className={cn(
                            "flex flex-col items-center gap-2 py-3 rounded-sm text-neutral-600 border border-transparent transition-colors",
                            dataLoaded
                                ? "hover:bg-neutral-100 hover:border-neutral-200 cursor-pointer"
                                : "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Icon size={20} strokeWidth={1.5} />
                        <span className="text-[10px] font-medium">{label}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}