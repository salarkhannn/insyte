import { Calendar, Hash, ToggleLeft, Type } from "lucide-react";
import { Column } from "../../types";
import { cn } from "../../utils";
import { useAppStore } from "../../stores/appStore";

function getTypeIcon(dtype: Column["dtype"]) {
    switch (dtype) {
        case "integer":
        case "float":
            return <Hash size={14} className="text-blue-600" />;
        case "string":
            return <Type size={14} className="text-amber-600" />;
        case "date":
            return <Calendar size={14} className="text-green-600" />;
        case "boolean":
            return <ToggleLeft size={14} className="text-purple-600" />;
        default:
            return <Type size={14} className="text-secondary" />;
    }
}

interface FieldItemProps {
    column: Column;
    selected: boolean;
    onClick: () => void;
}

function FieldItem({ column, selected, onClick }: FieldItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors",
                "hover:bg-black/5",
                selected && "bg-primary/10"
            )}
        >
            {getTypeIcon(column.dtype)}
            <span className="truncate">{column.name}</span>
        </button>
    );
}

export function FieldsPanel() {
    const { columns, dataLoaded } = useAppStore();

    return (
        <div className="p-3">
            <h3 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
                Fields
            </h3>
            {dataLoaded ? (
                <div className="space-y-0.5">
                    {columns?.map((col) => (
                        <FieldItem key={col.name} column={col} onClick={() => console.log(col)} selected={false} />
                    ))}
                </div>
            ) : (
                <p className="text-sm text-text-disabled">No data loaded</p>
            )}
        </div>
    )
}