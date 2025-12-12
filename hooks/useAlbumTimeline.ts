'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { clientFetch } from '@/lib/api'
import { transformTimelineEvents, mergeTimelineEvents } from '@/lib/utils'
import type { TimelineEntry, TimelineEvent } from '@/types'

/**
 * Hook options
 */
interface UseAlbumTimelineOptions {
    albumId: string | null
    limit?: number
    autoFetch?: boolean
    skipInitialFetch?: boolean
    onError?: (error: string) => void
}

/**
 * Hook return type
 */
interface UseAlbumTimelineReturn {
    // State
    timelineEntries: TimelineEntry[]
    isLoading: boolean
    isLoadingMore: boolean
    error: string | null
    hasMore: boolean

    // Actions
    fetchTimeline: () => Promise<void>
    loadMore: () => Promise<void>
    appendEntry: (entry: TimelineEntry) => void
    prependEntry: (entry: TimelineEntry) => void
    updateEntry: (id: string, updates: Partial<TimelineEntry>) => void
    removeEntry: (id: string) => void
    reset: () => void
}

/**
 * useAlbumTimeline Hook
 * 
 * Fetches and manages timeline events for a specific album
 * Supports infinite scroll (load more older events by scrolling up)
 * 
 * @example
 * ```typescript
 * const { timelineEntries, loadMore, isLoadingMore } = useAlbumTimeline({
 *   albumId: '123',
 *   limit: 20,
 *   autoFetch: true,
 * })
 * ```
 */
export function useAlbumTimeline({
    albumId,
    limit = 9,
    autoFetch = true,
    skipInitialFetch = false,
    onError,
}: UseAlbumTimelineOptions): UseAlbumTimelineReturn {
    const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const [offset, setOffset] = useState(0)

    // Track the current albumId to detect changes
    const currentAlbumId = useRef<string | null>(null)

    // Track if fetch is in progress to prevent double-fetch in Strict Mode
    const fetchInProgressRef = useRef(false)

    // Fetch initial timeline
    const fetchTimeline = useCallback(async () => {
        if (!albumId) {
            setTimelineEntries([])
            setHasMore(false)
            return
        }

        try {
            setIsLoading(true)
            setError(null)

            const response = await clientFetch(
                `/api/album/${albumId}/timeline?limit=${limit}&offset=0&order_by=created_at&ascending=true`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Failed to fetch timeline: ${response.status}`)
            }

            const data = await response.json()

            const events = data.events as TimelineEvent[]
            const entries = transformTimelineEvents(events)

            setTimelineEntries(entries)
            setOffset(entries.length)
            setHasMore(entries.length === limit)

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error fetching timeline'
            setError(errorMsg)
            onError?.(errorMsg)
            console.error('[useAlbumTimeline] Fetch error:', err)
        } finally {
            setIsLoading(false)
        }
    }, [albumId, limit, onError])

    // Load more older events (for scroll up)
    const loadMore = useCallback(async () => {
        if (!albumId || isLoadingMore || !hasMore) {
            return
        }

        try {
            setIsLoadingMore(true)
            setError(null)

            const response = await clientFetch(
                `/api/album/${albumId}/timeline?limit=${limit}&offset=${offset}&order_by=created_at&ascending=true`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Failed to load more timeline: ${response.status}`)
            }

            const data = await response.json()
            const events = data.events as TimelineEvent[]
            const newEntries = transformTimelineEvents(events)

            // Prepend older events (they come before existing ones chronologically)
            setTimelineEntries(prev => [...newEntries, ...prev])
            setOffset(prev => prev + newEntries.length)
            setHasMore(newEntries.length === limit)

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error loading more timeline'
            setError(errorMsg)
            onError?.(errorMsg)
            console.error('[useAlbumTimeline] Load more error:', err)
        } finally {
            setIsLoadingMore(false)
        }
    }, [albumId, limit, offset, isLoadingMore, hasMore, onError])

    // Append new entry (optimistic update for user actions)
    const appendEntry = useCallback((entry: TimelineEntry) => {
        setTimelineEntries(prev => {
            // Deduplicate by ID
            const existingIds = new Set(prev.map(e => e.id))
            if (existingIds.has(entry.id)) {
                // Update existing entry instead of duplicating
                return prev.map(e => e.id === entry.id ? entry : e)
            }
            return [...prev, entry]
        })
    }, [])

    // Prepend entry (for new events at the top)
    const prependEntry = useCallback((entry: TimelineEntry) => {
        setTimelineEntries(prev => {
            // Deduplicate by ID
            const existingIds = new Set(prev.map(e => e.id))
            if (existingIds.has(entry.id)) {
                // Update existing entry instead of duplicating
                return prev.map(e => e.id === entry.id ? entry : e)
            }
            return [entry, ...prev]
        })
    }, [])

    // Update existing entry
    const updateEntry = useCallback((id: string, updates: Partial<TimelineEntry>) => {
        setTimelineEntries(prev =>
            prev.map(entry =>
                entry.id === id ? { ...entry, ...updates } : entry
            )
        )
    }, [])

    // Remove entry by ID
    const removeEntry = useCallback((id: string) => {
        setTimelineEntries(prev => prev.filter(entry => entry.id !== id))
    }, [])

    // Reset state
    const reset = useCallback(() => {
        setTimelineEntries([])
        setIsLoading(false)
        setIsLoadingMore(false)
        setError(null)
        setHasMore(true)
        setOffset(0)
    }, [])

    // Auto-fetch when albumId changes
    useEffect(() => {
        if (autoFetch && albumId && albumId !== currentAlbumId.current) {
            // Skip initial fetch if flag is set (preserves timeline after album creation)
            if (skipInitialFetch && currentAlbumId.current === null) {
                currentAlbumId.current = albumId
                return
            }

            // Prevent double-fetch in React Strict Mode
            if (fetchInProgressRef.current) {
                return
            }

            fetchInProgressRef.current = true
            currentAlbumId.current = albumId
            reset()

            fetchTimeline().finally(() => {
                fetchInProgressRef.current = false
            })
        } else if (!albumId && currentAlbumId.current !== null) {
            currentAlbumId.current = null
            reset()
        }
    }, [albumId, autoFetch, skipInitialFetch, fetchTimeline, reset])

    return {
        timelineEntries,
        isLoading,
        isLoadingMore,
        error,
        hasMore,
        fetchTimeline,
        loadMore,
        appendEntry,
        prependEntry,
        updateEntry,
        removeEntry,
        reset,
    }
}

