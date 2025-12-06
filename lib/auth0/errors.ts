/**
 * Authentication Error Types & Handler
 * 
 * Centralized error handling for Auth0 authentication failures.
 * Provides type-safe error codes and standardized error responses.
 */

import { NextResponse } from 'next/server';

/**
 * Auth error codes for different authentication failure scenarios
 */
export enum AuthErrorCode {
    TOKEN_EXPIRED = 'token_expired',
    MISSING_REFRESH_TOKEN = 'missing_refresh_token',
    INVALID_TOKEN = 'invalid_token',
    NO_SESSION = 'no_session',
    UNAUTHORIZED = 'unauthorized',
}

/**
 * Custom error class for authentication failures
 */
export class AuthTokenError extends Error {
    constructor(
        public code: AuthErrorCode,
        message: string,
        public shouldLogout: boolean = true
    ) {
        super(message);
        this.name = 'AuthTokenError';
    }
}

/**
 * Standard auth error response structure
 */
export interface AuthErrorResponse {
    error: string;
    code: AuthErrorCode;
    shouldLogout: boolean;
    message: string;
}

/**
 * Handle authentication errors and return standardized response
 * 
 * @param error - The error to handle
 * @returns NextResponse with 401 status and logout flag
 * 
 * @example
 * ```typescript
 * try {
 *   const token = await getAccessToken();
 * } catch (error) {
 *   return handleAuthError(error);
 * }
 * ```
 */
export function handleAuthError(error: unknown): NextResponse<AuthErrorResponse> {
    // Handle AuthTokenError
    if (error instanceof AuthTokenError) {
        return NextResponse.json(
            {
                error: 'Authentication failed',
                code: error.code,
                shouldLogout: error.shouldLogout,
                message: error.message,
            },
            { status: 401 }
        );
    }

    // Handle Auth0 SDK errors with specific codes
    if (error instanceof Error) {
        const errorCode = (error as Error & { code?: string }).code;

        if (errorCode === 'missing_refresh_token') {
            return NextResponse.json(
                {
                    error: 'Authentication failed',
                    code: AuthErrorCode.MISSING_REFRESH_TOKEN,
                    shouldLogout: true,
                    message: 'Session expired. Please log in again.',
                },
                { status: 401 }
            );
        }

        if (errorCode === 'invalid_token' || error.message.includes('expired')) {
            return NextResponse.json(
                {
                    error: 'Authentication failed',
                    code: AuthErrorCode.TOKEN_EXPIRED,
                    shouldLogout: true,
                    message: 'Your session has expired. Please log in again.',
                },
                { status: 401 }
            );
        }
    }

    // Fallback for unknown auth errors
    return NextResponse.json(
        {
            error: 'Authentication failed',
            code: AuthErrorCode.UNAUTHORIZED,
            shouldLogout: true,
            message: 'Authentication required. Please log in.',
        },
        { status: 401 }
    );
}

/**
 * Check if an error is an authentication error that requires logout
 */
export function isAuthError(error: unknown): error is AuthTokenError {
    if (error instanceof AuthTokenError) {
        return error.shouldLogout;
    }

    if (error instanceof Error) {
        const errorCode = (error as Error & { code?: string }).code;
        return errorCode === 'missing_refresh_token' ||
            errorCode === 'invalid_token' ||
            error.message.includes('expired');
    }

    return false;
}
