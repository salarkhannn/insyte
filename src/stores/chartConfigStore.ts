import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
    ChartConfig,
    ChartType,
    BarChartConfig,
    LineChartConfig,
    AreaChartConfig,
    PieChartConfig,
    ScatterChartConfig,
    AxisConfig,
    TooltipConfig,
    LegendConfig,
    Orientation,
    AggregationType,
    SortOrder,
    CurveType,
    StrokeStyle,
    MarkerShape,
    LabelPosition,
    SampleMethod,
    TrendLineType,
} from "../types/chartConfigs";
import { getDefaultConfig } from "../components/visualization/charts/chartDefaults";

interface ChartConfigState {
    config: ChartConfig;
    isDirty: boolean;
    lastApplied: ChartConfig | null;
}

interface ChartConfigActions {
    setChartType: (type: ChartType) => void;
    resetToDefaults: () => void;
    applyConfig: () => void;
    revertChanges: () => void;
    loadConfig: (config: ChartConfig) => void;

    setDataFieldX: (field: string | null) => void;
    setDataFieldY: (field: string | null) => void;
    setAggregation: (aggregation: AggregationType) => void;
    setTitle: (title: string) => void;
    setColorScheme: (colors: string[]) => void;
    setMaxPoints: (maxPoints: number) => void;
    setAnimationDuration: (duration: number) => void;
    setBackgroundColor: (color: string) => void;
    setPadding: (padding: { top?: number; right?: number; bottom?: number; left?: number }) => void;
    setTooltip: (tooltip: Partial<TooltipConfig>) => void;
    setLegend: (legend: Partial<LegendConfig>) => void;

    setBarOrientation: (orientation: Orientation) => void;
    setBarStacked: (stacked: boolean) => void;
    setBarGrouped: (grouped: boolean) => void;
    setBarWidth: (width: number | "auto") => void;
    setBarMaxWidth: (width: number) => void;
    setBarSpacing: (spacing: number) => void;
    setBarCategoryGap: (gap: number) => void;
    setBarRadius: (radius: [number, number, number, number]) => void;
    setBarSortOrder: (order: SortOrder) => void;
    setBarSortBy: (sortBy: "x" | "y" | "none") => void;
    setBarShowValueLabels: (show: boolean) => void;
    setBarValueLabelPosition: (position: "top" | "center" | "bottom") => void;
    setBarValueLabelFontSize: (size: number) => void;
    setBarValueLabelFontColor: (color: string) => void;
    setBarHighlightOnHover: (highlight: boolean) => void;
    setBarSelectedIndex: (index: number | null) => void;
    setBarSelectedCategory: (category: string | null) => void;

    setLineCurveType: (curveType: CurveType) => void;
    setLineStrokeWidth: (width: number) => void;
    setLineStrokeStyle: (style: StrokeStyle) => void;
    setLineShowMarkers: (show: boolean) => void;
    setLineMarkerShape: (shape: MarkerShape) => void;
    setLineMarkerSize: (size: number) => void;
    setLineSortOrder: (order: SortOrder) => void;
    setLineSortBy: (sortBy: "x" | "y" | "none") => void;
    setLineMultiSeries: (enabled: boolean) => void;
    setLineSeriesFields: (fields: string[]) => void;
    setLineAreaFill: (fill: boolean) => void;
    setLineAreaFillOpacity: (opacity: number) => void;
    setLineAreaGradient: (gradient: boolean) => void;
    setLineZoomable: (zoomable: boolean) => void;
    setLinePannable: (pannable: boolean) => void;
    setLineConnectNulls: (connect: boolean) => void;
    setLineShowMinMax: (show: boolean) => void;

    setAreaCurveType: (curveType: CurveType) => void;
    setAreaStrokeWidth: (width: number) => void;
    setAreaShowLineBorder: (show: boolean) => void;
    setAreaShowMarkers: (show: boolean) => void;
    setAreaStacked: (stacked: boolean) => void;
    setAreaStackOffset: (offset: "none" | "expand" | "silhouette" | "wiggle") => void;
    setAreaFillOpacity: (opacity: number) => void;
    setAreaGradientFill: (gradient: boolean) => void;
    setAreaBaselineValue: (value: number) => void;
    setAreaSortOrder: (order: SortOrder) => void;
    setAreaMultiSeries: (enabled: boolean) => void;
    setAreaSeriesFields: (fields: string[]) => void;
    setAreaZoomable: (zoomable: boolean) => void;
    setAreaPannable: (pannable: boolean) => void;

    setPieInnerRadius: (radius: number) => void;
    setPieOuterRadius: (radius: number) => void;
    setPieStartAngle: (angle: number) => void;
    setPieEndAngle: (angle: number) => void;
    setPiePadAngle: (angle: number) => void;
    setPieCornerRadius: (radius: number) => void;
    setPieSortOrder: (order: SortOrder) => void;
    setPieShowLabels: (show: boolean) => void;
    setPieLabelFormat: (format: string) => void;
    setPieLabelPosition: (position: LabelPosition) => void;
    setPieMaxSlices: (max: number) => void;
    setPieOtherSliceLabel: (label: string) => void;
    setPieExplodeSliceIndex: (index: number | null) => void;
    setPieExplodeOffset: (offset: number) => void;
    setPieCenterLabel: (label: string) => void;

    setScatterDataFieldSize: (field: string | null) => void;
    setScatterDataFieldColor: (field: string | null) => void;
    setScatterPointSize: (size: number) => void;
    setScatterMinPointSize: (size: number) => void;
    setScatterMaxPointSize: (size: number) => void;
    setScatterPointShape: (shape: MarkerShape) => void;
    setScatterPointOpacity: (opacity: number) => void;
    setScatterSampleMethod: (method: SampleMethod) => void;
    setScatterSampleSize: (size: number) => void;
    setScatterZoomable: (zoomable: boolean) => void;
    setScatterPannable: (pannable: boolean) => void;
    setScatterShowTrendLine: (show: boolean) => void;
    setScatterTrendLineType: (type: TrendLineType) => void;
    setScatterHighlightOutliers: (highlight: boolean) => void;
    setScatterOutlierThreshold: (threshold: number) => void;
    setScatterJitter: (jitter: number) => void;
    setScatterShowQuadrants: (show: boolean) => void;

    setXAxis: (axis: Partial<AxisConfig>) => void;
    setYAxis: (axis: Partial<AxisConfig>) => void;
}

const initialConfig = getDefaultConfig("bar");

export const useChartConfigStore = create<ChartConfigState & ChartConfigActions>()(
    subscribeWithSelector((set, get) => ({
        config: initialConfig,
        isDirty: false,
        lastApplied: null,

        setChartType: (type) => {
            const currentConfig = get().config;
            const newConfig = getDefaultConfig(type);
            newConfig.dataFieldX = currentConfig.dataFieldX;
            newConfig.dataFieldY = currentConfig.dataFieldY;
            newConfig.title = currentConfig.title;
            set({ config: newConfig, isDirty: true });
        },

        resetToDefaults: () => {
            const type = get().config.type;
            set({ config: getDefaultConfig(type), isDirty: true });
        },

        applyConfig: () => {
            const config = get().config;
            set({ lastApplied: JSON.parse(JSON.stringify(config)), isDirty: false });
        },

        revertChanges: () => {
            const lastApplied = get().lastApplied;
            if (lastApplied) {
                set({ config: JSON.parse(JSON.stringify(lastApplied)), isDirty: false });
            }
        },

        loadConfig: (config) => {
            set({ config: JSON.parse(JSON.stringify(config)), isDirty: false, lastApplied: JSON.parse(JSON.stringify(config)) });
        },

        setDataFieldX: (field) => set((state) => ({
            config: { ...state.config, dataFieldX: field },
            isDirty: true,
        })),

        setDataFieldY: (field) => set((state) => ({
            config: { ...state.config, dataFieldY: field },
            isDirty: true,
        })),

        setAggregation: (aggregation) => set((state) => ({
            config: { ...state.config, aggregation },
            isDirty: true,
        })),

        setTitle: (title) => set((state) => ({
            config: { ...state.config, title },
            isDirty: true,
        })),

        setColorScheme: (colorScheme) => set((state) => ({
            config: { ...state.config, colorScheme },
            isDirty: true,
        })),

        setMaxPoints: (maxPoints) => set((state) => ({
            config: { ...state.config, maxPoints },
            isDirty: true,
        })),

        setAnimationDuration: (animationDuration) => set((state) => ({
            config: { ...state.config, animationDuration },
            isDirty: true,
        })),

        setBackgroundColor: (backgroundColor) => set((state) => ({
            config: { ...state.config, backgroundColor },
            isDirty: true,
        })),

        setPadding: (padding) => set((state) => ({
            config: { ...state.config, padding: { ...state.config.padding, ...padding } },
            isDirty: true,
        })),

        setTooltip: (tooltip) => set((state) => ({
            config: { ...state.config, tooltip: { ...state.config.tooltip, ...tooltip } },
            isDirty: true,
        })),

        setLegend: (legend) => set((state) => ({
            config: { ...state.config, legend: { ...state.config.legend, ...legend } },
            isDirty: true,
        })),

        setBarOrientation: (orientation) => set((state) => {
            if (state.config.type !== "bar") return state;
            return { config: { ...state.config, orientation }, isDirty: true };
        }),

        setBarStacked: (stacked) => set((state) => {
            if (state.config.type !== "bar") return state;
            return { config: { ...state.config, stacked, grouped: stacked ? false : state.config.grouped }, isDirty: true };
        }),

        setBarGrouped: (grouped) => set((state) => {
            if (state.config.type !== "bar") return state;
            return { config: { ...state.config, grouped, stacked: grouped ? false : state.config.stacked }, isDirty: true };
        }),

        setBarWidth: (barWidth) => set((state) => {
            if (state.config.type !== "bar") return state;
            return { config: { ...state.config, barWidth }, isDirty: true };
        }),

        setBarMaxWidth: (maxBarWidth) => set((state) => {
            if (state.config.type !== "bar") return state;
            return { config: { ...state.config, maxBarWidth }, isDirty: true };
        }),

        setBarSpacing: (barSpacing) => set((state) => {
            if (state.config.type !== "bar") return state;
            return { config: { ...state.config, barSpacing }, isDirty: true };
        }),

        setBarCategoryGap: (barCategoryGap) => set((state) => {
            if (state.config.type !== "bar") return state;
            return { config: { ...state.config, barCategoryGap }, isDirty: true };
        }),

        setBarRadius: (barRadius) => set((state) => {
            if (state.config.type !== "bar") return state;
            return { config: { ...state.config, barRadius }, isDirty: true };
        }),

        setBarSortOrder: (sortOrder) => set((state) => {
            if (state.config.type !== "bar") return state;
            return { config: { ...state.config, sortOrder }, isDirty: true };
        }),

        setBarSortBy: (sortBy) => set((state) => {
            if (state.config.type !== "bar") return state;
            return { config: { ...state.config, sortBy }, isDirty: true };
        }),

        setBarShowValueLabels: (showValueLabels) => set((state) => {
            if (state.config.type !== "bar") return state;
            return { config: { ...state.config, showValueLabels }, isDirty: true };
        }),

        setBarValueLabelPosition: (valueLabelPosition) => set((state) => {
            if (state.config.type !== "bar") return state;
            return { config: { ...state.config, valueLabelPosition }, isDirty: true };
        }),

        setBarValueLabelFontSize: (valueLabelFontSize) => set((state) => {
            if (state.config.type !== "bar") return state;
            return { config: { ...state.config, valueLabelFontSize }, isDirty: true };
        }),

        setBarValueLabelFontColor: (valueLabelFontColor) => set((state) => {
            if (state.config.type !== "bar") return state;
            return { config: { ...state.config, valueLabelFontColor }, isDirty: true };
        }),

        setBarHighlightOnHover: (highlightOnHover) => set((state) => {
            if (state.config.type !== "bar") return state;
            return { config: { ...state.config, highlightOnHover }, isDirty: true };
        }),

        setBarSelectedIndex: (selectedBarIndex) => set((state) => {
            if (state.config.type !== "bar") return state;
            return { config: { ...state.config, selectedBarIndex }, isDirty: true };
        }),

        setBarSelectedCategory: (selectedCategory) => set((state) => {
            if (state.config.type !== "bar") return state;
            return { config: { ...state.config, selectedCategory }, isDirty: true };
        }),

        setLineCurveType: (curveType) => set((state) => {
            if (state.config.type !== "line") return state;
            return { config: { ...state.config, curveType }, isDirty: true };
        }),

        setLineStrokeWidth: (strokeWidth) => set((state) => {
            if (state.config.type !== "line") return state;
            return { config: { ...state.config, strokeWidth }, isDirty: true };
        }),

        setLineStrokeStyle: (strokeStyle) => set((state) => {
            if (state.config.type !== "line") return state;
            return { config: { ...state.config, strokeStyle }, isDirty: true };
        }),

        setLineShowMarkers: (showMarkers) => set((state) => {
            if (state.config.type !== "line") return state;
            return { config: { ...state.config, showMarkers }, isDirty: true };
        }),

        setLineMarkerShape: (markerShape) => set((state) => {
            if (state.config.type !== "line") return state;
            return { config: { ...state.config, markerShape }, isDirty: true };
        }),

        setLineMarkerSize: (markerSize) => set((state) => {
            if (state.config.type !== "line") return state;
            return { config: { ...state.config, markerSize }, isDirty: true };
        }),

        setLineSortOrder: (sortOrder) => set((state) => {
            if (state.config.type !== "line") return state;
            return { config: { ...state.config, sortOrder }, isDirty: true };
        }),

        setLineSortBy: (sortBy) => set((state) => {
            if (state.config.type !== "line") return state;
            return { config: { ...state.config, sortBy }, isDirty: true };
        }),

        setLineMultiSeries: (multiSeries) => set((state) => {
            if (state.config.type !== "line") return state;
            return { config: { ...state.config, multiSeries }, isDirty: true };
        }),

        setLineSeriesFields: (seriesFields) => set((state) => {
            if (state.config.type !== "line") return state;
            return { config: { ...state.config, seriesFields }, isDirty: true };
        }),

        setLineAreaFill: (areaFill) => set((state) => {
            if (state.config.type !== "line") return state;
            return { config: { ...state.config, areaFill }, isDirty: true };
        }),

        setLineAreaFillOpacity: (areaFillOpacity) => set((state) => {
            if (state.config.type !== "line") return state;
            return { config: { ...state.config, areaFillOpacity }, isDirty: true };
        }),

        setLineAreaGradient: (areaGradient) => set((state) => {
            if (state.config.type !== "line") return state;
            return { config: { ...state.config, areaGradient }, isDirty: true };
        }),

        setLineZoomable: (zoomable) => set((state) => {
            if (state.config.type !== "line") return state;
            return { config: { ...state.config, zoomable }, isDirty: true };
        }),

        setLinePannable: (pannable) => set((state) => {
            if (state.config.type !== "line") return state;
            return { config: { ...state.config, pannable }, isDirty: true };
        }),

        setLineConnectNulls: (connectNulls) => set((state) => {
            if (state.config.type !== "line") return state;
            return { config: { ...state.config, connectNulls }, isDirty: true };
        }),

        setLineShowMinMax: (showMinMax) => set((state) => {
            if (state.config.type !== "line") return state;
            return { config: { ...state.config, showMinMax }, isDirty: true };
        }),

        setAreaCurveType: (curveType) => set((state) => {
            if (state.config.type !== "area") return state;
            return { config: { ...state.config, curveType }, isDirty: true };
        }),

        setAreaStrokeWidth: (strokeWidth) => set((state) => {
            if (state.config.type !== "area") return state;
            return { config: { ...state.config, strokeWidth }, isDirty: true };
        }),

        setAreaShowLineBorder: (showLineBorder) => set((state) => {
            if (state.config.type !== "area") return state;
            return { config: { ...state.config, showLineBorder }, isDirty: true };
        }),

        setAreaShowMarkers: (showMarkers) => set((state) => {
            if (state.config.type !== "area") return state;
            return { config: { ...state.config, showMarkers }, isDirty: true };
        }),

        setAreaStacked: (stacked) => set((state) => {
            if (state.config.type !== "area") return state;
            return { config: { ...state.config, stacked }, isDirty: true };
        }),

        setAreaStackOffset: (stackOffset) => set((state) => {
            if (state.config.type !== "area") return state;
            return { config: { ...state.config, stackOffset }, isDirty: true };
        }),

        setAreaFillOpacity: (fillOpacity) => set((state) => {
            if (state.config.type !== "area") return state;
            return { config: { ...state.config, fillOpacity }, isDirty: true };
        }),

        setAreaGradientFill: (gradientFill) => set((state) => {
            if (state.config.type !== "area") return state;
            return { config: { ...state.config, gradientFill }, isDirty: true };
        }),

        setAreaBaselineValue: (baselineValue) => set((state) => {
            if (state.config.type !== "area") return state;
            return { config: { ...state.config, baselineValue }, isDirty: true };
        }),

        setAreaSortOrder: (sortOrder) => set((state) => {
            if (state.config.type !== "area") return state;
            return { config: { ...state.config, sortOrder }, isDirty: true };
        }),

        setAreaMultiSeries: (multiSeries) => set((state) => {
            if (state.config.type !== "area") return state;
            return { config: { ...state.config, multiSeries }, isDirty: true };
        }),

        setAreaSeriesFields: (seriesFields) => set((state) => {
            if (state.config.type !== "area") return state;
            return { config: { ...state.config, seriesFields }, isDirty: true };
        }),

        setAreaZoomable: (zoomable) => set((state) => {
            if (state.config.type !== "area") return state;
            return { config: { ...state.config, zoomable }, isDirty: true };
        }),

        setAreaPannable: (pannable) => set((state) => {
            if (state.config.type !== "area") return state;
            return { config: { ...state.config, pannable }, isDirty: true };
        }),

        setPieInnerRadius: (innerRadius) => set((state) => {
            if (state.config.type !== "pie") return state;
            return { config: { ...state.config, innerRadius }, isDirty: true };
        }),

        setPieOuterRadius: (outerRadius) => set((state) => {
            if (state.config.type !== "pie") return state;
            return { config: { ...state.config, outerRadius }, isDirty: true };
        }),

        setPieStartAngle: (startAngle) => set((state) => {
            if (state.config.type !== "pie") return state;
            return { config: { ...state.config, startAngle }, isDirty: true };
        }),

        setPieEndAngle: (endAngle) => set((state) => {
            if (state.config.type !== "pie") return state;
            return { config: { ...state.config, endAngle }, isDirty: true };
        }),

        setPiePadAngle: (padAngle) => set((state) => {
            if (state.config.type !== "pie") return state;
            return { config: { ...state.config, padAngle }, isDirty: true };
        }),

        setPieCornerRadius: (cornerRadius) => set((state) => {
            if (state.config.type !== "pie") return state;
            return { config: { ...state.config, cornerRadius }, isDirty: true };
        }),

        setPieSortOrder: (sortOrder) => set((state) => {
            if (state.config.type !== "pie") return state;
            return { config: { ...state.config, sortOrder }, isDirty: true };
        }),

        setPieShowLabels: (showLabels) => set((state) => {
            if (state.config.type !== "pie") return state;
            return { config: { ...state.config, showLabels }, isDirty: true };
        }),

        setPieLabelFormat: (labelFormat) => set((state) => {
            if (state.config.type !== "pie") return state;
            return { config: { ...state.config, labelFormat }, isDirty: true };
        }),

        setPieLabelPosition: (labelPosition) => set((state) => {
            if (state.config.type !== "pie") return state;
            return { config: { ...state.config, labelPosition }, isDirty: true };
        }),

        setPieMaxSlices: (maxSlices) => set((state) => {
            if (state.config.type !== "pie") return state;
            return { config: { ...state.config, maxSlices }, isDirty: true };
        }),

        setPieOtherSliceLabel: (otherSliceLabel) => set((state) => {
            if (state.config.type !== "pie") return state;
            return { config: { ...state.config, otherSliceLabel }, isDirty: true };
        }),

        setPieExplodeSliceIndex: (explodeSliceIndex) => set((state) => {
            if (state.config.type !== "pie") return state;
            return { config: { ...state.config, explodeSliceIndex }, isDirty: true };
        }),

        setPieExplodeOffset: (explodeOffset) => set((state) => {
            if (state.config.type !== "pie") return state;
            return { config: { ...state.config, explodeOffset }, isDirty: true };
        }),

        setPieCenterLabel: (centerLabel) => set((state) => {
            if (state.config.type !== "pie") return state;
            return { config: { ...state.config, centerLabel }, isDirty: true };
        }),

        setScatterDataFieldSize: (dataFieldSize) => set((state) => {
            if (state.config.type !== "scatter") return state;
            return { config: { ...state.config, dataFieldSize }, isDirty: true };
        }),

        setScatterDataFieldColor: (dataFieldColor) => set((state) => {
            if (state.config.type !== "scatter") return state;
            return { config: { ...state.config, dataFieldColor }, isDirty: true };
        }),

        setScatterPointSize: (pointSize) => set((state) => {
            if (state.config.type !== "scatter") return state;
            return { config: { ...state.config, pointSize }, isDirty: true };
        }),

        setScatterMinPointSize: (minPointSize) => set((state) => {
            if (state.config.type !== "scatter") return state;
            return { config: { ...state.config, minPointSize }, isDirty: true };
        }),

        setScatterMaxPointSize: (maxPointSize) => set((state) => {
            if (state.config.type !== "scatter") return state;
            return { config: { ...state.config, maxPointSize }, isDirty: true };
        }),

        setScatterPointShape: (pointShape) => set((state) => {
            if (state.config.type !== "scatter") return state;
            return { config: { ...state.config, pointShape }, isDirty: true };
        }),

        setScatterPointOpacity: (pointOpacity) => set((state) => {
            if (state.config.type !== "scatter") return state;
            return { config: { ...state.config, pointOpacity }, isDirty: true };
        }),

        setScatterSampleMethod: (sampleMethod) => set((state) => {
            if (state.config.type !== "scatter") return state;
            return { config: { ...state.config, sampleMethod }, isDirty: true };
        }),

        setScatterSampleSize: (sampleSize) => set((state) => {
            if (state.config.type !== "scatter") return state;
            return { config: { ...state.config, sampleSize }, isDirty: true };
        }),

        setScatterZoomable: (zoomable) => set((state) => {
            if (state.config.type !== "scatter") return state;
            return { config: { ...state.config, zoomable }, isDirty: true };
        }),

        setScatterPannable: (pannable) => set((state) => {
            if (state.config.type !== "scatter") return state;
            return { config: { ...state.config, pannable }, isDirty: true };
        }),

        setScatterShowTrendLine: (showTrendLine) => set((state) => {
            if (state.config.type !== "scatter") return state;
            return { config: { ...state.config, showTrendLine }, isDirty: true };
        }),

        setScatterTrendLineType: (trendLineType) => set((state) => {
            if (state.config.type !== "scatter") return state;
            return { config: { ...state.config, trendLineType }, isDirty: true };
        }),

        setScatterHighlightOutliers: (highlightOutliers) => set((state) => {
            if (state.config.type !== "scatter") return state;
            return { config: { ...state.config, highlightOutliers }, isDirty: true };
        }),

        setScatterOutlierThreshold: (outlierThreshold) => set((state) => {
            if (state.config.type !== "scatter") return state;
            return { config: { ...state.config, outlierThreshold }, isDirty: true };
        }),

        setScatterJitter: (jitter) => set((state) => {
            if (state.config.type !== "scatter") return state;
            return { config: { ...state.config, jitter }, isDirty: true };
        }),

        setScatterShowQuadrants: (showQuadrants) => set((state) => {
            if (state.config.type !== "scatter") return state;
            return { config: { ...state.config, showQuadrants }, isDirty: true };
        }),

        setXAxis: (axis) => set((state) => {
            const config = state.config;
            if (!("xAxis" in config)) return state;
            return {
                config: { ...config, xAxis: { ...config.xAxis, ...axis } } as ChartConfig,
                isDirty: true,
            };
        }),

        setYAxis: (axis) => set((state) => {
            const config = state.config;
            if (!("yAxis" in config)) return state;
            return {
                config: { ...config, yAxis: { ...config.yAxis, ...axis } } as ChartConfig,
                isDirty: true,
            };
        }),
    }))
);

export function getBarConfig(config: ChartConfig): BarChartConfig | null {
    return config.type === "bar" ? config : null;
}

export function getLineConfig(config: ChartConfig): LineChartConfig | null {
    return config.type === "line" ? config : null;
}

export function getAreaConfig(config: ChartConfig): AreaChartConfig | null {
    return config.type === "area" ? config : null;
}

export function getPieConfig(config: ChartConfig): PieChartConfig | null {
    return config.type === "pie" ? config : null;
}

export function getScatterConfig(config: ChartConfig): ScatterChartConfig | null {
    return config.type === "scatter" ? config : null;
}
