/**
 * New Relic Error Reporter
 * 
 * Centralized error reporting utility for both client and server-side errors.
 * Integrates with New Relic APM (server) and Browser Agent (client).
 * 
 * @example
 * // Client-side
 * import { reportError } from '@/lib/new-relic/error-reporter'
 * reportError(error, { context: 'imageGeneration', albumId: '123' })
 * 
 * // Server-side (API routes)
 * import { reportServerError } from '@/lib/new-relic/error-reporter'
 * reportServerError(error, { endpoint: '/api/image-gen', userId: user.sub })
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
 * Report an error to New Relic (client-side)
 * Uses the browser agent's noticeError API
 * 
 * @param error - The error to report
 * @param context - Additional context/attributes
 */
export function reportError(error: Error | string, context?: ErrorContext): void {
    // Normalize error to Error object
    const errorObj = typeof error === 'string' ? new Error(error) : error

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.error('[ErrorReporter]', errorObj.message, context)
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
 * Report an error to New Relic (server-side)
 * Uses the Node.js APM agent's noticeError API
 * 
 * @param error - The error to report
 * @param context - Additional context/attributes
 */
export function reportServerError(error: Error | string, context?: ErrorContext): void {
    // Normalize error to Error object
    const errorObj = typeof error === 'string' ? new Error(error) : error

    // Log to console
    console.error('[ServerError]', errorObj.message, context)

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
 * Create an error reporter with preset context
 * Useful for scoping errors to a specific feature/module
 * 
 * @example
 * const imageGenReporter = createErrorReporter({ context: 'imageGeneration' })
 * imageGenReporter.report(error, { albumId: '123' })
 */
export function createErrorReporter(defaultContext: ErrorContext) {
    return {
        /**
         * Report client-side error with preset context
         */
        report: (error: Error | string, additionalContext?: ErrorContext) => {
            reportError(error, { ...defaultContext, ...additionalContext })
        },

        /**
         * Report server-side error with preset context
         */
        reportServer: (error: Error | string, additionalContext?: ErrorContext) => {
            reportServerError(error, { ...defaultContext, ...additionalContext })
        },
    }
}

/**
 * Wrap an async function with automatic error reporting
 * Catches and reports errors, then re-throws them
 * 
 * @example
 * const safeGenerateImage = withErrorReporting(generateImage, { context: 'imageGen' })
 * await safeGenerateImage(prompt) // Errors automatically reported
 */
export function withErrorReporting<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    context?: ErrorContext
): T {
    return (async (...args: Parameters<T>) => {
        try {
            return await fn(...args)
        } catch (error) {
            const errorObj = error instanceof Error ? error : new Error(String(error))

            // Report based on environment
            if (typeof window !== 'undefined') {
                reportError(errorObj, context)
            } else {
                reportServerError(errorObj, context)
            }

            throw error
        }
    }) as T
}

/**
 * Track a user action in New Relic
 * Creates a PageAction event for analytics
 * 
 * @example
 * trackAction('generateImage', { albumId: '123', model: 'flux' })
 */
export function trackAction(name: string, attributes?: Record<string, unknown>): void {
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
 * setUserIdentity(user.sub, { email: user.email, plan: 'premium' })
 */
export function setUserIdentity(
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
    reportError,
    reportServerError,
    createErrorReporter,
    withErrorReporting,
    trackAction,
    setUserIdentity,
}
