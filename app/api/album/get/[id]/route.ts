import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth0/server'
import { getAlbum } from '@/lib/api'

/**
 * GET /api/album/get/[id]
 * 
 * Fetch a specific album by ID for the authenticated user
 * 
 * Flow:
 * 1. Authenticate user via Auth0
 * 2. Validate album_id parameter
 * 3. Call backend API with user_id and album_id
 * 4. Return album details
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authenticate User
        const user = await getUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Await params (Next.js 15+ requirement)
        const resolvedParams = await params

        // Validate album_id
        const albumId = resolvedParams.id
        if (!albumId || !albumId.trim()) {
            return NextResponse.json(
                { error: 'Album ID is required' },
                { status: 400 }
            )
        }

        // Call Backend API
        try {
            const album = await getAlbum({
                user_id: user.sub,
                album_id: albumId,
            })

            return NextResponse.json({ album })

        } catch (backendError) {
            const errorMessage = backendError instanceof Error
                ? backendError.message
                : 'Unknown backend error'

            return NextResponse.json(
                {
                    error: 'Failed to fetch album from backend',
                    details: errorMessage,
                },
                { status: 500 }
            )
        }

    } catch (error) {
        return NextResponse.json(
            {
                error: 'Failed to fetch album',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}

