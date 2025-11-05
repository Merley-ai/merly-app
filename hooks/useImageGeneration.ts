'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useGenerationPolling } from './useGenerationPolling'
import { useServerSentEvents } from './useServerSentEvents'
import type { GenerationType, GeneratedImage } from '@/types/image-generation'
import type { SseMessage } from '@/types/sse'

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
    useServerSentEventsConnection = true, // Enable SSE by default
}: {
    onComplete?: (images: GeneratedImage[]) => void
    onError?: (error: string) => void
    useServerSentEventsConnection?: boolean
} = {}): UseImageGenerationReturn {
    const [isGenerating, setIsGenerating] = useState(false)
    const [requestId, setRequestId] = useState<string | null>(null)
    const [localError, setLocalError] = useState<string | null>(null)
    const [images, setImages] = useState<GeneratedImage[]>([])
    const [progress, setProgress] = useState(0)

    const sseUnsubscribeRef = useRef<(() => void) | null>(null)
    const usePollingFallbackRef = useRef(false)

    // SSE hook
    const { subscribe: sseSubscribe } = useServerSentEvents()

    // Polling hook (fallback)
    const {
        status: pollStatus,
        images: pollImages,
        progress: pollProgress,
        error: pollError,
    } = useGenerationPolling({
        requestId,
        enabled: !!requestId && (!useServerSentEventsConnection || usePollingFallbackRef.current),
        onComplete: (imgs) => {
            setIsGenerating(false)
            setImages(imgs || [])
            onComplete?.(imgs || [])
        },
        onError: (err) => {
            setIsGenerating(false)
            setLocalError(err)
            onError?.(err)
        },
        onProgress: (prog) => {
            setProgress(prog)
        },
    })

    // Subscribe to SSE updates when requestId changes
    useEffect(() => {
        if (!requestId || !useServerSentEventsConnection) return

        console.log('[useImageGeneration] Subscribing to SSE for request:', requestId)
        usePollingFallbackRef.current = false

        // Subscribe to SSE updates (this will establish connection)
        const unsubscribe = sseSubscribe(requestId, {
            onSuccess: (data: SseMessage) => {
                if (data.payload?.images) {
                    const generatedImages = data.payload.images.map(img => ({
                        url: img.url,
                        width: img.width,
                        height: img.height,
                        content_type: img.content_type,
                    }))

                    setImages(generatedImages)
                    setProgress(100)
                    setIsGenerating(false)
                    onComplete?.(generatedImages)
                }
            },
            onError: (data: SseMessage) => {
                const errorMsg = data.message || 'Generation failed via SSE'
                setLocalError(errorMsg)
                setIsGenerating(false)
                onError?.(errorMsg)
            },
            onProgress: (data: SseMessage) => {
                if (data.payload?.progress !== undefined) {
                    setProgress(data.payload.progress)
                }
            },
            onDisconnect: () => {
                // Fall back to polling if SSE disconnects
                console.log('[useImageGeneration] SSE disconnected, falling back to polling')
                usePollingFallbackRef.current = true
            },
        })

        sseUnsubscribeRef.current = unsubscribe

        return () => {
            unsubscribe()
            sseUnsubscribeRef.current = null
        }
    }, [requestId, useServerSentEventsConnection, sseSubscribe, onComplete, onError])

    // Determine final status
    const status = requestId ? (usePollingFallbackRef.current ? pollStatus : 'processing') : 'idle'
    const error = localError || pollError

    // Use WebSocket images if available, otherwise polling images
    const finalImages = images.length > 0 ? images : (pollImages || [])
    const finalProgress = progress > 0 ? progress : pollProgress

    // Submit generation request
    const submitGeneration = useCallback(async (
        endpoint: string,
        request: GenerationRequest
    ) => {
        try {
            setIsGenerating(true)
            setLocalError(null)
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
                // Polling/WebSocket will start automatically
            } else if (data.images) {
                // Sync response (rare)
                setIsGenerating(false)
                onComplete?.(data.images)
            } else {
                // Log the response for debugging
                console.error('[useImageGeneration] Unexpected response:', data)
                throw new Error(`Unexpected response format. Response keys: ${Object.keys(data).join(', ')}`)
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
        setRequestId(null)
        setLocalError(null)
    }, [])

    return {
        isGenerating,
        requestId,
        status,
        images: finalImages,
        progress: finalProgress,
        error,
        create,    // Intelligent routing (recommended)
        generate,  // Text-to-image only
        edit,      // Edit with 1 image
        remix,     // Remix with 2+ images
        reset,
    }
}

