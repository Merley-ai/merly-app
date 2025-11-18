import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth0/server'
import { getAlbumGallery } from '@/lib/api/album/client'

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
 * 
 * Flow:
 * 1. Authenticate user via Auth0
 * 2. Extract albumId from URL params
 * 3. Call backend API with query parameters
 * 4. Return gallery images
 */
export async function GET(
    request: NextRequest,
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

        // Await params (Next.js 15+)
        const { id: albumId } = await params

        // Extract query parameters
        const searchParams = request.nextUrl.searchParams
        const limit = searchParams.get('limit')
        const offset = searchParams.get('offset')
        const order_by = searchParams.get('order_by')
        const ascending = searchParams.get('ascending')

        // Call Backend API
        try {
            const images = await getAlbumGallery({
                albumId,
                limit: limit ? parseInt(limit, 10) : 20,
                offset: offset ? parseInt(offset, 10) : 0,
                order_by: order_by || 'created_at',
                ascending: ascending === 'true',
            })

            return NextResponse.json({
                images,
                count: images.length,
            })

        } catch (backendError) {
            const errorMessage = backendError instanceof Error
                ? backendError.message
                : 'Unknown backend error'

            return NextResponse.json(
                {
                    error: 'Failed to fetch gallery from backend',
                    details: errorMessage,
                },
                { status: 500 }
            )
        }

    } catch (error) {
        return NextResponse.json(
            {
                error: 'Failed to fetch gallery',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}

