import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
    sidebarWidth: number;
    tablePanelHeight: number;
    showQueryHistory: boolean;
    recentFiles: string[];
}

interface UiActions {
    setSidebarWidth: (width: number) => void;
    setTablePanelHeight: (height: number) => void;
    toggleQueryHistory: () => void;
    addRecentFile: (path: string) => void;
    clearRecentFiles: () => void;
}

export const useUiStore = create<UiState & UiActions>()(
    persist(
        (set) => ({
            sidebarWidth: 220,
            tablePanelHeight: 300,
            showQueryHistory: false,
            recentFiles: [],

            setSidebarWidth: (width) =>
                set({ sidebarWidth: Math.max(180, Math.min(400, width)) }),

            setTablePanelHeight: (height) =>
                set({ tablePanelHeight: Math.max(100, Math.min(600, height)) }),

            toggleQueryHistory: () =>
                set((state) => ({ showQueryHistory: !state.showQueryHistory })),

            addRecentFile: (path) =>
                set((state) => ({
                    recentFiles: [path, ...state.recentFiles.filter((p) => p !== path)].slice(
                        0,
                        10
                    ),
                })),

            clearRecentFiles: () => set({ recentFiles: [] }),
        }),
        {
            name: "insyte-ui",
            partialize: (state) => ({
                sidebarWidth: state.sidebarWidth,
                tablePanelHeight: state.tablePanelHeight,
                recentFiles: state.recentFiles,
            }),
        }
    )
);