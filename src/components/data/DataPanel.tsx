import { Hash, Type, Calendar, ToggleLeft, FileSpreadsheet } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import type { Column } from "../../types";

const typeIcons: Record<Column["dtype"], { icon: React.ReactNode; label: string }> = {
    integer: { icon: <Hash size={11} className="text-blue-600" />, label: "Numeric" },
    float: { icon: <Hash size={11} className="text-blue-600" />, label: "Numeric" },
    string: { icon: <Type size={11} className="text-amber-600" />, label: "Text" },
    date: { icon: <Calendar size={11} className="text-purple-600" />, label: "Date" },
    boolean: { icon: <ToggleLeft size={11} className="text-green-600" />, label: "Boolean" },
};

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 10) / 10} ${sizes[i]}`;
}

function formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num);
}

function FieldItem({ column }: { column: Column }) {
    const { icon } = typeIcons[column.dtype];
    return (
        <div className="flex items-center gap-2 py-1 text-neutral-700 hover:bg-neutral-50 px-1 rounded cursor-default">
            <span className="shrink-0">{icon}</span>
            <span className="truncate text-xs">{column.name}</span>
        </div>
    );
}

function groupFieldsByType(columns: Column[]) {
    const groups: Record<string, Column[]> = {
        numeric: [],
        text: [],
        date: [],
        boolean: [],
    };

    for (const col of columns) {
        if (col.dtype === "integer" || col.dtype === "float") {
            groups.numeric.push(col);
        } else if (col.dtype === "string") {
            groups.text.push(col);
        } else if (col.dtype === "date") {
            groups.date.push(col);
        } else if (col.dtype === "boolean") {
            groups.boolean.push(col);
        }
    }

    return groups;
}

export function DataPanel() {
    const { fileName, rowCount, fileSize, columns, dataLoaded } = useAppStore();

    if (!dataLoaded) {
        return (
            <div className="text-xs text-neutral-500 text-center py-4">
                <FileSpreadsheet size={20} className="mx-auto mb-2 text-neutral-400" />
                <p>No data loaded</p>
                <p className="text-neutral-400 mt-1">Import a file to begin</p>
            </div>
        );
    }

    const groups = groupFieldsByType(columns);

    return (
        <div className="space-y-3">
            {/* Dataset summary */}
            <div className="flex items-start gap-2.5">
                <FileSpreadsheet size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                    <div className="font-medium text-xs text-neutral-900 truncate" title={fileName ?? ""}>
                        {fileName}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                        {formatNumber(rowCount)} rows • {formatBytes(fileSize)}
                    </div>
                </div>
            </div>

            {/* Grouped fields */}
            <div className="space-y-2 pt-2 border-t border-neutral-100">
                {groups.numeric.length > 0 && (
                    <div>
                        <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium mb-1 flex items-center gap-1.5">
                            <Hash size={10} />
                            Numeric ({groups.numeric.length})
                        </div>
                        <div className="space-y-0.5">
                            {groups.numeric.map((col) => (
                                <FieldItem key={col.name} column={col} />
                            ))}
                        </div>
                    </div>
                )}

                {groups.text.length > 0 && (
                    <div>
                        <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium mb-1 flex items-center gap-1.5">
                            <Type size={10} />
                            Text ({groups.text.length})
                        </div>
                        <div className="space-y-0.5">
                            {groups.text.map((col) => (
                                <FieldItem key={col.name} column={col} />
                            ))}
                        </div>
                    </div>
                )}

                {groups.date.length > 0 && (
                    <div>
                        <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium mb-1 flex items-center gap-1.5">
                            <Calendar size={10} />
                            Date ({groups.date.length})
                        </div>
                        <div className="space-y-0.5">
                            {groups.date.map((col) => (
                                <FieldItem key={col.name} column={col} />
                            ))}
                        </div>
                    </div>
                )}

                {groups.boolean.length > 0 && (
                    <div>
                        <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium mb-1 flex items-center gap-1.5">
                            <ToggleLeft size={10} />
                            Boolean ({groups.boolean.length})
                        </div>
                        <div className="space-y-0.5">
                            {groups.boolean.map((col) => (
                                <FieldItem key={col.name} column={col} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
