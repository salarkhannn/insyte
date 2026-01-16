import { useCallback } from "react";
import toast from "react-hot-toast";

/**
 * Centralized error handling hook for Tauri API calls.
 * Wraps async functions with consistent error handling and toast notifications.
 */
export function useErrorHandler() {
    /**
     * Wraps an async function with error handling.
     * Errors are shown as toast notifications and optionally passed to a callback.
     */
    const handleAsync = useCallback(
        async <T,>(
            asyncFn: () => Promise<T>,
            options?: {
                successMessage?: string;
                errorMessage?: string;
                onError?: (error: Error) => void;
                silent?: boolean; // Don't show toast on error
            }
        ): Promise<T | null> => {
            try {
                const result = await asyncFn();
                if (options?.successMessage) {
                    toast.success(options.successMessage);
                }
                return result;
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                const message = error.message;

                // Skip cancelled operations (user intentionally cancelled)
                if (message.includes("cancelled") || message.includes("canceled")) {
                    return null;
                }

                if (!options?.silent) {
                    toast.error(options?.errorMessage || message);
                }

                options?.onError?.(error);
                return null;
            }
        },
        []
    );

    /**
     * Show a success toast notification.
     */
    const showSuccess = useCallback((message: string) => {
        toast.success(message);
    }, []);

    /**
     * Show an error toast notification.
     */
    const showError = useCallback((message: string) => {
        toast.error(message);
    }, []);

    /**
     * Show an info toast notification.
     */
    const showInfo = useCallback((message: string) => {
        toast(message, {
            icon: "ℹ️",
        });
    }, []);

    return {
        handleAsync,
        showSuccess,
        showError,
        showInfo,
    };
}
