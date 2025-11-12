

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
 * Get client-side SSE URL for direct browser EventSource connections
 * 
 * Returns the full backend SSE URL for direct connection.
 * NOTE: This requires CORS to be properly configured on the backend.
 * 
 * @param requestId - The image generation request ID
 * @returns Full backend SSE URL: https://api.merley.co/v1/image-gen/events?request_id=...
 * @throws Error if requestId is invalid or NEXT_PUBLIC_BACKEND_URL is not configured
 */
export function getSSEUrl(requestId: string): string {
    if (!requestId || !requestId.trim()) {
        throw new Error('Request ID is required for SSE connection')
    }

    const backendUrl = getBackendURL()
    // Backend SSE endpoint format: /v1/image-gen/events?request_id={requestId}
    const sseUrl = `${backendUrl}/v1/image-gen/${requestId}/event-stream`

    return sseUrl
}

/**
 * Create an EventSource connection for image generation SSE updates
 * 
 * Establishes a direct Server-Sent Events connection to the backend API
 * to receive real-time updates about image generation progress.
 * 
 * NOTE: This requires CORS to be properly configured on the backend to allow
 * cross-origin requests from your frontend domain.
 * 
 * The EventSource will automatically:
 * - Connect directly to the backend SSE endpoint
 * - Handle reconnection on errors (EventSource default behavior)
 * - Send events with the request status, progress, and results
 * 
 * @param requestId - The image generation request ID to subscribe to
 * @returns EventSource instance connected directly to backend SSE endpoint
 * @throws Error if requestId is invalid or NEXT_PUBLIC_BACKEND_URL is not configured
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

    // Get SSE URL for direct backend connection
    const sseUrl = getSSEUrl(requestId)

    console.log('[SSE Client] 🔌 Creating SSE connection:', sseUrl)

    // Create and return EventSource instance
    // EventSource automatically handles connection and reconnection
    const eventSource = new EventSource(sseUrl)

    return eventSource
}

