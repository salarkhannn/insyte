import { useRef, useMemo } from "react";

interface ScrollableChartWrapperProps {
    dataPointCount: number;
    minPointSize?: number;
    pointPadding?: number;
    scrollDirection?: "horizontal" | "vertical";
    children: React.ReactNode;
}

const DEFAULT_MIN_POINT_SIZE = 32;
const DEFAULT_POINT_PADDING = 8;

export function ScrollableChartWrapper({
    dataPointCount,
    minPointSize = DEFAULT_MIN_POINT_SIZE,
    pointPadding = DEFAULT_POINT_PADDING,
    scrollDirection = "horizontal",
    children,
}: ScrollableChartWrapperProps) {
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    const dimensions = useMemo(() => {
        const minSize = dataPointCount * (minPointSize + pointPadding);
        
        return {
            width: scrollDirection === "horizontal" ? Math.max(minSize, 0) : undefined,
            height: scrollDirection === "vertical" ? Math.max(minSize, 0) : undefined,
        };
    }, [dataPointCount, minPointSize, pointPadding, scrollDirection]);

    const containerStyle: React.CSSProperties = {
        width: dimensions.width ? `${dimensions.width}px` : '100%',
        height: dimensions.height ? `${dimensions.height}px` : '100%',
    };

    const scrollStyle: React.CSSProperties = {
        overflow: scrollDirection === "vertical" ? 'hidden auto' : 'auto hidden',
    };

    return (
        <div 
            ref={scrollContainerRef}
            className="w-full h-full"
            style={scrollStyle}
        >
            <div style={containerStyle}>
                {children}
            </div>
        </div>
    );
}
