import { useEffect, useCallback } from "react";
import {
    Table,
    BarChart3,
    PanelLeftClose,
    PanelLeft,
    Undo2,
    Redo2,
} from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { cn } from "../../utils";

interface ToolbarButtonProps {
    icon: React.ReactNode;
    onClick?: () => void;
    active?: boolean;
    disabled?: boolean;
    title?: string;
}

function ToolbarButton({
    icon,
    onClick,
    active,
    disabled,
    title,
}: ToolbarButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "w-8 h-8 flex items-center justify-center text-neutral-600 transition-colors rounded",
                "hover:bg-neutral-200 hover:text-neutral-900",
                "disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-neutral-600",
                active && "bg-blue-100 text-blue-600 hover:bg-blue-100"
            )}
            title={title}
        >
            {icon}
        </button>
    );
}

function Divider() {
    return <div className="w-px h-5 bg-neutral-300 mx-1" />;
}

export function Toolbar() {
    const {
        activeView,
        setActiveView,
        sidebarCollapsed,
        toggleSidebar,
    } = useAppStore();

    const handleUndo = useCallback(() => {
        // Undo functionality placeholder
    }, []);

    const handleRedo = useCallback(() => {
        // Redo functionality placeholder
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "z") {
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleUndo, handleRedo]);

    return (
        <header className="h-8 bg-neutral-100 border-b border-neutral-300 flex items-center px-2 gap-1 shrink-0">
            {/* Left: Sidebar toggle */}
            <ToolbarButton
                icon={sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
                onClick={toggleSidebar}
                title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            />

            <Divider />

            {/* Center: View toggles */}
            <div className="flex items-center gap-0.5">
                <ToolbarButton
                    icon={<Table size={16} />}
                    onClick={() => setActiveView("table")}
                    active={activeView === "table"}
                    title="Table view"
                />
                <ToolbarButton
                    icon={<BarChart3 size={16} />}
                    onClick={() => setActiveView("chart")}
                    active={activeView === "chart"}
                    title="Chart view"
                />
            </div>

            <Divider />

            {/* Center-Right: Undo/Redo */}
            <div className="flex items-center gap-0.5">
                <ToolbarButton
                    icon={<Undo2 size={16} />}
                    onClick={handleUndo}
                    disabled={true}
                    title="Undo (Ctrl+Z)"
                />
                <ToolbarButton
                    icon={<Redo2 size={16} />}
                    onClick={handleRedo}
                    disabled={true}
                    title="Redo (Ctrl+Shift+Z)"
                />
            </div>

            {/* Spacer */}
            <div className="flex-1" />
        </header>
    );
}