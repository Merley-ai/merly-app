import { NextResponse } from 'next/server'
import { getUser, getAccessToken } from '@/lib/auth0/server'
import { apiFetchService, Album as AlbumEndpoints } from '@/lib/api'
import type { AlbumResponse } from '@/types/album'

/**
 * GET /api/album/get-all
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
            // Get Auth0 access token for backend authentication
            const accessToken = await getAccessToken()

            const response = await apiFetchService<{ message: string; data: AlbumResponse[] | null }>(
                AlbumEndpoints.getAllAlbums(user.sub),
                {
                    headers: {
                        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
                    },
                }
            )

            const albums = response.data || []

            return NextResponse.json({
                albums,
                count: albums.length,
            })

        } catch (backendError) {
            const errorMessage = backendError instanceof Error
                ? backendError.message
                : 'Unknown backend error'

            return NextResponse.json(
                {
                    error: 'Failed to fetch albums from backend',
                    details: errorMessage,
                },
                { status: 500 }
            )
        }

    } catch (error) {
        return NextResponse.json(
            {
                error: 'Failed to fetch albums',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}

