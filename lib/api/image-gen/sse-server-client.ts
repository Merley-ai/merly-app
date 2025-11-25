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

    // Validate inputs
    if (!requestId || !requestId.trim()) {
        throw new SSEConnectionError(
            'Request ID is required for SSE connection',
            requestId,
            400
        )
    }

    const backendSSEUrl = ImageGenEndpoints.eventStream(requestId)

    // Log the URL being called (server-side only)
    console.log(`[SSE Server Client] Request ID: ${requestId}`)

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const headers: Record<string, string> = {
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
        }

        // Add authentication if token is provided
        if (options.accessToken) {
            headers['Authorization'] = `Bearer ${options.accessToken}`
        } else {
            console.warn('[SSE Server Client] No access token provided for authentication')
        }

        const response = await fetch(backendSSEUrl, {
            method: 'GET',
            headers,
            signal: controller.signal,
        })

        console.log(`[SSE Server Client] Response status: ${response.status}`)
        console.log(`[SSE Server Client] Response headers:`, Object.fromEntries(response.headers.entries()))

        clearTimeout(timeoutId)

        // Check if connection was successful
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error')
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
        // Handle specific error types
        if (error instanceof SSEConnectionError) {
            throw error
        }

        if (error instanceof Error && error.name === 'AbortError') {
            throw new SSEConnectionError(
                `SSE connection timeout after ${timeout}ms`,
                requestId,
                408,
                error
            )
        }

        // Wrap unknown errors
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

