import { useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import { useQueryStore } from "../stores/queryStore";
import type { VisualizationSpec } from "../types";

export function useQuery() {
    const { setVisualization, setProcessing, setError } = useAppStore();
    const { currentQuery, setCurrentQuery, addToHistory, history } = useQueryStore();

    const submitQuery = useCallback(
        async (query: string) => {
            if (!query.trim()) return;

            setProcessing(true, "Processing query");

            try {
                // Backend integration will go here
                const mockResult: VisualizationSpec = {
                    chartType: "bar",
                    xField: "category",
                    yField: "value",
                    aggregation: "sum",
                    groupBy: null,
                    sortBy: "none",
                    sortOrder: "asc",
                    title: query,
                    filters: [],
                };

                addToHistory({
                    query,
                    visualization: mockResult,
                    success: true,
                });

                setVisualization(mockResult);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Query failed";
                addToHistory({
                    query,
                    visualization: null,
                    success: false,
                    error: errorMessage,
                });
                setError(errorMessage);
            } finally {
                setProcessing(false);
            }
        },
        [setVisualization, setProcessing, setError, addToHistory]
    );

    return {
        currentQuery,
        setCurrentQuery,
        submitQuery,
        history,
    };
}