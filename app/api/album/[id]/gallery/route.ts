import { NextResponse } from 'next/server'
import { getAccessToken, withAuthParams } from '@/lib/auth0'
import { apiFetchService, Album as AlbumEndpoints } from '@/lib/api'
import type { GalleryImageResponse } from '@/types/gallery'

/**
 * GET /api/album/[id]/gallery
 * 
 * Fetch gallery images for a specific album
 * 
 * Query Parameters:
 * - limit: Number of images to fetch (default: 20)
 * - offset: Offset for pagination (default: 0)
 * - order_by: Field to order by (default: 'created_at')
 * - ascending: Sort order (default: false - newest first)
 */
export const GET = withAuthParams<
    { images: GalleryImageResponse[]; count: number },
    Promise<{ id: string }>
>(async (request, { params }) => {
    // Await params (Next.js 15+)
    const { id: albumId } = await params

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    const order_by = searchParams.get('order_by')
    const ascending = searchParams.get('ascending')

    // Build query params
    const queryParams = new URLSearchParams()
    queryParams.set('limit', limit || '9')
    queryParams.set('offset', offset || '0')
    queryParams.set('order_by', order_by || 'created_at')
    queryParams.set('ascending', ascending || 'false')

    const queryString = queryParams.toString()
    const baseUrl = AlbumEndpoints.getGallery(albumId)
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl

    // Get Auth0 access token
    const accessToken = await getAccessToken()

    const response = await apiFetchService<{ message: string; data: GalleryImageResponse[] }>(
        url,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        }
    )

    const images = response.data || []

    return NextResponse.json({
        images,
        count: images.length,
    })
})

