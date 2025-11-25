/**
 * Server-Side SSE Client for Image Generation
 * 
 * This module provides server-side utilities for establishing SSE connections
 * to the backend for image generation progress updates.
 * 
 * Architecture:
 * - Uses the same backend URL pattern as HTTP clients (via getSSEUrl from core)
 * - Handles authentication and error propagation
 * - Designed for use in Next.js API routes (server-side only)
 */

import { SSEConnectionError } from '../core'
import { ImageGen as ImageGenEndpoints } from '../endpoints'

/**
 * Options for establishing an SSE connection to the backend
 */
export interface SSEConnectionOptions {
    /** The request ID for tracking the generation process */
    requestId: string
    /** Optional timeout in milliseconds (default: 30000) */
    timeout?: number
    /** Optional access token for authentication */
    accessToken?: string
}

/**
 * Result of establishing an SSE connection
 */
export interface SSEConnectionResult {
    /** The Response object containing the SSE stream */
    response: Response
    /** The request ID being tracked */
    requestId: string
}

/**
 * Connect to the backend SSE endpoint for image generation progress
 * 
 * This function establishes a server-side connection to the backend's SSE endpoint
 * and returns the Response object for streaming to the client.
 * 
 * @param options - Connection options including requestId and optional timeout
 * @returns Promise resolving to the SSE connection result
 * @throws {SSEConnectionError} If the connection fails or backend returns an error
 * 
 * @example
 * ```typescript
 * const { response, requestId } = await connectToImageGenerationSSE({
 *   requestId: '12345',
 *   timeout: 30000
 * })
 * 
 * // Stream the response to the client
 * return new Response(response.body, {
 *   headers: createSSEHeaders()
 * })
 * ```
 */
export async function connectToImageGenerationSSE(
    options: SSEConnectionOptions
): Promise<SSEConnectionResult> {
    const { requestId, timeout = 30000 } = options

    console.log('🔵 [SSE Server Client] Connecting to backend SSE for requestId:', requestId)

    // Validate inputs
    if (!requestId || !requestId.trim()) {
        console.error('❌ [SSE Server Client] Invalid requestId')
        throw new SSEConnectionError(
            'Request ID is required for SSE connection',
            requestId,
            400
        )
    }

    // Construct the backend SSE URL using the endpoints utility
    // Backend endpoint format: /v1/image-gen/{requestId}/event-stream
    const backendSSEUrl = ImageGenEndpoints.eventStream(requestId)
    console.log('🔵 [SSE Server Client] Backend URL:', backendSSEUrl)

    try {
        // Establish connection to backend SSE endpoint with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        console.log('🔵 [SSE Server Client] Fetching from backend...')
        const headers: Record<string, string> = {
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
        }

        // Add authentication if token is provided
        if (options.accessToken) {
            headers['Authorization'] = `Bearer ${options.accessToken}`
            console.log('🔵 [SSE Server Client] Authentication token added')
        } else {
            console.log('⚠️ [SSE Server Client] No authentication token provided')
        }

        const response = await fetch(backendSSEUrl, {
            method: 'GET',
            headers,
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        console.log('🔵 [SSE Server Client] Backend response status:', response.status)
        console.log('🔵 [SSE Server Client] Backend response ok:', response.ok)

        // Check if connection was successful
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error')
            console.error('❌ [SSE Server Client] Backend returned error:', errorText)
            throw new SSEConnectionError(
                `Backend SSE connection failed: ${response.status} - ${errorText}`,
                requestId,
                response.status
            )
        }

        // Verify response has a body
        if (!response.body) {
            throw new SSEConnectionError(
                'Backend SSE response has no body',
                requestId,
                500
            )
        }

        return {
            response,
            requestId,
        }
    } catch (error) {
        console.error('❌ [SSE Server Client] Caught error:', error)
        console.error('❌ [SSE Server Client] Error type:', error?.constructor?.name)

        // Handle specific error types
        if (error instanceof SSEConnectionError) {
            console.error('❌ [SSE Server Client] Re-throwing SSEConnectionError')
            throw error
        }

        if (error instanceof Error && error.name === 'AbortError') {
            console.error('❌ [SSE Server Client] Connection timeout')
            throw new SSEConnectionError(
                `SSE connection timeout after ${timeout}ms`,
                requestId,
                408,
                error
            )
        }

        // Wrap unknown errors
        console.error('❌ [SSE Server Client] Unknown error, wrapping in SSEConnectionError')
        throw new SSEConnectionError(
            error instanceof Error ? error.message : 'Unknown SSE connection error',
            requestId,
            500,
            error
        )
    }
}

/**
 * Helper function to create SSE response headers
 * 
 * Use this to ensure consistent SSE headers across all API routes
 * 
 * @example
 * ```typescript
 * return new Response(stream, {
 *   headers: createSSEHeaders()
 * })
 * ```
 */
export function createSSEHeaders(): Record<string, string> {
    return {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
    }
}

