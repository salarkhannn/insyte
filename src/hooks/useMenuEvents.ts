import { useEffect, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import toast from "react-hot-toast";
import { useAppStore } from "../stores/appStore";
import { useDataStore } from "../stores/dataStore";
import { useVizBuilderStore } from "../stores/vizBuilderStore";
import { menuService, MenuEventId } from "../services/menuService";
import {
    saveProject,
    saveProjectAs,
    openProject,
    newProject,
    addToRecent,
} from "../services/projectService";
import { loadFile, getDataPage } from "../services/fileService";

/**
 * Hook to handle menu events from the native Tauri menu.
 * 
 * Uses the menuService singleton to subscribe to menu events,
 * ensuring only one Tauri event listener exists regardless of
 * React StrictMode or component re-renders.
 */
export function useMenuEvents() {
    const {
        projectPath,
        queryHistory,
        setProjectPath,
        setDirty,
        setActiveView,
        toggleSidebar,
        toggleAiPanel,
        setDataset,
        setQueryHistory,
        clearDataset,
        setProcessing,
        setError,
        setShowWelcome,
        setSettingsOpen,
        worksheets,
        activeWorksheetId,
        setWorksheets,
        dataLoaded,
    } = useAppStore();

    const { setRowData, clearData: clearDataStore } = useDataStore();
    const resetVizBuilder = useVizBuilderStore((state) => state.reset);

    const handleNewProject = useCallback(async () => {
        try {
            setProcessing(true, "Creating new project...");
            await newProject();
            clearDataset();
            clearDataStore();
            setProjectPath(null);
            setDirty(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setProcessing(false);
        }
    }, [clearDataset, clearDataStore, setProjectPath, setDirty, setProcessing, setError]);

    const handleOpenProject = useCallback(async () => {
        try {
            setProcessing(true, "Opening project...");
            const { path, project } = await openProject();
            
            if (project.data.sourcePath) {
                const info = await loadFile(project.data.sourcePath);
                setDataset({
                    fileName: info.fileName,
                    filePath: info.filePath,
                    columns: info.columns,
                    rowCount: info.rowCount,
                    fileSize: info.fileSize,
                });

                const page = await getDataPage(0, 10000, info.columns);
                setRowData(page.rows, page.totalRows);
            }
            
            if (project.worksheets && project.worksheets.length > 0 && project.activeWorksheetId) {
                setWorksheets(project.worksheets, project.activeWorksheetId);
            }
            
            setQueryHistory(project.queryHistory);
            setProjectPath(path);
            setDirty(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (!message.includes("cancelled")) {
                setError(message);
            }
        } finally {
            setProcessing(false);
        }
    }, [setDataset, setWorksheets, setQueryHistory, setDirty, setProcessing, setError, setRowData, setProjectPath]);

    const handleSave = useCallback(async () => {
        try {
            if (!dataLoaded) {
                toast.error("No data loaded. Please import data or open a project first.");
                return;
            }
            if (!activeWorksheetId) {
                toast.error("No active worksheet found.");
                return;
            }

            setProcessing(true, "Saving project...");
            const path = await saveProject(
                projectPath,
                worksheets,
                activeWorksheetId!,
                queryHistory
            );
            setProjectPath(path);
            await addToRecent(path);
            setDirty(false);
            toast.success("Project saved");
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (!message.includes("cancelled")) {
                toast.error(message);
            }
        } finally {
            setProcessing(false);
        }
    }, [projectPath, worksheets, activeWorksheetId, dataLoaded, queryHistory, setProjectPath, setDirty, setProcessing]);

    const handleSaveAs = useCallback(async () => {
        try {
            if (!dataLoaded) {
                toast.error("No data loaded. Please import data or open a project first.");
                return;
            }
            if (!activeWorksheetId) {
                toast.error("No active worksheet found.");
                return;
            }
            
            setProcessing(true, "Saving project...");
            const path = await saveProjectAs(worksheets, activeWorksheetId!, queryHistory);
            setProjectPath(path);
            await addToRecent(path);
            setDirty(false);
            toast.success("Project saved");
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (!message.includes("cancelled")) {
                toast.error(message);
            }
        } finally {
            setProcessing(false);
        }
    }, [worksheets, activeWorksheetId, dataLoaded, queryHistory, setProjectPath, setDirty, setProcessing]);

    const handleImportData = useCallback(async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [
                    {
                        name: "Data Files",
                        extensions: ["csv", "xlsx", "xls", "json"],
                    },
                ],
            });

            if (selected && typeof selected === "string") {
                setProcessing(true, "Loading data...");
                
                resetVizBuilder();
                
                const info = await loadFile(selected);
                setDataset({
                    fileName: info.fileName,
                    filePath: info.filePath,
                    columns: info.columns,
                    rowCount: info.rowCount,
                    fileSize: info.fileSize,
                });

                const page = await getDataPage(0, 10000, info.columns);
                setRowData(page.rows, page.totalRows);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setProcessing(false);
        }
    }, [setDataset, setProcessing, setError, setRowData, resetVizBuilder]);

    const handleCloseProject = useCallback(() => {
        clearDataset();
        clearDataStore();
        resetVizBuilder();
        setProjectPath(null);
        setDirty(false);
        setShowWelcome(true);
    }, [clearDataset, clearDataStore, resetVizBuilder, setProjectPath, setDirty, setShowWelcome]);

    const handleExportCsv = useCallback(async () => {
        try {
            setProcessing(true, "Exporting CSV...");
            const { exportCsv } = await import("../services/exportService");
            await exportCsv();
            toast.success("CSV exported successfully");
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (!message.includes("cancelled")) {
                toast.error(message);
            }
        } finally {
            setProcessing(false);
        }
    }, [setProcessing]);

    const handleExportExcel = useCallback(async () => {
        try {
            setProcessing(true, "Exporting Excel...");
            const { exportExcel } = await import("../services/exportService");
            await exportExcel();
            toast.success("Excel exported successfully");
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (!message.includes("cancelled")) {
                toast.error(message);
            }
        } finally {
            setProcessing(false);
        }
    }, [setProcessing]);

    const handleExportChart = useCallback(async () => {
        try {
            setProcessing(true, "Exporting chart...");
            const { exportChartAsPng } = await import("../services/exportService");
            await exportChartAsPng();
            toast.success("Chart exported successfully");
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (!message.includes("cancelled")) {
                toast.error(message);
            }
        } finally {
            setProcessing(false);
        }
    }, [setProcessing]);

    useEffect(() => {
        const handleMenuEvent = (menuId: MenuEventId) => {
            switch (menuId) {
                case "new_project":
                    handleNewProject();
                    break;
                case "open_project":
                    handleOpenProject();
                    break;
                case "save":
                    handleSave();
                    break;
                case "save_as":
                    handleSaveAs();
                    break;
                case "import_data":
                    handleImportData();
                    break;
                case "close_project":
                    handleCloseProject();
                    break;
                case "export_csv":
                    handleExportCsv();
                    break;
                case "export_excel":
                    handleExportExcel();
                    break;
                case "export_chart":
                    handleExportChart();
                    break;
                case "view_table":
                    setActiveView("table");
                    break;
                case "view_chart":
                    setActiveView("chart");
                    break;
                case "toggle_sidebar":
                    toggleSidebar();
                    break;
                case "toggle_ai_panel":
                    toggleAiPanel();
                    break;
                case "open_settings":
                    setSettingsOpen(true);
                    break;
            }
        };

        const unsubscribe = menuService.subscribe(handleMenuEvent);
        return unsubscribe;
    }, [
        handleNewProject,
        handleOpenProject,
        handleSave,
        handleSaveAs,
        handleImportData,
        handleCloseProject,
        handleExportCsv,
        handleExportExcel,
        handleExportChart,
        setActiveView,
        toggleSidebar,
        toggleAiPanel,
        setSettingsOpen,
    ]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMod = e.ctrlKey || e.metaKey;
            const key = e.key.toLowerCase();

            // Handle Escape for closing dialogs
            if (e.key === "Escape") {
                setSettingsOpen(false);
                return;
            }

            if (isMod && key === "s" && !e.shiftKey) {
                e.preventDefault();
                handleSave();
            } else if (isMod && key === "s" && e.shiftKey) {
                e.preventDefault();
                handleSaveAs();
            } else if (isMod && key === "w") {
                e.preventDefault();
                handleCloseProject();
            } else if (isMod && key === "n") {
                e.preventDefault();
                handleNewProject();
            } else if (isMod && key === "o" && !e.shiftKey) {
                e.preventDefault();
                handleOpenProject();
            } else if (isMod && key === "e") {
                // Ctrl+E: Export - trigger CSV export as default
                e.preventDefault();
                handleExportCsv();
            } else if (isMod && e.key === "/") {
                // Ctrl+/: Focus AI query input
                e.preventDefault();
                const aiInput = document.querySelector('[data-ai-input="true"]') as HTMLInputElement;
                if (aiInput) {
                    aiInput.focus();
                } else {
                    // If AI panel is collapsed, open it first
                    toggleAiPanel();
                }
            } else if (isMod && e.key === ",") {
                e.preventDefault();
                setSettingsOpen(true);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleSave, handleSaveAs, handleCloseProject, handleNewProject, handleOpenProject, handleExportCsv, toggleAiPanel, setSettingsOpen]);
}
