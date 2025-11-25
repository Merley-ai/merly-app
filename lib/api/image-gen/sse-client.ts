

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
 * }
 * ```
 */

'use client'

/**
 * Get client-side SSE URL for browser EventSource connections
 * 
 * Returns a relative path to the Next.js proxy endpoint to avoid CORS issues.
 * The proxy route at /api/events handles the backend connection server-side,
 * which bypasses CORS restrictions and handles duplicate header issues.
 * 
 * @param requestId - The image generation request ID
 * @returns Relative SSE URL for browser: /api/events?requestId=...
 * @throws Error if requestId is invalid
 */
export function getSSEUrl(requestId: string): string {
    if (!requestId || !requestId.trim()) {
        throw new Error('Request ID is required for SSE connection')
    }

    // Use Next.js proxy route to avoid CORS issues
    // The proxy route at /api/events handles the backend connection server-side
    // This bypasses CORS restrictions and handles backend header issues
    const sseUrl = `/api/events?requestId=${encodeURIComponent(requestId)}`

    return sseUrl
}

/**
 * Create an EventSource connection for image generation SSE updates
 * 
 * Establishes a Server-Sent Events connection through the Next.js proxy route
 * to receive real-time updates about image generation progress.
 * 
 * The proxy route handles the backend connection server-side, which:
 * - Avoids CORS issues (no cross-origin requests from browser)
 * - Handles backend header issues (duplicate CORS headers, etc.)
 * - Transforms event format as needed
 * 
 * The EventSource will automatically:
 * - Connect to the Next.js proxy route (/api/events)
 * - Handle reconnection on errors (EventSource default behavior)
 * - Send events with the request status, progress, and results
 * 
 * @param requestId - The image generation request ID to subscribe to
 * @returns EventSource instance connected to Next.js proxy route
 * @throws Error if requestId is invalid
 * 
 * @example
 * ```typescript
 * const eventSource = createImageGenerationSSE('abc-123-def')
 * 
 * eventSource.onmessage = (event) => {
 *   const data: ImageSSEStatus = JSON.parse(event.data)
 *   
 *   if (data.status === 'complete') {
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

    // Get SSE URL using Next.js proxy route (avoids CORS issues)
    const sseUrl = getSSEUrl(requestId)

    // Create and return EventSource instance
    const eventSource = new EventSource(sseUrl)

    return eventSource
}

