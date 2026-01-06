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
        console.log("Processing query:", query);

        setTimeout(() => {
            setProcessing(false);
            setQuery("");
        }, 1000);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-canvas border border-border rounded-lg shadow-sm flex items-center px-4 py-2 gap-3"
        >
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Ask a question, e.g. "Show revenue by month"'
                disabled={isProcessing}
                className={cn(
                    "flex-1 bg-transparent outline-none text-sm text-text-primary",
                    "placeholder:text-text-disabled disabled:opacity-50"
                )}
            />
            <button
                type="submit"
                disabled={!query.trim() || isProcessing}
                className={cn(
                    "w-8 h-8 rounded flex items-center justify-center transition-colors",
                    "bg-primary text-white hover:bg-primary/90",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
            >
                {isProcessing ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <Send size={16} />
                )}
            </button>
        </form>
    );
}