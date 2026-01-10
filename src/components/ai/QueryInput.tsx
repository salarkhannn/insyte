import { useState, useRef, useEffect } from "react";
import { Send, Loader2, History, X } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useQueryStore } from "../../stores/queryStore";
import { processAiQuery } from "../../services/aiService";
import { cn } from "../../utils";

export function QueryInput() {
    const [query, setQuery] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);

    const { isProcessing, setProcessing, setVisualization, setActiveView, dataLoaded } = useAppStore();
    const { history, addToHistory } = useQueryStore();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
                setShowHistory(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if ((event.ctrlKey || event.metaKey) && event.key === "/") {
                event.preventDefault();
                inputRef.current?.focus();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isProcessing || !dataLoaded) return;

        setError(null);
        setProcessing(true, "Processing query...");

        try {
            const spec = await processAiQuery(query.trim());
            setVisualization(spec);
            setActiveView("chart");
            addToHistory({
                query: query.trim(),
                visualization: spec,
                success: true,
            });
            setQuery("");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            addToHistory({
                query: query.trim(),
                visualization: null,
                success: false,
                error: errorMessage,
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleHistorySelect = (historyQuery: string) => {
        setQuery(historyQuery);
        setShowHistory(false);
        inputRef.current?.focus();
    };

    return (
        <div className="relative">
            <form
                onSubmit={handleSubmit}
                className={cn(
                    "bg-surface border rounded-sm flex items-center px-3 h-9 gap-2",
                    error ? "border-destructive" : "border-border"
                )}
            >
                {history.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className="text-text-muted hover:text-text transition-colors"
                    >
                        <History size={14} />
                    </button>
                )}
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setError(null);
                    }}
                    placeholder={dataLoaded ? "Ask: Show revenue by month..." : "Load data first..."}
                    disabled={isProcessing || !dataLoaded}
                    className={cn(
                        "flex-1 bg-transparent outline-none text-sm text-text",
                        "placeholder:text-text-muted disabled:opacity-50"
                    )}
                />
                {error && (
                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
                <button
                    type="submit"
                    disabled={!query.trim() || isProcessing || !dataLoaded}
                    className={cn(
                        "w-6 h-6 rounded-sm flex items-center justify-center transition-colors",
                        "bg-primary text-white hover:bg-primary-hover",
                        "disabled:opacity-40 disabled:hover:bg-primary"
                    )}
                >
                    {isProcessing ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <Send size={14} />
                    )}
                </button>
            </form>

            {error && (
                <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-destructive/10 border border-destructive/20 rounded-sm">
                    <p className="text-xs text-destructive">{error}</p>
                </div>
            )}

            {showHistory && history.length > 0 && (
                <div
                    ref={historyRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-sm shadow-lg max-h-48 overflow-y-auto z-50"
                >
                    {history.slice(0, 10).map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => handleHistorySelect(item.query)}
                            className={cn(
                                "w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 flex items-center gap-2",
                                !item.success && "text-text-muted"
                            )}
                        >
                            <span className={cn(
                                "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                item.success ? "bg-chart-1" : "bg-destructive"
                            )} />
                            <span className="truncate">{item.query}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}