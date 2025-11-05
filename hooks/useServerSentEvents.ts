'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type {
    SseMessage,
    SseHandlers,
    SseConnectionState,
    UseServerSentEventsOptions,
    UseServerSentEventsReturn,
} from '@/types/sse'

type SsePayload = NonNullable<SseMessage['payload']>

/**
 * useServerSentEvents Hook
 * 
 * Manages Server-Sent Events connection for real-time image generation updates
 * Provides automatic reconnection, subscription management, and error handling
 * 
 * @example
 * ```typescript
 * const { isConnected, subscribe } = useServerSentEvents()
 * 
 * // Subscribe to request updates
 * const unsubscribe = subscribe('req-123', {
 *   onSuccess: (data) => console.log('Images:', data.payload.images),
 *   onError: (data) => console.error('Error:', data.message),
 * })
 * 
 * // Cleanup
 * unsubscribe()
 * ```
 */
export function useServerSentEvents(
    options: UseServerSentEventsOptions = {}
): UseServerSentEventsReturn {
    const {
        endpoint = '/api/image-gen/events',
        autoConnect = false,
        reconnectInterval = 3000,
        maxReconnectAttempts = 10,
    } = options

    const [connectionState, setConnectionState] = useState<SseConnectionState>('disconnected')
    const [reconnectCount, setReconnectCount] = useState(0)

    const eventSourceRef = useRef<EventSource | null>(null)
    const subscribersRef = useRef<Map<string, SseHandlers>>(new Map())
    const activeRequestIdsRef = useRef<Set<string>>(new Set())
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isManualDisconnectRef = useRef(false)
    const connectForRequestRef = useRef<((requestId: string) => void) | null>(null)

    const isConnected = connectionState === 'connected'

    /**
     * Clean up existing connection
     */
    const cleanup = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }
    }, [])

    /**
     * Attempt to reconnect with exponential backoff
     */
    const attemptReconnect = useCallback(() => {
        if (isManualDisconnectRef.current) {
            console.log('[useServerSentEvents] Manual disconnect, skipping reconnect')
            return
        }

        if (reconnectCount >= maxReconnectAttempts) {
            console.error('[useServerSentEvents] Max reconnection attempts reached')
            setConnectionState('error')

            // Notify all subscribers of disconnect
            subscribersRef.current.forEach((handlers) => {
                handlers.onDisconnect?.()
            })
            return
        }

        // Get any active request ID for reconnection
        const activeRequestIds = Array.from(activeRequestIdsRef.current)
        if (activeRequestIds.length === 0) {
            console.log('[useServerSentEvents] No active requests, skipping reconnect')
            return
        }

        const delay = Math.min(reconnectInterval * Math.pow(2, reconnectCount), 30000)
        console.log(`[useServerSentEvents] Reconnecting in ${delay}ms (attempt ${reconnectCount + 1}/${maxReconnectAttempts})`)

        setConnectionState('connecting')
        reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectCount(prev => prev + 1)
            // Reconnect with the first active request ID
            if (connectForRequestRef.current) {
                connectForRequestRef.current(activeRequestIds[0])
            }
        }, delay)
    }, [reconnectCount, maxReconnectAttempts, reconnectInterval])

    /**
     * Normalize backend SSE payload to internal format
     */
    const normalizeSseMessage = useCallback((raw: unknown): SseMessage | null => {
        if (!raw || typeof raw !== 'object') {
            return null
        }

        const record = raw as Record<string, any>
        const requestId: string | undefined = record.request_id ?? record.data?.request_id

        if (!requestId) {
            return null
        }

        const normalizeImages = (images: any): SsePayload['images'] => {
            if (!Array.isArray(images)) {
                return undefined
            }

            return images
                .filter((img) => img && typeof img === 'object')
                .map((img) => ({
                    url: img.url ?? img.Url ?? '',
                    content_type: img.content_type ?? img.ContentType ?? '',
                    file_name: img.file_name ?? img.FileName ?? '',
                    file_size: img.file_size ?? img.FileSize ?? 0,
                    width: img.width ?? img.Width ?? 0,
                    height: img.height ?? img.Height ?? 0,
                }))
        }

        const buildPayload = (source: any): SsePayload | undefined => {
            if (!source || typeof source !== 'object') {
                return undefined
            }

            const payload: SsePayload = {}

            const images = normalizeImages(source.images ?? source.Images)
            if (images && images.length > 0) {
                payload.images = images
            }

            const progressValue = source.progress ?? source.Progress ?? source.percentage ?? source.Percentage
            if (typeof progressValue === 'number') {
                payload.progress = progressValue
            }

            return Object.keys(payload).length > 0 ? payload : undefined
        }

        if (typeof record.status === 'string') {
            const normalizedStatus = record.status.toUpperCase()
            if (normalizedStatus === 'OK' || normalizedStatus === 'ERROR' || normalizedStatus === 'PROGRESS') {
                return {
                    request_id: requestId,
                    status: normalizedStatus,
                    message: record.message,
                    payload: record.payload ?? buildPayload(record.data),
                }
            }
        }

        if (typeof record.type !== 'string') {
            return null
        }

        const eventType = record.type.toLowerCase()
        const eventData = record.data ?? {}

        switch (eventType) {
            case 'completed':
                return {
                    request_id: requestId,
                    status: 'OK',
                    payload: buildPayload(eventData),
                }
            case 'failed':
            case 'error':
                return {
                    request_id: requestId,
                    status: 'ERROR',
                    message: record.message ?? eventData.message ?? eventData.status ?? eventType.toUpperCase(),
                    payload: buildPayload(eventData),
                }
            case 'progress':
                return {
                    request_id: requestId,
                    status: 'PROGRESS',
                    message: eventData.message ?? record.message,
                    payload: buildPayload(eventData),
                }
            case 'queued':
            case 'processing':
                return {
                    request_id: requestId,
                    status: 'PROGRESS',
                    message: eventData.status ?? eventType.toUpperCase(),
                    payload: buildPayload(eventData),
                }
            default:
                return null
        }
    }, [])

    /**
     * Handle incoming SSE message
     */
    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const rawData = JSON.parse(event.data)
            const data = normalizeSseMessage(rawData)

            if (!data) {
                return
            }

            const requestId = data.request_id

            // Find subscriber for this request
            const handlers = subscribersRef.current.get(requestId)
            if (!handlers) {
                // No handler registered for this request_id, silently ignore
                return
            }

            console.log(`[useServerSentEvents] Message for request ${requestId}:`, data.status)

            // Dispatch to appropriate handler
            if (data.status === 'OK' && data.payload) {
                handlers.onSuccess?.(data)
            } else if (data.status === 'ERROR') {
                handlers.onError?.(data)
            } else if (data.status === 'PROGRESS' && data.payload?.progress !== undefined) {
                handlers.onProgress?.(data)
            }
        } catch (error) {
            console.error('[useServerSentEvents] Failed to parse message:', error)
        }
    }, [normalizeSseMessage])

    /**
     * Connect to SSE endpoint for a specific request
     */
    const connectForRequest = useCallback((requestId: string) => {
        // If already connected, just return
        if (eventSourceRef.current && connectionState === 'connected') {
            activeRequestIdsRef.current.add(requestId)
            return
        }

        // Clean up existing connection
        cleanup()

        isManualDisconnectRef.current = false
        setConnectionState('connecting')
        activeRequestIdsRef.current.add(requestId)

        try {
            // Build URL with request_id parameter
            const url = `${endpoint}?request_id=${encodeURIComponent(requestId)}`
            console.log('[useServerSentEvents] Connecting to:', url)

            const eventSource = new EventSource(url, {
                withCredentials: true, // Include cookies for authentication
            })

            eventSource.onopen = () => {
                console.log('[useServerSentEvents] Connected for request:', requestId)
                setConnectionState('connected')
                setReconnectCount(0) // Reset reconnect count on successful connection
            }

            eventSource.onmessage = handleMessage

            eventSource.onerror = (error) => {
                console.error('[useServerSentEvents] Connection error:', error)
                const readyState = eventSource.readyState
                console.log('[useServerSentEvents] Connection readyState:', readyState)

                // EventSource states:
                // 0 = CONNECTING (initial connection attempt)
                // 1 = OPEN (connected and receiving events)
                // 2 = CLOSED (connection closed, no auto-retry)

                if (readyState === EventSource.CLOSED) {
                    // Connection is closed - EventSource won't auto-retry
                    console.log('[useServerSentEvents] Connection closed')

                    // Only attempt manual reconnect if not manually disconnected and still have active requests
                    if (!isManualDisconnectRef.current && activeRequestIdsRef.current.size > 0) {
                        setConnectionState('disconnected')
                        attemptReconnect()
                    } else {
                        setConnectionState('disconnected')
                    }
                } else if (readyState === EventSource.CONNECTING) {
                    // Connection is attempting to reconnect (EventSource built-in retry)
                    console.log('[useServerSentEvents] Reconnecting...')
                    setConnectionState('connecting')
                } else if (readyState === EventSource.OPEN) {
                    // Connection is open - this shouldn't happen in error handler, but handle gracefully
                    console.log('[useServerSentEvents] Connection open (error event may be transient)')
                    setConnectionState('connected')
                }
            }

            eventSourceRef.current = eventSource
        } catch (error) {
            console.error('[useServerSentEvents] Failed to create EventSource:', error)
            setConnectionState('error')
            attemptReconnect()
        }
    }, [endpoint, handleMessage, cleanup, attemptReconnect, connectionState])

    // Store connectForRequest in ref to break circular dependency
    connectForRequestRef.current = connectForRequest

    /**
     * Connect to SSE endpoint (legacy, for backward compatibility)
     */
    const connect = useCallback(() => {
        console.warn('[useServerSentEvents] connect() called without requestId - this is deprecated')
    }, [])

    /**
     * Disconnect from SSE endpoint
     */
    const disconnect = useCallback(() => {
        console.log('[useServerSentEvents] Disconnecting')
        isManualDisconnectRef.current = true
        cleanup()
        setConnectionState('disconnected')
        setReconnectCount(0)

        // Notify all subscribers of disconnect
        subscribersRef.current.forEach((handlers) => {
            handlers.onDisconnect?.()
        })
    }, [cleanup])

    /**
     * Subscribe to request updates
     */
    const subscribe = useCallback((requestId: string, handlers: SseHandlers): (() => void) => {
        console.log(`[useServerSentEvents] Subscribing to request: ${requestId}`)
        subscribersRef.current.set(requestId, handlers)

        // Connect to SSE for this request
        connectForRequest(requestId)

        // Return unsubscribe function
        return () => {
            console.log(`[useServerSentEvents] Unsubscribing from request: ${requestId}`)
            subscribersRef.current.delete(requestId)
            activeRequestIdsRef.current.delete(requestId)

            // If no more active requests, disconnect
            if (activeRequestIdsRef.current.size === 0) {
                disconnect()
            }
        }
    }, [connectForRequest, disconnect])

    // Auto-connect on mount if enabled
    useEffect(() => {
        if (autoConnect) {
            connect()
        }

        // Cleanup on unmount
        return () => {
            disconnect()
        }
    }, []) // Only run on mount/unmount

    return {
        isConnected,
        connectionState,
        reconnectCount,
        subscribe,
        disconnect,
        connect,
    }
}

