import { useState, useRef, useEffect } from "react";
import { Plus, Copy, Edit2, Trash2, Table } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useVizBuilderStore } from "../../stores/vizBuilderStore";
import { cn } from "../../utils";
import { Worksheet } from "../../types";
import * as ContextMenu from "@radix-ui/react-context-menu";

interface WorksheetTabProps {
    worksheet: Worksheet;
    isActive: boolean;
    onActivate: () => void;
    onRename: (name: string) => void;
    onDuplicate: () => void;
    onDelete: () => void;
}

function WorksheetTab({
    worksheet,
    isActive,
    onActivate,
    onRename,
    onDuplicate,
    onDelete,
}: WorksheetTabProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(worksheet.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSubmit();
        } else if (e.key === "Escape") {
            setIsEditing(false);
            setEditName(worksheet.name);
        }
    };

    const handleSubmit = () => {
        if (editName.trim()) {
            onRename(editName.trim());
        } else {
            setEditName(worksheet.name);
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex items-center h-8 px-1 bg-white border-b-2 border-primary min-w-[100px]">
                <input
                    ref={inputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSubmit}
                    className="w-full h-full px-2 text-xs bg-transparent outline-none"
                />
            </div>
        );
    }

    return (
        <ContextMenu.Root>
            <ContextMenu.Trigger>
                <div
                    onClick={onActivate}
                    onDoubleClick={() => setIsEditing(true)}
                    className={cn(
                        "group flex items-center h-8 px-3 text-xs cursor-pointer select-none min-w-[100px] max-w-[200px] border-r border-neutral-200",
                        isActive
                            ? "bg-white text-primary font-medium border-t-2 border-t-transparent border-b-2 border-b-primary"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-50 border-b border-neutral-200"
                    )}
                >
                    <span className="truncate flex-1">{worksheet.name}</span>
                    {/* Hover menu trigger? Or just use context menu */}
                </div>
            </ContextMenu.Trigger>
            
            <ContextMenu.Portal>
                <ContextMenu.Content className="min-w-[160px] bg-white rounded-md shadow-lg border border-neutral-200 p-1 z-50 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2">
                    <ContextMenu.Item
                        onSelect={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs text-neutral-700 rounded-sm hover:bg-primary/10 hover:text-primary outline-none cursor-pointer"
                    >
                        <Edit2 size={12} />
                        Rename
                    </ContextMenu.Item>
                    <ContextMenu.Item
                        onSelect={onDuplicate}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs text-neutral-700 rounded-sm hover:bg-primary/10 hover:text-primary outline-none cursor-pointer"
                    >
                        <Copy size={12} />
                        Duplicate
                    </ContextMenu.Item>
                    <ContextMenu.Separator className="h-px bg-neutral-200 my-1" />
                    <ContextMenu.Item
                        onSelect={onDelete}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 rounded-sm hover:bg-red-50 outline-none cursor-pointer"
                    >
                        <Trash2 size={12} />
                        Delete
                    </ContextMenu.Item>
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu.Root>
    );
}

export function WorksheetBar() {
    const {
        worksheets,
        activeWorksheetId,
        activeView,
        setActiveView,
        addWorksheet,
        setActiveWorksheet,
        renameWorksheet,
        duplicateWorksheet,
        removeWorksheet,
    } = useAppStore();
    
    const resetVizBuilder = useVizBuilderStore((s) => s.reset);
    const loadFromSpec = useVizBuilderStore((s) => s.loadFromSpec);
    
    const handleAddWorksheet = () => {
        addWorksheet();
        resetVizBuilder();
    };
    
    const handleActivateWorksheet = (id: string) => {
        const targetSheet = worksheets.find(ws => ws.id === id);
        setActiveWorksheet(id);
        setActiveView("chart");
        if (targetSheet?.visualization) {
            loadFromSpec(targetSheet.visualization);
        } else {
            resetVizBuilder();
        }
    };
    
    const handleActivateDataSource = () => {
        setActiveView("table");
    };

    return (
        <div className="flex items-center h-8 bg-neutral-100 border-t border-neutral-200 select-none overflow-x-auto overflow-y-hidden">
            <div className="flex h-full">
                {/* Data Source Tab */}
                <div
                    onClick={handleActivateDataSource}
                    className={cn(
                        "group flex items-center h-8 px-3 text-xs cursor-pointer select-none min-w-[100px] border-r border-neutral-200 gap-2",
                        activeView === "table"
                            ? "bg-white text-primary font-medium border-t-2 border-t-transparent border-b-2 border-b-primary"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-50 border-b border-neutral-200"
                    )}
                >
                    <Table size={12} />
                    <span className="truncate">Data Source</span>
                </div>

                {worksheets.map((ws) => (
                    <WorksheetTab
                        key={ws.id}
                        worksheet={ws}
                        isActive={activeView === "chart" && ws.id === activeWorksheetId}
                        onActivate={() => handleActivateWorksheet(ws.id)}
                        onRename={(name) => renameWorksheet(ws.id, name)}
                        onDuplicate={() => duplicateWorksheet(ws.id)}
                        onDelete={() => removeWorksheet(ws.id)}
                    />
                ))}
            </div>
            
            <button
                onClick={handleAddWorksheet}
                className="flex items-center justify-center w-8 h-8 text-neutral-500 hover:text-primary hover:bg-neutral-200 transition-colors"
                title="New Worksheet"
            >
                <Plus size={16} />
            </button>
            
            <div className="flex-1 bg-neutral-100 border-b border-neutral-200"></div>
        </div>
    );
}
