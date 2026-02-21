import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#F8F9FA',
                    fontFamily: 'system-ui, sans-serif',
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '2rem',
                        padding: '3rem',
                        maxWidth: '420px',
                        textAlign: 'center',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                        border: '1px solid #f0f0f0',
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: '#FEE2E2',
                            borderRadius: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            fontSize: '28px',
                        }}>
                            ⚠️
                        </div>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: 900,
                            color: '#1a1a2e',
                            marginBottom: '0.5rem',
                        }}>
                            Something went wrong
                        </h2>
                        <p style={{
                            fontSize: '0.875rem',
                            color: '#94a3b8',
                            fontWeight: 500,
                            marginBottom: '1.5rem',
                            lineHeight: 1.6,
                        }}>
                            An unexpected error occurred. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: '#D11243',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.75rem',
                                padding: '0.75rem 2rem',
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
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
