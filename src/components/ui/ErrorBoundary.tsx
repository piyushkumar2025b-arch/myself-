import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    // If it's an external extension error or transient WebGL context issue, do not break the whole UI
    const errorMsg = (error?.message || '').toLowerCase();
    if (
      errorMsg.includes('metamask') ||
      errorMsg.includes('ethereum') ||
      errorMsg.includes('chrome-extension') ||
      errorMsg.includes('webgl') ||
      errorMsg.includes('context loss') ||
      errorMsg.includes('context could not be created')
    ) {
      console.warn('Recovered from non-fatal WebGL/Extension error in ErrorBoundary:', error);
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorMsg = (error?.message || '').toLowerCase();
    if (
      errorMsg.includes('metamask') ||
      errorMsg.includes('ethereum') ||
      errorMsg.includes('chrome-extension') ||
      errorMsg.includes('webgl') ||
      errorMsg.includes('context loss') ||
      errorMsg.includes('context could not be created')
    ) {
      return;
    }
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white font-sans">
          <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl text-center space-y-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Something went wrong</h2>
              <p className="text-sm text-slate-400">
                An unexpected interface error occurred. You can reload the page to restore your view.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="p-3 text-xs font-mono bg-black/40 rounded-lg text-rose-300/80 border border-white/5 text-left overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
