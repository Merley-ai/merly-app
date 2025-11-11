/**
 * Image Generation Types
 * 
 * Type definitions for backend image generation API integration.
 * These types match the Python backend API contracts.
 */

// ============================================
// Generation Types
// ============================================

export type GenerationType = 'generate' | 'edit' | 'remix'
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed'

// ============================================
// Backend API Request Types
// ============================================

/**
 * Request to generate image from text prompt
 * Optionally includes a reference image
 */
export interface GenerateImageRequest {
    model: string
    sub_path: string
    prompt: string
    user_id: string
    album_id?: string
    image_url?: string
    aspect_ratio?: string
    num_images?: number
    output_format?: string
    sync_mode?: boolean
}

/**
 * Request to edit an existing image
 * Requires an image URL
 */
export interface EditImageRequest {
    model: string
    sub_path: string
    prompt: string
    user_id: string
    album_id?: string
    image_url: string
    aspect_ratio?: string
    num_images?: number
    output_format?: string
    sync_mode?: boolean
}

/**
 * Request to remix multiple images
 * Requires array of image URLs
 */
export interface RemixImageRequest {
    model: string
    sub_path: string
    prompt: string
    user_id: string
    album_id?: string
    image_urls: string[]
    aspect_ratio?: string
    num_images?: number
    output_format?: string
    sync_mode?: boolean
}

// ============================================
// Backend API Response Types
// ============================================

/**
 * Response from backend generation endpoint
 * Contains either request_id (async) or images (sync)
 */
export interface GenerationResponse {
    request_id?: string // Present if async (sync_mode: false)
    status?: string // Backend status
    images?: GeneratedImage[] // Present if sync (sync_mode: true)
    error?: string // Error message if failed
}

/**
 * Individual generated image metadata
 */
export interface GeneratedImage {
    url: string
    width?: number
    height?: number
    seed?: number
    content_type?: string
}

/**
 * Request status response from backend
 */
export interface JobStatusResponse {
    request_id: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress?: number // 0-100
    error?: string
}

/**
 * Request results response from backend
 */
export interface JobResultsResponse {
    request_id: string
    status: string
    images: GeneratedImage[]
    metadata?: {
        prompt?: string
        model?: string
        seed?: number
        [key: string]: unknown
    }
}

// ============================================
// Database Types
// ============================================

/**
 * Generation record in database
 * Tracks each image generation request
 */
export interface Generation {
    id: string
    user_id: string
    type: GenerationType
    prompt: string
    model: string
    sub_path: string
    input_image_urls: string[] | null
    aspect_ratio: string
    num_images: number
    output_format: string
    request_id: string | null
    backend_status: string | null
    status: GenerationStatus
    error_message: string | null
    album_id: string | null
    created_at: string
    updated_at: string
    completed_at: string | null
}

/**
 * Generation result in database
 * Stores individual generated images
 */
export interface GenerationResult {
    id: string
    generation_id: string
    image_url: string
    image_index: number
    seed: number | null
    width: number | null
    height: number | null
    content_type: string | null
    created_at: string
}

/**
 * Generation with its results joined
 */
export interface GenerationWithResults extends Generation {
    results: GenerationResult[]
}

// ============================================
// Next.js API Route Types
// ============================================

/**
 * Request to create a new generation via API route
 */
export interface CreateGenerationRequest {
    type: GenerationType
    prompt: string
    model?: string
    sub_path?: string
    input_images?: string[] // Can be base64, URLs, or file references
    aspect_ratio?: string
    num_images?: number
    output_format?: string
    album_id?: string
}

/**
 * Response from create generation API route
 */
export interface CreateGenerationResponse {
    generation: Generation
    request_id?: string
    results?: GeneratedImage[] // If sync mode
}

/**
 * Response from get generation status API route
 */
export interface GetGenerationStatusResponse {
    generation: GenerationWithResults
    status: GenerationStatus
    results?: GenerationResult[]
    error?: string
}

// ============================================
// Frontend/UI Types
// ============================================

/**
 * Generation display data for UI components
 */
export interface GenerationDisplay extends Generation {
    results?: GenerationResult[]
    isLoading?: boolean
    progress?: number
}

/**
 * Options for generation creation
 */
export interface GenerationOptions {
    model?: string
    sub_path?: string
    aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
    num_images?: number
    output_format?: 'png' | 'jpg' | 'webp'
    sync_mode?: boolean
}

/**
 * Default generation options
 */
export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
    model: 'fal-ai/reve',
    sub_path: '/text-to-image',
    aspect_ratio: '16:9',
    num_images: 2,
    output_format: 'png',
    sync_mode: false, // Always use async for better UX
}

/**
 * Model options for different generation types
 */
export const GENERATION_MODELS = {
    generate: {
        model: 'fal-ai/reve',
        sub_path: '/text-to-image',
    },
    edit: {
        model: 'fal-ai/reve',
        sub_path: '/edit',
    },
    remix: {
        model: 'fal-ai/reve',
        sub_path: '/remix',
    },
} as const

/**
 * Get full model path for a generation type
 * @example getModelPath('generate') // 'fal-ai/reve/text-to-image'
 */
export function getModelPath(type: GenerationType): string {
    const config = GENERATION_MODELS[type]
    return `${config.model}${config.sub_path}`
}

/**
 * Aspect ratio options with display names
 */
export const ASPECT_RATIOS = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:4', label: 'Portrait (3:4)' },
] as const

/**
 * Output format options
 */
export const OUTPUT_FORMATS = [
    { value: 'png', label: 'PNG' },
    { value: 'jpg', label: 'JPEG' },
    { value: 'webp', label: 'WebP' },
] as const

// ============================================
// Utility Types
// ============================================

/**
 * Extract the generation type from a request
 */
export type GenerationRequestType<T> =
    T extends GenerateImageRequest ? 'generate' :
    T extends EditImageRequest ? 'edit' :
    T extends RemixImageRequest ? 'remix' :
    never

/**
 * Union of all backend request types
 */
export type AnyGenerationRequest =
    | GenerateImageRequest
    | EditImageRequest
    | RemixImageRequest

/**
 * Discriminated union for type-safe request handling
 */
export type TypedGenerationRequest =
    | { type: 'generate'; request: GenerateImageRequest }
    | { type: 'edit'; request: EditImageRequest }
    | { type: 'remix'; request: RemixImageRequest }

// ============================================
// Helper Type Guards
// ============================================

/**
 * Type guard to check if a generation is complete
 */
export function isGenerationComplete(generation: Generation): generation is Generation & { completed_at: string } {
    return generation.status === 'completed' && generation.completed_at !== null
}

/**
 * Type guard to check if a generation has failed
 */
export function isGenerationFailed(generation: Generation): generation is Generation & { error_message: string } {
    return generation.status === 'failed' && generation.error_message !== null
}

/**
 * Type guard to check if a generation is pending or processing
 */
export function isGenerationActive(generation: Generation): boolean {
    return generation.status === 'pending' || generation.status === 'processing'
}

/**
 * Type guard to check if response is async (has request_id)
 */
export function isAsyncResponse(response: GenerationResponse): response is GenerationResponse & { request_id: string } {
    return response.request_id !== undefined
}

/**
 * Type guard to check if response is sync (has images)
 */
export function isSyncResponse(response: GenerationResponse): response is GenerationResponse & { images: GeneratedImage[] } {
    return response.images !== undefined && response.images.length > 0
}

// ============================================
// SSE (Server-Sent Events) Types
// ============================================

/**
 * SSE status update from backend
 * Sent during real-time image generation
 */
export interface ImageSSEStatus {
    status: 'processing' | 'complete' | 'error'
    progress: number // 0-100
    message: string
    imageUrl?: string
    images?: GeneratedImage[]
    timestamp: number
}

