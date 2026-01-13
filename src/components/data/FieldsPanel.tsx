import { Hash, Type, Calendar, ToggleLeft, FileSpreadsheet } from "lucide-react";
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
        <div className="flex items-center gap-3 px-4 py-2 text-neutral-700 hover:bg-blue-50 hover:text-neutral-900 cursor-default transition-colors">
            <span className="shrink-0">{typeIcons[column.dtype]}</span>
            <span className="truncate text-xs">{column.name}</span>
        </div>
    );
}

function DatasetInfo() {
    const { fileName, rowCount, fileSize, dataLoaded } = useAppStore();

    if (!dataLoaded) {
        return (
            <div className="px-4 py-8 text-xs text-neutral-500">
                <div className="flex items-center gap-3 mb-2">
                    <FileSpreadsheet size={16} className="text-neutral-400" />
                    <span className="font-medium">No Data Loaded</span>
                </div>
                <p className="text-xs text-neutral-400">Import a file to begin</p>
            </div>
        );
    }

    return (
        <div className="px-4 py-4 space-y-4 text-xs">
            <div className="flex items-start gap-3">
                <FileSpreadsheet size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                    <div className="font-medium text-neutral-900 truncate" title={fileName ?? ""}>
                        {fileName}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-1 text-xs">
                <div>
                    <div className="text-neutral-500 mb-0.5">Rows</div>
                    <div className="text-neutral-900 font-medium">{formatNumber(rowCount)}</div>
                </div>
                <div>
                    <div className="text-neutral-500 mb-0.5">Size</div>
                    <div className="text-neutral-900 font-medium">{formatBytes(fileSize)}</div>
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
                <header className="px-4 py-3 text-xs font-semibold text-neutral-600 uppercase tracking-wider bg-neutral-50">
                    Data
                </header>
                <DatasetInfo />
            </section>

            <section className="flex-1 overflow-y-auto border-b border-neutral-200">
                <header className="px-4 py-3 text-xs font-semibold text-neutral-600 uppercase tracking-wider bg-neutral-50 sticky top-0">
                    Fields ({dataLoaded ? columns.length : 0})
                </header>
                {dataLoaded ? (
                    <div className="py-1">
                        {columns.map((col) => (
                            <FieldItem key={col.name} column={col} />
                        ))}
                    </div>
                ) : (
                    <div className="px-4 py-12 text-xs text-neutral-400 text-center">
                        No fields available
                    </div>
                )}
            </section>
        </div>
    );
}