import { useAppStore } from "../../stores/appStore";
import { TableView } from "../data/TableView";
import { ChartContainer } from "../visualization/ChartContainer";
import { Upload, BarChart3, ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react";
import { cn } from "../../utils";

function CanvasToolbar() {
    return (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-neutral-200 rounded-md p-1 shadow-sm">
            <button
                className={cn(
                    "w-7 h-7 flex items-center justify-center rounded text-neutral-500",
                    "hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                )}
                title="Zoom in"
            >
                <ZoomIn size={14} />
            </button>
            <button
                className={cn(
                    "w-7 h-7 flex items-center justify-center rounded text-neutral-500",
                    "hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                )}
                title="Zoom out"
            >
                <ZoomOut size={14} />
            </button>
            <div className="w-px h-5 bg-neutral-200 mx-0.5" />
            <button
                className={cn(
                    "w-7 h-7 flex items-center justify-center rounded text-neutral-500",
                    "hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                )}
                title="Fullscreen"
            >
                <Maximize2 size={14} />
            </button>
            <button
                className={cn(
                    "w-7 h-7 flex items-center justify-center rounded text-neutral-500",
                    "hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                )}
                title="Export"
            >
                <Download size={14} />
            </button>
        </div>
    );
}

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
                <>
                    <CanvasToolbar />
                    <div className="flex-1 p-4 min-h-0">
                        <ChartContainer spec={currentVisualization} />
                    </div>
                </>
            ) : (
                <ChartEmptyState />
            )}
        </main>
    );
}