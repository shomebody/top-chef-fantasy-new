// src/components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../../utils/debugUtils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    logger.error('Error caught by boundary', { 
      prefix: 'ErrorBoundary', 
      data: { error, errorInfo },
      trace: true 
    });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error!, this.resetError);
        }
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="p-4 border-2 border-red-500 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200">
          <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
          <p className="mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
          <details className="mb-4 text-sm">
            <summary className="cursor-pointer">Error details</summary>
            <pre className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 rounded overflow-auto max-h-32">
              {this.state.error?.stack}
            </pre>
          </details>
          <button
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            onClick={this.resetError}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher Order Component to wrap any component with an ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.FC<P> {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
  return WrappedComponent;
}

export default ErrorBoundary;