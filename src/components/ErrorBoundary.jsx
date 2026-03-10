import React from 'react'

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary] Caught error:', error, info)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    background: '#0a0a0a',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    fontFamily: 'system-ui, sans-serif',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        Something went wrong
                    </h1>
                    <p style={{ color: '#888', marginBottom: '1.5rem', maxWidth: '500px' }}>
                        The application encountered an unexpected error.
                    </p>
                    <pre style={{
                        background: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        maxWidth: '600px',
                        overflowX: 'auto',
                        marginBottom: '1.5rem',
                        textAlign: 'left'
                    }}>
                        {this.state.error?.message}
                    </pre>
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{
                            background: '#4f46e5',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0.75rem',
                            padding: '0.75rem 1.5rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}
                    >
                        Return to Home
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
