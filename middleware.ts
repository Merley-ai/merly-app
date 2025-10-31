import type { NextRequest } from "next/server";
import { auth0 } from "./lib/auth0/Auth0";

/**
 * Auth0 Middleware
 * 
 * This middleware handles all Auth0 authentication routes automatically.
 * It mounts the following routes:
 * - /auth/login - Initiates Auth0 login
 * - /auth/logout - Logs out the user
 * - /auth/callback - Handles Auth0 callback
 * - /auth/profile - Returns user profile
 * - /auth/access-token - Returns access token
 * 
 * No additional route handlers are needed for these endpoints.
 */
export async function middleware(request: NextRequest) {
    return await auth0.middleware(request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         * - public folder files
         */
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};

