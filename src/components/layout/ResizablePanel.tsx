import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { cn } from "../../utils";

interface ResizablePanelProps {
    children: ReactNode;
    side: "left" | "right";
    defaultWidth: number;
    minWidth: number;
    maxWidth: number;
    collapsed?: boolean;
    className?: string;
}

export function ResizablePanel({
    children,
    side,
    defaultWidth,
    minWidth,
    maxWidth,
    collapsed = false,
    className,
}: ResizablePanelProps) {
    const [width, setWidth] = useState(defaultWidth);
    const isResizing = useRef(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const startResize = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current || !panelRef.current) return;

            const panelRect = panelRef.current.getBoundingClientRect();
            let newWidth: number;

            if (side === "left") {
                newWidth = e.clientX - panelRect.left;
            } else {
                newWidth = panelRect.right - e.clientX;
            }

            newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
            setWidth(newWidth);
        };

        const handleMouseUp = () => {
            if (isResizing.current) {
                isResizing.current = false;
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            }
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [side, minWidth, maxWidth]);

    if (collapsed) {
        return null;
    }

    return (
        <div
            ref={panelRef}
            className={cn("relative flex shrink-0", className)}
            style={{ width }}
        >
            {children}
            <div
                onMouseDown={startResize}
                className={cn(
                    "absolute top-0 bottom-0 w-1 cursor-col-resize z-10",
                    "hover:bg-blue-500/50 active:bg-blue-500/50",
                    side === "left" ? "right-0" : "left-0"
                )}
            />
        </div>
    );
}
