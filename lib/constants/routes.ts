/**
 * Route Constants
 * 
 * Centralized route configuration for authentication and navigation
 */

/**
 * Routes that require authentication
 * Users will be redirected to login if not authenticated
 */
export const PROTECTED_ROUTES = [
    '/dashboard',
    // Add more protected routes here as your app grows
    // '/settings',
    // '/profile',
    // '/projects',
] as const

/**
 * Authentication routes
 * Authenticated users will be redirected to dashboard
 */
export const AUTH_ROUTES = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
] as const

/**
 * Public routes (explicitly defined)
 * These routes are accessible to everyone
 */
export const PUBLIC_ROUTES = [
    '/',
    '/about',
    '/pricing',
    '/contact',
] as const

/**
 * Auth callback routes
 * Used for OAuth and email confirmation
 */
export const AUTH_CALLBACK_ROUTES = [
    '/auth/callback',
    '/auth/confirm',
    '/auth/auth-code-error',
] as const

/**
 * Default redirect paths
 */
export const DEFAULT_PATHS = {
    // Where to redirect after successful login
    AFTER_LOGIN: '/dashboard',

    // Where to redirect when authentication is required
    LOGIN: '/login',

    // Where to redirect after successful signup
    AFTER_SIGNUP: '/dashboard',

    // Where to redirect after logout
    AFTER_LOGOUT: '/',

    // Where to redirect after password reset
    AFTER_PASSWORD_RESET: '/login',
} as const

/**
 * Helper function to check if a route is protected
 */
export function isProtectedRoute(pathname: string): boolean {
    return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Helper function to check if a route is an auth route
 */
export function isAuthRoute(pathname: string): boolean {
    return AUTH_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Helper function to check if a route is a public route
 */
export function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some(route => pathname === route)
}

/**
 * Helper function to check if a route is an auth callback route
 */
export function isAuthCallbackRoute(pathname: string): boolean {
    return AUTH_CALLBACK_ROUTES.some(route => pathname.startsWith(route))
}

