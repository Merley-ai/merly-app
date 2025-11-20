import { auth0 } from "./Auth0";
import { redirect } from "next/navigation";

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
 */
export async function getAccessToken(): Promise<string | null> {
    try {
        const session = await auth0.getSession();
        return (session?.accessToken as string | undefined) || null;
    } catch (_error) {
        return null;
    }
}

