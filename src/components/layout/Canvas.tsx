import { useAppStore } from "../../stores/appStore";
import { QueryInput } from "../ai/QueryInput";
import { TableView } from "../data/TableView";
import { ChartContainer } from "../visualization/ChartContainer";
import { Upload, BarChart3 } from "lucide-react";

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

function ChartEmptyState() {
    return (
        <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-sm w-full max-w-2xl h-72 flex flex-col items-center justify-center gap-3">
                <BarChart3 size={32} strokeWidth={1.5} className="text-text-disabled" />
                <p className="text-sm text-text-secondary">No visualization</p>
                <p className="text-xs text-text-muted max-w-xs text-center">
                    Ask a question about your data to generate a chart
                </p>
            </div>
        </div>
    );
}

export function Canvas() {
    const { dataLoaded, activeView, currentVisualization } = useAppStore();

    return (
        <main className="flex-1 flex flex-col overflow-hidden">
            {!dataLoaded ? (
                <EmptyState />
            ) : activeView === "table" ? (
                <div className="flex-1 p-3 min-h-0">
                    <TableView />
                </div>
            ) : currentVisualization ? (
                <div className="flex-1 p-3 min-h-0">
                    <ChartContainer spec={currentVisualization} />
                </div>
            ) : (
                <ChartEmptyState />
            )}
            {dataLoaded && (
                <div className="p-3 pt-0 shrink-0">
                    <QueryInput />
                </div>
            )}
        </main>
    );
}