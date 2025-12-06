/**
 * Client-Side Fetch Wrapper
 * 
 * Intercepts API responses and automatically handles authentication errors
 * by redirecting to logout when tokens expire or become invalid.
 */

import type { AuthErrorResponse } from '@/lib/auth0'

/**
 * Enhanced fetch wrapper with automatic auth error handling
 * 
 * Detects 401 responses with `shouldLogout: true` and redirects to logout.
 * Use this instead of native fetch for all client-side API calls.
 * 
 * @param input - URL or Request object
 * @param init - Fetch options
 * @returns Promise<Response>
 * 
 * @example
 * ```typescript
 * const response = await clientFetch('/api/album/getAll')
 * if (!response.ok) {
 *   // Handle error
 * }
 * const data = await response.json()
 * ```
 */
export async function clientFetch(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> {
    const response = await fetch(input, init)

    // Check for auth errors on 401 responses
    if (response.status === 401) {
        try {
            // Clone response to read body without consuming it
            const clone = response.clone()
            const data = await clone.json() as Partial<AuthErrorResponse>

            // If shouldLogout is true, redirect to logout
            if (data.shouldLogout) {
                console.warn('[Auth] Session expired, redirecting to logout...')
                window.location.href = '/auth/logout'

                // Return the original response for proper error handling
                return response
            }
        } catch {
            // If JSON parsing fails, just return the response
            return response
        }
    }

    return response
}
