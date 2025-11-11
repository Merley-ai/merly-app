/**
 * Core API Utilities
 * 
 * Shared configuration, error classes, and fetch wrapper
 * used by all API clients
 */

// Config
/**
 * Backend API base URL
 * Can be configured via environment variable
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.merley.co'
console.log('[Core] BACKEND_URL', BACKEND_URL)
// Hardcoded fallback for production debugging
// TODO: Remove hardcoded URL and use environment variables properly
if (!BACKEND_URL) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL is not set')
}

const API_TIMEOUT = 30000

// Custom error for API-related failures
export class BackendAPIError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public details?: unknown
    ) {
        super(message)
        this.name = 'BackendAPIError'
    }
}

// Custom error for timeout failures
export class BackendTimeoutError extends Error {
    constructor(message: string = 'Request timeout') {
        super(message)
        this.name = 'BackendTimeoutError'
    }
}

// Custom error for SSE connection failures
export class SSEConnectionError extends Error {
    constructor(
        message: string,
        public requestId?: string,
        public statusCode?: number,
        public details?: unknown
    ) {
        super(message)
        this.name = 'SSEConnectionError'
    }
}

/**
 * Fetch wrapper with timeout, error handling, and automatic JSON parsing
 * 
 * @param endpoint - API endpoint path (e.g., '/v1/albums')
 * @param options - Fetch options (method, body, headers, etc.)
 * @param timeout - Request timeout in milliseconds
 * @returns Parsed response data
 */
export async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = API_TIMEOUT
): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
        const url = `${BACKEND_URL}${endpoint}`

        const response = await fetch(url, {
            ...options,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...options.headers,
            },
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Parse response body
        let data: unknown
        const contentType = response.headers.get('content-type')

        if (contentType?.includes('application/json')) {
            data = await response.json()
        } else {
            data = await response.text()
        }

        // Handle non-OK responses
        if (!response.ok) {
            const dataObj = data as Record<string, unknown> | undefined
            throw new BackendAPIError(
                (dataObj?.error as string | undefined) || (dataObj?.message as string | undefined) || `API error: ${response.status}`,
                response.status,
                data
            )
        }
        return data as T

    } catch (error) {
        clearTimeout(timeoutId)

        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
            console.error('[Backend API] Request timeout')
            throw new BackendTimeoutError()
        }

        // Custom errors
        if (error instanceof BackendAPIError || error instanceof BackendTimeoutError) {
            console.error('[Backend API] Error:', error)
            throw error
        }

        // Handle network errors
        console.error('[Backend API] Network error:', error)
        throw new BackendAPIError(
            'Network error: Unable to connect to backend',
            0,
            error
        )
    }
}

/**
 * Get the configured backend URL
 * 
 * @returns Backend API base URL
 */
export function getBackendURL(): string {
    if (!BACKEND_URL) {
        throw new Error('NEXT_PUBLIC_BACKEND_URL is not set')
    }
    return BACKEND_URL
}

/**
 * Get SSE endpoint URL for backend streaming
 * 
 * Constructs full URL for Server-Sent Events endpoints.
 * Uses the same backend URL configuration as HTTP APIs.
 * 
 * @param endpoint - SSE endpoint path (e.g., '/v1/image-gen/123/event-stream')
 * @returns Full SSE URL
 * @throws Error if BACKEND_URL is not configured
 * 
 * @example
 * ```typescript
 * const sseUrl = getSSEUrl('/v1/image-gen/abc-123/event-stream')
 * // Returns: 'http://localhost:50051/v1/image-gen/abc-123/event-stream'
 * ```
 */
export function getSSEUrl(endpoint: string): string {
    if (!BACKEND_URL) {
        throw new Error('NEXT_PUBLIC_BACKEND_URL is not set')
    }

    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

    return `${BACKEND_URL}${normalizedEndpoint}`
}

export {
    BACKEND_URL,
    API_TIMEOUT,
}

