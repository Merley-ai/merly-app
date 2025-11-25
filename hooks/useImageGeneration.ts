'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { GenerationType, GeneratedImage, ImageSSEStatus } from '@/types/image-generation'
import { createImageGenerationSSE } from '@/lib/api'

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
 * Hook for submitting image generation requests with real-time SSE updates
 * 
 * @example
 * ```typescript
 * const { generate, isGenerating, progress, images, error } = useImageGeneration({
 *   onSuccess: (requestId) => console.log('Request submitted:', requestId),
 *   onComplete: (images) => console.log('Generation complete:', images),
 *   onError: (error) => console.error('Generation failed:', error),
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
    onComplete,
}: {
    onSuccess?: (requestId: string) => void
    onError?: (error: string) => void
    onComplete?: (images: GeneratedImage[]) => void
} = {}): UseImageGenerationReturn {
    const [isGenerating, setIsGenerating] = useState(false)
    const [requestId, setRequestId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)
    const [images, setImages] = useState<GeneratedImage[]>([])
    const [sseStatus, setSSEStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle')

    // EventSource reference for SSE
    const eventSourceRef = useRef<EventSource | null>(null)

    // Determine status based on state
    const status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed' =
        error ? 'failed' :
            sseStatus !== 'idle' ? sseStatus :
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

                // Close existing connection if any
                if (eventSourceRef.current) {
                    eventSourceRef.current.close()
                }

                // Reset progress and status
                setProgress(0)
                setSSEStatus('processing')

                // Create new EventSource connection using SSE client utility
                const eventSource = createImageGenerationSSE(requestIdValue)
                eventSourceRef.current = eventSource

                // Handle incoming messages
                eventSource.onmessage = (event) => {
                    try {
                        const data: ImageSSEStatus = JSON.parse(event.data)

                        // Update progress
                        setProgress(data.progress)

                        if (data.status === 'complete') {
                            // Handle completion
                            let completedImages: GeneratedImage[] = []
                            if (data.images) {
                                completedImages = data.images
                                setImages(completedImages)
                            } else if (data.imageUrl) {
                                completedImages = [{ url: data.imageUrl }]
                                setImages(completedImages)
                            }
                            setSSEStatus('completed')
                            setProgress(100)

                            // Trigger onComplete callback with images
                            if (completedImages.length > 0) {
                                onComplete?.(completedImages)
                            }

                            eventSource.close()
                        } else if (data.status === 'error') {
                            // Handle error
                            setError(data.message)
                            setSSEStatus('failed')
                            onError?.(data.message)
                            eventSource.close()
                        } else if (data.status === 'processing') {
                            setSSEStatus('processing')
                        }
                    } catch (parseError) {
                        // TODO: KURIA - Handle error
                    }
                }

                eventSource.onerror = (error) => {
                    // TODO: KURIA - Handle error
                    eventSource.close()
                }
            } else {
                throw new Error(`Unexpected response format. Response keys: ${Object.keys(data).join(', ')}`)
            }

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error'
            // TODO: KURIA - Handle error
            setError(errorMsg)
            setIsGenerating(false)
            setSSEStatus('failed')
            onError?.(errorMsg)
            throw err
        }
    }, [onSuccess, onError, onComplete])

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
        // Close EventSource if open
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
        }

        setIsGenerating(false)
        setRequestId(null)
        setError(null)
        setProgress(0)
        setImages([])
        setSSEStatus('idle')
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
            }
        }
    }, [])

    return {
        isGenerating,
        requestId,
        status,
        images,
        progress,
        error,
        create,
        generate,
        edit,
        remix,
        reset,
    }
}

