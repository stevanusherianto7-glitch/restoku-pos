import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component that catches React render errors
 * and displays a styled error UI instead of a white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[Restoku] React Error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen w-full bg-white flex items-center justify-center p-8 font-sans">
          <div className="max-w-lg w-full">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-red-700 text-xs font-semibold mb-4">
                <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                React Error
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-sm text-slate-600 mb-6">
                Terjadi kesalahan dalam rendering komponen. Periksa konsol browser untuk detail lengkap.
              </p>
            </div>
            <div className="bg-slate-950 rounded-xl p-4 overflow-auto">
              <p className="text-red-400 text-sm font-mono whitespace-pre-wrap">
                {this.state.error?.toString()}
              </p>
              {this.state.error?.stack && (
                <p className="text-slate-500 text-xs font-mono mt-3 whitespace-pre-wrap leading-relaxed">
                  {this.state.error.stack}
                </p>
              )}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-6 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
