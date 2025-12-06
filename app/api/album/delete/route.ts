import { NextRequest, NextResponse } from 'next/server'
import { getUser, getAccessToken, withAuth } from '@/lib/auth0'
import { apiFetchService, Album as AlbumEndpoints } from '@/lib/api'

/**
 * DELETE /api/album/delete
 * 
 * Delete an album for the authenticated user
 * 
 * Request Body:
 * - album_id: string (required)
 * 
 * Flow:
 * 1. Authenticate user via Auth0
 * 2. Validate request body
 * 3. Call backend API with user_id and album_id
 * 4. Return success confirmation
 */
export const DELETE = withAuth(async (request: NextRequest) => {
    const user = await getUser()
    const accessToken = await getAccessToken()

    if (!user?.sub) {
        throw new Error('User ID not found')
    }

    const body = await request.json()
    const { album_id } = body

    if (!album_id || !album_id.trim()) {
        throw new Error('Album ID is required')
    }

    await apiFetchService<{ message: string; data: null }>(
        AlbumEndpoints.delete(),
        {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                user_id: user.sub,
                album_id: album_id.trim(),
            }),
        }
    )

    return NextResponse.json({
        message: 'Album deleted successfully',
        album_id,
    })
})

