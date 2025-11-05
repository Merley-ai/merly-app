import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth0/server'
import { getAllAlbums } from '@/lib/api'

/**
 * GET /api/album/getAll
 * 
 * Fetch all albums for the authenticated user
 * 
 * Flow:
 * 1. Authenticate user via Auth0
 * 2. Call backend API with user_id
 * 3. Return albums array
 */
export async function GET() {
    try {
        // Authenticate User
        const user = await getUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Call Backend API
        try {
            const albums = await getAllAlbums({
                user_id: user.sub,
            })

            return NextResponse.json({
                albums,
                count: albums.length,
            })

        } catch (backendError) {
            const errorMessage = backendError instanceof Error
                ? backendError.message
                : 'Unknown backend error'

            console.error('[API] Failed to fetch albums:', errorMessage)

            return NextResponse.json(
                {
                    error: 'Failed to fetch albums from backend',
                    details: errorMessage,
                },
                { status: 500 }
            )
        }

    } catch (error) {
        console.error('[API] Album getAll error:', error)
        return NextResponse.json(
            {
                error: 'Failed to fetch albums',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}

