'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * WebSocket message format from backend
 */
export interface WebSocketMessage {
    request_id: string
    status: 'OK' | 'ERROR'
    payload?: {
        images: Array<{
            url: string
            content_type: string
            file_name: string
            file_size: number
            width: number
            height: number
        }>
    }
    message?: string // Error message
}

/**
 * WebSocket event handlers
 */
export interface WebSocketHandlers {
    onSuccess?: (data: WebSocketMessage) => void
    onError?: (data: WebSocketMessage) => void
    onConnect?: () => void
    onDisconnect?: () => void
    onReconnect?: () => void
}

/**
 * Hook return type
 */
interface UseWebSocketReturn {
    isConnected: boolean
    reconnectCount: number
    subscribe: (requestId: string, handlers: WebSocketHandlers) => () => void
    sendMessage: (message: any) => void
}

/**
 * useWebSocket Hook
 * 
 * Manages WebSocket connection to backend for real-time generation updates
 * Automatically reconnects on disconnect
 * 
 * @example
 * ```typescript
 * const { isConnected, subscribe } = useWebSocket()
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
export function useWebSocket(): UseWebSocketReturn {
    const [isConnected, setIsConnected] = useState(false)
    const [reconnectCount, setReconnectCount] = useState(0)

    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const subscribersRef = useRef<Map<string, WebSocketHandlers>>(new Map())
    const messageQueueRef = useRef<any[]>([])
    const reconnectAttemptsRef = useRef(0)

    const MAX_RECONNECT_ATTEMPTS = 10
    const RECONNECT_INTERVAL = 3000 // 3 seconds

    /**
     * Get WebSocket URL from environment
     */
    const getWebSocketUrl = useCallback((): string => {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
        if (!backendUrl) {
            throw new Error('NEXT_PUBLIC_BACKEND_URL is not configured')
        }

        // Convert HTTP(S) URL to WS(S) URL
        const wsUrl = backendUrl.replace(/^http/, 'ws')
        return `${wsUrl}/ws`
    }, [])

    /**
     * Process incoming WebSocket message
     */
    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const data: WebSocketMessage = JSON.parse(event.data)
            const requestId = data.request_id

            // Find subscriber for this request
            const handlers = subscribersRef.current.get(requestId)
            if (!handlers) {
                console.warn(`[useWebSocket] No handler for request ${requestId}`)
                return
            }

            // Handle based on status
            if (data.status === 'OK' && data.payload) {
                handlers.onSuccess?.(data)
            } else if (data.status === 'ERROR') {
                handlers.onError?.(data)
            }
        } catch (error) {
            console.error('[useWebSocket] Failed to parse message:', error)
        }
    }, [])

    /**
     * Connect to WebSocket
     */
    const connect = useCallback(() => {
        try {
            const wsUrl = getWebSocketUrl()
            console.log('[useWebSocket] Connecting to:', wsUrl)

            const ws = new WebSocket(wsUrl)
            wsRef.current = ws

            ws.onopen = () => {
                console.log('[useWebSocket] Connected')
                setIsConnected(true)
                reconnectAttemptsRef.current = 0
                setReconnectCount(0)

                // Flush message queue
                while (messageQueueRef.current.length > 0) {
                    const message = messageQueueRef.current.shift()
                    ws.send(JSON.stringify(message))
                }

                // Notify all subscribers
                subscribersRef.current.forEach(handlers => {
                    if (reconnectCount > 0) {
                        handlers.onReconnect?.()
                    } else {
                        handlers.onConnect?.()
                    }
                })
            }

            ws.onmessage = handleMessage

            ws.onerror = (error) => {
                console.error('[useWebSocket] Error:', error)
            }

            ws.onclose = () => {
                console.log('[useWebSocket] Disconnected')
                setIsConnected(false)
                wsRef.current = null

                // Notify all subscribers
                subscribersRef.current.forEach(handlers => {
                    handlers.onDisconnect?.()
                })

                // Attempt reconnect
                if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttemptsRef.current++
                    setReconnectCount(reconnectAttemptsRef.current)

                    console.log(`[useWebSocket] Reconnecting... (attempt ${reconnectAttemptsRef.current})`)

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect()
                    }, RECONNECT_INTERVAL)
                } else {
                    console.error('[useWebSocket] Max reconnect attempts reached')
                }
            }
        } catch (error) {
            console.error('[useWebSocket] Connection error:', error)
        }
    }, [getWebSocketUrl, handleMessage, reconnectCount])

    /**
     * Disconnect from WebSocket
     */
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }

        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }

        setIsConnected(false)
    }, [])

    /**
     * Send message to WebSocket
     */
    const sendMessage = useCallback((message: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message))
        } else {
            // Queue message for later
            messageQueueRef.current.push(message)
        }
    }, [])

    /**
     * Subscribe to request updates
     */
    const subscribe = useCallback((requestId: string, handlers: WebSocketHandlers): (() => void) => {
        subscribersRef.current.set(requestId, handlers)

        // Return unsubscribe function
        return () => {
            subscribersRef.current.delete(requestId)
        }
    }, [])

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        connect()

        return () => {
            disconnect()
        }
    }, []) // Empty deps intentionally - only run on mount/unmount

    return {
        isConnected,
        reconnectCount,
        subscribe,
        sendMessage,
    }
}

