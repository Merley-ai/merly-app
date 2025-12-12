import { NextRequest, NextResponse } from 'next/server'
import { getUser, getAccessToken, withAuth } from '@/lib/auth0'
import { apiFetchService, ImageGen as ImageGenEndpoints } from '@/lib/api'
import { getModelConfig } from '@/types/image-generation'
import type { CreateGenerationRequest, GenerationResponse, ModelId } from '@/types/image-generation'

/**
 * POST /api/image-gen/create
 * 
 * Intelligent routing endpoint for image generation with dynamic model selection
 * 
 * **Generation Type Detection:**
 * - Text-to-Image: prompt only (no images)
 * - Edit: prompt + 1 image
 * - Remix: prompt + 2+ images
 * 
 * **Model Selection:**
 * - Accepts ModelId from preferences (e.g., 'reve', 'flux-2', 'nano-banana', 'seedream')
 * - Dynamically resolves model + subpath based on generation type
 * - Falls back to 'reve' if no model specified
 * 
 * **Flow:**
 * 1. Authenticate user via Auth0
 * 2. Validate request body
 * 3. Determine generation type from input images
 * 4. Resolve model configuration using getModelConfig()
 * 5. Route to appropriate backend endpoint with correct model + subpath
 * 6. Return response to client
 */
export const POST = withAuth(async (request: NextRequest) => {
    const user = await getUser()
    const accessToken = await getAccessToken()

    if (!user?.sub) {
        throw new Error('User ID not found')
    }

    // Parse and validate request body
    const body: CreateGenerationRequest = await request.json()
    const {
        prompt,
        input_images = [],
        aspect_ratio = '9:16',
        num_images = 2,
        output_format = 'png',
        album_id,
        new_album,
        model, // ModelId from preferences (e.g., 'reve', 'flux-2')
    } = body

    console.log('[API /image-gen/create] Request params:', {
        hasAlbumId: !!album_id,
        hasNewAlbum: !!new_album,
        albumId: album_id,
        newAlbum: new_album,
    })

    if (!prompt || !prompt.trim()) {
        throw new Error('Prompt is required')
    }

    if (num_images < 1 || num_images > 10) {
        throw new Error('num_images must be between 1 and 10')
    }

    // Validate that either album_id or new_album is provided
    if (!album_id && !new_album) {
        throw new Error('Either album_id or new_album flag is required')
    }

    // Filter out empty/null images
    const validImages = input_images.filter(img => img && img.trim())

    // Determine generation type based on input
    let generationType: 'generate' | 'edit' | 'remix'

    if (validImages.length === 0) {
        // No images → Text-to-Image
        generationType = 'generate'
    } else if (validImages.length === 1) {
        // 1 image → Edit
        generationType = 'edit'
    } else {
        // 2+ images → Remix
        generationType = 'remix'
    }

    // Resolve model configuration dynamically
    // If model is provided as ModelId (e.g., 'flux-2'), use it
    // Otherwise fallback to 'reve' for backward compatibility
    const modelId: ModelId = (model as ModelId) || 'reve'
    const modelConfig = getModelConfig(modelId, generationType)

    // Use resolvedType for routing - handles models that don't support edit
    const routingType = modelConfig.resolvedType

    // Call Backend API directly based on resolved type
    let backendResponse: GenerationResponse

    if (routingType === 'generate') {
        // Text-to-Image Generation
        backendResponse = await apiFetchService<GenerationResponse>(
            ImageGenEndpoints.generate(),
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    model: modelConfig.model,
                    sub_path: modelConfig.sub_path,
                    prompt,
                    user_id: user.sub,
                    album_id,
                    new_album,
                    aspect_ratio,
                    num_images,
                    output_format,
                    sync_mode: false,
                }),
            }
        )
    } else if (routingType === 'edit') {
        // Image Editing (only for models that support it)
        backendResponse = await apiFetchService<GenerationResponse>(
            ImageGenEndpoints.edit(),
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    model: modelConfig.model,
                    sub_path: modelConfig.sub_path,
                    prompt,
                    user_id: user.sub,
                    album_id,
                    new_album,
                    image_url: validImages[0],
                    aspect_ratio,
                    num_images,
                    output_format,
                    sync_mode: false,
                }),
            }
        )
    } else {
        // Image Remixing
        backendResponse = await apiFetchService<GenerationResponse>(
            ImageGenEndpoints.remix(),
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    model: modelConfig.model,
                    sub_path: modelConfig.sub_path,
                    prompt,
                    user_id: user.sub,
                    album_id,
                    new_album,
                    image_urls: validImages, // Use all images
                    aspect_ratio,
                    num_images,
                    output_format,
                    sync_mode: false,
                }),
            }
        )
    }

    // Add generation type to response for frontend tracking
    return NextResponse.json({
        ...backendResponse,
        generation_type: generationType,
        routing_type: routingType,
        input_image_count: validImages.length,
    })
})