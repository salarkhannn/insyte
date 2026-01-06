import { useAppStore } from "../../stores/appStore";
import { QueryInput } from "../ai/QueryInput";
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

function WorkspacePlaceholder() {
    const { activeView } = useAppStore();

    return (
        <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-sm w-full max-w-3xl h-80 flex items-center justify-center">
                <span className="text-text-disabled text-sm">
                    {activeView === "chart" ? "Visualization" : "Data Table"}
                </span>
            </div>
        </div>
    );
}

export function Canvas() {
    const { dataLoaded } = useAppStore();

    return (
        <main className="flex-1 flex flex-col overflow-hidden">
            {dataLoaded ? <WorkspacePlaceholder /> : <EmptyState />}
            {dataLoaded && (
                <div className="p-3 pt-0 shrink-0">
                    <QueryInput />
                </div>
            )}
        </main>
    );
}