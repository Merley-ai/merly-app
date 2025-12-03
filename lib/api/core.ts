/**
 * Core API Utilities
 * 
 * Shared configuration, error classes, and fetch wrapper
 * used by all API clients
 */

import { reportServerError } from '@/lib/new-relic/error-reporter'

// Config
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
 * @param url - Full API URL (use buildUrl() from endpoints.ts to construct)
 * @param options - Fetch options (method, body, headers, etc.)
 * @param timeout - Request timeout in milliseconds
 * @param accessToken - Optional JWT access token for authentication
 * @returns Parsed response data
 */
export async function apiFetch<T>(
    url: string,
    options: RequestInit = {},
    timeout: number = API_TIMEOUT,
    accessToken?: string | null
): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {

        // Build headers with optional Authorization
        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }

        // Merge existing headers from options
        if (options.headers) {
            const existingHeaders = new Headers(options.headers)
            existingHeaders.forEach((value, key) => {
                headers[key] = value
            })
        }

        // Add Authorization header if token is provided
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`
        }

        const response = await fetch(url, {
            ...options,
            headers,
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
            const apiError = new BackendAPIError(
                (dataObj?.error as string | undefined) || (dataObj?.message as string | undefined) || `API error: ${response.status}`,
                response.status,
                data
            )

            // Report API errors to New Relic
            reportServerError(apiError, {
                context: 'apiFetch',
                url,
                statusCode: response.status,
                method: options.method || 'GET',
            })

            throw apiError
        }
        return data as T

    } catch (error) {
        clearTimeout(timeoutId)

        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
            const timeoutError = new BackendTimeoutError()
            reportServerError(timeoutError, {
                context: 'apiFetch',
                url,
                timeout,
                method: options.method || 'GET',
            })
            throw timeoutError
        }

        // Custom errors
        if (error instanceof BackendAPIError || error instanceof BackendTimeoutError) {
            throw error
        }

        // Handle network errors
        const networkError = new BackendAPIError(
            'Network error: Unable to connect to backend',
            0,
            error
        )
        reportServerError(networkError, {
            context: 'apiFetch',
            url,
            method: options.method || 'GET',
            originalError: error instanceof Error ? error.message : String(error),
        })
        throw networkError
    }
}

/**
 * Simplified fetch wrapper for server-side API routes
 * Constructs full URL using buildUrl from endpoints and calls backend directly
 * 
 * @param url - Full API URL (use buildUrl() from endpoints.ts to construct)
 * @param options - Fetch options (method, body, headers, etc.)
 * @param timeout - Request timeout in milliseconds
 * @returns Parsed response data
 */
export async function apiFetchService<T>(
    url: string,
    options: RequestInit = {},
    timeout: number = API_TIMEOUT
): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
        // Build headers
        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }

        // Merge existing headers from options
        if (options.headers) {
            const existingHeaders = new Headers(options.headers)
            existingHeaders.forEach((value, key) => {
                headers[key] = value
            })
        }

        const response = await fetch(url, {
            ...options,
            headers,
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
            const apiError = new BackendAPIError(
                (dataObj?.error as string | undefined) || (dataObj?.message as string | undefined) || `API error: ${response.status}`,
                response.status,
                data
            )

            // Report API errors to New Relic
            reportServerError(apiError, {
                context: 'apiFetchService',
                url,
                statusCode: response.status,
                method: options.method || 'GET',
            })

            throw apiError
        }
        return data as T

    } catch (error) {
        clearTimeout(timeoutId)

        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
            const timeoutError = new BackendTimeoutError()
            reportServerError(timeoutError, {
                context: 'apiFetchService',
                url,
                timeout,
                method: options.method || 'GET',
            })
            throw timeoutError
        }

        // Custom errors
        if (error instanceof BackendAPIError || error instanceof BackendTimeoutError) {
            throw error
        }

        // Handle network errors
        const networkError = new BackendAPIError(
            'Network error: Unable to connect to backend',
            0,
            error
        )
        reportServerError(networkError, {
            context: 'apiFetchService',
            url,
            method: options.method || 'GET',
            originalError: error instanceof Error ? error.message : String(error),
        })
        throw networkError
    }
}

export {
    API_TIMEOUT,
}

