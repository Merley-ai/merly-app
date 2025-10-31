import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * Auth0 Client Instance
 * 
 * This is the main Auth0 client used throughout the application.
 * It automatically reads configuration from environment variables:
 * - AUTH0_DOMAIN
 * - AUTH0_CLIENT_ID
 * - AUTH0_CLIENT_SECRET
 * - AUTH0_SECRET
 * - AUTH0_BASE_URL
 */
export const auth0 = new Auth0Client();