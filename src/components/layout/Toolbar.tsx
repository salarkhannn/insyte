import {
    FolderOpen,
    Save,
    Table,
    BarChart3,
    PanelLeftClose,
    PanelLeft,
    X,
} from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useDataset } from "../../hooks/useDataset";
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
                "h-8 px-3 flex items-center gap-2 text-text-secondary transition-colors",
                "hover:bg-neutral-200 hover:text-text",
                "disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-secondary",
                active && "bg-primary-muted text-primary"
            )}
            title={label}
        >
            {icon}
            {label && <span className="text-xs">{label}</span>}
        </button>
    );
}

function Divider() {
    return <div className="w-px h-6 bg-border mx-2" />;
}

export function Toolbar() {
    const { activeView, setActiveView, sidebarCollapsed, toggleSidebar, dataLoaded } =
        useAppStore();
    const { openFile, closeFile, isLoading } = useDataset();

    return (
        <header className="h-10 bg-surface border-b border-border flex items-center px-4 gap-2 shrink-0">
            <div className="flex items-center gap-3 mr-4 pr-4 border-r border-border">
                <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
                    <span className="text-white text-[10px] font-semibold">I</span>
                </div>
                <span className="text-sm font-medium text-text">Insyte</span>
            </div>

            <ToolbarButton
                icon={sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
                onClick={toggleSidebar}
            />

            <Divider />

            <ToolbarButton
                icon={<FolderOpen size={18} />}
                label="Open"
                onClick={openFile}
                disabled={isLoading}
            />
            <ToolbarButton
                icon={<X size={18} />}
                label="Close"
                onClick={closeFile}
                disabled={!dataLoaded || isLoading}
            />
            <ToolbarButton
                icon={<Save size={18} />}
                label="Save"
                disabled={!dataLoaded}
            />

            <Divider />

            <ToolbarButton
                icon={<Table size={18} />}
                label="Table"
                onClick={() => setActiveView("table")}
                active={activeView === "table"}
            />
            <ToolbarButton
                icon={<BarChart3 size={18} />}
                label="Chart"
                onClick={() => setActiveView("chart")}
                active={activeView === "chart"}
            />
        </header>
    );
}