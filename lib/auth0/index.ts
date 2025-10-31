/**
 * Auth0 Utilities
 * 
 * Centralized exports for Auth0 authentication
 */

// Main Auth0 client
export { auth0 } from './Auth0';

// Server-side utilities
export {
    getSession,
    getUser,
    requireAuth,
    isAuthenticated,
    getAccessToken,
} from './server';

// Client-side utilities (use only in Client Components)
export { useUser } from './client';
export type { Auth0User } from './client';

