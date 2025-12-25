import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "./lib/auth0/Auth0";
import { isMobileUserAgent } from "./lib/utils/device";

const APP_ROUTES = ['/home', '/albums', '/accounts'];

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
 * 
 * Mobile Detection:
 * Redirects mobile users accessing app routes to /mobile-view page.
 * Remove this block when mobile view is fully implemented.
 */

// TODO: Remove this block when mobile view is fully implemented
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip mobile redirect if already on mobile-view page
    if (pathname !== '/mobile-view') {
        const isAppRoute = APP_ROUTES.some(route => pathname.startsWith(route));

        if (isAppRoute) {
            const userAgent = request.headers.get('user-agent');
            if (isMobileUserAgent(userAgent)) {
                return NextResponse.redirect(new URL('/mobile-view', request.url));
            }
        }
    }

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

