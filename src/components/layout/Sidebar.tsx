import { useAppStore } from "../../stores/appStore";
import { cn } from "../../utils";
import { FieldsPanel } from "../data/FieldsPanel";
import { ConfigPanel } from "../data/ConfigPanel";

export function Sidebar() {
    const { sidebarCollapsed } = useAppStore();

    return (
        <div className={cn(
            "flex shrink-0 transition-all duration-100",
            sidebarCollapsed ? "w-0 overflow-hidden" : "w-auto"
        )}>
            <aside
                className="w-64 bg-neutral-50 border-r border-neutral-200 flex flex-col overflow-hidden"
            >
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    <FieldsPanel />
                </div>
            </aside>

            <aside
                className="w-80 bg-white border-r border-neutral-200 flex flex-col overflow-hidden"
            >
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    <ConfigPanel />
                </div>
            </aside>
        </div>
    );
}