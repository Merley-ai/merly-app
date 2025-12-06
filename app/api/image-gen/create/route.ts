import { NextRequest, NextResponse } from 'next/server'
import { getUser, getAccessToken, withAuth } from '@/lib/auth0'
import { apiFetchService, ImageGen as ImageGenEndpoints } from '@/lib/api'
import { GENERATION_MODELS } from '@/types/image-generation'
import type { CreateGenerationRequest, GenerationResponse } from '@/types/image-generation'

/**
 * POST /api/image-gen/create
 * 
 * Intelligent routing endpoint for image generation
 * Automatically determines the correct model based on input:
 * 
 * - Text-to-Image: prompt only (no images)
 * - Edit: prompt + 1 image
 * - Remix: prompt + 2+ images
 * 
 * Flow:
 * 1. Authenticate user via Auth0
 * 2. Validate request body
 * 3. Determine generation type from input
 * 4. Route to appropriate backend endpoint
 * 5. Return response to client
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
    } = body

    if (!prompt || !prompt.trim()) {
        throw new Error('Prompt is required')
    }

    if (num_images < 1 || num_images > 10) {
        throw new Error('num_images must be between 1 and 10')
    }

    // Filter out empty/null images
    const validImages = input_images.filter(img => img && img.trim())

    // Determine generation type based on input
    let generationType: 'generate' | 'edit' | 'remix'
    let modelConfig: typeof GENERATION_MODELS[keyof typeof GENERATION_MODELS]

    if (validImages.length === 0) {
        // No images → Text-to-Image
        generationType = 'generate'
        modelConfig = GENERATION_MODELS.generate
    } else if (validImages.length === 1) {
        // 1 image → Edit
        generationType = 'edit'
        modelConfig = GENERATION_MODELS.edit
    } else {
        // 2+ images → Remix
        generationType = 'remix'
        modelConfig = GENERATION_MODELS.remix
    }

    // Call Backend API directly based on type
    let backendResponse: GenerationResponse

    if (generationType === 'generate') {
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
                    aspect_ratio,
                    num_images,
                    output_format,
                    sync_mode: false,
                }),
            }
        )
    } else if (generationType === 'edit') {
        // Image Editing
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
                    image_url: validImages[0], // Use the single image
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
        input_image_count: validImages.length,
    })
})