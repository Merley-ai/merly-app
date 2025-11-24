import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { DEFAULT_PATHS } from "@/lib/constants/routes";
import { NextResponse } from "next/server";

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
 * - AUTH0_AUDIENCE (REQUIRED for JWT tokens instead of JWE)
 * - AUTH0_SCOPE (default: 'openid profile email')
 * 
 * IMPORTANT: To receive JWT tokens (3 parts) instead of JWE tokens (5 parts):
 * 1. Set AUTH0_AUDIENCE to match your API identifier in Auth0 dashboard
 * 2. Create an API in Auth0 Dashboard (Applications > APIs > Create API)
 * 3. Use the API identifier as AUTH0_AUDIENCE value
 * 4. (Optional) Set Default Audience in Tenant Settings > API Authorization Settings
 * 
 * Without a valid audience, Auth0 returns opaque JWE tokens that cannot be
 * validated by external APIs. With audience set, you get standard JWT tokens
 * that can be verified using your Auth0 tenant's public keys.
 * 
 * Configured to redirect to dashboard after successful login.
 */
export const auth0 = new Auth0Client({
    authorizationParameters: {
        audience: process.env.AUTH0_AUDIENCE,
    },
    onCallback: async (error, ctx, _session) => {
        if (error) {
            // On error, redirect to login with error message
            return NextResponse.redirect(
                new URL(`/login?error=authentication_failed`, ctx.returnTo || DEFAULT_PATHS.LOGIN)
            );
        }

        // On success, redirect to dashboard (or returnTo if specified)
        const redirectTo = ctx.returnTo || DEFAULT_PATHS.AFTER_LOGIN;
        return NextResponse.redirect(new URL(redirectTo, process.env.AUTH0_BASE_URL));
    },
});