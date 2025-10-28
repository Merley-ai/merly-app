/**
 * Centralized constants export
 * 
 * This file provides a single entry point for all application constants.
 */

export { default as dashboardSvgPaths } from './dashboard-svg-paths';
export { default as websiteSvgPaths } from './website-svg-paths';

// Route constants
export {
    PROTECTED_ROUTES,
    AUTH_ROUTES,
    PUBLIC_ROUTES,
    AUTH_CALLBACK_ROUTES,
    DEFAULT_PATHS,
    isProtectedRoute,
    isAuthRoute,
    isPublicRoute,
    isAuthCallbackRoute,
} from './routes';

