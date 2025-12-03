'use client'

import { useEffect } from 'react'

/**
 * Global Error Boundary
 * 
 * Catches errors in the root layout and reports them to New Relic.
 * This is the last line of defense for unhandled errors.
 * 
 * Note: This component must define its own <html> and <body> tags
 * because it replaces the root layout when triggered.
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errorjs
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Report to New Relic browser agent if available
        if (typeof window !== 'undefined' && window.newrelic) {
            window.newrelic.noticeError(error, {
                context: 'globalErrorBoundary',
                digest: error.digest,
                isFatal: true,
                url: window.location.href,
            })
        }

        // Also log to console for debugging
        console.error('[GlobalError]', error)
    }, [error])

    return (
        <html lang="en">
            <body>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f9fafb',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                }}>
                    <div style={{
                        maxWidth: '28rem',
                        width: '100%',
                        padding: '2rem',
                        backgroundColor: 'white',
                        borderRadius: '0.5rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        textAlign: 'center',
                    }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <svg
                                style={{ margin: '0 auto', height: '3rem', width: '3rem', color: '#ef4444' }}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        <h1 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            color: '#111827',
                            marginBottom: '0.5rem',
                        }}>
                            Application Error
                        </h1>

                        <p style={{
                            color: '#6b7280',
                            marginBottom: '1.5rem',
                        }}>
                            A critical error occurred. Our team has been notified.
                        </p>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button
                                onClick={reset}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#000',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                }}
                            >
                                Try again
                            </button>

                            <button
                                onClick={() => window.location.href = '/'}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'white',
                                    color: '#374151',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                }}
                            >
                                Go home
                            </button>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    )
}
