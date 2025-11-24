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
import { Album as AlbumEndpoints } from '../endpoints'

/**
 * Get all albums for a user
 * 
 * @param request - Contains user_id
 * @param accessToken - Optional JWT access token for authentication
 * @returns Array of albums belonging to the user
 */
export async function getAllAlbums(
    request: GetAllAlbumsRequest,
    accessToken?: string | null
): Promise<AlbumResponse[]> {
    const response = await apiFetch<{ message: string; data: AlbumResponse[] | null }>(
        AlbumEndpoints.getAllAlbums(request.user_id),
        { method: 'GET' },
        undefined,
        accessToken
    )
    console.log("getAllAlbums api request: ", response)

    // Handle backend response structure: {message, data}
    return response.data || []
}

/**
 * Get a specific album by ID
 * 
 * @param request - Contains user_id and album_id
 * @param accessToken - Optional JWT access token for authentication
 * @returns Single album details
 */
export async function getAlbum(
    request: GetAlbumRequest,
    accessToken?: string | null
): Promise<AlbumResponse> {
    const response = await apiFetch<{ message: string; data: AlbumResponse }>(
        AlbumEndpoints.getAlbum(request.album_id),
        { method: 'GET' },
        undefined,
        accessToken
    )

    return response.data
}

/**
 * Get timeline events for an album
 * 
 * @param request - Contains albumId and optional query parameters (limit, offset, order_by, ascending)
 * @param accessToken - Optional JWT access token for authentication
 * @returns Array of timeline events for the album
 */
export async function getAlbumTimeline(
    request: GetAlbumTimelineRequest,
    accessToken?: string | null
): Promise<TimelineEvent[]> {
    const { albumId, limit, offset, order_by, ascending } = request

    // Build query parameters
    const params = new URLSearchParams()
    if (limit !== undefined) params.append('limit', limit.toString())
    if (offset !== undefined) params.append('offset', offset.toString())
    if (order_by) params.append('order_by', order_by)
    if (ascending !== undefined) params.append('ascending', ascending.toString())

    const queryString = params.toString()
    const baseUrl = AlbumEndpoints.getTimeline(albumId)
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl

    const response = await apiFetch<{ message: string; data: TimelineEvent[] }>(
        url,
        { method: 'GET' },
        undefined,
        accessToken
    )

    return response.data
}

/**
 * Get gallery images for an album
 * 
 * @param request - Contains albumId and optional query parameters (limit, offset, order_by, ascending)
 * @param accessToken - Optional JWT access token for authentication
 * @returns Array of gallery images for the album
 */
export async function getAlbumGallery(
    request: GetAlbumGalleryRequest,
    accessToken?: string | null
): Promise<GalleryImageResponse[]> {
    const { albumId, limit, offset, order_by, ascending } = request

    // Build query parameters
    const params = new URLSearchParams()
    if (limit !== undefined) params.append('limit', limit.toString())
    if (offset !== undefined) params.append('offset', offset.toString())
    if (order_by) params.append('order_by', order_by)
    if (ascending !== undefined) params.append('ascending', ascending.toString())

    const queryString = params.toString()
    const baseUrl = AlbumEndpoints.getGallery(albumId)
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl

    const response = await apiFetch<{ message: string; data: GalleryImageResponse[] }>(
        url,
        { method: 'GET' },
        undefined,
        accessToken
    )

    return response.data
}

/**
 * Create a new album
 * 
 * @param request - Contains user_id, name, and optional description
 * @param accessToken - Optional JWT access token for authentication
 * @returns The created album
 */
export async function createAlbum(
    request: CreateAlbumRequest,
    accessToken?: string | null
): Promise<AlbumResponse> {
    const response = await apiFetch<{ message: string; data: AlbumResponse }>(
        AlbumEndpoints.create(),
        {
            method: 'POST',
            body: JSON.stringify(request),
        },
        undefined,
        accessToken
    )

    return response.data
}

/**
 * Update an existing album
 * 
 * @param request - Contains user_id, album_id, name, and optional description
 * @param accessToken - Optional JWT access token for authentication
 * @returns The updated album
 */
export async function updateAlbum(
    request: UpdateAlbumRequest,
    accessToken?: string | null
): Promise<AlbumResponse> {
    const response = await apiFetch<{ message: string; data: AlbumResponse }>(
        AlbumEndpoints.update(),
        {
            method: 'PATCH',
            body: JSON.stringify(request),
        },
        undefined,
        accessToken
    )

    return response.data
}

/**
 * Delete an album
 * 
 * @param request - Contains user_id and album_id
 * @param accessToken - Optional JWT access token for authentication
 * @returns void on success
 */
export async function deleteAlbum(
    request: DeleteAlbumRequest,
    accessToken?: string | null
): Promise<void> {
    await apiFetch<{ message: string; data: null }>(
        AlbumEndpoints.delete(),
        {
            method: 'DELETE',
            body: JSON.stringify(request),
        },
        undefined,
        accessToken
    )

    // Return void on success
    return
}

