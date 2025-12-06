import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, withAuthParams } from '@/lib/auth0'
import { apiFetchService, Album as AlbumEndpoints } from '@/lib/api'
import type { AlbumResponse } from '@/types/album'

/**
 * GET /api/album/get/[id]
 * 
 * Fetch a specific album by ID for the authenticated user
 */
export const GET = withAuthParams<
    { album: AlbumResponse },
    Promise<{ id: string }>
>(async (request: NextRequest, { params }) => {
    const { id: albumId } = await params
    const accessToken = await getAccessToken()

    if (!albumId || !albumId.trim()) {
        throw new Error('Album ID is required')
    }

    const response = await apiFetchService<{ message: string; data: AlbumResponse }>(
        AlbumEndpoints.getAlbum(albumId),
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        }
    )

    return NextResponse.json({ album: response.data })
})

