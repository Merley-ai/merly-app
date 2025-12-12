'use client'

import { useEffect, useRef } from 'react'
import { createImageGenerationSSE } from '@/lib/api/image-gen/sse-client'
import type { ImageSSEStatus, GeneratedImage } from '@/types/image-generation'
import type { PendingGeneration } from '@/types'
import type { GalleryImage } from '@/types'

interface UseGenerationSSEOptions {
    pendingGeneration: PendingGeneration | null
    onGalleryUpdate: (image: GalleryImage) => void
    onComplete?: () => void
    onError?: (error: string) => void
}

/**
 * useGenerationSSE Hook
 * 
 * Manages SSE connection for a pending generation.
 * Automatically connects when pendingGeneration is provided.
 * 
 * Simplified flow (no complex persistence):
 * 1. Pending generation passed from consumePendingGeneration()
 * 2. Hook connects to SSE
 * 3. Updates gallery images as they complete
 * 4. Cleans up on unmount or completion
 * 
 * @example
 * ```tsx
 * const pending = consumePendingGeneration()
 * 
 * useGenerationSSE({
 *   pendingGeneration: pending,
 *   onGalleryUpdate: gallery.appendImage,
 *   onComplete: () => console.log('Done!')
 * })
 * ```
 */
export function useGenerationSSE({
    pendingGeneration,
    onGalleryUpdate,
    onComplete,
    onError,
}: UseGenerationSSEOptions) {
    const eventSourceRef = useRef<EventSource | null>(null)
    const processedRef = useRef(false)

    useEffect(() => {
        if (!pendingGeneration || processedRef.current) return

        const { requestId, numImages, prompt } = pendingGeneration

        console.log('[useGenerationSSE] Connecting to SSE:', {
            requestId,
            numImages,
        })

        // Mark as processed (prevent re-connection in Strict Mode)
        processedRef.current = true

        try {
            // Create SSE connection
            const eventSource = createImageGenerationSSE(requestId)
            eventSourceRef.current = eventSource

            // Handle SSE messages
            eventSource.onmessage = (event) => {
                try {
                    console.log('[useGenerationSSE] Raw SSE event received:', event.data)

                    const data: ImageSSEStatus = JSON.parse(event.data)

                    console.log('[useGenerationSSE] Parsed SSE event body:', {
                        status: data.status,
                        progress: data.progress,
                        message: data.message,
                        images: data.images,
                        fullData: data,
                    })

                    if (data.status === 'complete') {
                        // Extract images
                        const images: GeneratedImage[] = data.images || []

                        console.log('[useGenerationSSE] Generation complete:', {
                            imageCount: images.length,
                        })

                        // Update gallery with completed images
                        images.forEach((img, index) => {
                            const placeholderId = `placeholder-${requestId}-${index}`
                            onGalleryUpdate({
                                id: placeholderId,
                                url: img.url,
                                name: '',
                                description: prompt,
                                status: 'complete',
                                addedAt: new Date(),
                                requestId,
                            })
                        })

                        // Cleanup
                        onComplete?.()
                        eventSource.close()
                        eventSourceRef.current = null

                    } else if (data.status === 'error') {
                        console.error('[useGenerationSSE] Generation error:', data.message)
                        onError?.(data.message || 'Unknown error')
                        eventSource.close()
                        eventSourceRef.current = null
                    }
                } catch (error) {
                    console.error('[useGenerationSSE] SSE parse error:', error)
                }
            }

            eventSource.onerror = (error) => {
                console.error('[useGenerationSSE] SSE connection error:', error)
                // EventSource will auto-reconnect, but we can handle errors if needed
            }

        } catch (error) {
            console.error('[useGenerationSSE] Failed to connect:', error)
            onError?.(error instanceof Error ? error.message : 'Failed to connect')
        }

        // Cleanup on unmount
        return () => {
            if (eventSourceRef.current) {
                console.log('[useGenerationSSE] Closing SSE connection')
                eventSourceRef.current.close()
                eventSourceRef.current = null
            }
            // Reset processed flag to allow reconnection (handles React Strict Mode double-mount)
            processedRef.current = false
        }
    }, [pendingGeneration, onGalleryUpdate, onComplete, onError])
}
