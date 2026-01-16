import { TitleBar } from "./TitleBar";
import { ActivityBar } from "./ActivityBar";
import { Sidebar } from "./Sidebar";
import { Canvas } from "./Canvas";
import { StatusBar } from "./StatusBar";
import { AIChatSidebar } from "../ai";
import { useMenuEvents } from "../../hooks";
import { WorksheetBar } from "../worksheets/WorksheetBar";
import { ErrorBoundary } from "../common";

export function AppShell() {
    useMenuEvents();

    return (
        <ErrorBoundary>
            <div className="h-screen flex flex-col bg-canvas">
                <TitleBar />
                <div className="flex flex-1 min-h-0">
                    <ActivityBar />
                    <Sidebar />
                    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                        <Canvas />
                        <WorksheetBar />
                    </div>
                    <AIChatSidebar />
                </div>
                <StatusBar />
            </div>
        </ErrorBoundary>
    );
}