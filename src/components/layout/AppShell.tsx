import { TitleBar } from "./TitleBar";
import { ActivityBar } from "./ActivityBar";
import { Sidebar } from "./Sidebar";
import { Canvas } from "./Canvas";
import { StatusBar } from "./StatusBar";
import { ResizablePanel } from "./ResizablePanel";
import { AIChatSidebar } from "../ai";
import { useMenuEvents } from "../../hooks";
import { WorksheetBar } from "../worksheets/WorksheetBar";
import { ErrorBoundary } from "../common";
import { useAppStore } from "../../stores/appStore";
import { ChevronLeft, MessageSquare } from "lucide-react";

function CollapsedAIPanel() {
    const { setAiPanelCollapsed } = useAppStore();

    return (
        <div className="w-10 bg-neutral-50 border-l border-neutral-200 flex flex-col items-center py-3 shrink-0">
            <button
                onClick={() => setAiPanelCollapsed(false)}
                className="p-1.5 rounded hover:bg-neutral-100 text-neutral-500"
                title="Open Data Assistant (Ctrl+/)"
                aria-label="Open Data Assistant panel"
            >
                <ChevronLeft size={16} />
            </button>
            <div className="mt-3 p-1.5 rounded bg-neutral-700 text-white">
                <MessageSquare size={14} />
            </div>
        </div>
    );
}

export function AppShell() {
    useMenuEvents();
    const { sidebarCollapsed, aiPanelCollapsed } = useAppStore();

    return (
        <ErrorBoundary>
            <div className="h-screen flex flex-col bg-canvas">
                <TitleBar />
                <div className="flex flex-1 min-h-0">
                    <ActivityBar />
                    <ResizablePanel
                        side="left"
                        defaultWidth={288}
                        minWidth={200}
                        maxWidth={480}
                        collapsed={sidebarCollapsed}
                    >
                        <Sidebar />
                    </ResizablePanel>
                    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                        <Canvas />
                        <WorksheetBar />
                    </div>
                    {aiPanelCollapsed ? (
                        <CollapsedAIPanel />
                    ) : (
                        <ResizablePanel
                            side="right"
                            defaultWidth={320}
                            minWidth={240}
                            maxWidth={500}
                        >
                            <AIChatSidebar />
                        </ResizablePanel>
                    )}
                </div>
                <StatusBar />
            </div>
        </ErrorBoundary>
    );
}