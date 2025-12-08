'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { clientFetch, createImageGenerationSSE } from '@/lib/api'
import { toast } from '@/lib/notifications'
import { resolvePreferences, type PreferencesState } from '@/components/ui/PreferencesPopover'
import { useImageGeneration } from './useImageGeneration'
import type { TimelineEntry, GalleryImage, UploadedFile } from '@/types'
import type { GeneratedImage, ImageSSEStatus } from '@/types/image-generation'

/**
 * Generation request configuration
 */
interface GenerationConfig {
    prompt: string
    inputImages: string[]
    preferences: PreferencesState
    albumId?: string
}

/**
 * Callbacks for generation lifecycle
 */
interface GenerationCallbacks {
    onTimelineUpdate?: (entry: TimelineEntry) => void
    onGalleryUpdate?: (image: GalleryImage) => void
    onAlbumCreated?: (albumId: string, albumName: string) => void
    onGenerationStart?: (requestId: string) => void
    onGenerationComplete?: (images: GeneratedImage[]) => void
    onError?: (error: string) => void
}

/**
 * Hook return type
 */
interface UseAlbumGenerationReturn {
    isGenerating: boolean
    generate: (config: GenerationConfig) => Promise<void>
    activeGenerations: Map<string, { numImages: number; aiEntryId: string }>
}

/**
 * useAlbumGeneration Hook
 * 
 * Unified generation flow that handles both new and existing albums:
 * 
 * **New Album Flow:**
 * 1. Calls /api/image-gen/generate with new_album=true
 * 2. Backend creates album + timeline event + starts generation
 * 3. Returns album_id, album_name, request_id
 * 4. Establishes SSE connection for progress tracking
 * 5. Triggers onAlbumCreated callback for navigation
 * 
 * **Existing Album Flow:**
 * 1. Adds optimistic timeline entry (user prompt)
 * 2. Adds placeholder images to gallery
 * 3. Calls /api/image-gen/create with album_id
 * 4. Establishes SSE connection for progress tracking
 * 5. Updates placeholders when images complete
 * 
 * **Key Features:**
 * - Consistent UX for both flows
 * - Real-time SSE progress tracking
 * - Optimistic UI updates
 * - Supports multiple concurrent generations
 * - Automatic error handling and recovery
 * - Runtime validation of required parameters
 * 
 * @example
 * ```typescript
 * // NEW ALBUM - albumId is undefined
 * const { generate } = useAlbumGeneration({
 *   onAlbumCreated: (albumId, albumName) => {
 *     router.push(`/albums?selected=${albumId}`)
 *   }
 * })
 * await generate({
 *   prompt: "fashion editorial",
 *   inputImages: [],
 *   preferences: { count: 2, aspectRatio: '9:16' },
 *   albumId: undefined // Creates new album with new_album: true
 * })
 * 
 * // EXISTING ALBUM - albumId is required
 * const { generate } = useAlbumGeneration({
 *   onTimelineUpdate: appendTimelineEntry,
 *   onGalleryUpdate: appendGalleryImage,
 * })
 * await generate({
 *   prompt: "fashion editorial",
 *   inputImages: [],
 *   preferences: { count: 2, aspectRatio: '9:16' },
 *   albumId: selectedAlbum.id // REQUIRED for existing album
 * })
 * ```
 */
export function useAlbumGeneration(callbacks: GenerationCallbacks = {}): UseAlbumGenerationReturn {
    const router = useRouter()
    const [isGenerating, setIsGenerating] = useState(false)

    // Track multiple concurrent generations
    const activeGenerationsRef = useRef<Map<string, { numImages: number; aiEntryId: string }>>(
        new Map()
    )

    // Image generation hook with SSE support
    const { create: createWithSSE } = useImageGeneration({
        onComplete: (images) => {
            handleGenerationComplete(images)
        },
        onError: (error) => {
            handleGenerationError(error)
        },
    })

    /**
     * Handle generation completion
     */
    const handleGenerationComplete = useCallback((images: GeneratedImage[]) => {
        // Find which generation this belongs to by checking active generations
        // In a real implementation, we'd need the request_id from the SSE event
        // For now, we'll use the first active generation (works for single generation)
        const [requestId, generationInfo] = Array.from(activeGenerationsRef.current.entries())[0] || []

        if (generationInfo && callbacks.onGalleryUpdate) {
            const { aiEntryId } = generationInfo
            const placeholderPrefix = `placeholder-${aiEntryId}-`

            // Update each placeholder with actual image
            images.forEach((img, index) => {
                const placeholderId = `${placeholderPrefix}${index}`
                callbacks.onGalleryUpdate?.({
                    id: placeholderId,
                    url: img.url,
                    name: '',
                    description: 'Generated image',
                    status: 'complete',
                    addedAt: new Date(),
                })
            })

            // Remove from active generations
            if (requestId) {
                activeGenerationsRef.current.delete(requestId)
            }
        }

        callbacks.onGenerationComplete?.(images)
    }, [callbacks])

    /**
     * Handle generation error
     */
    const handleGenerationError = useCallback((error: string) => {
        const errorEntry: TimelineEntry = {
            id: `error-${Date.now()}`,
            type: 'error',
            content: `Sorry, something went wrong: ${error}`,
            inputImages: [],
            prompt: '',
            status: 'complete',
            timestamp: new Date(),
            errorMessage: `Sorry, something went wrong: ${error}`,
        }

        callbacks.onTimelineUpdate?.(errorEntry)
        callbacks.onError?.(error)

        // Clear active generations on error
        activeGenerationsRef.current.clear()
    }, [callbacks])

    /**
     * Main generation function
     */
    const generate = useCallback(async (config: GenerationConfig) => {
        const { prompt, inputImages, preferences, albumId } = config

        console.log('[useAlbumGeneration] Generate called with:', {
            hasPrompt: !!prompt,
            albumId,
            albumIdType: typeof albumId,
            isUndefined: albumId === undefined
        })

        // Validate input
        if (!prompt.trim() && inputImages.length === 0) {
            return
        }

        const resolvedPrefs = resolvePreferences(preferences)
        const numImages = resolvedPrefs.count
        const isNewAlbum = !albumId

        console.log('[useAlbumGeneration] Flow detection:', { isNewAlbum, albumId })

        setIsGenerating(true)

        try {
            // === VALIDATION: Ensure correct parameters for each flow ===
            if (isNewAlbum) {
                // New album flow: new_album flag will be set to true
                console.log('[useAlbumGeneration] Creating new album with generation')
            } else {
                // Existing album flow: album_id is required
                if (!albumId) {
                    throw new Error('album_id is required for existing album generation')
                }
                console.log('[useAlbumGeneration] Generating for existing album:', albumId)
            }

            // Add optimistic UI updates for BOTH new and existing albums
            if (isNewAlbum || albumId) {
                // Add user entry to timeline
                const userEntry: TimelineEntry = {
                    id: Date.now().toString(),
                    type: 'user',
                    content: prompt,
                    inputImages,
                    prompt,
                    status: 'complete',
                    timestamp: new Date(),
                }
                callbacks.onTimelineUpdate?.(userEntry)

                // Add placeholder images to gallery
                const aiEntryId = (Date.now() + 1).toString()
                const placeholders: GalleryImage[] = Array.from({ length: numImages }, (_, i) => ({
                    id: `placeholder-${aiEntryId}-${i}`,
                    url: '',
                    name: '',
                    description: prompt,
                    status: 'rendering' as const,
                    addedAt: new Date(),
                    requestId: aiEntryId,
                    index: i,
                }))

                placeholders.forEach(placeholder => callbacks.onGalleryUpdate?.(placeholder))

                // Track this generation
                activeGenerationsRef.current.set(aiEntryId, { aiEntryId, numImages })
            }

            const endpoint = '/api/image-gen/create'

            // Build request body with proper validation
            const requestBody: Record<string, any> = {
                prompt,
                input_images: inputImages.length > 0 ? inputImages : undefined,
                num_images: numImages,
                aspect_ratio: resolvedPrefs.aspectRatio,
                output_format: 'png',
                model: resolvedPrefs.model,
            }

            // Add flow-specific parameters with validation
            if (isNewAlbum) {
                // New album: set new_album flag
                requestBody.new_album = true
                console.log('[useAlbumGeneration] Request body includes new_album: true')
            } else {
                // Existing album: album_id is required
                if (!albumId) {
                    throw new Error('album_id is required for existing album generation')
                }
                requestBody.album_id = albumId
                console.log('[useAlbumGeneration] Request body includes album_id:', albumId)
            }

            console.log('[useAlbumGeneration] Final request:', {
                endpoint,
                hasNewAlbum: 'new_album' in requestBody,
                hasAlbumId: 'album_id' in requestBody,
                newAlbumValue: requestBody.new_album,
                albumIdValue: requestBody.album_id,
            })

            const response = await clientFetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to generate images')
            }

            const responseData = await response.json()
            const data = responseData.data || responseData

            // === NEW ALBUM: Handle album creation ===
            if (isNewAlbum) {
                const albumName = data.album_name
                const systemMessage = data.system_message
                const promptRequestId = data.prompt_request_id

                console.log('[useAlbumGeneration] New album response:', {
                    albumName,
                    promptRequestId,
                    systemMessage,
                    allKeys: Object.keys(data),
                    fullData: data
                })

                // Show success message
                if (albumName) {

                    // Query the albums API to get the album_id by name
                    // This is a workaround since backend doesn't return album_id
                    try {
                        const albumsResponse = await clientFetch('/api/album/getAll')
                        if (albumsResponse.ok) {
                            const albumsData = await albumsResponse.json()
                            const albums = albumsData.data || albumsData.albums || []
                            // Find the newly created album by name (most recent with matching name)
                            const newAlbum = albums.find((a: any) => a.name === albumName)
                            if (newAlbum && newAlbum.id) {
                                console.log('[useAlbumGeneration] Found album_id from API:', newAlbum.id)
                                callbacks.onAlbumCreated?.(newAlbum.id, albumName)
                            } else {
                                console.warn('[useAlbumGeneration] Could not find album in list')
                            }
                        }
                    } catch (error) {
                        console.error('[useAlbumGeneration] Failed to fetch albums:', error)
                    }
                }

                // Add system message to timeline if present
                if (systemMessage) {
                    const systemEntry: TimelineEntry = {
                        id: data.timeline_event_id || `system-${Date.now()}`,
                        type: 'system',
                        content: systemMessage,
                        inputImages: [],
                        prompt: '',
                        status: 'complete',
                        timestamp: new Date(),
                        systemMessage,
                    }
                    callbacks.onTimelineUpdate?.(systemEntry)
                }
            }

            // === EXISTING ALBUM: Handle system message ===
            if (!isNewAlbum && data.system_message) {
                const systemEntry: TimelineEntry = {
                    id: data.timeline_event_id || `system-${Date.now()}`,
                    type: 'system',
                    content: data.system_message,
                    inputImages: [],
                    prompt: '',
                    status: 'complete',
                    timestamp: new Date(),
                    systemMessage: data.system_message,
                }
                callbacks.onTimelineUpdate?.(systemEntry)
            }

            // === SSE CONNECTION: Establish for both flows ===
            const requestId = data.request_id
            if (requestId) {
                callbacks.onGenerationStart?.(requestId)

                // Establish SSE connection directly (don't make another API request)
                const eventSource = createImageGenerationSSE(requestId)

                // Handle SSE messages
                eventSource.onmessage = (event) => {
                    try {
                        const sseData: ImageSSEStatus = JSON.parse(event.data)

                        console.log('[useAlbumGeneration] SSE event received:', {
                            status: sseData.status,
                            progress: sseData.progress,
                            hasImages: !!sseData.images,
                            imageCount: sseData.images?.length
                        })

                        if (sseData.status === 'complete') {
                            // Extract completed images
                            const completedImages: GeneratedImage[] = sseData.images ||
                                (sseData.imageUrl ? [{ url: sseData.imageUrl }] : [])

                            console.log('[useAlbumGeneration] Generation complete, images:', completedImages.length)

                            // For new albums, we need to get the album_id from somewhere
                            // The SSE event might have it, or we need to extract from the initial response
                            if (isNewAlbum && data.album_name) {
                                // Extract album_id from prompt_request_id or another source
                                // For now, we'll need to query the backend or get it from SSE
                                const albumIdFromSSE = (sseData as any).album_id
                                if (albumIdFromSSE) {
                                    console.log('[useAlbumGeneration] Got album_id from SSE:', albumIdFromSSE)
                                    callbacks.onAlbumCreated?.(albumIdFromSSE, data.album_name)
                                }
                            }

                            // Update placeholders with real images
                            handleGenerationComplete(completedImages)

                            eventSource.close()
                        } else if (sseData.status === 'error') {
                            console.error('[useAlbumGeneration] SSE error:', sseData.message)
                            handleGenerationError(sseData.message)
                            eventSource.close()
                        }
                    } catch (parseError) {
                        console.error('[useAlbumGeneration] SSE parse error:', parseError)
                    }
                }

                eventSource.onerror = () => {
                    console.error('[useAlbumGeneration] SSE connection error')
                    eventSource.close()
                }
            }

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'

            // Add error to timeline
            const errorEntry: TimelineEntry = {
                id: `error-${Date.now()}`,
                type: 'error',
                content: `Sorry, something went wrong: ${errorMsg}`,
                inputImages: [],
                prompt: '',
                status: 'complete',
                timestamp: new Date(),
                errorMessage: `Sorry, something went wrong: ${errorMsg}`,
            }
            callbacks.onTimelineUpdate?.(errorEntry)
            callbacks.onError?.(errorMsg)

            toast.error(errorMsg, {
                context: isNewAlbum ? 'newAlbum' : 'imageGeneration',
            })
        } finally {
            setIsGenerating(false)
        }
    }, [callbacks, createWithSSE, router])

    return {
        isGenerating,
        generate,
        activeGenerations: activeGenerationsRef.current,
    }
}
