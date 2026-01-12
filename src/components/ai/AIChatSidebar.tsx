import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, User, Bot, ChevronRight, ChevronLeft, Trash2 } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useQueryStore } from "../../stores/queryStore";
import { useVizBuilderStore } from "../../stores/vizBuilderStore";
import { processAiQuery } from "../../services/aiService";
import { cn } from "../../utils";
import type { VisualizationSpec } from "../../types";

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    visualization?: VisualizationSpec;
    error?: boolean;
}

export function AIChatSidebar() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isCollapsed, setIsCollapsed] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const { isProcessing, setProcessing, setVisualization, setActiveView, dataLoaded } = useAppStore();
    const { addToHistory } = useQueryStore();
    const { loadFromSpec } = useVizBuilderStore();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if ((event.ctrlKey || event.metaKey) && event.key === "/") {
                event.preventDefault();
                if (isCollapsed) {
                    setIsCollapsed(false);
                }
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isCollapsed]);

    const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing || !dataLoaded) return;

        const userMessage: ChatMessage = {
            id: generateId(),
            role: "user",
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setProcessing(true, "Analyzing your request...");

        try {
            const spec = await processAiQuery(userMessage.content);
            
            const assistantMessage: ChatMessage = {
                id: generateId(),
                role: "assistant",
                content: `I've created a ${spec.chartType} chart showing ${spec.aggregation} of ${spec.yField} by ${spec.xField}.`,
                timestamp: new Date(),
                visualization: spec,
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setVisualization(spec);
            loadFromSpec(spec);
            setActiveView("chart");

            addToHistory({
                query: userMessage.content,
                visualization: spec,
                success: true,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            
            const assistantMessage: ChatMessage = {
                id: generateId(),
                role: "assistant",
                content: `Sorry, I couldn't process that request. ${errorMessage}`,
                timestamp: new Date(),
                error: true,
            };

            setMessages((prev) => [...prev, assistantMessage]);

            addToHistory({
                query: userMessage.content,
                visualization: null,
                success: false,
                error: errorMessage,
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const applyVisualization = (spec: VisualizationSpec) => {
        setVisualization(spec);
        loadFromSpec(spec);
        setActiveView("chart");
    };

    const clearChat = () => {
        setMessages([]);
    };

    if (isCollapsed) {
        return (
            <div className="w-10 bg-neutral-50 border-l border-neutral-300 flex flex-col items-center py-3">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="p-2 rounded hover:bg-neutral-200 text-neutral-600 transition-colors"
                    title="Open AI Chat (Ctrl+/)"
                >
                    <ChevronLeft size={16} />
                </button>
                <div className="mt-3 p-2 rounded bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                    <Sparkles size={16} />
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 bg-white border-l border-neutral-300 flex flex-col">
            <header className="h-11 px-3 flex items-center justify-between border-b border-neutral-200 bg-gradient-to-r from-violet-50 to-indigo-50 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                        <Sparkles size={12} />
                    </div>
                    <span className="text-xs font-semibold text-neutral-700">AI Assistant</span>
                </div>
                <div className="flex items-center gap-1">
                    {messages.length > 0 && (
                        <button
                            onClick={clearChat}
                            className="p-1.5 rounded hover:bg-neutral-200/50 text-neutral-500 transition-colors"
                            title="Clear chat"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="p-1.5 rounded hover:bg-neutral-200/50 text-neutral-500 transition-colors"
                        title="Collapse"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <div className="p-3 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 mb-3">
                            <Sparkles size={24} className="text-violet-600" />
                        </div>
                        <p className="text-sm font-medium text-neutral-700 mb-1">
                            Ask me anything about your data
                        </p>
                        <p className="text-xs text-neutral-500 mb-4">
                            I can create visualizations based on your questions
                        </p>
                        {dataLoaded && (
                            <div className="space-y-2 w-full">
                                <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                                    Try asking
                                </p>
                                {[
                                    "Show revenue by month",
                                    "Compare sales across regions",
                                    "Top 10 products by quantity",
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setInput(suggestion)}
                                        className="w-full px-3 py-2 text-xs text-left text-neutral-600 bg-neutral-50 rounded border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300 transition-colors"
                                    >
                                        "{suggestion}"
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    messages.map((message) => (
                        <div key={message.id} className="flex gap-2">
                            <div
                                className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                                    message.role === "user"
                                        ? "bg-neutral-200 text-neutral-600"
                                        : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white"
                                )}
                            >
                                {message.role === "user" ? (
                                    <User size={12} />
                                ) : (
                                    <Bot size={12} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p
                                    className={cn(
                                        "text-xs leading-relaxed",
                                        message.error ? "text-red-600" : "text-neutral-700"
                                    )}
                                >
                                    {message.content}
                                </p>
                                {message.visualization && (
                                    <button
                                        onClick={() => applyVisualization(message.visualization!)}
                                        className="mt-2 px-2.5 py-1.5 text-[10px] font-medium bg-violet-50 text-violet-700 rounded border border-violet-200 hover:bg-violet-100 transition-colors flex items-center gap-1"
                                    >
                                        <Sparkles size={10} />
                                        Apply this chart
                                    </button>
                                )}
                                <p className="text-[10px] text-neutral-400 mt-1">
                                    {message.timestamp.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                {isProcessing && (
                    <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                            <Loader2 size={12} className="animate-spin" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-neutral-500">Thinking...</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-200 shrink-0">
                <div
                    className={cn(
                        "flex items-end gap-2 bg-neutral-50 rounded-lg border p-2",
                        !dataLoaded ? "border-neutral-200 opacity-60" : "border-neutral-300"
                    )}
                >
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={dataLoaded ? "Ask about your data..." : "Load data first..."}
                        disabled={!dataLoaded || isProcessing}
                        rows={1}
                        className={cn(
                            "flex-1 bg-transparent outline-none text-xs text-neutral-700 resize-none",
                            "placeholder:text-neutral-400 disabled:cursor-not-allowed",
                            "min-h-[20px] max-h-[80px]"
                        )}
                        style={{ height: "auto" }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = "auto";
                            target.style.height = `${Math.min(target.scrollHeight, 80)}px`;
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isProcessing || !dataLoaded}
                        className={cn(
                            "w-7 h-7 rounded-md flex items-center justify-center transition-all shrink-0",
                            input.trim() && dataLoaded && !isProcessing
                                ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700 shadow-sm"
                                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                        )}
                    >
                        {isProcessing ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Send size={14} />
                        )}
                    </button>
                </div>
                <p className="text-[10px] text-neutral-400 mt-1.5 text-center">
                    Press Enter to send • Ctrl+/ to focus
                </p>
            </form>
        </div>
    );
}
