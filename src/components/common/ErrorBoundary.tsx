import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error boundary component that catches React errors and displays a friendly fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center h-full p-8 bg-surface">
                    <div className="flex flex-col items-center gap-4 max-w-md text-center">
                        <div className="p-4 rounded-full bg-error/10">
                            <AlertTriangle className="w-8 h-8 text-error" />
                        </div>
                        <h2 className="text-lg font-semibold text-text">
                            Something went wrong
                        </h2>
                        <p className="text-sm text-text-secondary">
                            An unexpected error occurred. Please try again or refresh the application.
                        </p>
                        {this.state.error && (
                            <details className="w-full text-left">
                                <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary">
                                    Technical details
                                </summary>
                                <pre className="mt-2 p-3 text-xs bg-neutral-100 rounded overflow-auto max-h-32 text-error">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={this.handleRetry}
                            className="flex items-center gap-2 px-4 py-2 mt-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary-hover transition-colors"
                            aria-label="Try again"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
