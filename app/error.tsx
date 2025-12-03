'use client'

import { useEffect } from 'react'
import { reportError } from '@/lib/new-relic/error-reporter'

/**
 * Error Boundary for App Routes
 * 
 * Catches errors in route segments and reports them to New Relic.
 * This handles errors in page components, not the root layout.
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Report error to New Relic browser agent
        reportError(error, {
            context: 'errorBoundary',
            digest: error.digest,
            componentStack: (error as Error & { componentStack?: string }).componentStack,
        })
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full px-6 py-8 bg-white rounded-lg shadow-md text-center">
                <div className="mb-4">
                    <svg
                        className="mx-auto h-12 w-12 text-red-500"
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

                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Something went wrong
                </h2>

                <p className="text-gray-600 mb-6">
                    We encountered an unexpected error. Our team has been notified.
                </p>

                {process.env.NODE_ENV === 'development' && (
                    <details className="mb-6 text-left">
                        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                            Error details
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                            {error.message}
                            {error.stack && `\n\n${error.stack}`}
                        </pre>
                    </details>
                )}

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                    >
                        Try again
                    </button>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Go home
                    </button>
                </div>
            </div>
        </div>
    )
}
