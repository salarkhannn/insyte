import { useCallback, useState } from "react";
import { useAppStore } from "../stores/appStore";
import { useQueryStore } from "../stores/queryStore";
import { processAiQuery } from "../services/aiService";
import type { VisualizationSpec } from "../types";

export function useQuery() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { setVisualization, setActiveView, dataLoaded } = useAppStore();
    const { currentQuery, setCurrentQuery, addToHistory, history } = useQueryStore();

    const submitQuery = useCallback(
        async (query: string): Promise<VisualizationSpec | null> => {
            if (!query.trim() || !dataLoaded) {
                return null;
            }

            setIsLoading(true);
            setError(null);

            try {
                const spec = await processAiQuery(query.trim());
                setVisualization(spec);
                setActiveView("chart");
                addToHistory({
                    query: query.trim(),
                    visualization: spec,
                    success: true,
                });
                return spec;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                setError(errorMessage);
                addToHistory({
                    query: query.trim(),
                    visualization: null,
                    success: false,
                    error: errorMessage,
                });
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [dataLoaded, setVisualization, setActiveView, addToHistory]
    );

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        currentQuery,
        setCurrentQuery,
        submitQuery,
        history,
        isLoading,
        error,
        clearError,
    };
}