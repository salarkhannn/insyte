import { Toolbar } from "./Toolbar";
import { Sidebar } from "./Sidebar";
import { Canvas } from "./Canvas";
import { StatusBar } from "./StatusBar";
import { AIChatSidebar } from "../ai";

export function AppShell() {
    return (
        <div className="h-screen flex flex-col bg-canvas">
            <Toolbar />
            <div className="flex flex-1 min-h-0">
                <Sidebar />
                <Canvas />
                <AIChatSidebar />
            </div>
            <StatusBar />
        </div>
    );
}