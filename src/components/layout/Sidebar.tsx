import { useAppStore } from "../../stores/appStore";
import { cn } from "../../utils";
import { FieldsPanel } from "../data/FieldsPanel";

export function Sidebar() {
    const { sidebarCollapsed } = useAppStore();

    return (
        <aside
            className={cn(
                "bg-sidebar border-r border-border flex flex-col shrink-0 transition-all duration-200 overflow-hidden",
                sidebarCollapsed ? "w-0" : "w-60"
            )}
        >
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                <FieldsPanel />
            </div>
        </aside>
    )
}