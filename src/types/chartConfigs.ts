export type Orientation = "vertical" | "horizontal";
export type AggregationType = "sum" | "avg" | "count" | "min" | "max" | "median";
export type SortOrder = "asc" | "desc" | "none";
export type GridLineStyle = "solid" | "dashed" | "dotted";
export type LegendPosition = "top" | "bottom" | "left" | "right" | "none";
export type CurveType = "linear" | "step" | "stepAfter" | "stepBefore" | "smooth" | "monotone";
export type StrokeStyle = "solid" | "dashed" | "dotted";
export type MarkerShape = "circle" | "square" | "triangle" | "diamond" | "cross" | "star";
export type LabelPosition = "inside" | "outside" | "center";
export type SampleMethod = "random" | "stratified" | "systematic";
export type TrendLineType = "none" | "linear" | "polynomial" | "exponential" | "logarithmic" | "loess";

export interface AxisConfig {
    title: string;
    titleFontSize: number;
    titleFontFamily: string;
    titleFontColor: string;
    labelFontSize: number;
    labelFontFamily: string;
    labelFontColor: string;
    labelRotation: number;
    showGridLines: boolean;
    gridLineStyle: GridLineStyle;
    gridLineColor: string;
    showAxisLine: boolean;
    axisLineColor: string;
    tickCount: number | "auto";
    tickFormat: string;
    min: number | "auto";
    max: number | "auto";
}

export interface TooltipConfig {
    enabled: boolean;
    format: string;
    showSeriesName: boolean;
    showPercentage: boolean;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    fontSize: number;
    fontFamily: string;
}

export interface LegendConfig {
    show: boolean;
    position: LegendPosition;
    fontSize: number;
    fontFamily: string;
    fontColor: string;
    itemSpacing: number;
    iconSize: number;
}

interface BaseChartConfig {
    dataFieldX: string | null;
    dataFieldY: string | null;
    aggregation: AggregationType;
    title: string;
    titleFontSize: number;
    titleFontFamily: string;
    titleFontColor: string;
    colorScheme: string[];
    maxPoints: number;
    animationDuration: number;
    tooltip: TooltipConfig;
    legend: LegendConfig;
    backgroundColor: string;
    padding: { top: number; right: number; bottom: number; left: number };
}

export interface BarChartConfig extends BaseChartConfig {
    type: "bar";
    orientation: Orientation;
    stacked: boolean;
    grouped: boolean;
    barWidth: number | "auto";
    maxBarWidth: number;
    barSpacing: number;
    barCategoryGap: number;
    barRadius: [number, number, number, number];
    xAxis: AxisConfig;
    yAxis: AxisConfig;
    sortOrder: SortOrder;
    sortBy: "x" | "y" | "none";
    showValueLabels: boolean;
    valueLabelPosition: "top" | "center" | "bottom";
    valueLabelFontSize: number;
    valueLabelFontColor: string;
    highlightOnHover: boolean;
    selectedBarIndex: number | null;
    selectedCategory: string | null;
}

export interface LineChartConfig extends BaseChartConfig {
    type: "line";
    curveType: CurveType;
    strokeWidth: number;
    strokeStyle: StrokeStyle;
    showMarkers: boolean;
    markerShape: MarkerShape;
    markerSize: number;
    markerFill: boolean;
    markerBorderWidth: number;
    xAxis: AxisConfig;
    yAxis: AxisConfig;
    sortOrder: SortOrder;
    sortBy: "x" | "y" | "none";
    multiSeries: boolean;
    seriesFields: string[];
    areaFill: boolean;
    areaFillOpacity: number;
    areaGradient: boolean;
    zoomable: boolean;
    pannable: boolean;
    connectNulls: boolean;
    showMinMax: boolean;
}

export interface AreaChartConfig extends BaseChartConfig {
    type: "area";
    curveType: CurveType;
    strokeWidth: number;
    strokeStyle: StrokeStyle;
    showLineBorder: boolean;
    showMarkers: boolean;
    markerShape: MarkerShape;
    markerSize: number;
    stacked: boolean;
    stackOffset: "none" | "expand" | "silhouette" | "wiggle";
    fillOpacity: number;
    gradientFill: boolean;
    gradientDirection: "vertical" | "horizontal";
    baselineValue: number;
    xAxis: AxisConfig;
    yAxis: AxisConfig;
    sortOrder: SortOrder;
    sortBy: "x" | "y" | "none";
    multiSeries: boolean;
    seriesFields: string[];
    zoomable: boolean;
    pannable: boolean;
    connectNulls: boolean;
}

export interface PieChartConfig extends BaseChartConfig {
    type: "pie";
    dataFieldCategory: string | null;
    dataFieldValue: string | null;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    padAngle: number;
    cornerRadius: number;
    sortOrder: SortOrder;
    showLabels: boolean;
    labelFormat: string;
    labelPosition: LabelPosition;
    labelMinAngle: number;
    showLabelLines: boolean;
    labelLineLength: number;
    maxSlices: number;
    otherSliceLabel: string;
    explodeSliceIndex: number | null;
    explodeOffset: number;
    centerLabel: string;
    centerLabelFontSize: number;
    centerLabelFontColor: string;
}

export interface ScatterChartConfig extends BaseChartConfig {
    type: "scatter";
    dataFieldSize: string | null;
    dataFieldColor: string | null;
    pointSize: number;
    minPointSize: number;
    maxPointSize: number;
    pointShape: MarkerShape;
    pointOpacity: number;
    pointBorderWidth: number;
    pointBorderColor: string;
    xAxis: AxisConfig;
    yAxis: AxisConfig;
    sampleMethod: SampleMethod;
    sampleSize: number;
    zoomable: boolean;
    pannable: boolean;
    showTrendLine: boolean;
    trendLineType: TrendLineType;
    trendLineColor: string;
    trendLineWidth: number;
    trendLineStyle: StrokeStyle;
    showConfidenceInterval: boolean;
    confidenceLevel: number;
    highlightOutliers: boolean;
    outlierThreshold: number;
    outlierColor: string;
    jitter: number;
    showQuadrants: boolean;
    quadrantOriginX: number | "mean" | "median";
    quadrantOriginY: number | "mean" | "median";
    quadrantColors: [string, string, string, string];
}

export type ChartConfig =
    | BarChartConfig
    | LineChartConfig
    | AreaChartConfig
    | PieChartConfig
    | ScatterChartConfig;

export type ChartType = ChartConfig["type"];
