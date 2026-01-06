import { create } from "zustand";

interface DataState {
    rowData: Record<string, unknown>[];
    totalRows: number;
    pageSize: number;
    currentPage: number;
    sortColumn: string | null;
    sortDirection: "asc" | "desc" | null;
    filters: Record<string, unknown>;
}

interface DataActions {
    setRowData: (data: Record<string, unknown>[], totalRows: number) => void;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setSort: (column: string | null, direction: "asc" | "desc" | null) => void;
    setFilters: (filters: Record<string, unknown>) => void;
    clearData: () => void;
}

const initialState: DataState = {
    rowData: [],
    totalRows: 0,
    pageSize: 100,
    currentPage: 0,
    sortColumn: null,
    sortDirection: null,
    filters: {},
};

export const useDataStore = create<DataState & DataActions>((set) => ({
    ...initialState,

    setRowData: (data, totalRows) =>
        set({
            rowData: data,
            totalRows,
        }),

    setPage: (page) => set({ currentPage: page }),

    setPageSize: (size) => set({ pageSize: size, currentPage: 0 }),

    setSort: (column, direction) =>
        set({
            sortColumn: column,
            sortDirection: direction,
        }),

    setFilters: (filters) =>
        set({
            filters,
            currentPage: 0,
        }),

    clearData: () => set(initialState),
}));