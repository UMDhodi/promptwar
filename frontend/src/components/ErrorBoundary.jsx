import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary — catches render-phase errors in any child tree.
 *
 * Wraps the three lazy-loaded panels (ChatAssistant, VenueMap,
 * WaitTimeDashboard) so that a single panel failure never crashes the
 * whole application.
 *
 * Usage:
 *   <ErrorBoundary label="Stadium Map">
 *     <VenueMap ... />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  /** Called synchronously after a descendant throws during rendering. */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /** Log the error + component stack for debugging. */
  componentDidCatch(error, info) {
    console.error(`[ErrorBoundary: ${this.props.label ?? 'panel'}]`, error, info.componentStack);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-gray-50 text-center"
        role="alert"
        aria-label={`Error in ${this.props.label ?? 'panel'}`}
      >
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500" aria-hidden="true" />
        </div>
        <div>
          <p className="font-bold text-gray-800 text-sm">
            {this.props.label ?? 'Panel'} failed to load
          </p>
          <p className="text-xs text-gray-500 mt-1 max-w-xs">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
        </div>
        <button
          onClick={this.handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Retry loading this panel"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }
}
