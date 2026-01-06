import { Column, VisualizationSpec } from "../types";
import { create } from "zustand";

interface AppState {
    dataLoaded: boolean;
    fileName: string | null;
    columns: Column[] | null;
    rowCount: number;
    sidebarCollapsed: boolean;
    activeView: "table" | "chart";
    isProcessing: boolean;
    currentVisualization: VisualizationSpec | null;
    projectPath: string | null;
    isDirty: boolean;
}

interface AppActions {
    toggleSidebar: () => void;
    setActiveView: (view: "table" | "chart") => void;
    setProcessing: (processing: boolean) => void;
    setDataset: (fileName: string, columns: Column[], rowCount: number) => void;
    clearDataset: () => void;
    setVisualization: (spec: VisualizationSpec | null) => void;
}

export const useAppStore = create<AppState & AppActions>((set) => ({
    dataLoaded: false,
    fileName: null,
    columns: [],
    rowCount: 0,
    sidebarCollapsed: false,
    activeView: "table",
    isProcessing: false,
    currentVisualization: null,
    projectPath: null,
    isDirty: false,

    toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

    setActiveView: (view) => set({ activeView: view }),

    setProcessing: (processing) => set({ isProcessing: processing }),

    setDataset: (fileName, columns, rowCount) =>
        set({
            dataLoaded: true,
            fileName,
            columns,
            rowCount,
            isDirty: true,
        }),

    clearDataset: () =>
        set({
            dataLoaded: false,
            fileName: null,
            columns: [],
            rowCount: 0,
            currentVisualization: null,
            isDirty: false,
        }),

    setVisualization: (spec) =>
        set({
            currentVisualization: spec,
            activeView: spec ? "chart" : "table",
            isDirty: true,
        }),
}));