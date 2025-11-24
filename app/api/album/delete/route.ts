import { NextResponse } from 'next/server'
import { getUser, getAccessToken } from '@/lib/auth0/server'
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
export async function DELETE(request: Request) {
    try {
        // Authenticate User
        const user = await getUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Parse and Validate Request Body
        const body = await request.json()
        const { album_id } = body

        // Validate album_id
        if (!album_id || !album_id.trim()) {
            return NextResponse.json(
                { error: 'Album ID is required' },
                { status: 400 }
            )
        }

        // Call Backend API
        try {
            // Get Auth0 access token for backend authentication
            const accessToken = await getAccessToken()

            await apiFetchService<{ message: string; data: null }>(
                AlbumEndpoints.delete(),
                {
                    method: 'DELETE',
                    headers: {
                        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
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

        } catch (backendError) {
            const errorMessage = backendError instanceof Error
                ? backendError.message
                : 'Unknown backend error'

            return NextResponse.json(
                {
                    error: 'Failed to delete album in backend',
                    details: errorMessage,
                },
                { status: 500 }
            )
        }

    } catch (error) {
        return NextResponse.json(
            {
                error: 'Failed to delete album',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}

