import { useCallback, useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Minus, Square, X, Copy } from "lucide-react";
import { cn } from "../../utils";
import { menuService, MenuEventId } from "../../services/menuService";

const appWindow = getCurrentWindow();

interface WindowControlButtonProps {
    icon: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "close";
    title: string;
}

function WindowControlButton({
    icon,
    onClick,
    variant = "default",
    title,
}: WindowControlButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-11 h-full flex items-center justify-center transition-colors",
                variant === "default" && "hover:bg-neutral-200",
                variant === "close" && "hover:bg-red-500 hover:text-white"
            )}
            title={title}
        >
            {icon}
        </button>
    );
}

interface MenuItemProps {
    label: string;
    shortcut?: string;
    onClick: () => void;
    disabled?: boolean;
}

function MenuItem({ label, shortcut, onClick, disabled }: MenuItemProps) {
    return (
        <DropdownMenu.Item
            className={cn(
                "flex items-center justify-between px-3 py-1.5 text-[13px] outline-none cursor-default",
                "hover:bg-neutral-100 data-[disabled]:opacity-40 data-[disabled]:pointer-events-none"
            )}
            onClick={onClick}
            disabled={disabled}
        >
            <span>{label}</span>
            {shortcut && (
                <span className="ml-6 text-neutral-400 text-[11px]">{shortcut}</span>
            )}
        </DropdownMenu.Item>
    );
}

function MenuSeparator() {
    return <DropdownMenu.Separator className="h-px bg-neutral-200 my-1" />;
}

interface MenuDropdownProps {
    label: string;
    children: React.ReactNode;
}

function MenuDropdown({ label, children }: MenuDropdownProps) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="px-2.5 py-1 text-[13px] text-neutral-700 hover:bg-neutral-200 outline-none">
                    {label}
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="min-w-[180px] bg-white border border-neutral-200 shadow-lg py-1"
                    sideOffset={2}
                    align="start"
                >
                    {children}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

export function TitleBar() {
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        const checkMaximized = async () => {
            const maximized = await appWindow.isMaximized();
            setIsMaximized(maximized);
        };
        checkMaximized();

        const unlisten = appWindow.onResized(async () => {
            const maximized = await appWindow.isMaximized();
            setIsMaximized(maximized);
        });

        return () => {
            unlisten.then((fn) => fn());
        };
    }, []);

    const handleMinimize = useCallback(() => {
        appWindow.minimize();
    }, []);

    const handleMaximize = useCallback(() => {
        appWindow.toggleMaximize();
    }, []);

    const handleClose = useCallback(() => {
        appWindow.close();
    }, []);

    const emitMenuEvent = useCallback((eventId: MenuEventId) => {
        menuService.emit(eventId);
    }, []);

    return (
        <header className="h-8 bg-neutral-100 border-b border-neutral-300 flex items-center shrink-0 select-none">
            <div className="flex items-center h-full" data-tauri-drag-region>
                <div className="flex items-center">
                    <MenuDropdown label="File">
                        <MenuItem
                            label="New Project"
                            shortcut="Ctrl+N"
                            onClick={() => emitMenuEvent("new_project")}
                        />
                        <MenuItem
                            label="Open Project..."
                            shortcut="Ctrl+O"
                            onClick={() => emitMenuEvent("open_project")}
                        />
                        <MenuSeparator />
                        <MenuItem
                            label="Save"
                            shortcut="Ctrl+S"
                            onClick={() => emitMenuEvent("save")}
                        />
                        <MenuItem
                            label="Save As..."
                            shortcut="Ctrl+Shift+S"
                            onClick={() => emitMenuEvent("save_as")}
                        />
                        <MenuSeparator />
                        <MenuItem
                            label="Import Data..."
                            onClick={() => emitMenuEvent("import_data")}
                        />
                        <MenuItem
                            label="Export Data..."
                            onClick={() => emitMenuEvent("export_data")}
                        />
                        <MenuSeparator />
                        <MenuItem
                            label="Close Project"
                            shortcut="Ctrl+W"
                            onClick={() => emitMenuEvent("close_project")}
                        />
                    </MenuDropdown>

                    <MenuDropdown label="Edit">
                        <MenuItem label="Undo" shortcut="Ctrl+Z" onClick={() => { }} disabled />
                        <MenuItem label="Redo" shortcut="Ctrl+Shift+Z" onClick={() => { }} disabled />
                        <MenuSeparator />
                        <MenuItem label="Cut" shortcut="Ctrl+X" onClick={() => document.execCommand("cut")} />
                        <MenuItem label="Copy" shortcut="Ctrl+C" onClick={() => document.execCommand("copy")} />
                        <MenuItem label="Paste" shortcut="Ctrl+V" onClick={() => document.execCommand("paste")} />
                        <MenuSeparator />
                        <MenuItem label="Select All" shortcut="Ctrl+A" onClick={() => document.execCommand("selectAll")} />
                    </MenuDropdown>

                    <MenuDropdown label="View">
                        <MenuItem
                            label="Table View"
                            shortcut="Ctrl+1"
                            onClick={() => emitMenuEvent("view_table")}
                        />
                        <MenuItem
                            label="Chart View"
                            shortcut="Ctrl+2"
                            onClick={() => emitMenuEvent("view_chart")}
                        />
                        <MenuSeparator />
                        <MenuItem
                            label="Toggle Sidebar"
                            shortcut="Ctrl+B"
                            onClick={() => emitMenuEvent("toggle_sidebar")}
                        />
                        <MenuItem
                            label="Toggle AI Assistant"
                            shortcut="Ctrl+Shift+A"
                            onClick={() => emitMenuEvent("toggle_ai_panel")}
                        />
                    </MenuDropdown>

                    <MenuDropdown label="Help">
                        <MenuItem label="About Insyte" onClick={() => { }} />
                    </MenuDropdown>
                </div>
            </div>

            <div
                className="flex-1 h-full flex items-center justify-center"
                data-tauri-drag-region
            >
                <span className="text-xs font-medium text-neutral-500" data-tauri-drag-region>
                    insyte
                </span>
            </div>

            <div className="flex h-full">
                <WindowControlButton
                    icon={<Minus size={14} strokeWidth={1.5} />}
                    onClick={handleMinimize}
                    title="Minimize"
                />
                <WindowControlButton
                    icon={
                        isMaximized ? (
                            <Copy size={12} strokeWidth={1.5} className="rotate-90" />
                        ) : (
                            <Square size={12} strokeWidth={1.5} />
                        )
                    }
                    onClick={handleMaximize}
                    title={isMaximized ? "Restore" : "Maximize"}
                />
                <WindowControlButton
                    icon={<X size={16} strokeWidth={1.5} />}
                    onClick={handleClose}
                    variant="close"
                    title="Close"
                />
            </div>
        </header>
    );
}
