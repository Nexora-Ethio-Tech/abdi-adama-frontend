import { Component, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Finance } from './Finance';
import { AuditorFinance } from './AuditorFinance';

/** Error Boundary – catches any render crash and shows the error instead of a white page. */
class AuditorFinanceErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[AuditorFinance] Render crash:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="m-8 p-8 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-3xl">
          <h2 className="text-lg font-black text-red-700 dark:text-red-300 mb-2">
            Page Error — Student Finance failed to render
          </h2>
          <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-all bg-red-100 dark:bg-red-900 p-4 rounded-xl overflow-auto max-h-64">
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Routes super-admin to group finance; auditors to auditor finance workspace. */
export const FinanceRoute = () => {
  const { role } = useUser();

  if (role === 'auditor') {
    return (
      <AuditorFinanceErrorBoundary>
        <AuditorFinance />
      </AuditorFinanceErrorBoundary>
    );
  }

  if (role === 'super-admin') {
    return <Finance />;
  }

  return <Navigate to="/" replace />;
};
