/**
 * Image Generation SSE Client
 * 
 * Client-side utilities for establishing Server-Sent Events (SSE) connections
 * to the backend image generation service. Follows the same architecture
 * pattern as other API clients in lib/api.
 * 
 * @example
 * ```typescript
 * const eventSource = createImageGenerationSSE('request-id-123')
 * eventSource.onmessage = (event) => {
 *   const data = JSON.parse(event.data)
 *   console.log('Status update:', data)
 * }
 * ```
 */

'use client'

import { getBackendURL } from '../core'

/**
 * Get the SSE endpoint URL for a given request ID
 * 
 * @param requestId - The image generation request ID
 * @returns Full SSE URL pointing to backend events endpoint
 * @throws Error if NEXT_PUBLIC_BACKEND_URL is not configured
 */
export function getSSEUrl(requestId: string): string {
    if (!requestId || !requestId.trim()) {
        throw new Error('Request ID is required for SSE connection')
    }

    const backendUrl = getBackendURL()
    // Backend SSE endpoint format: /v1/image-gen/events?request_id={requestId}
    const sseUrl = `${backendUrl}/v1/image-gen/events?requestId=${encodeURIComponent(requestId)}`

    return sseUrl
}

/**
 * Create an EventSource connection for image generation SSE updates
 * 
 * Establishes a Server-Sent Events connection to the backend to receive
 * real-time updates about image generation progress.
 * 
 * The EventSource will automatically:
 * - Connect to the backend SSE endpoint
 * - Handle reconnection on errors (EventSource default behavior)
 * - Send events with the request status, progress, and results
 * 
 * @param requestId - The image generation request ID to subscribe to
 * @returns EventSource instance connected to backend SSE endpoint
 * @throws Error if NEXT_PUBLIC_BACKEND_URL is not configured or requestId is invalid
 * 
 * @example
 * ```typescript
 * const eventSource = createImageGenerationSSE('abc-123-def')
 * 
 * eventSource.onopen = () => {
 *   console.log('SSE connection opened')
 * }
 * 
 * eventSource.onmessage = (event) => {
 *   const data: ImageSSEStatus = JSON.parse(event.data)
 *   console.log('Progress:', data.progress, '%')
 *   
 *   if (data.status === 'complete') {
 *     console.log('Images:', data.images)
 *     eventSource.close()
 *   }
 * }
 * 
 * eventSource.onerror = (error) => {
 *   console.error('SSE error:', error)
 *   eventSource.close()
 * }
 * ```
 */
export function createImageGenerationSSE(requestId: string): EventSource {
    // Validate requestId
    if (!requestId || !requestId.trim()) {
        throw new Error('Request ID is required for SSE connection')
    }

    // Check if EventSource is available (browser environment)
    if (typeof EventSource === 'undefined') {
        throw new Error('EventSource is not available. This utility requires a browser environment.')
    }

    // Get SSE URL using backend URL from environment
    const sseUrl = getSSEUrl(requestId)

    console.log('[SSE Client] 🔌 Creating SSE connection:', sseUrl)

    // Create and return EventSource instance
    // EventSource automatically handles connection and reconnection
    const eventSource = new EventSource(sseUrl)

    return eventSource
}

