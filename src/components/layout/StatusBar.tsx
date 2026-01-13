import { useAppStore } from "../../stores/appStore";
import { Loader2 } from "lucide-react";

export function StatusBar() {
    const { dataLoaded, fileName, rowCount, columns, isProcessing } = useAppStore();

    return (
        <footer className="h-8 bg-sidebar border-t border-border flex items-center px-4 text-xs text-text-muted shrink-0">
            {isProcessing ? (
                <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Processing
                </span>
            ) : (
                <span>Ready</span>
            )}

            <div className="flex-1" />

            {dataLoaded && (
                <div className="flex items-center gap-4">
                    <span>{fileName}</span>
                    <span>{rowCount.toLocaleString()} rows</span>
                    <span>{columns?.length} cols</span>
                </div>
            )}
        </footer>
    );
}