import { create } from "zustand";
import type { Column, VisualizationSpec } from "../types";

interface AppState {
    dataLoaded: boolean;
    fileName: string | null;
    filePath: string | null;
    columns: Column[];
    rowCount: number;
    fileSize: number;

    sidebarCollapsed: boolean;
    activeView: "table" | "chart";
    isProcessing: boolean;
    processingMessage: string | null;

    currentVisualization: VisualizationSpec | null;

    projectPath: string | null;
    isDirty: boolean;

    error: string | null;
}

interface AppActions {
    toggleSidebar: () => void;
    setActiveView: (view: "table" | "chart") => void;
    setProcessing: (processing: boolean, message?: string) => void;
    setDataset: (info: {
        fileName: string;
        filePath: string;
        columns: Column[];
        rowCount: number;
        fileSize: number;
    }) => void;
    clearDataset: () => void;
    setVisualization: (spec: VisualizationSpec | null) => void;
    setProjectPath: (path: string | null) => void;
    setDirty: (dirty: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

const initialState: AppState = {
    dataLoaded: false,
    fileName: null,
    filePath: null,
    columns: [],
    rowCount: 0,
    fileSize: 0,
    sidebarCollapsed: false,
    activeView: "table",
    isProcessing: false,
    processingMessage: null,
    currentVisualization: null,
    projectPath: null,
    isDirty: false,
    error: null,
};

export const useAppStore = create<AppState & AppActions>((set) => ({
    ...initialState,

    toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

    setActiveView: (view) => set({ activeView: view }),

    setProcessing: (processing, message) =>
        set({
            isProcessing: processing,
            processingMessage: processing ? (message ?? null) : null,
        }),

    setDataset: (info) =>
        set({
            dataLoaded: true,
            fileName: info.fileName,
            filePath: info.filePath,
            columns: info.columns,
            rowCount: info.rowCount,
            fileSize: info.fileSize,
            isDirty: true,
            error: null,
        }),

    clearDataset: () =>
        set({
            dataLoaded: false,
            fileName: null,
            filePath: null,
            columns: [],
            rowCount: 0,
            fileSize: 0,
            currentVisualization: null,
            isDirty: false,
            error: null,
        }),

    setVisualization: (spec) =>
        set({
            currentVisualization: spec,
            activeView: spec ? "chart" : "table",
            isDirty: true,
        }),

    setProjectPath: (path) => set({ projectPath: path }),

    setDirty: (dirty) => set({ isDirty: dirty }),

    setError: (error) => set({ error, isProcessing: false }),

    reset: () => set(initialState),
}));