'use client'

import { useState, useCallback } from 'react'
import { useGenerationPolling } from './useGenerationPolling'
import type { GenerationType } from '@/types/image-generation'

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
    jobId: string | null
    status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed'
    images: any[]
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
 * Complete hook for image generation with automatic polling
 * 
 * @example
 * ```typescript
 * const { generate, status, images, progress } = useImageGeneration({
 *   onComplete: (images) => console.log('Done!', images),
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
    onComplete,
    onError,
}: {
    onComplete?: (images: any[]) => void
    onError?: (error: string) => void
} = {}): UseImageGenerationReturn {
    const [isGenerating, setIsGenerating] = useState(false)
    const [jobId, setJobId] = useState<string | null>(null)
    const [localError, setLocalError] = useState<string | null>(null)

    // Use polling hook
    const {
        status: pollStatus,
        images,
        progress,
        error: pollError,
    } = useGenerationPolling({
        jobId,
        enabled: !!jobId,
        onComplete: (imgs) => {
            setIsGenerating(false)
            onComplete?.(imgs)
        },
        onError: (err) => {
            setIsGenerating(false)
            setLocalError(err)
            onError?.(err)
        },
    })

    // Determine final status
    const status = jobId ? pollStatus : 'idle'
    const error = localError || pollError

    // Submit generation request
    const submitGeneration = useCallback(async (
        endpoint: string,
        request: GenerationRequest
    ) => {
        try {
            setIsGenerating(true)
            setLocalError(null)
            setJobId(null)

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

            if (data.job_id) {
                setJobId(data.job_id)
                // Polling will start automatically
            } else if (data.images) {
                // Sync response (rare)
                setIsGenerating(false)
                onComplete?.(data.images)
            } else {
                throw new Error('Unexpected response format')
            }

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error'
            setLocalError(errorMsg)
            setIsGenerating(false)
            onError?.(errorMsg)
            throw err
        }
    }, [onComplete, onError])

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
        setJobId(null)
        setLocalError(null)
    }, [])

    return {
        isGenerating,
        jobId,
        status,
        images,
        progress,
        error,
        create,    // Intelligent routing (recommended)
        generate,  // Text-to-image only
        edit,      // Edit with 1 image
        remix,     // Remix with 2+ images
        reset,
    }
}

