import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Maximize2, Minimize2, Download, Loader2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useChartConfigStore } from "../../stores/chartConfigStore";
import { executeVisualizationQuery, executeScatterQuery } from "../../services/aiService";
import { menuService } from "../../services/menuService";
import { BarChart, LineChart, AreaChart, PieChart, ScatterChart } from "./charts";
import { cn } from "../../utils";
import type { ChartData, VisualizationSpec, ReductionReason } from "../../types";

interface ChartContainerProps {
    spec: VisualizationSpec;
}

/**
 * Get a user-friendly description for a reduction reason.
 */
function getReductionDescription(reason: ReductionReason): string {
    switch (reason) {
        case "auto-aggregation":
            return "Data was automatically aggregated";
        case "sampling":
            return "A representative sample is shown";
        case "top-n":
            return "Showing top categories only";
        case "date-binning":
            return "Dates were grouped for clarity";
        case "combined":
            return "Multiple optimizations applied";
        default:
            return "";
    }
}

/**
 * Get icon and color for reduction badge.
 */
function getReductionBadgeStyle(reason: ReductionReason): { icon: typeof Info; color: string } {
    switch (reason) {
        case "sampling":
            return { icon: AlertTriangle, color: "text-amber-600 bg-amber-50" };
        case "top-n":
            return { icon: Info, color: "text-blue-600 bg-blue-50" };
        default:
            return { icon: Info, color: "text-gray-600 bg-gray-50" };
    }
}

export function ChartContainer({ spec }: ChartContainerProps) {
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showReductionDetails, setShowReductionDetails] = useState(false);

    const { setProcessing } = useAppStore();
    // Subscribe to chart config store for real-time updates
    const chartConfig = useChartConfigStore((state) => state.config);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setProcessing(true, "Loading chart data...");

        try {
            // Use scatter-specific query for scatter plots (with sampling)
            const data = spec.chartType === "scatter"
                ? await executeScatterQuery(spec)
                : await executeVisualizationQuery(spec);
            setChartData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
            setProcessing(false);
        }
    }, [spec, setProcessing]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        fetchData();
    };

    const handleToggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const renderChart = () => {
        if (!chartData) return null;

        // Use chartConfig from store subscription (updates trigger re-render)
        switch (spec.chartType) {
            case "bar":
                return <BarChart data={chartData} config={chartConfig.type === "bar" ? chartConfig : undefined} />;
            case "line":
                return <LineChart data={chartData} config={chartConfig.type === "line" ? chartConfig : undefined} />;
            case "area":
                return <AreaChart data={chartData} config={chartConfig.type === "area" ? chartConfig : undefined} />;
            case "pie":
                return <PieChart data={chartData} config={chartConfig.type === "pie" ? chartConfig : undefined} />;
            case "scatter":
                return <ScatterChart data={chartData} config={chartConfig.type === "scatter" ? chartConfig : undefined} />;
            default:
                return <BarChart data={chartData} />;
        }
    };

    /**
     * Render reduction warning badge if data was reduced.
     * This is critical for user trust - they must know when they're seeing
     * aggregated, sampled, or truncated data.
     */
    const renderReductionBadge = () => {
        const metadata = chartData?.metadata;
        if (!metadata?.reduced) return null;

        const reason = metadata.reductionReason ?? "auto-aggregation";
        const { icon: Icon, color } = getReductionBadgeStyle(reason);
        const description = getReductionDescription(reason);

        return (
            <div className="relative">
                <button
                    onClick={() => setShowReductionDetails(!showReductionDetails)}
                    className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium",
                        color,
                        "hover:opacity-80 transition-opacity cursor-help"
                    )}
                    title="Click for details"
                >
                    <Icon size={10} />
                    <span>Data optimized</span>
                </button>

                {/* Dropdown with detailed reduction info */}
                {showReductionDetails && (
                    <div className="absolute top-full right-0 mt-1 z-50 w-64 bg-white border border-border rounded shadow-lg p-3">
                        <div className="text-xs space-y-2">
                            <div className="font-medium text-text">{description}</div>

                            {metadata.warningMessage && (
                                <div className="text-text-muted">
                                    {metadata.warningMessage}
                                </div>
                            )}

                            <div className="border-t border-border pt-2 space-y-1 text-text-muted">
                                <div className="flex justify-between">
                                    <span>Original rows:</span>
                                    <span className="font-mono">
                                        {(metadata.originalRowEstimate ?? 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Displayed:</span>
                                    <span className="font-mono">
                                        {(metadata.returnedPoints ?? 0).toLocaleString()}
                                    </span>
                                </div>

                                {metadata.sampleRatio !== undefined && (
                                    <div className="flex justify-between">
                                        <span>Sample rate:</span>
                                        <span className="font-mono">
                                            {(metadata.sampleRatio * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                )}

                                {metadata.topNValue !== undefined && (
                                    <div className="flex justify-between">
                                        <span>Top categories:</span>
                                        <span className="font-mono">{metadata.topNValue}</span>
                                    </div>
                                )}
                            </div>

                            <div className="text-[9px] text-text-muted italic pt-1 border-t border-border">
                                Data is optimized for performance while preserving accuracy.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const containerClass = cn(
        "bg-surface border border-border rounded-sm flex flex-col",
        isFullscreen
            ? "fixed inset-4 z-50 shadow-lg"
            : "w-full h-full"
    );

    return (
        <>
            {isFullscreen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40"
                    onClick={handleToggleFullscreen}
                />
            )}

            {/* Close reduction details when clicking outside */}
            {showReductionDetails && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowReductionDetails(false)}
                />
            )}

            <div className={containerClass} data-chart-container>
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-medium text-text truncate max-w-xs">
                            {spec.title || "Visualization"}
                        </h3>
                        {chartData?.metadata && (
                            <span className="text-xs text-text-muted">
                                ({chartData.metadata.totalRecords.toLocaleString()} records)
                            </span>
                        )}
                        {renderReductionBadge()}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className={cn(
                                "p-2 rounded-sm text-text-muted hover:text-text hover:bg-neutral-100",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                            title="Refresh"
                        >
                            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                        </button>
                        <button
                            onClick={handleToggleFullscreen}
                            className={cn(
                                "p-2 rounded-sm text-text-muted hover:text-text hover:bg-neutral-100",
                                isFullscreen && "text-primary bg-primary-muted"
                            )}
                            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                        <button
                            onClick={() => menuService.emit("export_chart")}
                            className="p-2 rounded-sm text-text-muted hover:text-text hover:bg-neutral-100"
                            title="Export chart as image"
                        >
                            <Download size={16} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 min-h-0 p-6">
                    {isLoading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <Loader2 size={32} className="animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                            <AlertCircle size={32} className="text-destructive" />
                            <p className="text-sm text-text-secondary">Failed to load chart</p>
                            <p className="text-xs text-text-muted max-w-sm text-center">{error}</p>
                            <button
                                onClick={handleRefresh}
                                className="mt-2 px-4 py-2 text-xs bg-primary text-white rounded-sm hover:bg-primary-hover"
                            >
                                Try again
                            </button>
                        </div>
                    ) : chartData ? (
                        renderChart()
                    ) : null}
                </div>
                {chartData?.metadata && !isLoading && !error && (
                    <div className="px-4 py-3 border-t border-border text-xs text-text-muted flex items-center gap-4">
                        <span>X: {chartData.metadata.xLabel}</span>
                        <span>Y: {chartData.metadata.yLabel}</span>
                        {chartData.metadata.reduced && chartData.metadata.returnedPoints && (
                            <span className="ml-auto">
                                Showing {chartData.metadata.returnedPoints.toLocaleString()} points
                            </span>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
