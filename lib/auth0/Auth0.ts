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
 * 
 * Configured to redirect to dashboard after successful login.
 */
export const auth0 = new Auth0Client({
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