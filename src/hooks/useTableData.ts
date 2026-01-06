import { useCallback, useEffect } from "react";
import { useAppStore, useDataStore } from "../stores";

export function useTableData() {
    const { dataLoaded, filePath } = useAppStore();
    const {
        rowData,
        totalRows,
        pageSize,
        currentPage,
        sortColumn,
        sortDirection,
        filters,
        setRowData,
        setPage,
        setPageSize,
        setSort,
        setFilters,
        clearData,
    } = useDataStore();

    const fetchPage = useCallback(async () => {
        if (!dataLoaded || !filePath) return;

        // ADD BACKEND INTEGRATION FOR FOR PAGINATION HERE
    }, [dataLoaded, filePath, currentPage, pageSize, sortColumn, sortDirection, filters]);

    useEffect(() => {
        fetchPage();
    }, [fetchPage]);

    const nextPage = useCallback(() => {
        const maxPage = Math.ceil(totalRows / pageSize) - 1;
        if (currentPage < maxPage) {
            setPage(currentPage + 1);
        }
    }, [currentPage, totalRows, pageSize, setPage]);

    const prevPage = useCallback(() => {
        if (currentPage > 0) {
            setPage(currentPage - 1);
        }
    }, [currentPage, setPage]);

    const goToPage = useCallback(
        (page: number) => {
            const maxPage = Math.ceil(totalRows / pageSize) - 1;
            setPage(Math.max(0, Math.min(page, maxPage)));
        },
        [totalRows, pageSize, setPage]
    );

    return {
        rowData,
        totalRows,
        pageSize,
        currentPage,
        sortColumn,
        sortDirection,
        filters,
        setPageSize,
        setSort,
        setFilters,
        nextPage,
        prevPage,
        goToPage,
        clearData,
    };
}