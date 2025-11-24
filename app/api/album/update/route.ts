import { NextResponse } from 'next/server'
import { getUser, getAccessToken } from '@/lib/auth0/server'
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
export async function PATCH(request: Request) {
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
        const { album_id, name, description } = body

        // Validate album_id
        if (!album_id || !album_id.trim()) {
            return NextResponse.json(
                { error: 'Album ID is required' },
                { status: 400 }
            )
        }

        // Validate name
        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: 'Album name is required' },
                { status: 400 }
            )
        }

        // Call Backend API
        try {
            // Get Auth0 access token for backend authentication
            const accessToken = await getAccessToken()

            const response = await apiFetchService<{ message: string; data: AlbumResponse }>(
                AlbumEndpoints.update(),
                {
                    method: 'PATCH',
                    headers: {
                        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
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

        } catch (backendError) {
            const errorMessage = backendError instanceof Error
                ? backendError.message
                : 'Unknown backend error'

            return NextResponse.json(
                {
                    error: 'Failed to update album in backend',
                    details: errorMessage,
                },
                { status: 500 }
            )
        }

    } catch (error) {
        return NextResponse.json(
            {
                error: 'Failed to update album',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}

