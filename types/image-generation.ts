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
    new_album?: boolean
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
    new_album?: boolean
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
    new_album?: boolean
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
    album_id?: string // Present when new_album=true
    album_name?: string // Present when new_album=true
    system_message?: string // System message for timeline
    timeline_event_id?: string // Timeline event ID
    prompt_request_id?: string // Prompt request ID
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
    new_album?: boolean
}

/**
 * Response from create generation API route
 */
export interface CreateGenerationResponse {
    generation: Generation
    request_id?: string
    results?: GeneratedImage[] // If sync mode
    system_message?: string // System message to display in timeline (e.g., "Album created", "Generation started")
    album?: any // Album data when new_album=true
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
    aspect_ratio?: '16:9' | '3:2' | '4:3' | '1:1' | '3:4' | '2:3' | '9:16'
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
    sync_mode: false,
}


/**
 * Get model configuration for a specific model and generation type
 * Automatically falls back to remix if edit is not supported
 * @param modelId - The model identifier (e.g., 'reve', 'flux-2')
 * @param generationType - The type of generation ('generate', 'edit', 'remix')
 * @returns ModelConfig with model and sub_path, and the resolved generation type
 * @example getModelConfig('flux-2', 'generate') // { model: 'fal-ai/flux-2', sub_path: '' }
 */
export function getModelConfig(modelId: ModelId, generationType: GenerationType): ModelConfig & { resolvedType: GenerationType } {
    const modelDef = MODEL_REGISTRY[modelId]

    // Determine the actual generation type based on model capabilities
    let resolvedType = generationType
    if (generationType === 'edit' && !modelDef.capabilities.edit) {
        // Model doesn't support edit, fall back to remix
        resolvedType = 'remix'
    }

    const subPath = modelDef.subPaths[resolvedType]

    return {
        model: modelDef.baseModel,
        sub_path: subPath ?? '',
        resolvedType,
    }
}

/**
 * Resolve UI model selection to ModelId
 * Converts user-friendly model names to internal model IDs
 * @param modelSelection - The model selected in UI (e.g., 'Default', 'Flux 2')
 * @returns ModelId for use with getModelConfig
 * @example resolveModelId('Flux 2') // 'flux-2'
 */
export function resolveModelId(modelSelection: models): ModelId {
    switch (modelSelection) {
        case 'Auto':
        case 'Reve':
            return 'reve'
        case 'Nano-banana Pro':
            return 'nano-banana-pro'
        case 'Flux 2 Pro':
            return 'flux-2-pro'
        case 'Seedream 4.5':
            return 'seedream-4.5'
        default:
            return 'nano-banana-pro' // Fallback to default
    }
}

/**
 * Get full model path with dynamic model selection
 * @param modelId - The model identifier
 * @param generationType - The type of generation
 * @returns Full model path (e.g., 'fal-ai/flux-2')
 * @example getFullModelPath('flux-2', 'generate') // 'fal-ai/flux-2'
 */
export function getFullModelPath(modelId: ModelId, generationType: GenerationType): string {
    const config = getModelConfig(modelId, generationType)
    return `${config.model}${config.sub_path}`
}

/**
 * Aspect ratio options with display names
 */
export type aspectRatio = "Default" | "16:9" | "3:2" | "4:3" | "1:1" | "3:4" | "2:3" | "9:16";

export const ASPECT_RATIO_LABELS = [
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '3:2', label: '3:2' },
    { value: '4:3', label: '4:3' },
    { value: '1:1', label: 'Square (1:1)' },
    { value: '3:4', label: '3:4' },
    { value: '2:3', label: '2:3' },
    { value: '9:16', label: 'Portrait (9:16)' },
] as const

/**
 * Image count options with display names
 */
export type imageCount = "Default" | "2" | "4" | "6" | "8";

export const IMAGE_COUNT_LABELS = [
    { value: 2, label: '2' },
    { value: 4, label: '4' },
    { value: 6, label: '6' },
    { value: 8, label: '8' },
] as const

/**
 * Model ID type - maps to backend model identifiers
 */
export type ModelId = 'reve' | 'nano-banana-pro' | 'flux-2-pro' | 'seedream-4.5'

/**
 * Model selection type for UI
 */
export type models = "Auto" | "Reve" | "Nano-banana Pro" | "Flux 2 Pro" | "Seedream 4.5"

/**
 * Model configuration for a specific generation type
 */
export interface ModelConfig {
    model: string // Base model path (e.g., 'fal-ai/reve')
    sub_path: string // Subpath for generation type (e.g., '/text-to-image')
}

/**
 * Model capabilities - defines what operations a model supports
 * - generate: text-to-image (no input images)
 * - edit: single image editing (exactly 1 input image)
 * - remix: multi-image remix (1+ input images)
 */
export interface ModelCapabilities {
    generate: boolean
    edit: boolean
    remix: boolean
}

/**
 * Complete model definition with metadata and capabilities
 */
export interface ModelDefinition {
    id: ModelId
    displayName: string
    description: string
    baseModel: string
    capabilities: ModelCapabilities
    subPaths: Partial<Record<GenerationType, string>>
}

/**
 * Model registry - Single source of truth for all available models
 */
export const MODEL_REGISTRY: Record<ModelId, ModelDefinition> = {
    'nano-banana-pro': {
        id: 'nano-banana-pro',
        displayName: 'Nano-banana Pro',
        description: 'Fast generation with good quality',
        baseModel: 'fal-ai/nano-banana-pro',
        capabilities: { generate: true, edit: false, remix: true },
        subPaths: {
            generate: '',
            remix: '/edit',
        },
    },
    'flux-2-pro': {
        id: 'flux-2-pro',
        displayName: 'Flux 2 pro`',
        description: 'High quality, slower generation',
        baseModel: 'fal-ai/flux-2-pro',
        capabilities: { generate: true, edit: false, remix: true },
        subPaths: {
            generate: '',
            remix: '/edit',
        },
    },
    'reve': {
        id: 'reve',
        displayName: 'Reve',
        description: 'Balanced quality and speed',
        baseModel: 'fal-ai/reve',
        capabilities: { generate: true, edit: true, remix: true },
        subPaths: {
            generate: '/text-to-image',
            edit: '/edit',
            remix: '/remix',
        },
    },
    'seedream-4.5': {
        id: 'seedream-4.5',
        displayName: 'Seedream 4.5',
        description: 'Creative and artistic results',
        baseModel: 'fal-ai/bytedance/seedream/v4.5/',
        capabilities: { generate: true, edit: false, remix: true },
        subPaths: {
            generate: 'text-to-image',
            remix: '/edit',
        },
    },
} as const

/**
 * Model options for UI display
 */
export const MODEL_OPTIONS_LABELS = [
    { value: 'Auto', label: 'Auto', description: 'Nano-banana Pro' },
    { value: 'Reve', label: 'Reve', description: 'Balanced quality and speed' },
    { value: 'Nano-banana Pro', label: 'Nano-banana Pro', description: 'Fast generation' },
    { value: 'Flux 2 Pro', label: 'Flux 2 Pro', description: 'High quality' },
    { value: 'Seedream 4.5', label: 'Seedream 4.5', description: 'Creative results' },
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

