import { TitleBar } from "./TitleBar";
import { Toolbar } from "./Toolbar";
import { Sidebar } from "./Sidebar";
import { Canvas } from "./Canvas";
import { StatusBar } from "./StatusBar";
import { AIChatSidebar } from "../ai";
import { useMenuEvents } from "../../hooks";

export function AppShell() {
    useMenuEvents();

    return (
        <div className="h-screen flex flex-col bg-canvas">
            <TitleBar />
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