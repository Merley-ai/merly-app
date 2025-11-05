import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth0/server'
import { remixImages } from '@/lib/api'
import { GENERATION_MODELS } from '@/types/image-generation'
import type { CreateGenerationRequest } from '@/types/image-generation'

/**
 * POST /api/image-gen/remix
 * 
 * Remix multiple images into a new composition
 * Requires multiple input image URLs
 * 
 * Flow:
 * 1. Authenticate user via Auth0
 * 2. Validate request body (must have multiple images)
 * 3. Call backend API
 * 4. Return response to client
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
      model = 'fal-ai/reve/remix',
      input_images = [],
      aspect_ratio = '16:9',
      num_images = 1,
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

    // Validate image requirement for remix (need multiple)
    if (!input_images || input_images.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 input images are required for remixing' },
        { status: 400 }
      )
    }

    // Limit maximum images
    if (input_images.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 input images allowed for remixing' },
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

    // Call Backend API
    try {
      const modelConfig = GENERATION_MODELS.remix
      const backendResponse = await remixImages({
        model: modelConfig.model,
        sub_path: modelConfig.sub_path,
        prompt,
        user_id: user.sub,
        image_urls: input_images,
        aspect_ratio,
        num_images,
        output_format,
        sync_mode: false,
      })

      return NextResponse.json(backendResponse)

    } catch (backendError) {

      const errorMessage = backendError instanceof Error
        ? backendError.message
        : 'Unknown backend error'

      return NextResponse.json(
        {
          error: 'Backend remix failed',
          details: errorMessage,
        },
        { status: 500 }
      )
    }

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to remix images',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
