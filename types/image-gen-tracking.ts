/**
 * Image Generation Tracking Types
 * 
 * Types for managing SSE connections and pending generation state.
 */

/**
 * Pending generation metadata (stored during redirect)
 */
export interface PendingGeneration {
    requestId: string
    albumId: string
    numImages: number
    prompt: string
    type: 'generate' | 'edit' | 'remix'
}

/**
 * SSE connection state
 */
export type SSEConnectionState = 'idle' | 'connecting' | 'connected' | 'error' | 'closed'

export interface SSEConnection {
    requestId: string
    eventSource: EventSource
    state: SSEConnectionState
}
