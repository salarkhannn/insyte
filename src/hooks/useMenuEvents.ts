import { useEffect, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useAppStore } from "../stores/appStore";
import { useDataStore } from "../stores/dataStore";
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
        currentVisualization,
        queryHistory,
        setProjectPath,
        setDirty,
        setActiveView,
        toggleSidebar,
        toggleAiPanel,
        setDataset,
        setVisualization,
        setQueryHistory,
        clearDataset,
        setProcessing,
        setError,
    } = useAppStore();

    const { setRowData, clearData: clearDataStore } = useDataStore();

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
            const project = await openProject();
            
            if (project.data.sourcePath) {
                const info = await loadFile(project.data.sourcePath);
                setDataset({
                    fileName: info.fileName,
                    filePath: info.filePath,
                    columns: info.columns,
                    rowCount: info.rowCount,
                    fileSize: info.fileSize,
                });

                // Load the actual row data into the data store
                const page = await getDataPage(0, 10000, info.columns);
                setRowData(page.rows, page.totalRows);
            }
            
            if (project.visualization) {
                setVisualization(project.visualization);
            }
            
            setQueryHistory(project.queryHistory);
            setDirty(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (!message.includes("cancelled")) {
                setError(message);
            }
        } finally {
            setProcessing(false);
        }
    }, [setDataset, setVisualization, setQueryHistory, setDirty, setProcessing, setError, setRowData]);

    const handleSave = useCallback(async () => {
        try {
            setProcessing(true, "Saving project...");
            const path = await saveProject(
                projectPath,
                currentVisualization,
                queryHistory
            );
            setProjectPath(path);
            await addToRecent(path);
            setDirty(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (!message.includes("cancelled")) {
                setError(message);
            }
        } finally {
            setProcessing(false);
        }
    }, [projectPath, currentVisualization, queryHistory, setProjectPath, setDirty, setProcessing, setError]);

    const handleSaveAs = useCallback(async () => {
        try {
            setProcessing(true, "Saving project...");
            const path = await saveProjectAs(currentVisualization, queryHistory);
            setProjectPath(path);
            await addToRecent(path);
            setDirty(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (!message.includes("cancelled")) {
                setError(message);
            }
        } finally {
            setProcessing(false);
        }
    }, [currentVisualization, queryHistory, setProjectPath, setDirty, setProcessing, setError]);

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

            if (selected) {
                setProcessing(true, "Loading data...");
                const info = await loadFile(selected);
                setDataset({
                    fileName: info.fileName,
                    filePath: info.filePath,
                    columns: info.columns,
                    rowCount: info.rowCount,
                    fileSize: info.fileSize,
                });

                // Load the actual row data into the data store
                const page = await getDataPage(0, 10000, info.columns);
                setRowData(page.rows, page.totalRows);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setProcessing(false);
        }
    }, [setDataset, setProcessing, setError, setRowData]);

    const handleCloseProject = useCallback(() => {
        clearDataset();
        clearDataStore();
        setProjectPath(null);
        setDirty(false);
    }, [clearDataset, clearDataStore, setProjectPath, setDirty]);

    // Subscribe to menu events from the singleton service
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
            }
        };

        // Subscribe returns an unsubscribe function
        const unsubscribe = menuService.subscribe(handleMenuEvent);
        return unsubscribe;
    }, [
        handleNewProject,
        handleOpenProject,
        handleSave,
        handleSaveAs,
        handleImportData,
        handleCloseProject,
        setActiveView,
        toggleSidebar,
        toggleAiPanel,
    ]);
}
