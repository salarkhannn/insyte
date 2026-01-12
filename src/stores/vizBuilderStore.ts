import { create } from "zustand";
import type { VisualizationSpec, Column } from "../types";

type ChartType = VisualizationSpec["chartType"];
type AggregationType = VisualizationSpec["aggregation"];
type SortField = VisualizationSpec["sortBy"];
type SortOrder = VisualizationSpec["sortOrder"];

interface VizBuilderState {
    isOpen: boolean;
    chartType: ChartType;
    xField: string | null;
    yField: string | null;
    aggregation: AggregationType;
    sortBy: SortField;
    sortOrder: SortOrder;
    title: string;
}

interface VizBuilderActions {
    open: () => void;
    close: () => void;
    setChartType: (type: ChartType) => void;
    setXField: (field: string | null) => void;
    setYField: (field: string | null) => void;
    setAggregation: (agg: AggregationType) => void;
    setSortBy: (sort: SortField) => void;
    setSortOrder: (order: SortOrder) => void;
    setTitle: (title: string) => void;
    reset: () => void;
    buildSpec: (columns: Column[]) => VisualizationSpec | null;
    loadFromSpec: (spec: VisualizationSpec) => void;
}

const initialState: VizBuilderState = {
    isOpen: false,
    chartType: "bar",
    xField: null,
    yField: null,
    aggregation: "sum",
    sortBy: "none",
    sortOrder: "asc",
    title: "",
};

export const useVizBuilderStore = create<VizBuilderState & VizBuilderActions>((set, get) => ({
    ...initialState,

    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),

    setChartType: (chartType) => set({ chartType }),
    setXField: (xField) => set({ xField }),
    setYField: (yField) => set({ yField }),
    setAggregation: (aggregation) => set({ aggregation }),
    setSortBy: (sortBy) => set({ sortBy }),
    setSortOrder: (sortOrder) => set({ sortOrder }),
    setTitle: (title) => set({ title }),

    reset: () => set(initialState),

    buildSpec: (columns) => {
        const state = get();
        if (!state.xField || !state.yField) return null;

        const xExists = columns.some((c) => c.name === state.xField);
        const yExists = columns.some((c) => c.name === state.yField);
        if (!xExists || !yExists) return null;

        const generatedTitle =
            state.title ||
            `${state.aggregation.charAt(0).toUpperCase() + state.aggregation.slice(1)} of ${state.yField} by ${state.xField}`;

        return {
            chartType: state.chartType,
            xField: state.xField,
            yField: state.yField,
            aggregation: state.aggregation,
            groupBy: null,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
            title: generatedTitle,
            filters: [],
        };
    },

    loadFromSpec: (spec) =>
        set({
            chartType: spec.chartType,
            xField: spec.xField,
            yField: spec.yField,
            aggregation: spec.aggregation,
            sortBy: spec.sortBy,
            sortOrder: spec.sortOrder,
            title: spec.title,
        }),
}));
