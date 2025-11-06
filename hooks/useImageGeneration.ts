'use client'

import { useState, useCallback } from 'react'
import type { GenerationType, GeneratedImage } from '@/types/image-generation'

/**
 * Generation request parameters
 */
interface GenerationRequest {
    type: GenerationType
    prompt: string
    model?: string
    input_images?: string[]
    aspect_ratio?: string
    num_images?: number
    output_format?: string
    album_id?: string
}

/**
 * Hook return type
 */
interface UseImageGenerationReturn {
    // State
    isGenerating: boolean
    requestId: string | null
    status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed'
    images: GeneratedImage[]
    progress: number
    error: string | null

    // Actions
    create: (request: Omit<GenerationRequest, 'type'>) => Promise<void>  // Intelligent routing (recommended)
    generate: (request: GenerationRequest) => Promise<void>               // Text-to-image only
    edit: (request: Omit<GenerationRequest, 'type'>) => Promise<void>     // Edit with 1 image
    remix: (request: Omit<GenerationRequest, 'type'>) => Promise<void>    // Remix with 2+ images
    reset: () => void
}

/**
 * useImageGeneration Hook
 * 
 * Hook for submitting image generation requests
 * 
 * @example
 * ```typescript
 * const { generate, isGenerating, requestId, error } = useImageGeneration({
 *   onSuccess: (requestId) => console.log('Request submitted:', requestId),
 * })
 * 
 * // Generate
 * await generate({
 *   type: 'generate',
 *   prompt: 'A beautiful landscape',
 * })
 * ```
 */
export function useImageGeneration({
    onSuccess,
    onError,
}: {
    onSuccess?: (requestId: string) => void
    onError?: (error: string) => void
} = {}): UseImageGenerationReturn {
    const [isGenerating, setIsGenerating] = useState(false)
    const [requestId, setRequestId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Determine status based on state
    const status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed' =
        error ? 'failed' :
            isGenerating ? 'pending' :
                requestId ? 'processing' :
                    'idle'

    // Submit generation request
    const submitGeneration = useCallback(async (
        endpoint: string,
        request: GenerationRequest
    ) => {
        try {
            setIsGenerating(true)
            setError(null)
            setRequestId(null)

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Request failed: ${response.status}`)
            }

            const data = await response.json()

            // Handle response with request_id (can be nested in data object)
            const requestIdValue = data.request_id || data.data?.request_id

            if (requestIdValue) {
                setRequestId(requestIdValue)
                setIsGenerating(false)
                onSuccess?.(requestIdValue)
            } else {
                // Log the response for debugging
                console.error('[useImageGeneration] Unexpected response:', data)
                throw new Error(`Unexpected response format. Response keys: ${Object.keys(data).join(', ')}`)
            }

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error'
            setError(errorMsg)
            setIsGenerating(false)
            onError?.(errorMsg)
            throw err
        }
    }, [onSuccess, onError])

    // Create function (intelligent routing)
    // Automatically determines whether to use generate/edit/remix based on input
    const create = useCallback(async (request: Omit<GenerationRequest, 'type'>) => {
        return submitGeneration('/api/image-gen/create', { ...request, type: 'generate' })
    }, [submitGeneration])

    // Generate function (text-to-image only, no images)
    const generate = useCallback(async (request: GenerationRequest) => {
        return submitGeneration('/api/image-gen/generate', request)
    }, [submitGeneration])

    // Edit function (requires 1 image)
    const edit = useCallback(async (request: Omit<GenerationRequest, 'type'>) => {
        return submitGeneration('/api/image-gen/edit', { ...request, type: 'edit' })
    }, [submitGeneration])

    // Remix function (requires 2+ images)
    const remix = useCallback(async (request: Omit<GenerationRequest, 'type'>) => {
        return submitGeneration('/api/image-gen/remix', { ...request, type: 'remix' })
    }, [submitGeneration])

    // Reset function
    const reset = useCallback(() => {
        setIsGenerating(false)
        setRequestId(null)
        setError(null)
    }, [])

    return {
        isGenerating,
        requestId,
        status,
        images: [],
        progress: 0,
        error,
        create,
        generate,
        edit,
        remix,
        reset,
    }
}

