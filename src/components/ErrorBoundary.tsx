import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Global Error Boundary to prevent the entire application from crashing.
 * Provides a premium fallback UI with a recovery action.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
            <div className="w-16 h-16 bg-brand/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-brand" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
            <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={this.handleReset}
                className="w-full bg-brand text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-brand/90 transition-all active:scale-95 shadow-lg shadow-brand/20"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-white/5 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-95"
              >
                <Home className="w-4 h-4" />
                Go to Homepage
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 text-left">
                <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-2">Error Details</p>
                <code className="block p-3 bg-black/40 rounded-lg text-[10px] text-red-400 overflow-auto max-h-32 no-scrollbar">
                  {this.state.error?.message}
                </code>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
