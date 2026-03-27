import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#fff0f0', minHeight: '100vh' }}>
          <h1 style={{ color: '#cc0000', fontSize: '1.5rem', marginBottom: '1rem' }}>
            Something went wrong
          </h1>
          <pre style={{ color: '#cc0000', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {this.state.error?.toString()}
          </pre>
          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', color: '#666' }}>Component Stack</summary>
            <pre style={{ color: '#666', fontSize: '0.75rem', whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#cc0000', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
