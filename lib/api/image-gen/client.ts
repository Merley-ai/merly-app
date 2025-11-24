/**
 * Image Generation API Client
 * 
 * Handles all HTTP communication for image generation operations
 */

import type {
    GenerateImageRequest,
    EditImageRequest,
    RemixImageRequest,
    GenerationResponse,
} from '@/types/image-generation'

// Import shared utilities
import { apiFetch } from '../core'
import { ImageGen as ImageGenEndpoints } from '../endpoints'

/**
 * Generate image from text prompt
 * 
 * @param request - Generation parameters
 * @param accessToken - Optional JWT access token for authentication
 * @returns Generation response with request_id or images
 */
export async function generateImage(
    request: GenerateImageRequest,
    accessToken?: string | null
): Promise<GenerationResponse> {
    return apiFetch<GenerationResponse>(
        ImageGenEndpoints.generate(),
        {
            method: 'POST',
            body: JSON.stringify(request),
        },
        undefined,
        accessToken
    )
}

/**
 * Edit an existing image
 * 
 * @param request - Edit parameters including image URL
 * @param accessToken - Optional JWT access token for authentication
 * @returns Generation response with request_id or images
 */
export async function editImage(
    request: EditImageRequest,
    accessToken?: string | null
): Promise<GenerationResponse> {
    return apiFetch<GenerationResponse>(
        ImageGenEndpoints.edit(),
        {
            method: 'POST',
            body: JSON.stringify(request),
        },
        undefined,
        accessToken
    )
}

/**
 * Remix multiple images
 * 
 * @param request - Remix parameters including image URLs
 * @param accessToken - Optional JWT access token for authentication
 * @returns Generation response with request_id or images
 */
export async function remixImages(
    request: RemixImageRequest,
    accessToken?: string | null
): Promise<GenerationResponse> {
    return apiFetch<GenerationResponse>(
        ImageGenEndpoints.remix(),
        {
            method: 'POST',
            body: JSON.stringify(request),
        },
        undefined,
        accessToken
    )
}

