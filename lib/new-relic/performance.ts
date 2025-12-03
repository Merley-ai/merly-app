/**
 * New Relic Performance Monitoring Utilities
 * 
 * Provides utilities for tracing, metrics, and spans.
 * Supports both server-side (APM) and client-side (Browser Agent) monitoring.
 * 
 * @example
 * // Server-side transaction tracking
 * import { startTransaction, startSpan } from '@/lib/new-relic'
 * 
 * await startTransaction('ImageGeneration', 'generate', async () => {
 *   await generateImages(prompt)
 * })
 * 
 * // Client-side interaction tracking
 * import { startInteraction } from '@/lib/new-relic'
 * startInteraction('generateImage', { albumId: '123' })
 */

// Server-side performance tracking

/**
 * Start a custom transaction (server-side)
 * Wraps an async operation in a New Relic transaction
 */
export async function startTransaction<T>(
    name: string,
    group: string,
    operation: () => Promise<T>,
    attributes?: Record<string, string | number | boolean>
): Promise<T> {
    if (typeof window !== 'undefined') {
        // Client-side: just run the operation
        return operation()
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const newrelic = require('newrelic')

        return await newrelic.startBackgroundTransaction(`${group}/${name}`, group, async () => {
            const transaction = newrelic.getTransaction()

            // Add custom attributes
            if (attributes) {
                Object.entries(attributes).forEach(([key, value]) => {
                    newrelic.addCustomAttribute(key, value)
                })
            }

            try {
                const result = await operation()
                return result
            } catch (error) {
                newrelic.noticeError(error as Error)
                throw error
            } finally {
                transaction.end()
            }
        })
    } catch {
        // New Relic not available, run operation directly
        return operation()
    }
}

/**
 * Start a span within a transaction (server-side)
 * Useful for measuring specific parts of a larger operation
 */
export async function startSpan<T>(
    name: string,
    operation: () => Promise<T>,
    attributes?: Record<string, string | number | boolean>
): Promise<T> {
    if (typeof window !== 'undefined') {
        return operation()
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const newrelic = require('newrelic')

        return await newrelic.startSegment(name, true, async () => {
            if (attributes) {
                Object.entries(attributes).forEach(([key, value]) => {
                    newrelic.addCustomAttribute(key, value)
                })
            }
            return operation()
        })
    } catch {
        return operation()
    }
}

/**
 * Record a custom metric (server-side)
 */
export function recordMetric(name: string, value: number): void {
    if (typeof window !== 'undefined') return

    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const newrelic = require('newrelic')
        newrelic.recordMetric(`Custom/${name}`, value)
    } catch {
        // New Relic not available
    }
}

/**
 * Set custom attributes on current transaction (server-side)
 */
export function setAttributes(attributes: Record<string, string | number | boolean>): void {
    if (typeof window !== 'undefined') return

    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const newrelic = require('newrelic')
        Object.entries(attributes).forEach(([key, value]) => {
            newrelic.addCustomAttribute(key, value)
        })
    } catch {
        // New Relic not available
    }
}

// Client-side performance tracking

/**
 * Start a browser interaction (client-side)
 * Creates a custom interaction in New Relic Browser
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
 * Record page action with timing (client-side)
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
 * Start a performance timer for measuring durations
 */
export function startTimer(name: string) {
    const startTime = performance.now()

    return {
        /** Stop timer and record duration */
        stop: (attributes?: Record<string, string | number | boolean>) => {
            const duration = performance.now() - startTime

            // Record on client
            if (typeof window !== 'undefined' && window.newrelic) {
                window.newrelic.addPageAction(`${name}:duration`, {
                    ...attributes,
                    durationMs: Math.round(duration),
                })
            }

            // Record on server
            if (typeof window === 'undefined') {
                recordMetric(`${name}/duration`, duration)
            }

            return duration
        },

        /** Get elapsed time without stopping */
        elapsed: () => performance.now() - startTime,
    }
}

// SSE-specific tracking

export interface SSEMetrics {
    connectionId: string
    startTime: number
    eventCount: number
    lastEventTime: number
    status: 'connecting' | 'connected' | 'completed' | 'error' | 'timeout'
}

/**
 * Create an SSE connection span
 * Tracks connection lifecycle, events, and performance
 */
export function createSSESpan(connectionId: string, context?: string) {
    const metrics: SSEMetrics = {
        connectionId,
        startTime: Date.now(),
        eventCount: 0,
        lastEventTime: Date.now(),
        status: 'connecting',
    }

    const trackEvent = (eventName: string, attributes?: Record<string, unknown>) => {
        if (typeof window !== 'undefined' && window.newrelic) {
            window.newrelic.addPageAction(`sse:${eventName}`, {
                connectionId,
                context,
                eventCount: metrics.eventCount,
                elapsedMs: Date.now() - metrics.startTime,
                ...attributes,
            })
        }
    }

    return {
        /** Mark connection as established */
        connected: () => {
            metrics.status = 'connected'
            const connectionTime = Date.now() - metrics.startTime
            trackEvent('connected', { connectionTimeMs: connectionTime })
            recordMetric('SSE/ConnectionTime', connectionTime)
        },

        /** Record an SSE event received */
        event: (eventType: string, data?: unknown) => {
            metrics.eventCount++
            metrics.lastEventTime = Date.now()
            trackEvent('event', {
                eventType,
                hasData: !!data,
            })
        },

        /** Mark connection as completed successfully */
        complete: (attributes?: Record<string, unknown>) => {
            metrics.status = 'completed'
            const totalTime = Date.now() - metrics.startTime
            trackEvent('complete', {
                totalTimeMs: totalTime,
                totalEvents: metrics.eventCount,
                ...attributes,
            })
            recordMetric('SSE/TotalTime', totalTime)
            recordMetric('SSE/EventCount', metrics.eventCount)
        },

        /** Mark connection as failed */
        error: (error: Error | string) => {
            metrics.status = 'error'
            const errorMessage = typeof error === 'string' ? error : error.message
            trackEvent('error', {
                errorMessage,
                elapsedMs: Date.now() - metrics.startTime,
                eventsBeforeError: metrics.eventCount,
            })
        },

        /** Mark connection as timed out */
        timeout: () => {
            metrics.status = 'timeout'
            trackEvent('timeout', {
                elapsedMs: Date.now() - metrics.startTime,
                eventsBeforeTimeout: metrics.eventCount,
            })
        },

        /** Get current metrics */
        getMetrics: () => ({ ...metrics }),
    }
}

// Image generation specific tracking

export interface ImageGenMetrics {
    requestId: string
    startTime: number
    queueTime?: number
    processingTime?: number
    totalTime?: number
    imageCount?: number
    status: 'queued' | 'processing' | 'completed' | 'failed'
}

/**
 * Create an image generation span
 * Tracks the full lifecycle of image generation requests
 */
export function createImageGenSpan(requestId: string, attributes?: Record<string, unknown>) {
    const metrics: ImageGenMetrics = {
        requestId,
        startTime: Date.now(),
        status: 'queued',
    }

    const baseAttributes = {
        requestId,
        ...attributes,
    }

    const trackEvent = (eventName: string, eventAttributes?: Record<string, unknown>) => {
        // Client-side tracking
        if (typeof window !== 'undefined' && window.newrelic) {
            window.newrelic.addPageAction(`imageGen:${eventName}`, {
                ...baseAttributes,
                ...eventAttributes,
            })
        }

        // Server-side tracking
        if (typeof window === 'undefined') {
            setAttributes({
                imageGenRequestId: requestId,
                imageGenStatus: metrics.status,
            })
        }
    }

    return {
        /** Mark request as queued */
        queued: () => {
            metrics.status = 'queued'
            trackEvent('queued')
        },

        /** Mark request as processing */
        processing: (progress?: number) => {
            if (metrics.status === 'queued') {
                metrics.queueTime = Date.now() - metrics.startTime
                recordMetric('ImageGen/QueueTime', metrics.queueTime)
            }
            metrics.status = 'processing'
            trackEvent('processing', { progress })
        },

        /** Mark request as completed */
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

            recordMetric('ImageGen/TotalTime', metrics.totalTime)
            recordMetric('ImageGen/ProcessingTime', metrics.processingTime || 0)
            recordMetric('ImageGen/ImageCount', imageCount)
        },

        /** Mark request as failed */
        failed: (error: Error | string) => {
            metrics.status = 'failed'
            metrics.totalTime = Date.now() - metrics.startTime
            const errorMessage = typeof error === 'string' ? error : error.message

            trackEvent('failed', {
                errorMessage,
                totalTimeMs: metrics.totalTime,
                queueTimeMs: metrics.queueTime,
            })

            recordMetric('ImageGen/FailureTime', metrics.totalTime)
        },

        /** Get current metrics */
        getMetrics: () => ({ ...metrics }),
    }
}
