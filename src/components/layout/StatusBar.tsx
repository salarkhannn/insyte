import { useAppStore } from "../../stores/appStore";
import { Loader2 } from "lucide-react";

export function StatusBar() {
    const { dataLoaded, fileName, rowCount, columns, isProcessing } =
        useAppStore();

    return (
        <footer className="h-6 bg-sidebar border-t border-border flex items-center px-3 text-xs text-text-secondary shrink-0">
            <div className="flex items-center gap-4">
                {isProcessing ? (
                    <span className="flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin" />
                        Processing...
                    </span>
                ) : (
                    <span>Ready</span>
                )}
            </div>

            <div className="flex-1" />

            {dataLoaded && (
                <div className="flex items-center gap-4">
                    <span>{fileName}</span>
                    <span>Rows: {rowCount.toLocaleString()}</span>
                    <span>Columns: {columns?.length}</span>
                </div>
            )}
        </footer>
    );
}