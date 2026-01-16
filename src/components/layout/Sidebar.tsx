import { useEffect } from "react";
import { Database, Layers } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useVizBuilderStore } from "../../stores/vizBuilderStore";
import { useChartConfigStore } from "../../stores/chartConfigStore";
import { cn } from "../../utils";
import { CollapsibleSection } from "./CollapsibleSection";
import { DataPanel } from "../data/DataPanel";
import { EncodingPanel } from "../data/EncodingPanel";
import { ChartTypeSelector } from "../data/ChartTypeSelector";
import { ChartOptionsPanel } from "../data/ChartOptionsPanel";
import type { ChartType } from "../../types";

export function Sidebar() {
    const { sidebarCollapsed, columns, dataLoaded, currentVisualization, setVisualization, setActiveView } = useAppStore();
    const {
        chartType,
        xField,
        yField,
        aggregation,
        setChartType,
        setXField,
        setYField,
        setAggregation,
        buildSpec,
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

    useEffect(() => {
        if (dataLoaded && xField && yField) {
            const spec = buildSpec(columns);
            if (spec) {
                setVisualization(spec);
                setActiveView("chart");
            }
        }
    }, [dataLoaded, chartType, xField, yField, aggregation, buildSpec, columns, setVisualization, setActiveView]);

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
                    {/* DATA Section */}
                    <CollapsibleSection
                        title="Data"
                        icon={<Database size={13} />}
                        defaultExpanded={!dataLoaded}
                        badge={dataLoaded ? `${columns.length} fields` : undefined}
                    >
                        <DataPanel />
                    </CollapsibleSection>

                    {/* ENCODING Section - Always Expanded */}
                    <CollapsibleSection
                        title="Encoding"
                        icon={<Layers size={13} />}
                        alwaysExpanded
                    >
                        <EncodingPanel
                            columns={columns}
                            xField={xField}
                            yField={yField}
                            aggregation={aggregation}
                            onXFieldChange={setXField}
                            onYFieldChange={setYField}
                            onAggregationChange={setAggregation}
                            disabled={!dataLoaded}
                        />
                    </CollapsibleSection>

                    {/* CHART TYPE Section */}
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

                    {/* CHART OPTIONS Section */}
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