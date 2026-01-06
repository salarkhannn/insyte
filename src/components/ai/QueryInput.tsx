import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { cn } from "../../utils";

export function QueryInput() {
    const [query, setQuery] = useState("");
    const { isProcessing, setProcessing } = useAppStore();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isProcessing) return;

        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            setQuery("");
        }, 800);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-surface border border-border rounded-sm flex items-center px-3 h-9 gap-2"
        >
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask: Show revenue by month..."
                disabled={isProcessing}
                className={cn(
                    "flex-1 bg-transparent outline-none text-sm text-text",
                    "placeholder:text-text-muted disabled:opacity-50"
                )}
            />
            <button
                type="submit"
                disabled={!query.trim() || isProcessing}
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
    );
}