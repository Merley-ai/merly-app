import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth0/server'
import { generateImage, editImage, remixImages, BackendAPIError } from '@/lib/api'
import { GENERATION_MODELS } from '@/types/image-generation'
import type { CreateGenerationRequest } from '@/types/image-generation'

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
export async function POST(request: Request) {
    try {
        // Authenticate User
        const user = await getUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Parse and Validate Request Body
        const body: CreateGenerationRequest = await request.json()
        const {
            prompt,
            input_images = [],
            aspect_ratio = '16:9',
            num_images = 2,
            output_format = 'png',
            album_id,
        } = body

        // Validate prompt
        if (!prompt || !prompt.trim()) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            )
        }

        // Validate num_images
        if (num_images < 1 || num_images > 10) {
            return NextResponse.json(
                { error: 'num_images must be between 1 and 10' },
                { status: 400 }
            )
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

        // Call Backend API based on type
        try {
            let backendResponse

            if (generationType === 'generate') {
                // Text-to-Image Generation
                backendResponse = await generateImage({
                    model: modelConfig.model,
                    sub_path: modelConfig.sub_path,
                    prompt,
                    user_id: user.sub,
                    album_id,
                    aspect_ratio,
                    num_images,
                    output_format,
                    sync_mode: false,
                })
            } else if (generationType === 'edit') {
                // Image Editing
                backendResponse = await editImage({
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
                })
            } else {
                // Image Remixing
                backendResponse = await remixImages({
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
                })
            }

            // Add generation type to response for frontend tracking
            return NextResponse.json({
                ...backendResponse,
                generation_type: generationType,
                input_image_count: validImages.length,
            })

        } catch (backendError) {
            // Extract detailed error information
            let errorMessage = 'Unknown backend error'
            let statusCode = 500

            if (backendError instanceof BackendAPIError) {
                errorMessage = backendError.message
                statusCode = backendError.statusCode || 500
            } else if (backendError instanceof Error) {
                errorMessage = backendError.message
            }

            return NextResponse.json(
                {
                    error: 'Backend generation failed',
                    details: errorMessage,
                    generation_type: generationType,
                    album_id, // Include album_id in error for debugging
                    backend_status: statusCode,
                },
                { status: statusCode >= 400 && statusCode < 500 ? statusCode : 500 }
            )
        }

    } catch (error) {
        return NextResponse.json(
            {
                error: 'Failed to create image generation',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}