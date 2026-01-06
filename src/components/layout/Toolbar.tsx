import { useAppStore } from "../../stores/appStore";
import { cn } from "../../utils";
import { BarChart3, FolderOpen, HelpCircle, PanelLeft, PanelLeftClose, Save, Table } from "lucide-react";

interface ToolbarButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
}

function ToolbarButton({ icon, label, onClick, active, disabled }: ToolbarButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors",
                "hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed",
                active && "bg-primary/10 text-primary"
            )}
            title={label}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}

function ToolbarDivider() {
    return <div className="w-px h-6 bg-border mx-1" />;
}

export function Toolbar() {
    const {
        activeView, setActiveView, sidebarCollapsed, toggleSidebar
    } = useAppStore();

    const handleOpenFile = () => {
        console.log("Open file");
    };

    const handleSave = () => {
        console.log("Save project");
    };

    return (
        <header className="h-12 bg-canvas border-b border-border flex items-center px-2 gap-1 shrink-0">
            <div className="flex items-center gap-2 mr-4">
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">I</span>
                </div>
                <span className="font-semibold text-text-primary hidden md:block">
                    Insyte
                </span>
            </div>

            <ToolbarButton
                icon={sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
                label={sidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
                onClick={toggleSidebar}
            />

            <ToolbarDivider />

            <ToolbarButton
                icon={<FolderOpen size={18} />}
                label="Open"
                onClick={handleOpenFile}
            />

            <ToolbarButton
                icon={<Save size={18} />}
                label="Save"
                onClick={handleSave}
            />

            <ToolbarDivider />

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

            <div className="flex-1" />

            <ToolbarButton icon={<HelpCircle size={18} />} label="Help" onClick={() => console.log("Help")} />
        </header>
    )
}