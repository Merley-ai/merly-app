'use client'

import { useUser as useAuth0User } from "@auth0/nextjs-auth0/client";

/**
 * Client-side utilities for Auth0 authentication
 * These hooks can only be used in Client Components
 */

/**
 * Hook to access user information in client components
 * 
 * @example
 * const { user, isLoading, error } = useUser();
 * 
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (!user) return <div>Please log in</div>;
 * 
 * return <div>Hello, {user.name}!</div>;
 */
export function useUser() {
    return useAuth0User();
}

/**
 * Type definitions for Auth0 user
 */
export type Auth0User = {
    email?: string;
    email_verified?: boolean;
    name?: string;
    nickname?: string;
    picture?: string;
    sub?: string;
    updated_at?: string;
    [key: string]: unknown;
};

