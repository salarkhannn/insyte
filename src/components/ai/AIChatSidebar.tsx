import { useState, useRef, useEffect } from "react";
import { Send, Loader2, User, Bot, ChevronRight, ChevronLeft, Trash2, BarChart3, MessageSquare } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useQueryStore } from "../../stores/queryStore";
import { useVizBuilderStore } from "../../stores/vizBuilderStore";
import { processAiChat } from "../../services/aiService";
import { cn } from "../../utils";
import type { VisualizationSpec, DataInsight } from "../../types";

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    visualization?: VisualizationSpec;
    insights?: DataInsight[];
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
            const response = await processAiChat(userMessage.content);

            if (response.type === "visualization") {
                const assistantMessage: ChatMessage = {
                    id: generateId(),
                    role: "assistant",
                    content: response.explanation,
                    timestamp: new Date(),
                    visualization: response.spec,
                };

                setMessages((prev) => [...prev, assistantMessage]);
                setVisualization(response.spec);
                loadFromSpec(response.spec);
                setActiveView("chart");

                addToHistory({
                    query: userMessage.content,
                    visualization: response.spec,
                    success: true,
                });
            } else if (response.type === "answer") {
                const assistantMessage: ChatMessage = {
                    id: generateId(),
                    role: "assistant",
                    content: response.content,
                    timestamp: new Date(),
                    insights: response.insights,
                };

                setMessages((prev) => [...prev, assistantMessage]);

                addToHistory({
                    query: userMessage.content,
                    visualization: null,
                    success: true,
                });
            } else {
                const assistantMessage: ChatMessage = {
                    id: generateId(),
                    role: "assistant",
                    content: response.message,
                    timestamp: new Date(),
                    error: true,
                };

                setMessages((prev) => [...prev, assistantMessage]);

                addToHistory({
                    query: userMessage.content,
                    visualization: null,
                    success: false,
                    error: response.message,
                });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            
            const assistantMessage: ChatMessage = {
                id: generateId(),
                role: "assistant",
                content: `Unable to process request. ${errorMessage}`,
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
            <div className="w-12 bg-neutral-50 border-l border-neutral-200 flex flex-col items-center py-4">
                <button
                    onClick={() => setAiPanelCollapsed(false)}
                    className="p-2 rounded hover:bg-neutral-100 text-neutral-500"
                    title="Open AI Chat (Ctrl+/)"
                    aria-label="Open AI Chat panel"
                >
                    <ChevronLeft size={18} />
                </button>
                <div className="mt-4 p-2 rounded bg-neutral-700 text-white">
                    <MessageSquare size={16} />
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 bg-white border-l border-neutral-200 flex flex-col">
            <header className="h-12 px-3 flex items-center justify-between border-b border-neutral-200 bg-neutral-50 shrink-0">
                <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-neutral-600" />
                    <span className="text-sm font-medium text-neutral-700">Data Assistant</span>
                </div>
                <div className="flex items-center gap-1">
                    {messages.length > 0 && (
                        <button
                            onClick={clearChat}
                            className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400"
                            title="Clear chat"
                            aria-label="Clear chat history"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                    <button
                        onClick={() => setAiPanelCollapsed(true)}
                        className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400"
                        title="Collapse"
                        aria-label="Collapse AI Chat panel"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <div className="w-10 h-10 rounded bg-neutral-100 flex items-center justify-center mb-3">
                            <MessageSquare size={20} className="text-neutral-500" />
                        </div>
                        <p className="text-sm font-medium text-neutral-700 mb-1">
                            Ask about your data
                        </p>
                        <p className="text-xs text-neutral-500 mb-4">
                            Get answers or create visualizations
                        </p>
                        {dataLoaded && (
                            <div className="space-y-2 w-full">
                                <p className="text-xs text-neutral-400 font-medium">
                                    Examples
                                </p>
                                {[
                                    "What is the total revenue?",
                                    "Show sales by region",
                                    "How many records are there?",
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setInput(suggestion)}
                                        className="w-full px-3 py-2 text-xs text-left text-neutral-600 bg-neutral-50 rounded border border-neutral-200 hover:bg-neutral-100"
                                    >
                                        {suggestion}
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
                                    "w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5",
                                    message.role === "user"
                                        ? "bg-neutral-200 text-neutral-600"
                                        : "bg-neutral-700 text-white"
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
                                        "text-sm leading-relaxed",
                                        message.error ? "text-red-600" : "text-neutral-700"
                                    )}
                                >
                                    {message.content}
                                </p>
                                {message.insights && message.insights.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        {message.insights.map((insight, idx) => (
                                            <div
                                                key={idx}
                                                className="flex justify-between text-xs bg-neutral-50 px-2 py-1.5 rounded border border-neutral-100"
                                            >
                                                <span className="text-neutral-500">{insight.label}</span>
                                                <span className="font-medium text-neutral-700">{insight.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {message.visualization && (
                                    <button
                                        onClick={() => applyVisualization(message.visualization!)}
                                        className="mt-2 px-2.5 py-1.5 text-xs font-medium bg-neutral-100 text-neutral-700 rounded border border-neutral-200 hover:bg-neutral-200 flex items-center gap-1.5"
                                    >
                                        <BarChart3 size={12} />
                                        View chart
                                    </button>
                                )}
                                <p className="text-xs text-neutral-400 mt-1">
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
                    <div className="flex gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 bg-neutral-700 text-white">
                            <Loader2 size={12} className="animate-spin" />
                        </div>
                        <div className="flex-1 pt-1">
                            <p className="text-sm text-neutral-500">Analyzing...</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-200 shrink-0">
                <div
                    className={cn(
                        "flex items-end gap-2 bg-neutral-50 rounded border p-2",
                        !dataLoaded ? "border-neutral-100 opacity-50" : "border-neutral-200"
                    )}
                >
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={dataLoaded ? "Ask about your data..." : "Load data first"}
                        disabled={!dataLoaded || isLoading}
                        rows={1}
                        data-ai-input="true"
                        aria-label="AI query input"
                        className={cn(
                            "flex-1 bg-transparent outline-none text-sm text-neutral-700 resize-none",
                            "placeholder:text-neutral-400 disabled:cursor-not-allowed",
                            "min-h-[22px] max-h-[100px]"
                        )}
                        style={{ height: "auto" }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = "auto";
                            target.style.height = `${Math.min(target.scrollHeight, 100)}px`;
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading || !dataLoaded}
                        aria-label="Send message"
                        className={cn(
                            "w-7 h-7 rounded flex items-center justify-center shrink-0",
                            input.trim() && dataLoaded && !isLoading
                                ? "bg-neutral-700 text-white hover:bg-neutral-800"
                                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Send size={14} />
                        )}
                    </button>
                </div>
                <p className="text-xs text-neutral-400 mt-1.5 text-center">
                    Enter to send · Ctrl+/ to focus
                </p>
            </form>
        </div>
    );
}
