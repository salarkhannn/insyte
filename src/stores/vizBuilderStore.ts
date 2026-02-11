import { create } from "zustand";
import type { VisualizationSpec, Column, DateBinning } from "../types";

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
    xAggregation: AggregationType;
    xDateBinning: DateBinning;
    yDateBinning: DateBinning;
    sortBy: SortField;
    sortOrder: SortOrder;
    title: string;
}

interface VizBuilderActions {
    open: () => void;
    close: () => void;
    setChartType: (type: ChartType) => void;
    setXField: (field: string | null, columns: Column[]) => void;
    setYField: (field: string | null, columns: Column[]) => void;
    setAggregation: (agg: AggregationType) => void;
    setXAggregation: (agg: AggregationType) => void;
    setXDateBinning: (binning: DateBinning) => void;
    setYDateBinning: (binning: DateBinning) => void;
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
    xAggregation: "sum",
    xDateBinning: "year",
    yDateBinning: "year",
    sortBy: "none",
    sortOrder: "asc",
    title: "",
};

export const useVizBuilderStore = create<VizBuilderState & VizBuilderActions>((set, get) => ({
    ...initialState,

    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),

    setChartType: (chartType) => set({ chartType }),
    setXField: (xField, columns) => {
        const updates: Partial<VizBuilderState> = { xField };
        if (xField) {
            const column = columns.find(c => c.name === xField);
            if (column?.dtype === "date") {
                updates.xDateBinning = "year";
            }
        }
        set(updates);
    },
    setYField: (yField, columns) => {
        const updates: Partial<VizBuilderState> = { yField };
        if (yField) {
            const column = columns.find(c => c.name === yField);
            if (column?.dtype === "date") {
                updates.yDateBinning = "year";
            }
        }
        set(updates);
    },
    setAggregation: (aggregation) => set({ aggregation }),
    setXAggregation: (xAggregation) => set({ xAggregation }),
    setXDateBinning: (xDateBinning) => set({ xDateBinning }),
    setYDateBinning: (yDateBinning) => set({ yDateBinning }),
    setSortBy: (sortBy) => set({ sortBy }),
    setSortOrder: (sortOrder) => set({ sortOrder }),
    setTitle: (title) => set({ title }),

    reset: () => set(initialState),

    buildSpec: (columns) => {
        const state = get();
        if (!state.xField || !state.yField) return null;

        const xColumn = columns.find((c) => c.name === state.xField);
        const yColumn = columns.find((c) => c.name === state.yField);
        if (!xColumn || !yColumn) return null;

        const aggregation = state.aggregation;
        const generatedTitle =
            state.title ||
            `${aggregation.charAt(0).toUpperCase() + aggregation.slice(1)} of ${state.yField} by ${state.xField}`;

        const spec: VisualizationSpec = {
            chartType: state.chartType,
            xField: state.xField,
            yField: state.yField,
            aggregation,
            groupBy: null,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
            title: generatedTitle,
            filters: [],
        };

        if (xColumn.dtype === "date") {
            spec.xDateBinning = state.xDateBinning;
        }

        if (yColumn.dtype === "date") {
            spec.yDateBinning = state.yDateBinning;
        }

        return spec;
    },

    loadFromSpec: (spec) =>
        set({
            chartType: spec.chartType,
            xField: spec.xField,
            yField: spec.yField,
            aggregation: spec.aggregation,
            xDateBinning: spec.xDateBinning || "year",
            yDateBinning: spec.yDateBinning || "year",
            sortBy: spec.sortBy,
            sortOrder: spec.sortOrder,
            title: spec.title,
        }),
}));
