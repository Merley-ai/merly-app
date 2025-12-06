import { NextRequest, NextResponse } from 'next/server'
import { getUser, getAccessToken, withAuth } from '@/lib/auth0'
import { apiFetchService, Album as AlbumEndpoints } from '@/lib/api'
import type { AlbumResponse } from '@/types/album'

/**
 * PATCH /api/album/update
 * 
 * Update an existing album for the authenticated user
 * 
 * Request Body:
 * - album_id: string (required)
 * - name: string (required)
 * - description?: string (optional)
 * 
 * Flow:
 * 1. Authenticate user via Auth0
 * 2. Validate request body
 * 3. Call backend API with user_id, album_id, name, description
 * 4. Return updated album
 */
export const PATCH = withAuth(async (request: NextRequest) => {
    const user = await getUser()
    const accessToken = await getAccessToken()

    if (!user?.sub) {
        throw new Error('User ID not found')
    }

    const body = await request.json()
    const { album_id, name, description } = body

    if (!album_id || !album_id.trim()) {
        throw new Error('Album ID is required')
    }

    if (!name || !name.trim()) {
        throw new Error('Album name is required')
    }

    const response = await apiFetchService<{ message: string; data: AlbumResponse }>(
        AlbumEndpoints.update(),
        {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                user_id: user.sub,
                album_id: album_id.trim(),
                name: name.trim(),
                description: description?.trim(),
            }),
        }
    )

    return NextResponse.json({
        album: response.data,
        message: 'Album updated successfully',
    })
})

