/**
 * New Relic Error & Context Utilities
 * 
 * Centralized error capture and user context utilities.
 * Integrates with New Relic APM (server) and Browser Agent (client).
 * 
 * @example
 * // Client-side
 * import { captureError } from '@/lib/new-relic'
 * captureError(error, { context: 'imageGeneration', albumId: '123' })
 * 
 * // Server-side (API routes)
 * import { captureServerError } from '@/lib/new-relic'
 * captureServerError(error, { endpoint: '/api/image-gen', userId: user.sub })
 */

export interface ErrorContext {
    /** Where the error occurred */
    context?: string
    /** User ID if available */
    userId?: string
    /** Request/operation ID for tracing */
    requestId?: string
    /** HTTP status code if applicable */
    statusCode?: number
    /** Additional custom attributes */
    [key: string]: unknown
}

/**
 * Capture an error to New Relic (client-side)
 * Uses the browser agent's noticeError API
 * 
 * @param error - The error to capture
 * @param context - Additional context/attributes
 */
export function captureError(error: Error | string, context?: ErrorContext): void {
    // Normalize error to Error object
    const errorObj = typeof error === 'string' ? new Error(error) : error

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.error('[Error Capture :]', errorObj.message, context)
    }

    // Report to New Relic browser agent
    if (typeof window !== 'undefined' && window.newrelic) {
        window.newrelic.noticeError(errorObj, {
            ...context,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
        })
    }
}

/**
 * Capture an error to New Relic (server-side)
 * Uses the Node.js APM agent's noticeError API
 * 
 * @param error - The error to capture
 * @param context - Additional context/attributes
 */
export function captureServerError(error: Error | string, context?: ErrorContext): void {
    // Normalize error to Error object
    const errorObj = typeof error === 'string' ? new Error(error) : error

    // Log to console
    console.error('[Server Error :]', errorObj.message, context)

    // Report to New Relic APM agent (server-side only)
    if (typeof window === 'undefined') {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const newrelic = require('newrelic')

            // Add custom attributes to the error
            if (context) {
                Object.entries(context).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        newrelic.addCustomAttribute(key, String(value))
                    }
                })
            }

            // Report the error
            newrelic.noticeError(errorObj, context)
        } catch {
            // New Relic not available, already logged to console
        }
    }
}

/**
 * Create an error handler with preset context
 * Useful for scoping errors to a specific feature/module
 * 
 * @example
 * const imageGenHandler = createErrorHandler({ context: 'imageGeneration' })
 * imageGenHandler.capture(error, { albumId: '123' })
 */
export function createErrorHandler(defaultContext: ErrorContext) {
    return {
        /**
         * Capture client-side error with preset context
         */
        capture: (error: Error | string, additionalContext?: ErrorContext) => {
            captureError(error, { ...defaultContext, ...additionalContext })
        },

        /**
         * Capture server-side error with preset context
         */
        captureServer: (error: Error | string, additionalContext?: ErrorContext) => {
            captureServerError(error, { ...defaultContext, ...additionalContext })
        },
    }
}

/**
 * Wrap an async function with automatic error capture
 * Catches and captures errors, then re-throws them
 * 
 * @example
 * const safeGenerateImage = withErrorBoundary(generateImage, { context: 'imageGen' })
 * await safeGenerateImage(prompt) // Errors automatically captured
 */
export function withErrorBoundary<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    context?: ErrorContext
): T {
    return (async (...args: Parameters<T>) => {
        try {
            return await fn(...args)
        } catch (error) {
            const errorObj = error instanceof Error ? error : new Error(String(error))

            // Capture based on environment
            if (typeof window !== 'undefined') {
                captureError(errorObj, context)
            } else {
                captureServerError(errorObj, context)
            }

            throw error
        }
    }) as T
}

/**
 * Record a user action in New Relic
 * Creates a PageAction event for analytics
 * 
 * @example
 * recordAction('generateImage', { albumId: '123', model: 'flux' })
 */
export function recordAction(name: string, attributes?: Record<string, unknown>): void {
    if (typeof window !== 'undefined' && window.newrelic) {
        window.newrelic.addPageAction(name, {
            ...attributes,
            timestamp: new Date().toISOString(),
        })
    }
}

/**
 * Set user identity for session tracking
 * Call after user authentication
 * 
 * @example
 * setUser(user.sub, { email: user.email, plan: 'premium' })
 */
export function setUser(
    userId: string,
    attributes?: Record<string, string | number | boolean>
): void {
    if (typeof window !== 'undefined' && window.newrelic) {
        window.newrelic.setUserId(userId)

        if (attributes) {
            Object.entries(attributes).forEach(([key, value]) => {
                window.newrelic?.setCustomAttribute(key, value)
            })
        }
    }
}

export default {
    captureError,
    captureServerError,
    createErrorHandler,
    withErrorBoundary,
    recordAction,
    setUser,
}
