/**
 * API Route Handler Wrapper
 * 
 * Provides centralized error handling for API routes with automatic
 * authentication error detection and logout triggering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleAuthError, isAuthError, AuthErrorResponse } from './errors';

/**
 * API route handler function type (without params)
 */
type ApiHandler<T = unknown> = (
    request: NextRequest
) => Promise<NextResponse<T | AuthErrorResponse>>;

/**
 * Wraps an API route handler with automatic auth error handling
 * 
 * Catches AuthTokenError and other auth-related errors, returning
 * standardized 401 responses with logout flags.
 * 
 * @param handler - The API route handler function
 * @returns Wrapped handler with error handling
 * 
 * @example
 * ```typescript
 * export const GET = withAuth(async (request) => {
 *   const token = await getAccessToken(); // Throws on error
 *   // ... rest of handler
 * });
 * ```
 */
export function withAuth<T = unknown>(handler: ApiHandler<T>): ApiHandler<T> {
    return async (request: NextRequest) => {
        try {
            return await handler(request);
        } catch (error) {
            // Handle authentication errors
            if (isAuthError(error)) {
                return handleAuthError(error);
            }

            // Re-throw non-auth errors to be handled by Next.js
            throw error;
        }
    };
}

/**
 * Alternative: Wrapper for route handlers with params
 * 
 * @example
 * ```typescript
 * export const GET = withAuthParams(async (request, context) => {
 *   const { id } = await context.params;
 *   const token = await getAccessToken();
 *   // ... rest of handler
 * });
 * ```
 */
export function withAuthParams<T = unknown, P = unknown>(
    handler: (request: NextRequest, context: { params: P }) => Promise<NextResponse<T>>
) {
    return async (request: NextRequest, context: { params: P }) => {
        try {
            return await handler(request, context);
        } catch (error) {
            if (isAuthError(error)) {
                return handleAuthError(error);
            }
            throw error;
        }
    };
}
