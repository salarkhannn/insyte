import { create } from "zustand";
import type {
    ChartConfig,
    ChartType,
    LegendConfig,
    CurveType,
    Orientation,
} from "../types/chartConfigs";
import { getDefaultConfig } from "../components/visualization/charts/chartDefaults";

interface ChartConfigState {
    config: ChartConfig;
}

interface ChartConfigActions {
    setChartType: (type: ChartType) => void;
    resetToDefaults: () => void;
    updateConfig: (updates: Partial<ChartConfig>) => void;
    setLegend: (legend: Partial<LegendConfig>) => void;

    // Bar chart
    setBarOrientation: (orientation: Orientation) => void;
    setBarStacked: (stacked: boolean) => void;
    setBarShowValueLabels: (show: boolean) => void;
    setBarRadius: (radius: number) => void;

    // Line chart
    setLineCurveType: (curveType: CurveType) => void;
    setLineStrokeWidth: (width: number) => void;
    setLineShowMarkers: (show: boolean) => void;
    setLineMarkerSize: (size: number) => void;
    setLineConnectNulls: (connect: boolean) => void;

    // Area chart
    setAreaCurveType: (curveType: CurveType) => void;
    setAreaStacked: (stacked: boolean) => void;
    setAreaFillOpacity: (opacity: number) => void;
    setAreaShowLine: (show: boolean) => void;
    setAreaStrokeWidth: (width: number) => void;

    // Pie chart
    setPieInnerRadius: (radius: number) => void;
    setPieShowLabels: (show: boolean) => void;
    setPieLabelType: (type: "name" | "value" | "percent") => void;

    // Scatter chart
    setScatterPointSize: (size: number) => void;
    setScatterPointOpacity: (opacity: number) => void;
}

export const useChartConfigStore = create<ChartConfigState & ChartConfigActions>((set) => ({
    config: getDefaultConfig("bar"),

    setChartType: (type) => set({ config: getDefaultConfig(type) }),

    resetToDefaults: () => set((state) => ({
        config: getDefaultConfig(state.config.type),
    })),

    updateConfig: (updates) => set((state) => ({
        config: { ...state.config, ...updates } as ChartConfig,
    })),

    setLegend: (legend) => set((state) => ({
        config: { ...state.config, legend: { ...state.config.legend, ...legend } },
    })),

    // Bar chart setters
    setBarOrientation: (orientation) => set((state) => {
        if (state.config.type !== "bar") return state;
        return { config: { ...state.config, orientation } };
    }),

    setBarStacked: (stacked) => set((state) => {
        if (state.config.type !== "bar") return state;
        return { config: { ...state.config, stacked } };
    }),

    setBarShowValueLabels: (showValueLabels) => set((state) => {
        if (state.config.type !== "bar") return state;
        return { config: { ...state.config, showValueLabels } };
    }),

    setBarRadius: (barRadius) => set((state) => {
        if (state.config.type !== "bar") return state;
        return { config: { ...state.config, barRadius } };
    }),

    // Line chart setters
    setLineCurveType: (curveType) => set((state) => {
        if (state.config.type !== "line") return state;
        return { config: { ...state.config, curveType } };
    }),

    setLineStrokeWidth: (strokeWidth) => set((state) => {
        if (state.config.type !== "line") return state;
        return { config: { ...state.config, strokeWidth } };
    }),

    setLineShowMarkers: (showMarkers) => set((state) => {
        if (state.config.type !== "line") return state;
        return { config: { ...state.config, showMarkers } };
    }),

    setLineMarkerSize: (markerSize) => set((state) => {
        if (state.config.type !== "line") return state;
        return { config: { ...state.config, markerSize } };
    }),

    setLineConnectNulls: (connectNulls) => set((state) => {
        if (state.config.type !== "line") return state;
        return { config: { ...state.config, connectNulls } };
    }),

    // Area chart setters
    setAreaCurveType: (curveType) => set((state) => {
        if (state.config.type !== "area") return state;
        return { config: { ...state.config, curveType } };
    }),

    setAreaStacked: (stacked) => set((state) => {
        if (state.config.type !== "area") return state;
        return { config: { ...state.config, stacked } };
    }),

    setAreaFillOpacity: (fillOpacity) => set((state) => {
        if (state.config.type !== "area") return state;
        return { config: { ...state.config, fillOpacity } };
    }),

    setAreaShowLine: (showLine) => set((state) => {
        if (state.config.type !== "area") return state;
        return { config: { ...state.config, showLine } };
    }),

    setAreaStrokeWidth: (strokeWidth) => set((state) => {
        if (state.config.type !== "area") return state;
        return { config: { ...state.config, strokeWidth } };
    }),

    // Pie chart setters
    setPieInnerRadius: (innerRadius) => set((state) => {
        if (state.config.type !== "pie") return state;
        return { config: { ...state.config, innerRadius } };
    }),

    setPieShowLabels: (showLabels) => set((state) => {
        if (state.config.type !== "pie") return state;
        return { config: { ...state.config, showLabels } };
    }),

    setPieLabelType: (labelType) => set((state) => {
        if (state.config.type !== "pie") return state;
        return { config: { ...state.config, labelType } };
    }),

    // Scatter chart setters
    setScatterPointSize: (pointSize) => set((state) => {
        if (state.config.type !== "scatter") return state;
        return { config: { ...state.config, pointSize } };
    }),

    setScatterPointOpacity: (pointOpacity) => set((state) => {
        if (state.config.type !== "scatter") return state;
        return { config: { ...state.config, pointOpacity } };
    }),
}));
