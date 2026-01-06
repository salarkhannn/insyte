import { Hash, Type, Calendar, ToggleLeft } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import type { Column } from "../../types";

const typeIcons: Record<Column["dtype"], React.ReactNode> = {
    integer: <Hash size={12} className="text-chart-1" />,
    float: <Hash size={12} className="text-chart-1" />,
    string: <Type size={12} className="text-chart-5" />,
    date: <Calendar size={12} className="text-chart-6" />,
    boolean: <ToggleLeft size={12} className="text-chart-3" />,
};

function FieldItem({ column }: { column: Column }) {
    return (
        <div className="flex items-center gap-2 px-3 py-1 text-text-secondary hover:bg-neutral-200 hover:text-text cursor-default">
            {typeIcons[column.dtype]}
            <span className="truncate text-xs">{column.name}</span>
        </div>
    );
}

export function FieldsPanel() {
    const { columns, dataLoaded } = useAppStore();

    return (
        <section className="border-b border-border">
            <header className="px-3 py-2 text-[11px] font-medium text-text-muted uppercase tracking-wide">
                Fields
            </header>
            {dataLoaded ? (
                <div className="pb-2">
                    {columns?.map((col) => (
                        <FieldItem key={col.name} column={col} />
                    ))}
                </div>
            ) : (
                <p className="px-3 pb-3 text-xs text-text-disabled">No data loaded</p>
            )}
        </section>
    );
}