import { NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth0/server'

/**
 * API Route: /api/auth/access-token
 * 
 * Returns the Auth0 access token for the current authenticated user.
 * This token is used by the Supabase client for authentication.
 * 
 * The token includes custom claims added by the Auth0 Post-Login Action:
 * - role: 'authenticated' (required by Supabase)
 * - user_id: Auth0 user ID
 * - email: User email
 * 
 * @returns JSON response with accessToken or error
 */
export async function GET() {
    try {
        const accessToken = await getAccessToken()

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        return NextResponse.json({ accessToken })
    } catch (error) {
        console.error('Error fetching access token:', error)
        return NextResponse.json(
            { error: 'Failed to fetch access token' },
            { status: 500 }
        )
    }
}

