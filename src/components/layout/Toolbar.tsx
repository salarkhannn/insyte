import {
    FolderOpen,
    Save,
    Table,
    BarChart3,
    PanelLeftClose,
    PanelLeft,
} from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { cn } from "../../utils";

interface ToolbarButtonProps {
    icon: React.ReactNode;
    label?: string;
    onClick?: () => void;
    active?: boolean;
    disabled?: boolean;
}

function ToolbarButton({
    icon,
    label,
    onClick,
    active,
    disabled,
}: ToolbarButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "h-7 px-2 flex items-center gap-1.5 text-text-secondary rounded-sm transition-colors",
                "hover:bg-neutral-200 hover:text-text",
                "disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-secondary",
                active && "bg-primary-muted text-primary"
            )}
            title={label}
        >
            {icon}
            {label && <span>{label}</span>}
        </button>
    );
}

function Divider() {
    return <div className="w-px h-5 bg-border mx-1" />;
}

export function Toolbar() {
    const { activeView, setActiveView, sidebarCollapsed, toggleSidebar, dataLoaded } =
        useAppStore();

    return (
        <header className="h-10 bg-surface border-b border-border flex items-center px-2 gap-0.5 shrink-0">
            <div className="flex items-center gap-1.5 mr-3 pr-3 border-r border-border">
                <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">I</span>
                </div>
                <span className="font-medium text-text">Insyte</span>
            </div>

            <ToolbarButton
                icon={sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
                onClick={toggleSidebar}
            />

            <Divider />

            <ToolbarButton icon={<FolderOpen size={16} />} label="Open" />
            <ToolbarButton icon={<Save size={16} />} label="Save" disabled={!dataLoaded} />

            <Divider />

            <ToolbarButton
                icon={<Table size={16} />}
                label="Table"
                onClick={() => setActiveView("table")}
                active={activeView === "table"}
            />
            <ToolbarButton
                icon={<BarChart3 size={16} />}
                label="Chart"
                onClick={() => setActiveView("chart")}
                active={activeView === "chart"}
            />
        </header>
    );
}