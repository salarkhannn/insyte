import { Toolbar } from "./Toolbar";
import { Sidebar } from "./Sidebar";
import { Canvas } from "./Canvas";
import { StatusBar } from "./StatusBar";

export function AppShell() {
    return (
        <div className="h-screen flex flex-col">
            <Toolbar />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <Canvas />
            </div>
            <StatusBar />
        </div>
    );
}