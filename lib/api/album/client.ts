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

import type {
    TimelineEvent,
    GetAlbumTimelineRequest,
} from '@/types/timeline'

import type {
    GalleryImageResponse,
    GetAlbumGalleryRequest,
} from '@/types/gallery'

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
        `/v1/album/get-all/${request.user_id}`,
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
 * Get timeline events for an album
 * 
 * @param request - Contains albumId and optional query parameters (limit, offset, order_by, ascending)
 * @returns Array of timeline events for the album
 */
export async function getAlbumTimeline(
    request: GetAlbumTimelineRequest
): Promise<TimelineEvent[]> {
    const { albumId, limit, offset, order_by, ascending } = request

    // Build query parameters
    const params = new URLSearchParams()
    if (limit !== undefined) params.append('limit', limit.toString())
    if (offset !== undefined) params.append('offset', offset.toString())
    if (order_by) params.append('order_by', order_by)
    if (ascending !== undefined) params.append('ascending', ascending.toString())

    const queryString = params.toString()
    const url = `/v1/album/get/${albumId}/timeline${queryString ? `?${queryString}` : ''}`

    const response = await apiFetch<{ message: string; data: TimelineEvent[] }>(
        url,
        { method: 'GET' }
    )

    return response.data
}

/**
 * Get gallery images for an album
 * 
 * @param request - Contains albumId and optional query parameters (limit, offset, order_by, ascending)
 * @returns Array of gallery images for the album
 */
export async function getAlbumGallery(
    request: GetAlbumGalleryRequest
): Promise<GalleryImageResponse[]> {
    const { albumId, limit, offset, order_by, ascending } = request

    // Build query parameters
    const params = new URLSearchParams()
    if (limit !== undefined) params.append('limit', limit.toString())
    if (offset !== undefined) params.append('offset', offset.toString())
    if (order_by) params.append('order_by', order_by)
    if (ascending !== undefined) params.append('ascending', ascending.toString())

    const queryString = params.toString()
    const url = `/v1/album/get/${albumId}/gallery${queryString ? `?${queryString}` : ''}`

    const response = await apiFetch<{ message: string; data: GalleryImageResponse[] }>(
        url,
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
    const response = await apiFetch<{ message: string; data: AlbumResponse }>(
        '/v1/album/create',
        {
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
    const response = await apiFetch<{ message: string; data: AlbumResponse }>(
        '/v1/album/update',
        {
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
    await apiFetch<{ message: string; data: null }>(
        '/v1/album/delete',
        {
            method: 'DELETE',
            body: JSON.stringify(request),
        })

    // Return void on success
    return
}

