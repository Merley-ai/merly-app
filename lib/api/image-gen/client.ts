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
    JobStatusResponse,
    JobResultsResponse,
} from '@/types/image-generation'

// Import shared utilities
import { apiFetch, POLLING_TIMEOUT } from '../core'

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

/**
 * Check status of a generation request
 * 
 * @param requestId - The request ID to check
 * @returns Request status and progress
 */
export async function checkJobStatus(
    requestId: string
): Promise<JobStatusResponse> {
    return apiFetch<JobStatusResponse>(
        `/v1/requests/${requestId}/status`,
        { method: 'GET' },
        POLLING_TIMEOUT // Use shorter timeout for polling
    )
}

/**
 * Get results of a completed generation request
 * 
 * @param requestId - The request ID to get results for
 * @returns Request results with generated images
 */
export async function getJobResults(
    requestId: string
): Promise<JobResultsResponse> {
    return apiFetch<JobResultsResponse>(
        `/v1/requests/${requestId}/results`,
        { method: 'GET' },
        POLLING_TIMEOUT
    )
}

