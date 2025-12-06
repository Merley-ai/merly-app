'use client'

import { useState, useEffect, useCallback } from 'react'
import { clientFetch } from '@/lib/api'
import { transformAlbumResponse } from '@/types'
import type { Album, AlbumResponse } from '@/types'

/**
 * Hook return type
 */
interface UseAlbumsReturn {
    // State
    albums: Album[]
    selectedAlbum: Album | null
    isLoading: boolean
    error: string | null

    // Actions
    fetchAlbums: () => Promise<void>
    createAlbum: (name?: string, description?: string) => Promise<Album>
    updateAlbum: (albumId: string, name: string, description?: string) => Promise<void>
    deleteAlbum: (albumId: string) => Promise<void>
    selectAlbum: (album: Album) => void
    refreshAlbum: (albumId: string) => Promise<void>
}

/**
 * Hook options
 */
interface UseAlbumsOptions {
    autoFetch?: boolean // Automatically fetch albums on mount (default: true)
    onError?: (error: string) => void
}

/**
 * useAlbums Hook
 * 
 * Complete hook for album management with automatic fetching and state management
 * 
 * @example
 * ```typescript
 * const { albums, createAlbum, selectAlbum } = useAlbums()
 * 
 * // Create album with automatic placeholder
 * await createAlbum()
 * 
 * // Create album with custom name
 * await createAlbum('My Collection', 'Editorial photos')
 * ```
 */
export function useAlbums({
    autoFetch = true,
    onError,
}: UseAlbumsOptions = {}): UseAlbumsReturn {
    const [albums, setAlbums] = useState<Album[]>([])
    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
    const [isLoading, setIsLoading] = useState(autoFetch)
    const [error, setError] = useState<string | null>(null)

    // Fetch all albums
    const fetchAlbums = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await clientFetch('/api/album/getAll', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Failed to fetch albums: ${response.status}`)
            }

            const data = await response.json()
            const transformedAlbums = (data.albums as AlbumResponse[])
                .map(transformAlbumResponse)
                .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

            setAlbums(transformedAlbums)

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error fetching albums'
            setError(errorMsg)
            onError?.(errorMsg)
            console.error('[useAlbums] Fetch error:', err)
        } finally {
            setIsLoading(false)
        }
    }, [onError])

    // Create new album
    const createAlbum = useCallback(async (
        name?: string,
        description?: string
    ): Promise<Album> => {
        try {
            setError(null)

            // Generate placeholder values if not provided
            const timestamp = Date.now()
            const albumName = name || `New Album ${timestamp}`
            const albumDescription = description || `Created on ${new Date().toLocaleDateString()}`

            const response = await clientFetch('/api/album/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: albumName,
                    description: albumDescription,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Failed to create album: ${response.status}`)
            }

            const data = await response.json()

            if (!data.album) {
                throw new Error('Invalid response: album data missing')
            }

            // Validate album has required fields
            const albumData = data.album as AlbumResponse
            if (!albumData.id) {
                throw new Error('Invalid album: missing ID')
            }

            const newAlbum = transformAlbumResponse(albumData)

            // Validate transformed album
            if (!newAlbum.id) {
                throw new Error('Transformation failed: album missing ID')
            }

            // Optimistically add to state and sort by updatedAt
            setAlbums(prev => [...prev, newAlbum].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()))
            setSelectedAlbum(newAlbum)

            return newAlbum

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error creating album'
            setError(errorMsg)
            onError?.(errorMsg)
            console.error('[useAlbums] Create error:', err)
            throw err
        }
    }, [onError])

    // Update existing album
    const updateAlbum = useCallback(async (
        albumId: string,
        name: string,
        description?: string
    ) => {
        try {
            setError(null)

            const response = await clientFetch('/api/album/update', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    album_id: albumId,
                    name,
                    description,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Failed to update album: ${response.status}`)
            }

            const data = await response.json()
            const updatedAlbum = transformAlbumResponse(data.album as AlbumResponse)

            // Update in state and re-sort by updatedAt
            setAlbums(prev => prev
                .map(album => album.id === albumId ? updatedAlbum : album)
                .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            )

            // Update selected if it's the one being updated
            if (selectedAlbum?.id === albumId) {
                setSelectedAlbum(updatedAlbum)
            }

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error updating album'
            setError(errorMsg)
            onError?.(errorMsg)
            console.error('[useAlbums] Update error:', err)
            throw err
        }
    }, [selectedAlbum, onError])

    // Delete album
    const deleteAlbum = useCallback(async (albumId: string) => {
        try {
            setError(null)

            const response = await clientFetch('/api/album/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    album_id: albumId,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Failed to delete album: ${response.status}`)
            }

            // Remove from state
            setAlbums(prev => prev.filter(album => album.id !== albumId))

            // If deleted album was selected, select first available
            if (selectedAlbum?.id === albumId) {
                setAlbums(prev => {
                    const remaining = prev.filter(album => album.id !== albumId)
                    setSelectedAlbum(remaining.length > 0 ? remaining[0] : null)
                    return remaining
                })
            }

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error deleting album'
            setError(errorMsg)
            onError?.(errorMsg)
            console.error('[useAlbums] Delete error:', err)
            throw err
        }
    }, [selectedAlbum, onError])

    // Select album
    const selectAlbum = useCallback((album: Album) => {
        setSelectedAlbum(album)

        // Optionally save to localStorage for persistence
        try {
            localStorage.setItem('selectedAlbumId', album.id)
        } catch (err) {
            console.warn('[useAlbums] Failed to save selected album to localStorage:', err)
        }
    }, [])

    // Refresh a specific album (useful after updates)
    const refreshAlbum = useCallback(async (albumId: string) => {
        try {
            setError(null)

            const response = await clientFetch(`/api/album/get/${albumId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Failed to refresh album: ${response.status}`)
            }

            const data = await response.json()
            const refreshedAlbum = transformAlbumResponse(data.album as AlbumResponse)

            // Update in state and re-sort by updatedAt
            setAlbums(prev => prev
                .map(album => album.id === albumId ? refreshedAlbum : album)
                .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            )

            // Update selected if it's the one being refreshed
            if (selectedAlbum?.id === albumId) {
                setSelectedAlbum(refreshedAlbum)
            }

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error refreshing album'
            setError(errorMsg)
            onError?.(errorMsg)
            console.error('[useAlbums] Refresh error:', err)
        }
    }, [selectedAlbum, onError])

    // Auto-fetch albums on mount
    useEffect(() => {
        if (autoFetch) {
            fetchAlbums()
        }
    }, []) // Only run on mount, fetchAlbums intentionally excluded

    // Restore selected album from localStorage on mount
    useEffect(() => {
        if (albums.length > 0 && !selectedAlbum) {
            try {
                const savedAlbumId = localStorage.getItem('selectedAlbumId')
                if (savedAlbumId) {
                    const savedAlbum = albums.find(a => a.id === savedAlbumId)
                    if (savedAlbum) {
                        setSelectedAlbum(savedAlbum)
                        return
                    }
                }
            } catch (err) {
                console.warn('[useAlbums] Failed to restore selected album from localStorage:', err)
            }
        }
    }, [albums]) // Run when albums change, selectedAlbum intentionally excluded to avoid loops

    return {
        albums,
        selectedAlbum,
        isLoading,
        error,
        fetchAlbums,
        createAlbum,
        updateAlbum,
        deleteAlbum,
        selectAlbum,
        refreshAlbum,
    }
}

