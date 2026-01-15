import { create } from "zustand";
import type { Column, VisualizationSpec, QueryHistoryItem, Worksheet } from "../types";

interface AppState {
    dataLoaded: boolean;
    fileName: string | null;
    filePath: string | null;
    columns: Column[];
    rowCount: number;
    fileSize: number;

    sidebarCollapsed: boolean;
    aiPanelCollapsed: boolean;
    activeView: "table" | "chart";
    isProcessing: boolean;
    processingMessage: string | null;

    // Worksheet state
    worksheets: Worksheet[];
    activeWorksheetId: string | null;
    currentVisualization: VisualizationSpec | null; // Synced with active worksheet

    queryHistory: QueryHistoryItem[];

    projectPath: string | null;
    isDirty: boolean;

    showWelcome: boolean;
    settingsOpen: boolean;
    error: string | null;
}

interface AppActions {
    // Worksheet actions
    addWorksheet: () => void;
    removeWorksheet: (id: string) => void;
    duplicateWorksheet: (id: string) => void;
    renameWorksheet: (id: string, name: string) => void;
    setActiveWorksheet: (id: string) => void;

    // Existing actions
    toggleSidebar: () => void;
    toggleAiPanel: () => void;
    setAiPanelCollapsed: (collapsed: boolean) => void;
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
    addQueryHistoryItem: (item: QueryHistoryItem) => void;
    setQueryHistory: (history: QueryHistoryItem[]) => void;
    clearQueryHistory: () => void;
    setShowWelcome: (show: boolean) => void;
    setSettingsOpen: (open: boolean) => void;
    reset: () => void;

    // Internal helper to sync worksheets
    setWorksheets: (worksheets: Worksheet[], activeId: string) => void;
}

const initialState: AppState = {
    dataLoaded: false,
    fileName: null,
    filePath: null,
    columns: [],
    rowCount: 0,
    fileSize: 0,
    sidebarCollapsed: false,
    aiPanelCollapsed: false,
    activeView: "table",
    isProcessing: false,
    processingMessage: null,

    worksheets: [],
    activeWorksheetId: null,
    currentVisualization: null,

    queryHistory: [],
    projectPath: null,
    isDirty: false,
    showWelcome: true,
    settingsOpen: false,
    error: null,
};

export const useAppStore = create<AppState & AppActions>((set, get) => ({
    ...initialState,

    addWorksheet: () => {
        const id = crypto.randomUUID();
        const num = get().worksheets.length + 1;
        const newSheet: Worksheet = {
            id,
            name: `Sheet ${num}`,
            visualization: null,
        };
        set((state) => ({
            worksheets: [...state.worksheets, newSheet],
            activeWorksheetId: id,
            currentVisualization: null,
            activeView: "table" // Reset view when new sheet created
        }));
    },

    removeWorksheet: (id) => {
        set((state) => {
            if (state.worksheets.length <= 1) return state; // Don't delete last sheet
            
            const newSheets = state.worksheets.filter(s => s.id !== id);
            let newActiveId = state.activeWorksheetId;
            
            if (state.activeWorksheetId === id) {
                // If deleting active sheet, switch to last one or next one
                const idx = state.worksheets.findIndex(s => s.id === id);
                // Try to go to previous one, or next one
                const newIdx = Math.max(0, idx - 1);
                newActiveId = newSheets[newIdx].id;
            }
            
            const activeSheet = newSheets.find(s => s.id === newActiveId);
            return {
                worksheets: newSheets,
                activeWorksheetId: newActiveId,
                currentVisualization: activeSheet?.visualization ?? null,
                activeView: activeSheet?.visualization ? "chart" : "table",
                isDirty: true
            };
        });
    },

    duplicateWorksheet: (id) => {
        const state = get();
        const sheet = state.worksheets.find(s => s.id === id);
        if (!sheet) return;
        
        const newId = crypto.randomUUID();
        const newSheet: Worksheet = {
            ...sheet,
            id: newId,
            name: `${sheet.name} (Copy)`
        };
        
        set((state) => ({
            worksheets: [...state.worksheets, newSheet],
            activeWorksheetId: newId,
            currentVisualization: newSheet.visualization,
            isDirty: true
        }));
    },

    renameWorksheet: (id, name) => {
        set((state) => ({
            worksheets: state.worksheets.map(s => s.id === id ? { ...s, name } : s),
            isDirty: true
        }));
    },

    setActiveWorksheet: (id) => {
        const sheet = get().worksheets.find(s => s.id === id);
        if (sheet) {
            set({ 
                activeWorksheetId: id,
                currentVisualization: sheet.visualization,
                activeView: sheet.visualization ? "chart" : "table"
            });
        }
    },

    toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

    toggleAiPanel: () =>
        set((state) => ({ aiPanelCollapsed: !state.aiPanelCollapsed })),

    setAiPanelCollapsed: (collapsed) => set({ aiPanelCollapsed: collapsed }),

    setActiveView: (view) => set({ activeView: view }),

    setProcessing: (processing, message) =>
        set({
            isProcessing: processing,
            processingMessage: processing ? (message ?? null) : null,
        }),

    setDataset: (info) => {
        // Create initial default worksheet
        const initialSheetId = crypto.randomUUID();
        const initialSheet: Worksheet = {
            id: initialSheetId,
            name: "Sheet 1",
            visualization: null
        };
        
        set({
            dataLoaded: true,
            fileName: info.fileName,
            filePath: info.filePath,
            columns: info.columns,
            rowCount: info.rowCount,
            fileSize: info.fileSize,
            
            worksheets: [initialSheet],
            activeWorksheetId: initialSheetId,
            currentVisualization: null,
            
            queryHistory: [],
            projectPath: null,
            activeView: "table",
            isDirty: false,
            showWelcome: false,
            error: null,
        });
    },

    clearDataset: () =>
        set({
            dataLoaded: false,
            fileName: null,
            filePath: null,
            columns: [],
            rowCount: 0,
            fileSize: 0,
            worksheets: [],
            activeWorksheetId: null,
            currentVisualization: null,
            queryHistory: [],
            isDirty: false,
            error: null,
        }),

    setVisualization: (spec) =>
        set((state) => {
            // Update active worksheet
            const newWorksheets = state.worksheets.map(ws => 
                 ws.id === state.activeWorksheetId 
                    ? { ...ws, visualization: spec } 
                    : ws
            );
            
            return {
                worksheets: newWorksheets,
                currentVisualization: spec,
                activeView: spec ? "chart" : "table",
                isDirty: true,
            };
        }),

    setProjectPath: (path) => set({ projectPath: path }),

    setDirty: (dirty) => set({ isDirty: dirty }),

    setError: (error) => set({ error, isProcessing: false }),

    addQueryHistoryItem: (item) =>
        set((state) => ({
            queryHistory: [item, ...state.queryHistory].slice(0, 50),
            isDirty: true,
        })),

    setQueryHistory: (history) => set({ queryHistory: history }),

    clearQueryHistory: () => set({ queryHistory: [] }),

    setShowWelcome: (show) => set({ showWelcome: show }),

    setSettingsOpen: (open) => set({ settingsOpen: open }),

    reset: () => set(initialState),
    
    setWorksheets: (worksheets, activeId) => set({ 
        worksheets, 
        activeWorksheetId: activeId,
        // Sync current viz
        currentVisualization: worksheets.find(w => w.id === activeId)?.visualization ?? null
    }),
}));