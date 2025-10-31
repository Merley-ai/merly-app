import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth0/server'

/**
 * API Route: /api/profile
 * 
 * GET - Fetch user profile from Supabase
 * POST - Create or update user profile in Supabase
 * 
 * This route demonstrates how to use Auth0 + Supabase together:
 * 1. Authenticate user with Auth0
 * 2. Get authenticated Supabase client (with Auth0 JWT)
 * 3. Query Supabase database with RLS automatically applied
 */

/**
 * GET /api/profile
 * Fetch the authenticated user's profile from Supabase
 */
export async function GET() {
    try {
        // Get authenticated user from Auth0
        const user = await getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Get Supabase client with Auth0 token
        const supabase = await getSupabaseClient()

        // Query user profile
        // RLS policies will automatically ensure user can only see their own profile
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.sub)
            .single()

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows returned (profile doesn't exist yet)
            console.error('Supabase error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch profile', details: error.message },
                { status: 500 }
            )
        }

        // If no profile exists, return null (not an error)
        if (!profile) {
            return NextResponse.json({ profile: null })
        }

        return NextResponse.json({ profile })
    } catch (error) {
        console.error('Error in GET /api/profile:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/profile
 * Create or update the authenticated user's profile in Supabase
 * 
 * Request body:
 * {
 *   full_name?: string
 *   avatar_url?: string
 * }
 */
export async function POST(request: Request) {
    try {
        // Get authenticated user from Auth0
        const user = await getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Parse request body
        const body = await request.json()
        const { full_name, avatar_url } = body

        // Validate input (optional but recommended)
        if (full_name && typeof full_name !== 'string') {
            return NextResponse.json(
                { error: 'Invalid full_name' },
                { status: 400 }
            )
        }

        if (avatar_url && typeof avatar_url !== 'string') {
            return NextResponse.json(
                { error: 'Invalid avatar_url' },
                { status: 400 }
            )
        }

        // Get Supabase client with Auth0 token
        const supabase = await getSupabaseClient()

        // Upsert profile (insert or update)
        // RLS policies will automatically ensure user can only modify their own profile
        const { data: profile, error } = await supabase
            .from('profiles')
            .upsert(
                {
                    user_id: user.sub,
                    email: user.email || '',
                    full_name: full_name || null,
                    avatar_url: avatar_url || user.picture || null,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'user_id',
                }
            )
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json(
                { error: 'Failed to save profile', details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ profile })
    } catch (error) {
        console.error('Error in POST /api/profile:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

