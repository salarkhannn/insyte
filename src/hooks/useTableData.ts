import { useCallback, useEffect, useState } from "react";
import { useAppStore, useDataStore } from "../stores";
import { getDataPage } from "../services/fileService";

export function useTableData() {
    const { dataLoaded, filePath, columns } = useAppStore();
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

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPage = useCallback(async () => {
        if (!dataLoaded || !filePath || columns.length === 0) return;

        setIsLoading(true);
        setError(null);

        try {
            const offset = currentPage * pageSize;
            const page = await getDataPage(offset, pageSize, columns);
            setRowData(page.rows, page.totalRows);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to fetch data";
            setError(message);
            console.error("Error fetching data page:", err);
        } finally {
            setIsLoading(false);
        }
    }, [dataLoaded, filePath, columns, currentPage, pageSize, setRowData]);

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
        isLoading,
        error,
        setPageSize,
        setSort,
        setFilters,
        nextPage,
        prevPage,
        goToPage,
        clearData,
        refetch: fetchPage,
    };
}