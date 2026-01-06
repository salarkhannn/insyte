import { useAppStore } from "../../stores/appStore";
import { QueryInput } from "../ai/QueryInput";
import { FileUp } from "lucide-react";

function EmptyState() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-text-secondary">
            <div className="w-16 h-16 rounded-full bg-sidebar flex items-center justify-center mb-4">
                <FileUp size={32} className="text-secondary" />
            </div>
            <h2 className="text-lg font-medium text-text-primary mb-1">
                No data loaded
            </h2>
            <p className="text-sm">Open a CSV, Excel, or JSON file to get started</p>
        </div>
    );
}

function ChartPlaceholder() {
    const { currentVisualization } = useAppStore();

    if (!currentVisualization) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-text-secondary">
                <p className="text-sm">Ask a question to generate a visualization</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-center justify-center">
            <div className="bg-canvas border border-border rounded-lg shadow-sm p-8 max-w-2xl w-full">
                <h3 className="text-lg font-medium text-text-primary mb-4">
                    {currentVisualization.title}
                </h3>
                <div className="h-64 bg-sidebar rounded flex items-center justify-center text-text-disabled">
                    Chart will render here
                </div>
            </div>
        </div>
    );
}

function TablePlaceholder() {
    return (
        <div className="flex-1 flex items-center justify-center">
            <div className="bg-canvas border border-border rounded-lg shadow-sm p-8 max-w-4xl w-full">
                <div className="h-64 bg-sidebar rounded flex items-center justify-center text-text-disabled">
                    Table will render here
                </div>
            </div>
        </div>
    );
}

export function Canvas() {
    const { dataLoaded, activeView } = useAppStore();

    return (
        <main className="flex-1 flex flex-col bg-surface p-4 overflow-hidden">
            {!dataLoaded ? (
                <EmptyState />
            ) : activeView === "chart" ? (
                <ChartPlaceholder />
            ) : (
                <TablePlaceholder />
            )}

            {dataLoaded && (
                <div className="mt-4 shrink-0">
                    <QueryInput />
                </div>
            )}
        </main>
    );
}