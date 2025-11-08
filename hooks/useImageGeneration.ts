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
        console.log('[useImageGeneration] 🚀 Starting generation request', { endpoint, request })

        try {
            setIsGenerating(true)
            setError(null)
            setRequestId(null)

            console.log('[useImageGeneration] 📡 Sending POST request to:', endpoint)
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            })

            console.log('[useImageGeneration] 📥 Response received:', {
                status: response.status,
                ok: response.ok,
                contentType: response.headers.get('content-type')
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error('[useImageGeneration] ❌ Request failed:', errorData)
                throw new Error(errorData.error || `Request failed: ${response.status}`)
            }

            const data = await response.json()
            console.log('[useImageGeneration] 📦 Response data:', data)

            // Handle response with request_id (can be nested in data object)
            const requestIdValue = data.request_id || data.data?.request_id

            if (requestIdValue) {
                console.log('[useImageGeneration] ✅ Got request_id:', requestIdValue)
                setRequestId(requestIdValue)
                setIsGenerating(false)
                onSuccess?.(requestIdValue)

                // Step 2: Subscribe to SSE updates
                console.log('[useImageGeneration] 🔌 Setting up SSE connection...')

                // Close existing connection if any
                if (eventSourceRef.current) {
                    console.log('[useImageGeneration] 🔌 Closing existing EventSource')
                    eventSourceRef.current.close()
                }

                // Reset progress and status
                setProgress(0)
                setSSEStatus('processing')

                // Create new EventSource connection using SSE client utility
                console.log('[useImageGeneration] 🔌 Creating SSE connection for requestId:', requestIdValue)

                const eventSource = createImageGenerationSSE(requestIdValue)
                eventSourceRef.current = eventSource

                // Log connection opened
                eventSource.onopen = () => {
                    console.log('[useImageGeneration] ✅ SSE connection opened')
                }

                // Handle incoming messages
                eventSource.onmessage = (event) => {
                    console.log('[useImageGeneration] 📨 SSE message received:', event.data)

                    try {
                        const data: ImageSSEStatus = JSON.parse(event.data)
                        console.log('[useImageGeneration] 📦 Parsed SSE data:', data)

                        // Update progress
                        setProgress(data.progress)
                        console.log('[useImageGeneration] 📊 Progress updated:', data.progress + '%')

                        if (data.status === 'complete') {
                            console.log('[useImageGeneration] 🎉 Generation complete!')
                            // Handle completion
                            let completedImages: GeneratedImage[] = []
                            if (data.images) {
                                console.log('[useImageGeneration] 🖼️ Received images:', data.images.length)
                                completedImages = data.images
                                setImages(completedImages)
                            } else if (data.imageUrl) {
                                console.log('[useImageGeneration] 🖼️ Received single image URL')
                                completedImages = [{ url: data.imageUrl }]
                                setImages(completedImages)
                            }
                            setSSEStatus('completed')
                            setProgress(100)

                            // Trigger onComplete callback with images
                            if (completedImages.length > 0) {
                                console.log('[useImageGeneration] 🎊 Calling onComplete callback with', completedImages.length, 'images')
                                onComplete?.(completedImages)
                            }

                            console.log('[useImageGeneration] 🔌 Closing SSE connection (complete)')
                            eventSource.close()
                        } else if (data.status === 'error') {
                            console.error('[useImageGeneration] ❌ Generation error:', data.message)
                            // Handle error
                            setError(data.message)
                            setSSEStatus('failed')
                            onError?.(data.message)
                            console.log('[useImageGeneration] 🔌 Closing SSE connection (error)')
                            eventSource.close()
                        } else if (data.status === 'processing') {
                            console.log('[useImageGeneration] ⚙️ Processing:', data.message)
                            // Update processing status
                            setSSEStatus('processing')
                        }
                    } catch (parseError) {
                        console.error('[useImageGeneration] ❌ Failed to parse SSE data:', parseError, 'Raw data:', event.data)
                    }
                }

                // Handle errors
                eventSource.onerror = (error) => {
                    console.error('[useImageGeneration] ❌ SSE connection error:', error)
                    console.error('[useImageGeneration] ❌ EventSource readyState:', eventSource.readyState)
                    console.error('[useImageGeneration] ❌ EventSource url:', eventSource.url)
                    setError('Connection lost. Please try again.')
                    setSSEStatus('failed')
                    onError?.('Connection lost')
                    console.log('[useImageGeneration] 🔌 Closing SSE connection (error)')
                    eventSource.close()
                }
            } else {
                // Log the response for debugging
                console.error('[useImageGeneration] ❌ No request_id in response:', data)
                throw new Error(`Unexpected response format. Response keys: ${Object.keys(data).join(', ')}`)
            }

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error'
            console.error('[useImageGeneration] ❌ Generation failed:', errorMsg, err)
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
        console.log('[useImageGeneration] 🔄 Resetting hook state')
        // Close EventSource if open
        if (eventSourceRef.current) {
            console.log('[useImageGeneration] 🔌 Closing EventSource in reset')
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
        console.log('[useImageGeneration] 🎬 Hook mounted')
        return () => {
            console.log('[useImageGeneration] 🧹 Cleaning up on unmount')
            if (eventSourceRef.current) {
                console.log('[useImageGeneration] 🔌 Closing EventSource on unmount')
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

