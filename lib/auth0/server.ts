import { auth0 } from "./Auth0";
import { redirect } from "next/navigation";
import { AuthTokenError, AuthErrorCode } from "./errors";

/**
 * Server-side utilities for Auth0 authentication
 */

/**
 * Get the current user session on the server
 * Returns null if not authenticated
 */
export async function getSession() {
    try {
        return await auth0.getSession();
    } catch (_error) {
        return null;
    }
}

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getUser() {
    const session = await getSession();
    return session?.user || null;
}

/**
 * Require authentication for a page/component
 * Redirects to login if not authenticated
 */
export async function requireAuth() {
    const session = await getSession();

    if (!session) {
        redirect("/auth/login");
    }

    return session;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const session = await getSession();
    return !!session;
}

/**
 * Get access token for API calls
 * 
 * Requires AUTH0_AUDIENCE environment variable to be set.
 * Returns an access token that can be used to authenticate with your backend API.
 * 
 * @throws {AuthTokenError} When token is expired, missing, or invalid
 * 
 * @example
 * ```typescript
 * try {
 *   const token = await getAccessToken();
 *   // Use token for API calls
 * } catch (error) {
 *   return handleAuthError(error);
 * }
 * ```
 */
export async function getAccessToken(): Promise<string> {
    try {
        const tokenResult = await auth0.getAccessToken();

        if (!tokenResult?.token) {
            throw new AuthTokenError(
                AuthErrorCode.NO_SESSION,
                'No valid session found. Please log in again.'
            );
        }

        return tokenResult.token;
    } catch (error) {
        // Re-throw AuthTokenError as-is
        if (error instanceof AuthTokenError) {
            throw error;
        }

        // Handle Auth0 SDK errors
        if (error instanceof Error) {
            const errorCode = (error as Error & { code?: string }).code;

            if (errorCode === 'missing_refresh_token') {
                throw new AuthTokenError(
                    AuthErrorCode.MISSING_REFRESH_TOKEN,
                    'Session expired. Please log in again.'
                );
            }

            if (errorCode === 'invalid_token' || error.message.includes('expired')) {
                throw new AuthTokenError(
                    AuthErrorCode.TOKEN_EXPIRED,
                    'Your session has expired. Please log in again.'
                );
            }
        }

        // Fallback for unknown errors
        throw new AuthTokenError(
            AuthErrorCode.INVALID_TOKEN,
            'Failed to get access token. Please log in again.'
        );
    }
}

