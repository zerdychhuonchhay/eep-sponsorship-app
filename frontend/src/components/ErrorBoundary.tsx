import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-2 dark:bg-box-dark-2">
            <div className="w-full max-w-lg p-8 space-y-4 bg-white dark:bg-box-dark rounded-lg shadow-md text-center">
                 <h1 className="text-2xl font-bold text-danger">Oops! Something went wrong.</h1>
                 <p className="text-body-color dark:text-gray-300">We've encountered an unexpected error. Please try refreshing the page.</p>
                 {this.state.error && (
                    <details className="text-left text-xs text-body-color dark:text-gray-400 bg-gray-2 dark:bg-box-dark-2 p-2 rounded">
                        <summary>Error Details</summary>
                        <pre className="mt-2 whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </details>
                 )}
                 <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90">
                    Refresh Page
                 </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
