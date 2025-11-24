import { NextResponse } from 'next/server'
import { getUser, getAccessToken } from '@/lib/auth0/server'
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
 * 
 * Flow:
 * 1. Authenticate user via Auth0
 * 2. Validate request body
 * 3. Call backend API with user_id, name, description
 * 4. Return created album
 */
export async function POST(request: Request) {
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
        const { name, description } = body

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
                AlbumEndpoints.create(),
                {
                    method: 'POST',
                    headers: {
                        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
                    },
                    body: JSON.stringify({
                        user_id: user.sub,
                        name: name.trim(),
                        description: description?.trim(),
                    }),
                }
            )

            const album = response.data

            if (!album || !album.id) {
                return NextResponse.json(
                    {
                        error: 'Backend returned invalid album data',
                        details: 'Album missing required fields',
                    },
                    { status: 500 }
                )
            }

            return NextResponse.json(
                {
                    album,
                    message: 'Album created successfully',
                },
                { status: 201 }
            )

        } catch (backendError) {
            const errorMessage = backendError instanceof Error
                ? backendError.message
                : 'Unknown backend error'

            return NextResponse.json(
                {
                    error: 'Failed to create album in backend',
                    details: errorMessage,
                },
                { status: 500 }
            )
        }

    } catch (error) {
        return NextResponse.json(
            {
                error: 'Failed to create album',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}

