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
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const { 
        setVisualization, 
        setActiveView, 
        dataLoaded,
        aiPanelCollapsed,
        setAiPanelCollapsed,
    } = useAppStore();
    const { addToHistory } = useQueryStore();
    const { loadFromSpec } = useVizBuilderStore();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if ((event.ctrlKey || event.metaKey) && event.key === "/") {
                event.preventDefault();
                if (aiPanelCollapsed) {
                    setAiPanelCollapsed(false);
                }
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [aiPanelCollapsed, setAiPanelCollapsed]);

    const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !dataLoaded) return;

        const userMessage: ChatMessage = {
            id: generateId(),
            role: "user",
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

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
            setIsLoading(false);
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

    if (aiPanelCollapsed) {
        return (
            <div className="w-12 bg-neutral-50 border-l border-neutral-300 flex flex-col items-center py-4">
                <button
                    onClick={() => setAiPanelCollapsed(false)}
                    className="p-2.5 rounded hover:bg-neutral-200 text-neutral-600 transition-colors"
                    title="Open AI Chat (Ctrl+/)"
                    aria-label="Open AI Chat panel"
                >
                    <ChevronLeft size={18} />
                </button>
                <div className="mt-4 p-2.5 rounded bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                    <Sparkles size={18} />
                </div>
            </div>
        );
    }

    return (
        <div className="w-96 bg-white border-l border-neutral-300 flex flex-col">
            <header className="h-14 px-4 flex items-center justify-between border-b border-neutral-200 bg-gradient-to-r from-violet-50 to-indigo-50 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                        <Sparkles size={14} />
                    </div>
                    <span className="text-sm font-semibold text-neutral-700">AI Assistant</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {messages.length > 0 && (
                        <button
                            onClick={clearChat}
                            className="p-2 rounded hover:bg-neutral-200/50 text-neutral-500 transition-colors"
                            title="Clear chat"
                            aria-label="Clear chat history"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                    <button
                        onClick={() => setAiPanelCollapsed(true)}
                        className="p-2 rounded hover:bg-neutral-200/50 text-neutral-500 transition-colors"
                        title="Collapse"
                        aria-label="Collapse AI Chat panel"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-6">
                        <div className="p-4 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 mb-4">
                            <Sparkles size={28} className="text-violet-600" />
                        </div>
                        <p className="text-base font-medium text-neutral-700 mb-2">
                            Ask me anything about your data
                        </p>
                        <p className="text-sm text-neutral-500 mb-6">
                            I can create visualizations based on your questions
                        </p>
                        {dataLoaded && (
                            <div className="space-y-3 w-full">
                                <p className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
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
                                        className="w-full px-4 py-3 text-sm text-left text-neutral-600 bg-neutral-50 rounded border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300 transition-colors"
                                    >
                                        "{suggestion}"
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    messages.map((message) => (
                        <div key={message.id} className="flex gap-3">
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    message.role === "user"
                                        ? "bg-neutral-200 text-neutral-600"
                                        : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white"
                                )}
                            >
                                {message.role === "user" ? (
                                    <User size={14} />
                                ) : (
                                    <Bot size={14} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                                <p
                                    className={cn(
                                        "text-sm leading-relaxed",
                                        message.error ? "text-red-600" : "text-neutral-700"
                                    )}
                                >
                                    {message.content}
                                </p>
                                {message.visualization && (
                                    <button
                                        onClick={() => applyVisualization(message.visualization!)}
                                        className="mt-3 px-3 py-2 text-xs font-medium bg-violet-50 text-violet-700 rounded border border-violet-200 hover:bg-violet-100 transition-colors flex items-center gap-1.5"
                                    >
                                        <Sparkles size={12} />
                                        Apply this chart
                                    </button>
                                )}
                                <p className="text-xs text-neutral-400 mt-1.5">
                                    {message.timestamp.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                            <Loader2 size={14} className="animate-spin" />
                        </div>
                        <div className="flex-1 pt-1.5">
                            <p className="text-sm text-neutral-500">Thinking...</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-200 shrink-0">
                <div
                    className={cn(
                        "flex items-end gap-2 bg-neutral-50 rounded-lg border p-3",
                        !dataLoaded ? "border-neutral-200 opacity-60" : "border-neutral-300"
                    )}
                >
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={dataLoaded ? "Ask about your data..." : "Load data first..."}
                        disabled={!dataLoaded || isLoading}
                        rows={1}
                        data-ai-input="true"
                        aria-label="AI query input"
                        className={cn(
                            "flex-1 bg-transparent outline-none text-sm text-neutral-700 resize-none",
                            "placeholder:text-neutral-400 disabled:cursor-not-allowed",
                            "min-h-[24px] max-h-[120px]"
                        )}
                        style={{ height: "auto" }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = "auto";
                            target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading || !dataLoaded}
                        aria-label="Send message"
                        className={cn(
                            "w-8 h-8 rounded-md flex items-center justify-center transition-all shrink-0",
                            input.trim() && dataLoaded && !isLoading
                                ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700 shadow-sm"
                                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Send size={16} />
                        )}
                    </button>
                </div>
                <p className="text-xs text-neutral-400 mt-2 text-center">
                    Press Enter to send • Ctrl+/ to focus
                </p>
            </form>
        </div>
    );
}
