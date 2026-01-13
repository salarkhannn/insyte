import { useEffect, useCallback } from "react";
import {
    FolderOpen,
    Save,
    Table,
    BarChart3,
    PanelLeftClose,
    PanelLeft,
    X,
    FilePlus,
} from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useDataset } from "../../hooks/useDataset";
import { cn } from "../../utils";
import {
    saveProject,
    saveProjectAs,
    openProject,
    newProject,
} from "../../services/projectService";
import { loadFile } from "../../services/fileService";

interface ToolbarButtonProps {
    icon: React.ReactNode;
    label?: string;
    onClick?: () => void;
    active?: boolean;
    disabled?: boolean;
    shortcut?: string;
}

function ToolbarButton({
    icon,
    label,
    onClick,
    active,
    disabled,
    shortcut,
}: ToolbarButtonProps) {
    const title = shortcut ? `${label} (${shortcut})` : label;
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "h-8 px-3 flex items-center gap-2 text-text-secondary transition-colors",
                "hover:bg-neutral-200 hover:text-text",
                "disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-secondary",
                active && "bg-primary-muted text-primary"
            )}
            title={title}
        >
            {icon}
            {label && <span className="text-xs">{label}</span>}
        </button>
    );
}

function Divider() {
    return <div className="w-px h-6 bg-border mx-2" />;
}

export function Toolbar() {
    const {
        activeView,
        setActiveView,
        sidebarCollapsed,
        toggleSidebar,
        dataLoaded,
        projectPath,
        currentVisualization,
        queryHistory,
        isDirty,
        setProjectPath,
        setDirty,
        setDataset,
        setVisualization,
        setQueryHistory,
        clearDataset,
        setProcessing,
        setError,
    } = useAppStore();
    const { openFile, closeFile, isLoading } = useDataset();

    const handleSave = useCallback(async () => {
        if (!dataLoaded) return;

        try {
            setProcessing(true, "Saving project...");
            const savedPath = await saveProject(
                projectPath,
                currentVisualization,
                queryHistory
            );
            setProjectPath(savedPath);
            setDirty(false);
        } catch (err) {
            if (err !== "Operation cancelled") {
                setError(err instanceof Error ? err.message : String(err));
            }
        } finally {
            setProcessing(false);
        }
    }, [dataLoaded, projectPath, currentVisualization, queryHistory, setProcessing, setProjectPath, setDirty, setError]);

    const handleSaveAs = useCallback(async () => {
        if (!dataLoaded) return;

        try {
            setProcessing(true, "Saving project...");
            const savedPath = await saveProjectAs(currentVisualization, queryHistory);
            setProjectPath(savedPath);
            setDirty(false);
        } catch (err) {
            if (err !== "Operation cancelled") {
                setError(err instanceof Error ? err.message : String(err));
            }
        } finally {
            setProcessing(false);
        }
    }, [dataLoaded, currentVisualization, queryHistory, setProcessing, setProjectPath, setDirty, setError]);

    const handleOpenProject = useCallback(async () => {
        try {
            setProcessing(true, "Opening project...");
            const project = await openProject();

            if (project.data.sourcePath) {
                const datasetInfo = await loadFile(project.data.sourcePath);
                setDataset({
                    fileName: datasetInfo.fileName,
                    filePath: datasetInfo.filePath,
                    columns: datasetInfo.columns,
                    rowCount: datasetInfo.rowCount,
                    fileSize: datasetInfo.fileSize,
                });
            }

            if (project.visualization) {
                setVisualization(project.visualization);
            }

            setQueryHistory(project.queryHistory);
            setDirty(false);
        } catch (err) {
            if (err !== "Operation cancelled") {
                setError(err instanceof Error ? err.message : String(err));
            }
        } finally {
            setProcessing(false);
        }
    }, [setProcessing, setDataset, setVisualization, setQueryHistory, setDirty, setError]);

    const handleNewProject = useCallback(async () => {
        if (isDirty) {
            const confirmed = window.confirm("You have unsaved changes. Discard and create new project?");
            if (!confirmed) return;
        }

        try {
            await newProject();
            clearDataset();
            setProjectPath(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    }, [isDirty, clearDataset, setProjectPath, setError]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                if (e.shiftKey) {
                    handleSaveAs();
                } else {
                    handleSave();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "o" && !e.shiftKey) {
                e.preventDefault();
                handleOpenProject();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "n") {
                e.preventDefault();
                handleNewProject();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleSave, handleSaveAs, handleOpenProject, handleNewProject]);

    return (
        <header className="h-10 bg-surface border-b border-border flex items-center px-4 gap-2 shrink-0">
            <div className="flex items-center gap-3 mr-4 pr-4 border-r border-border">
                <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
                    <span className="text-white text-[10px] font-semibold">I</span>
                </div>
                <span className="text-sm font-medium text-text">Insyte</span>
            </div>

            <ToolbarButton
                icon={sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
                onClick={toggleSidebar}
            />

            <Divider />

            <ToolbarButton
                icon={<FilePlus size={18} />}
                label="New"
                onClick={handleNewProject}
                disabled={isLoading}
                shortcut="Ctrl+N"
            />
            <ToolbarButton
                icon={<FolderOpen size={18} />}
                label="Open"
                onClick={openFile}
                disabled={isLoading}
            />
            <ToolbarButton
                icon={<FolderOpen size={18} />}
                label="Open Project"
                onClick={handleOpenProject}
                disabled={isLoading}
                shortcut="Ctrl+O"
            />
            <ToolbarButton
                icon={<X size={18} />}
                label="Close"
                onClick={closeFile}
                disabled={!dataLoaded || isLoading}
            />
            <ToolbarButton
                icon={<Save size={18} />}
                label="Save"
                onClick={handleSave}
                disabled={!dataLoaded || isLoading}
                shortcut="Ctrl+S"
            />

            <Divider />

            <ToolbarButton
                icon={<Table size={18} />}
                label="Table"
                onClick={() => setActiveView("table")}
                active={activeView === "table"}
            />
            <ToolbarButton
                icon={<BarChart3 size={18} />}
                label="Chart"
                onClick={() => setActiveView("chart")}
                active={activeView === "chart"}
            />
        </header>
    );
}