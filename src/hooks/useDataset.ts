import { useCallback, useState } from "react";
import { useAppStore } from "../stores/appStore";
import { useDataStore } from "../stores/dataStore";
import { useUiStore } from "../stores/uiStore";
import { openFileDialog, loadFile, getDataPage, clearData } from "../services/fileService";

export function useDataset() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        dataLoaded,
        fileName,
        filePath,
        columns,
        rowCount,
        fileSize,
        setDataset,
        clearDataset,
        setProcessing,
        setError: setAppError,
    } = useAppStore();

    const { setRowData, clearData: clearDataStore } = useDataStore();
    const { addRecentFile } = useUiStore();

    const openFile = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const path = await openFileDialog();
            if (!path) {
                setIsLoading(false);
                return;
            }

            setProcessing(true, "Loading file");

            const info = await loadFile(path);

            setDataset({
                fileName: info.fileName,
                filePath: info.filePath,
                columns: info.columns,
                rowCount: info.rowCount,
                fileSize: info.fileSize,
            });

            addRecentFile(info.filePath);

            const page = await getDataPage(0, 10000, info.columns);
            setRowData(page.rows, page.totalRows);

            setProcessing(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load file";
            setError(message);
            setAppError(message);
        } finally {
            setIsLoading(false);
        }
    }, [setDataset, setProcessing, setAppError, addRecentFile, setRowData]);

    const closeFile = useCallback(async () => {
        try {
            await clearData();
            clearDataset();
            clearDataStore();
        } catch (err) {
            console.error("Failed to clear data:", err);
        }
    }, [clearDataset, clearDataStore]);

    return {
        dataLoaded,
        fileName,
        filePath,
        columns,
        rowCount,
        fileSize,
        isLoading,
        error,
        openFile,
        closeFile,
    };
}