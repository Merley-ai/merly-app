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

/**
 * Generate image from text prompt
 * 
 * @param request - Generation parameters
 * @returns Generation response with request_id or images
 */
export async function generateImage(
    request: GenerateImageRequest
): Promise<GenerationResponse> {
    return apiFetch<GenerationResponse>('/v1/image-gen/generate', {
        method: 'POST',
        body: JSON.stringify(request),
    })
}

/**
 * Edit an existing image
 * 
 * @param request - Edit parameters including image URL
 * @returns Generation response with request_id or images
 */
export async function editImage(
    request: EditImageRequest
): Promise<GenerationResponse> {
    return apiFetch<GenerationResponse>('/v1/image-gen/edit', {
        method: 'POST',
        body: JSON.stringify(request),
    })
}

/**
 * Remix multiple images
 * 
 * @param request - Remix parameters including image URLs
 * @returns Generation response with request_id or images
 */
export async function remixImages(
    request: RemixImageRequest
): Promise<GenerationResponse> {
    return apiFetch<GenerationResponse>('/v1/image-gen/remix', {
        method: 'POST',
        body: JSON.stringify(request),
    })
}

