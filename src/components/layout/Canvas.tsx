import { useAppStore } from "../../stores/appStore";
import { TableView } from "../data/TableView";
import { ChartContainer } from "../visualization/ChartContainer";
import { Upload, BarChart3 } from "lucide-react";

function EmptyState() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <Upload size={32} strokeWidth={1.5} className="text-neutral-400 mb-3" />
            <p className="text-sm text-neutral-600 mb-1">No data loaded</p>
            <p className="text-xs text-neutral-500">
                Open a CSV, Excel, or JSON file to begin
            </p>
        </div>
    );
}

function ChartEmptyState() {
    return (
        <div className="flex-1 flex items-center justify-center p-5">
            <div className="bg-white border border-neutral-200 w-full max-w-2xl h-64 flex flex-col items-center justify-center gap-2">
                <BarChart3 size={32} strokeWidth={1.5} className="text-neutral-400" />
                <p className="text-sm text-neutral-600">No visualization configured</p>
                <p className="text-xs text-neutral-500 max-w-xs text-center">
                    Select a chart type and map fields using the sidebar
                </p>
            </div>
        </div>
    );
}

export function Canvas() {
    const { dataLoaded, activeView, currentVisualization } = useAppStore();

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-neutral-100/50 relative">
            {!dataLoaded ? (
                <EmptyState />
            ) : activeView === "table" ? (
                <div className="flex-1 p-4 min-h-0">
                    <TableView />
                </div>
            ) : currentVisualization ? (
                <div className="flex-1 p-4 min-h-0">
                    <ChartContainer spec={currentVisualization} />
                </div>
            ) : (
                <ChartEmptyState />
            )}
        </main>
    );
}