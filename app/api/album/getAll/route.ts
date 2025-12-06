import { NextRequest, NextResponse } from 'next/server'
import { getUser, getAccessToken, withAuth } from '@/lib/auth0'
import { apiFetchService, Album as AlbumEndpoints } from '@/lib/api'
import type { AlbumResponse } from '@/types/album'

/**
 * GET /api/album/get-all
 * 
 * Fetch all albums for the authenticated user
 */
export const GET = withAuth<{ albums: AlbumResponse[]; count: number }>(async (_request: NextRequest) => {
    const user = await getUser()
    const accessToken = await getAccessToken()

    if (!user?.sub) {
        return NextResponse.json(
            { albums: [], count: 0 },
            { status: 200 }
        )
    }

    const response = await apiFetchService<{ message: string; data: AlbumResponse[] | null }>(
        AlbumEndpoints.getAllAlbums(user.sub),
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        }
    )

    const albums = response.data || []

    return NextResponse.json({
        albums,
        count: albums.length,
    })
})

