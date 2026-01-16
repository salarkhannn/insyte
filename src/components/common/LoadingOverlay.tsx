import { Loader2 } from "lucide-react";
import { useAppStore } from "../../stores/appStore";

interface LoadingOverlayProps {
    /** Show in full-screen mode */
    fullScreen?: boolean;
    /** Custom loading message */
    message?: string;
    /** Whether to show the overlay */
    show?: boolean;
}

/**
 * Loading overlay component that displays a spinner with optional message.
 * Can be used in full-screen mode or as a component overlay.
 */
export function LoadingOverlay({ fullScreen = true, message, show }: LoadingOverlayProps) {
    const { isProcessing, processingMessage } = useAppStore();
    
    const isVisible = show ?? isProcessing;
    const displayMessage = message ?? processingMessage;

    if (!isVisible) return null;

    const overlayClasses = fullScreen
        ? "fixed inset-0 z-50"
        : "absolute inset-0 z-10";

    return (
        <div 
            className={`${overlayClasses} flex items-center justify-center bg-white/80 backdrop-blur-sm`}
            role="progressbar"
            aria-busy="true"
            aria-label={displayMessage || "Loading"}
        >
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                {displayMessage && (
                    <p className="text-sm text-text-secondary font-medium">
                        {displayMessage}
                    </p>
                )}
            </div>
        </div>
    );
}

/**
 * Standalone loading spinner for inline use.
 */
export function LoadingSpinner({ size = 16 }: { size?: number }) {
    return (
        <Loader2 
            className="text-primary animate-spin" 
            style={{ width: size, height: size }}
            aria-hidden="true"
        />
    );
}
