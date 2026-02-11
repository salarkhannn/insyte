import { useEffect } from "react";
import { Database } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useVizBuilderStore } from "../../stores/vizBuilderStore";
import { useChartConfigStore } from "../../stores/chartConfigStore";
import { cn } from "../../utils";
import { CollapsibleSection } from "./CollapsibleSection";
import { DataPanel } from "../data/DataPanel";
import { ChartTypeSelector } from "../data/ChartTypeSelector";
import { ChartOptionsPanel } from "../data/ChartOptionsPanel";
import type { ChartType } from "../../types";

export function Sidebar() {
    const { sidebarCollapsed, columns, dataLoaded, currentVisualization } = useAppStore();
    const {
        chartType,
        setChartType,
        loadFromSpec,
    } = useVizBuilderStore();
    const chartConfigStore = useChartConfigStore();

    useEffect(() => {
        if (currentVisualization) {
            loadFromSpec(currentVisualization);
        }
    }, [currentVisualization, loadFromSpec]);

    useEffect(() => {
        if (chartType && chartType !== chartConfigStore.config.type) {
            chartConfigStore.setChartType(chartType as ChartType);
        }
    }, [chartType, chartConfigStore]);

    const selectedChartLabel = chartType
        ? chartType.charAt(0).toUpperCase() + chartType.slice(1)
        : "None";

    return (
        <div
            className={cn(
                "flex shrink-0 h-full",
                sidebarCollapsed ? "w-0 overflow-hidden" : "w-full"
            )}
        >
            <aside className="w-full bg-white border-r border-neutral-200 flex flex-col overflow-hidden">
                <div className="h-10 px-3 flex items-center border-b border-neutral-200 shrink-0">
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Explorer</span>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    <CollapsibleSection
                        title="Data"
                        icon={<Database size={13} />}
                        defaultExpanded={!dataLoaded}
                        badge={dataLoaded ? `${columns.length} fields` : undefined}
                    >
                        <DataPanel />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Chart Type"
                        defaultExpanded={false}
                        badge={selectedChartLabel}
                    >
                        <ChartTypeSelector
                            value={chartType}
                            onChange={setChartType}
                            disabled={!dataLoaded}
                        />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Chart Options"
                        defaultExpanded={false}
                    >
                        <ChartOptionsPanel
                            chartType={chartType as ChartType}
                            disabled={!dataLoaded || !chartType}
                        />
                    </CollapsibleSection>
                </div>
            </aside>
        </div>
    );
}