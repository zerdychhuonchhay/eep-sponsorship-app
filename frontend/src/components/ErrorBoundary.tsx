import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BugIcon } from './Icons.tsx';
import Button from './ui/Button.tsx';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex items-center justify-center h-screen bg-gray-2 dark:bg-box-dark-2">
            <div className="text-center p-10 bg-white dark:bg-box-dark rounded-lg shadow-md max-w-lg mx-auto">
                <div className="flex justify-center mb-4">
                    <BugIcon className="w-16 h-16 text-danger" />
                </div>
                <h1 className="text-2xl font-bold text-black dark:text-white mb-2">Oops! Something went wrong.</h1>
                <p className="text-body-color dark:text-gray-400 mb-6">
                    We've encountered an unexpected error. Our team has been notified. Please try refreshing the page.
                </p>
                <Button onClick={this.handleReload} variant="primary">
                    Refresh Page
                </Button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
