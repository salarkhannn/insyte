import { PanelLeft, PanelLeftClose, Settings } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { cn } from "../../utils";

interface ActivityButtonProps {
    icon: React.ReactNode;
    onClick: () => void;
    active?: boolean;
    title: string;
}

function ActivityButton({ icon, onClick, active, title }: ActivityButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full h-10 flex items-center justify-center text-neutral-500 transition-colors",
                "hover:bg-neutral-200 hover:text-neutral-700",
                active && "text-neutral-900 bg-neutral-200"
            )}
            title={title}
            aria-label={title}
        >
            {icon}
        </button>
    );
}

export function ActivityBar() {
    const { sidebarCollapsed, toggleSidebar, setSettingsOpen } = useAppStore();

    return (
        <nav className="w-11 bg-neutral-100 border-r border-neutral-300 flex flex-col shrink-0">
            <ActivityButton
                icon={sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
                onClick={toggleSidebar}
                title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            />
            <div className="flex-1" />
            <div className="h-px bg-neutral-300 mx-2" />
            <ActivityButton
                icon={<Settings size={18} />}
                onClick={() => setSettingsOpen(true)}
                title="Settings"
            />
        </nav>
    );
}
