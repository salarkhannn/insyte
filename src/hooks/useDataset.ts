import { useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import { useUiStore } from "../stores/uiStore";
import type { Column } from "../types";

export function useDataset() {
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
        setError,
    } = useAppStore();

    const { addRecentFile } = useUiStore();

    const loadDataset = useCallback(
        async (info: {
            fileName: string;
            filePath: string;
            columns: Column[];
            rowCount: number;
            fileSize: number;
        }) => {
            setProcessing(true, "Loading dataset");
            try {
                setDataset(info);
                addRecentFile(info.filePath);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load dataset");
            } finally {
                setProcessing(false);
            }
        },
        [setDataset, setProcessing, setError, addRecentFile]
    );

    const unloadDataset = useCallback(() => {
        clearDataset();
    }, [clearDataset]);

    return {
        dataLoaded,
        fileName,
        filePath,
        columns,
        rowCount,
        fileSize,
        loadDataset,
        unloadDataset,
    };
}