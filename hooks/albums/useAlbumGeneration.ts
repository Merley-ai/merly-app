'use client'

import { useState, useCallback } from 'react'
import { clientFetch } from '@/lib/api'
import { resolvePreferences, type PreferencesState } from '@/components/ui/Menus/PreferencesPopover'
import type { TimelineEntry, GalleryImage } from '@/types'

/**
 * Generation request configuration
 */
interface GenerationConfig {
    prompt: string
    inputImages: string[]
    preferences: PreferencesState
    albumId?: string
    isNewAlbum?: boolean
    styleTemplateId?: string
}

/**
 * Result returned from generate function
 */
export interface GenerationResult {
    requestId: string
    numImages: number
    prompt: string
    inputImages: string[]
    albumName?: string
    systemMessage?: string
}

/**
 * Callbacks for generation lifecycle
 */
interface GenerationCallbacks {
    onTimelineUpdate?: (entry: TimelineEntry) => void
    onGalleryUpdate?: (image: GalleryImage) => void
    onAlbumCreated?: (albumId: string, albumName: string) => void
    onError?: (error: string) => void
    onGenerationError?: (requestId: string | null) => void
}

/**
 * Hook return type
 */
interface UseAlbumGenerationReturn {
    isGenerating: boolean
    generate: (config: GenerationConfig) => Promise<GenerationResult | null>
}

/**
 * useAlbumGeneration Hook
 * 
 * Unified generation flow using UUID-based routing for both new and existing albums.
 * 
 * **New Album Flow (UUID-based):**
 * 1. Parent generates UUID client-side and navigates to /albums/{uuid}
 * 2. Calls /api/image-gen/create with pre-generated album_id (UUID)
 * 3. Backend creates album with provided UUID + starts generation
 * 4. Returns album_name, request_id
 * 5. SSE connects after API response (album exists in backend)
 * 6. Triggers onAlbumCreated callback to update optimistic album name
 * 
 * **Existing Album Flow:**
 * 1. Calls /api/image-gen/create with album_id
 * 2. Backend starts generation for existing album
 * 3. Returns request_id and generation info
 * 4. Parent component handles SSE connection via useGenerationSSE
 * 
 * **Key Features:**
 * - UUID-based routing (no special 'new' route)
 * - Always requires album_id (pre-generated for new albums)
 * - Returns generation result for parent to manage SSE
 * - Optimistic UI updates via callbacks
 * 
 * @example
 * ```typescript
 * // NEW ALBUM - albumId is pre-generated UUID
 * const newAlbumId = crypto.randomUUID()
 * const { generate } = useAlbumGeneration({
 *   onAlbumCreated: (albumId, albumName) => {
 *     updateOptimisticAlbum(albumId, albumName) // Update sidebar
 *   }
 * })
 * await generate({
 *   prompt: "fashion editorial",
 *   inputImages: [],
 *   preferences: { count: 2, aspectRatio: '9:16' },
 *   albumId: newAlbumId // Pre-generated UUID
 * })
 * 
 * // EXISTING ALBUM - albumId from context
 * const { generate } = useAlbumGeneration({
 *   onGalleryUpdate: appendGalleryImage,
 * })
 * await generate({
 *   prompt: "fashion editorial",
 *   inputImages: [],
 *   preferences: { count: 2, aspectRatio: '9:16' },
 *   albumId: selectedAlbum.id // Existing album UUID
 * })
 * ```
 */
export function useAlbumGeneration(callbacks: GenerationCallbacks = {}): UseAlbumGenerationReturn {
    const [isGenerating, setIsGenerating] = useState(false)

    /**
     * Main generation function
     * Returns generation result for parent to manage SSE connection
     */
    const generate = useCallback(async (config: GenerationConfig): Promise<GenerationResult | null> => {
        const { prompt, inputImages, preferences, albumId, isNewAlbum = false, styleTemplateId } = config

        // Validate input
        if (!prompt.trim() && inputImages.length === 0) {
            return null
        }

        const resolvedPrefs = resolvePreferences(preferences)
        const numImages = resolvedPrefs.count

        setIsGenerating(true)

        try {
            // === Add user timeline entry IMMEDIATELY for instant UX feedback ===
            // This shows the user's prompt and input images before waiting for API response
            const userTimelineEntryId = `user-${Date.now()}`
            // Convert string URLs to TimelineImage objects
            const timelineImages = inputImages.map((url, index) => ({
                id: `input-${Date.now()}-${index}`,
                storageUrl: url,
                name: `Input ${index + 1}`,
                description: '',
            }))
            const userEntry: TimelineEntry = {
                id: userTimelineEntryId,
                type: 'user',
                content: prompt,
                inputImages: timelineImages, // Show uploaded images immediately
                prompt,
                status: 'complete',
                timestamp: new Date(),
            }
            callbacks.onTimelineUpdate?.(userEntry)

            const endpoint = '/api/image-gen/create'

            // Validate album_id is always provided for new albums
            if (!albumId) {
                throw new Error('album_id is required')
            }

            // Build request body
            const requestBody: Record<string, any> = {
                prompt,
                input_images: inputImages.length > 0 ? inputImages : undefined,
                num_images: numImages,
                aspect_ratio: resolvedPrefs.aspectRatio,
                output_format: 'png',
                model: resolvedPrefs.model,
                album_id: albumId,
                new_album: isNewAlbum,
                style_template_id: styleTemplateId || undefined,
            }

            console.log('[useAlbumGeneration] Sending request:', {
                albumId,
                isNewAlbum,
                new_album: requestBody.new_album,
            });

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

            const requestId = data.request_id
            const albumName = data.album_name

            // === NEW ALBUM: Notify parent that album was created ===
            if (isNewAlbum && albumName) {
                // Album created successfully in backend
                // Parent component should refresh albums list
                callbacks.onAlbumCreated?.(albumId!, albumName)
            }

            // === Handle system message (both new and existing albums) ===
            if (data.system_message) {
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

            // === Return generation result for parent to manage SSE ===
            if (data.request_id) {
                return {
                    requestId: data.request_id,
                    numImages,
                    prompt,
                    inputImages,
                    albumName: data.album_name,
                    systemMessage: data.system_message,
                }
            }

            return null

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'

            // Add error to timeline with user-friendly message
            // Convert string URLs to TimelineImage objects for error entry
            const errorTimelineImages = inputImages.map((url, index) => ({
                id: `error-input-${Date.now()}-${index}`,
                storageUrl: url,
                name: `Input ${index + 1}`,
                description: '',
            }))
            const errorEntry: TimelineEntry = {
                id: `error-${Date.now()}`,
                type: 'error',
                content: 'Sorry, something went wrong',
                inputImages: errorTimelineImages, // Store input images for retry
                prompt: prompt, // Store original prompt for retry
                status: 'complete',
                timestamp: new Date(),
                errorMessage: 'Sorry, something went wrong',
            }
            callbacks.onTimelineUpdate?.(errorEntry)
            callbacks.onError?.(errorMsg)
            callbacks.onGenerationError?.(null)

            return null
        } finally {
            setIsGenerating(false)
        }
    }, [callbacks])

    return {
        isGenerating,
        generate,
    }
}
