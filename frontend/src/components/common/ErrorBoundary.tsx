import React, { Component, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy-900 flex items-center justify-center p-8">
          <div className="glass-card p-8 max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-8 h-8 text-danger" />
            </div>
            <h1 className="text-heading text-white mb-3">Something went wrong</h1>
            <p className="text-body text-gray-400 mb-6">
              An unexpected error occurred. This has been logged for review.
            </p>
            {this.state.error && (
              <div className="bg-navy-700 rounded-lg p-4 mb-6 text-left">
                <p className="text-caption font-mono text-danger-light break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="btn-primary inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
