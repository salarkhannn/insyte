import { useAppStore } from "../../stores/appStore";
import { QueryInput } from "../ai/QueryInput";
import { TableView } from "../data/TableView";
import { Upload } from "lucide-react";

function EmptyState() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <Upload size={32} strokeWidth={1.5} className="text-text-disabled mb-3" />
            <p className="text-sm text-text-secondary mb-1">No data loaded</p>
            <p className="text-xs text-text-muted">
                Open a CSV, Excel, or JSON file to begin
            </p>
        </div>
    );
}

function ChartPlaceholder() {
    const { currentVisualization } = useAppStore();

    return (
        <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-sm w-full max-w-3xl h-80 flex flex-col items-center justify-center">
                {currentVisualization ? (
                    <>
                        <span className="text-text-secondary text-sm mb-1">
                            {currentVisualization.title}
                        </span>
                        <span className="text-text-disabled text-xs">
                            {currentVisualization.chartType} chart
                        </span>
                    </>
                ) : (
                    <span className="text-text-disabled text-sm">Visualization</span>
                )}
            </div>
        </div>
    );
}

export function Canvas() {
    const { dataLoaded, activeView } = useAppStore();

    return (
        <main className="flex-1 flex flex-col overflow-hidden">
            {!dataLoaded ? (
                <EmptyState />
            ) : activeView === "table" ? (
                <div className="flex-1 p-3 min-h-0">
                    <TableView />
                </div>
            ) : (
                <ChartPlaceholder />
            )}
            {dataLoaded && (
                <div className="p-3 pt-0 shrink-0">
                    <QueryInput />
                </div>
            )}
        </main>
    );
}