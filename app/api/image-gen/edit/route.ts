import { NextResponse } from 'next/server'
import { getUser, getAccessToken } from '@/lib/auth0/server'
import { apiFetchService, ImageGen as ImageGenEndpoints } from '@/lib/api'
import { GENERATION_MODELS } from '@/types/image-generation'
import type { CreateGenerationRequest, GenerationResponse } from '@/types/image-generation'

/**
 * POST /api/image-gen/edit
 * 
 * Edit an existing image based on a text prompt
 * Requires an input image URL
 * 
 * Flow:
 * 1. Authenticate user via Auth0
 * 2. Validate request body (must have image)
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
      model: _model = 'fal-ai/reve/edit',
      input_images = [],
      aspect_ratio = '9:16',
      num_images = 1,
      output_format = 'png',
      album_id: _album_id,
    } = body

    // Validate prompt
    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Validate image requirement for edit
    if (!input_images || input_images.length === 0) {
      return NextResponse.json(
        { error: 'At least one input image is required for editing' },
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
      // Get Auth0 access token for backend authentication
      const accessToken = await getAccessToken()

      const modelConfig = GENERATION_MODELS.edit
      const backendResponse = await apiFetchService<GenerationResponse>(
        ImageGenEndpoints.edit(),
        {
          method: 'POST',
          headers: {
            ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
          },
          body: JSON.stringify({
            model: modelConfig.model,
            sub_path: modelConfig.sub_path,
            prompt,
            user_id: user.sub,
            image_url: input_images[0],
            aspect_ratio,
            num_images,
            output_format,
            sync_mode: false,
          }),
        }
      )

      return NextResponse.json(backendResponse)

    } catch (backendError) {

      const errorMessage = backendError instanceof Error
        ? backendError.message
        : 'Unknown backend error'

      return NextResponse.json(
        {
          error: 'Backend edit failed',
          details: errorMessage,
        },
        { status: 500 }
      )
    }

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to edit image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

