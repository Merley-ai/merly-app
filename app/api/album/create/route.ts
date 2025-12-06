import { NextRequest, NextResponse } from 'next/server'
import { getUser, getAccessToken, withAuth } from '@/lib/auth0'
import { apiFetchService, Album as AlbumEndpoints } from '@/lib/api'
import type { AlbumResponse } from '@/types/album'

/**
 * POST /api/album/create
 * 
 * Create a new album for the authenticated user
 * 
 * Request Body:
 * - name: string (required)
 * - description?: string (optional)
 */
export const POST = withAuth<{ album: AlbumResponse; message: string }>(async (request: NextRequest) => {
    const user = await getUser()
    const accessToken = await getAccessToken()

    if (!user?.sub) {
        throw new Error('User ID not found')
    }

    // Parse and validate request body
    const body = await request.json()
    const { name, description } = body

    if (!name || !name.trim()) {
        throw new Error('Album name is required')
    }

    const response = await apiFetchService<{ message: string; data: AlbumResponse[] }>(
        AlbumEndpoints.create(),
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                user_id: user.sub,
                name: name.trim(),
                description: description?.trim(),
            }),
        }
    )

    const albums = response.data
    const album = Array.isArray(albums) ? albums[0] : undefined

    if (!album || !album.id) {
        throw new Error('Backend returned invalid album data')
    }

    return NextResponse.json(
        {
            album,
            message: 'Album created successfully',
        },
        { status: 201 }
    )
})

