/**
 * Album API Client
 * 
 * Handles all HTTP communication for album-related operations
 */

import type {
    AlbumResponse,
    CreateAlbumRequest,
    UpdateAlbumRequest,
    DeleteAlbumRequest,
    GetAlbumRequest,
    GetAllAlbumsRequest,
} from '@/types/album'

// Import shared utilities
import { apiFetch } from '../core'

/**
 * Get all albums for a user
 * 
 * @param request - Contains user_id
 * @returns Array of albums belonging to the user
 */
export async function getAllAlbums(
    request: GetAllAlbumsRequest
): Promise<AlbumResponse[]> {
    const response = await apiFetch<{ message: string; data: AlbumResponse[] | null }>(
        `/v1/album/getAll/${request.user_id}`,
        { method: 'GET' }
    )

    // Handle backend response structure: {message, data}
    return response.data || []
}

/**
 * Get a specific album by ID
 * 
 * @param request - Contains user_id and album_id
 * @returns Single album details
 */
export async function getAlbum(
    request: GetAlbumRequest
): Promise<AlbumResponse> {
    const response = await apiFetch<{ message: string; data: AlbumResponse }>(
        `/v1/album/get/${request.album_id}`,
        { method: 'GET' }
    )

    return response.data
}

/**
 * Create a new album
 * 
 * @param request - Contains user_id, name, and optional description
 * @returns The created album
 */
export async function createAlbum(
    request: CreateAlbumRequest
): Promise<AlbumResponse> {
    const response = await apiFetch<{ message: string; data: AlbumResponse }>('/v1/album/create', {
        method: 'POST',
        body: JSON.stringify(request),
    })

    return response.data
}

/**
 * Update an existing album
 * 
 * @param request - Contains user_id, album_id, name, and optional description
 * @returns The updated album
 */
export async function updateAlbum(
    request: UpdateAlbumRequest
): Promise<AlbumResponse> {
    const response = await apiFetch<{ message: string; data: AlbumResponse }>('/v1/album/update', {
        method: 'PATCH',
        body: JSON.stringify(request),
    })

    return response.data
}

/**
 * Delete an album
 * 
 * @param request - Contains user_id and album_id
 * @returns void on success
 */
export async function deleteAlbum(
    request: DeleteAlbumRequest
): Promise<void> {
    await apiFetch<{ message: string; data: null }>('/v1/album/delete', {
        method: 'DELETE',
        body: JSON.stringify(request),
    })

    // Return void on success
    return
}

