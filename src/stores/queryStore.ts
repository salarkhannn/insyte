import { create } from "zustand";
import type { QueryHistoryItem } from "../types";

interface QueryState {
    history: QueryHistoryItem[];
    currentQuery: string;
    selectedHistoryId: string | null;
}

interface QueryActions {
    setCurrentQuery: (query: string) => void;
    addToHistory: (item: Omit<QueryHistoryItem, "id" | "timestamp">) => void;
    selectHistoryItem: (id: string | null) => void;
    clearHistory: () => void;
    removeFromHistory: (id: string) => void;
}

function generateId(): string {
    return Math.random().toString(36).substring(2, 11);
}

export const useQueryStore = create<QueryState & QueryActions>((set) => ({
    history: [],
    currentQuery: "",
    selectedHistoryId: null,

    setCurrentQuery: (query) => set({ currentQuery: query }),

    addToHistory: (item) =>
        set((state) => ({
            history: [
                {
                    id: generateId(),
                    timestamp: Date.now(),
                    ...item,
                },
                ...state.history,
            ].slice(0, 50),
            currentQuery: "",
        })),

    selectHistoryItem: (id) => set({ selectedHistoryId: id }),

    clearHistory: () => set({ history: [], selectedHistoryId: null }),

    removeFromHistory: (id) =>
        set((state) => ({
            history: state.history.filter((item) => item.id !== id),
            selectedHistoryId:
                state.selectedHistoryId === id ? null : state.selectedHistoryId,
        })),
}));