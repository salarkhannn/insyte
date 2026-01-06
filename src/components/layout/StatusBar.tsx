import { useAppStore } from "../../stores/appStore";
import { Loader2 } from "lucide-react";

export function StatusBar() {
    const { dataLoaded, fileName, rowCount, columns, isProcessing } = useAppStore();

    return (
        <footer className="h-[22px] bg-sidebar border-t border-border flex items-center px-3 text-[11px] text-text-muted shrink-0">
            {isProcessing ? (
                <span className="flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin" />
                    Processing
                </span>
            ) : (
                <span>Ready</span>
            )}

            <div className="flex-1" />

            {dataLoaded && (
                <div className="flex items-center gap-3">
                    <span>{fileName}</span>
                    <span>{rowCount.toLocaleString()} rows</span>
                    <span>{columns?.length} cols</span>
                </div>
            )}
        </footer>
    );
}