import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import {
    isProtectedRoute,
    isAuthRoute,
    DEFAULT_PATHS
} from '@/lib/constants/routes'

export async function middleware(request: NextRequest) {
    // Update session and get the response
    const supabaseResponse = await updateSession(request)

    const { pathname } = request.nextUrl

    // Check if current route requires authentication or is an auth route
    const requiresAuth = isProtectedRoute(pathname)
    const isAuthPage = isAuthRoute(pathname)

    // Create Supabase client to check authentication status
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    // Not setting cookies here as it's handled by updateSession
                },
            },
        }
    )

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()

    // Redirect to login if trying to access protected route without auth
    if (requiresAuth && !user) {
        const loginUrl = new URL(DEFAULT_PATHS.LOGIN, request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Redirect to dashboard if trying to access auth route while authenticated
    if (isAuthPage && user) {
        return NextResponse.redirect(new URL(DEFAULT_PATHS.AFTER_LOGIN, request.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files (images, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

