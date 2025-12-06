'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { clientFetch } from '@/lib/api'
import type { GalleryImage, GalleryImageResponse } from '@/types'

/**
 * Transform backend GalleryImageResponse to frontend GalleryImage
 */
function transformGalleryImage(image: GalleryImageResponse): GalleryImage {
    return {
        id: image.id,
        // Prefer storage_url over fal_url for consistency
        url: image.storage_url || image.fal_url,
        name: image.file_name,
        description: image.file_name,
        status: 'complete',
        addedAt: new Date(image.created_at),
        requestId: image.prompt_request_id,
    }
}

/**
 * Hook options
 */
interface UseAlbumGalleryOptions {
    albumId: string | null
    limit?: number
    autoFetch?: boolean
    onError?: (error: string) => void
}

/**
 * Hook return type
 */
interface UseAlbumGalleryReturn {
    // State
    galleryImages: GalleryImage[]
    isLoading: boolean
    isLoadingMore: boolean
    error: string | null
    hasMore: boolean

    // Actions
    fetchGallery: () => Promise<void>
    loadMore: () => Promise<void>
    appendImage: (image: GalleryImage) => void
    updateImage: (id: string, updates: Partial<GalleryImage>) => void
    reset: () => void
}

/**
 * useAlbumGallery Hook
 * 
 * Fetches and manages gallery images for a specific album.
 * 
 * Order Strategy:
 * - Initial fetch: Gets newest images first (descending), then reverses for display
 *   so oldest appears at top, newest at bottom (chat-like order)
 * - Load more (scroll down): Fetches older images and prepends them to the top
 * - New placeholders: Appended to bottom (newest position)
 * 
 * @example
 * ```typescript
 * const { galleryImages, loadMore, isLoadingMore } = useAlbumGallery({
 *   albumId: '123',
 *   limit: 9,
 *   autoFetch: true,
 * })
 * ```
 */
export function useAlbumGallery({
    albumId,
    limit = 9,
    autoFetch = true,
    onError,
}: UseAlbumGalleryOptions): UseAlbumGalleryReturn {
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const [offset, setOffset] = useState(0)

    // Track the current albumId to detect changes
    const currentAlbumId = useRef<string | null>(null)

    // Fetch initial gallery (newest images first, reversed for display)
    const fetchGallery = useCallback(async () => {
        if (!albumId) {
            setGalleryImages([])
            setHasMore(false)
            return
        }

        try {
            setIsLoading(true)
            setError(null)

            // Fetch newest images first (descending order)
            const response = await clientFetch(
                `/api/album/${albumId}/gallery?limit=${limit}&offset=0&order_by=created_at&ascending=false`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Failed to fetch gallery: ${response.status}`)
            }

            const data = await response.json()
            const images = (data.images as GalleryImageResponse[]).map(transformGalleryImage)

            // Reverse so oldest is at top, newest at bottom (chat-like order)
            setGalleryImages(images.reverse())
            setOffset(images.length)
            setHasMore(images.length === limit)

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error fetching gallery'
            setError(errorMsg)
            onError?.(errorMsg)
            console.error('[useAlbumGallery] Fetch error:', err)
        } finally {
            setIsLoading(false)
        }
    }, [albumId, limit, onError])

    // Load more older images (for scroll down - reveals older content)
    const loadMore = useCallback(async () => {
        if (!albumId || isLoadingMore || !hasMore) {
            return
        }

        try {
            setIsLoadingMore(true)
            setError(null)

            // Fetch next batch of older images (descending order, higher offset)
            const response = await clientFetch(
                `/api/album/${albumId}/gallery?limit=${limit}&offset=${offset}&order_by=created_at&ascending=false`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Failed to load more gallery: ${response.status}`)
            }

            const data = await response.json()
            const newImages = (data.images as GalleryImageResponse[]).map(transformGalleryImage)

            // Prepend older images to top (reversed so oldest of batch is at top)
            // Order: [older batch reversed] + [existing images]
            setGalleryImages(prev => [...newImages.reverse(), ...prev])
            setOffset(prev => prev + newImages.length)
            setHasMore(newImages.length === limit)

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error loading more gallery'
            setError(errorMsg)
            onError?.(errorMsg)
            console.error('[useAlbumGallery] Load more error:', err)
        } finally {
            setIsLoadingMore(false)
        }
    }, [albumId, limit, offset, isLoadingMore, hasMore, onError])

    // Append new image to bottom (for placeholders and real-time updates)
    const appendImage = useCallback((image: GalleryImage) => {
        setGalleryImages(prev => [...prev, image])
    }, [])

    // Update existing image
    const updateImage = useCallback((id: string, updates: Partial<GalleryImage>) => {
        setGalleryImages(prev =>
            prev.map(image =>
                image.id === id ? { ...image, ...updates } : image
            )
        )
    }, [])

    // Reset state
    const reset = useCallback(() => {
        setGalleryImages([])
        setIsLoading(false)
        setIsLoadingMore(false)
        setError(null)
        setHasMore(true)
        setOffset(0)
    }, [])

    // Auto-fetch when albumId changes
    useEffect(() => {
        if (autoFetch && albumId && albumId !== currentAlbumId.current) {
            currentAlbumId.current = albumId
            reset()
            fetchGallery()
        } else if (!albumId && currentAlbumId.current !== null) {
            currentAlbumId.current = null
            reset()
        }
    }, [albumId, autoFetch, fetchGallery, reset])

    return {
        galleryImages,
        isLoading,
        isLoadingMore,
        error,
        hasMore,
        fetchGallery,
        loadMore,
        appendImage,
        updateImage,
        reset,
    }
}

