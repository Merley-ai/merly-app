/**
 * Server-Sent Events (SSE) Type Definitions
 * 
 * Types for real-time image generation updates via SSE
 */

/**
 * SSE Message received from server
 */
export interface SseMessage {
    request_id: string
    status: 'OK' | 'ERROR' | 'PROGRESS'
    message?: string
    payload?: {
        images?: Array<{
            url: string
            content_type: string
            file_name: string
            file_size: number
            width: number
            height: number
        }>
        progress?: number
    }
}

/**
 * SSE Event Handlers
 */
export interface SseHandlers {
    onSuccess?: (data: SseMessage) => void
    onError?: (data: SseMessage) => void
    onProgress?: (data: SseMessage) => void
    onDisconnect?: () => void
}

/**
 * SSE Connection State
 */
export type SseConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * SSE Hook Options
 */
export interface UseServerSentEventsOptions {
    endpoint?: string // SSE endpoint URL
    autoConnect?: boolean // Auto-connect on mount
    reconnectInterval?: number // Reconnection interval in ms
    maxReconnectAttempts?: number // Max reconnection attempts
}

/**
 * SSE Hook Return Type
 */
export interface UseServerSentEventsReturn {
    isConnected: boolean
    connectionState: SseConnectionState
    reconnectCount: number
    subscribe: (requestId: string, handlers: SseHandlers) => () => void
    disconnect: () => void
    connect: () => void
}

