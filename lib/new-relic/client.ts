/**
 * New Relic Client-Side Utilities
 * 
 * Safe to import in 'use client' components.
 * Uses window.newrelic browser agent only.
 */

export interface ErrorContext {
    context?: string
    userId?: string
    requestId?: string
    statusCode?: number
    [key: string]: unknown
}

/**
 * Capture an error to New Relic (client-side)
 */
export function captureError(error: Error | string, context?: ErrorContext): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error

    if (process.env.NODE_ENV === 'production') {
        console.error('[ErrorCapture]', errorObj.message, context)
    }

    if (typeof window !== 'undefined' && window.newrelic) {
        window.newrelic.noticeError(errorObj, {
            ...context,
            timestamp: new Date().toISOString(),
            url: window.location.href,
        })
    }
}

/**
 * Record a user action
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
 * Record page action with timing
 */
export function recordPageAction(
    name: string,
    attributes?: Record<string, string | number | boolean>
): void {
    if (typeof window === 'undefined' || !window.newrelic) return

    window.newrelic.addPageAction(name, {
        ...attributes,
        timestamp: Date.now(),
    })
}

/**
 * Start a browser interaction
 */
export function startInteraction(
    name: string,
    attributes?: Record<string, string | number | boolean>,
    callback?: () => void
): void {
    if (typeof window === 'undefined' || !window.newrelic) {
        callback?.()
        return
    }

    const interaction = window.newrelic.interaction()
    if (!interaction) {
        callback?.()
        return
    }

    interaction.setName(name)

    if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
            interaction.setAttribute(key, value)
        })
    }

    interaction.save()
    callback?.()
}

/**
 * Start a performance timer
 */
export function startTimer(name: string) {
    const startTime = performance.now()

    return {
        stop: (attributes?: Record<string, string | number | boolean>) => {
            const duration = performance.now() - startTime

            if (typeof window !== 'undefined' && window.newrelic) {
                window.newrelic.addPageAction(`${name}:duration`, {
                    ...attributes,
                    durationMs: Math.round(duration),
                })
            }

            return duration
        },
        elapsed: () => performance.now() - startTime,
    }
}

/**
 * Set user identity
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

// Image generation tracking (client-side)
export interface ImageGenMetrics {
    requestId: string
    startTime: number
    queueTime?: number
    processingTime?: number
    totalTime?: number
    imageCount?: number
    status: 'queued' | 'processing' | 'completed' | 'failed'
}

export function createImageGenSpan(requestId: string, attributes?: Record<string, unknown>) {
    const metrics: ImageGenMetrics = {
        requestId,
        startTime: Date.now(),
        status: 'queued',
    }

    const baseAttributes = { requestId, ...attributes }

    const trackEvent = (eventName: string, eventAttributes?: Record<string, unknown>) => {
        if (typeof window !== 'undefined' && window.newrelic) {
            window.newrelic.addPageAction(`imageGen:${eventName}`, {
                ...baseAttributes,
                ...eventAttributes,
            })
        }
    }

    return {
        queued: () => {
            metrics.status = 'queued'
            trackEvent('queued')
        },

        processing: (progress?: number) => {
            if (metrics.status === 'queued') {
                metrics.queueTime = Date.now() - metrics.startTime
            }
            metrics.status = 'processing'
            trackEvent('processing', { progress })
        },

        completed: (imageCount: number, additionalAttributes?: Record<string, unknown>) => {
            metrics.status = 'completed'
            metrics.imageCount = imageCount
            metrics.totalTime = Date.now() - metrics.startTime
            metrics.processingTime = metrics.totalTime - (metrics.queueTime || 0)

            trackEvent('completed', {
                imageCount,
                queueTimeMs: metrics.queueTime,
                processingTimeMs: metrics.processingTime,
                totalTimeMs: metrics.totalTime,
                ...additionalAttributes,
            })
        },

        failed: (error: Error | string) => {
            metrics.status = 'failed'
            metrics.totalTime = Date.now() - metrics.startTime
            const errorMessage = typeof error === 'string' ? error : error.message

            trackEvent('failed', {
                errorMessage,
                totalTimeMs: metrics.totalTime,
                queueTimeMs: metrics.queueTime,
            })
        },

        getMetrics: () => ({ ...metrics }),
    }
}

// Legacy aliases
export const reportError = captureError
export const trackAction = recordAction
export const trackPageAction = recordPageAction
export const trackInteraction = startInteraction
export const createTimer = startTimer
export const setUserIdentity = setUser
export const createImageGenTracker = createImageGenSpan
