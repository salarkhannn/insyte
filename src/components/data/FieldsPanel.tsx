import { Hash, Type, Calendar, ToggleLeft, Database, FileSpreadsheet } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import type { Column } from "../../types";

const typeIcons: Record<Column["dtype"], React.ReactNode> = {
    integer: <Hash size={12} className="text-blue-600" />,
    float: <Hash size={12} className="text-blue-600" />,
    string: <Type size={12} className="text-orange-600" />,
    date: <Calendar size={12} className="text-purple-600" />,
    boolean: <ToggleLeft size={12} className="text-green-600" />,
};

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round(bytes / Math.pow(k, i) * 10) / 10} ${sizes[i]}`;
}

function formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num);
}

function FieldItem({ column }: { column: Column }) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 text-neutral-700 hover:bg-blue-50 hover:text-neutral-900 cursor-default transition-colors group">
            <span className="shrink-0">{typeIcons[column.dtype]}</span>
            <span className="truncate text-xs font-medium">{column.name}</span>
        </div>
    );
}

function DatasetInfo() {
    const { fileName, rowCount, fileSize, dataLoaded } = useAppStore();

    if (!dataLoaded) {
        return (
            <div className="px-3 py-3 text-xs text-neutral-500">
                <div className="flex items-center gap-2 mb-2">
                    <FileSpreadsheet size={14} className="text-neutral-400" />
                    <span className="font-medium">No Data Loaded</span>
                </div>
                <p className="text-[11px] text-neutral-400">Import a file to begin</p>
            </div>
        );
    }

    return (
        <div className="px-3 py-3 space-y-2 text-xs">
            <div className="flex items-start gap-2">
                <FileSpreadsheet size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                    <div className="font-medium text-neutral-900 truncate" title={fileName ?? ""}>
                        {fileName}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>
                    <div className="text-neutral-500 font-medium">Rows</div>
                    <div className="text-neutral-900 font-semibold">{formatNumber(rowCount)}</div>
                </div>
                <div>
                    <div className="text-neutral-500 font-medium">Size</div>
                    <div className="text-neutral-900 font-semibold">{formatBytes(fileSize)}</div>
                </div>
            </div>
        </div>
    );
}

export function FieldsPanel() {
    const { columns, dataLoaded } = useAppStore();

    return (
        <div className="flex flex-col h-full">
            <section className="border-b border-neutral-200">
                <header className="px-3 py-2.5 text-[11px] font-semibold text-neutral-600 uppercase tracking-wider bg-neutral-100">
                    Data
                </header>
                <DatasetInfo />
            </section>

            <section className="flex-1 overflow-y-auto border-b border-neutral-200">
                <header className="px-3 py-2.5 text-[11px] font-semibold text-neutral-600 uppercase tracking-wider bg-neutral-100 sticky top-0">
                    Fields ({dataLoaded ? columns.length : 0})
                </header>
                {dataLoaded ? (
                    <div className="py-1">
                        {columns.map((col) => (
                            <FieldItem key={col.name} column={col} />
                        ))}
                    </div>
                ) : (
                    <div className="px-3 py-4 text-xs text-neutral-400 text-center">
                        No fields available
                    </div>
                )}
            </section>
        </div>
    );
}