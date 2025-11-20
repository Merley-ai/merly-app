'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useAlbums } from '@/hooks/useAlbums'
import type { Album } from '@/types'

interface AlbumsContextType {
    albums: Album[]
    selectedAlbum: Album | null
    isLoading: boolean
    error: string | null
    fetchAlbums: () => Promise<void>
    createAlbum: (name?: string, description?: string) => Promise<Album>
    updateAlbum: (albumId: string, name: string, description?: string) => Promise<void>
    deleteAlbum: (albumId: string) => Promise<void>
    selectAlbum: (album: Album) => void
    refreshAlbum: (albumId: string) => Promise<void>
}

const AlbumsContext = createContext<AlbumsContextType | undefined>(undefined)

export function AlbumsProvider({ children }: { children: ReactNode }) {
    const albumsState = useAlbums({
        autoFetch: true,
        onError: (error) => {
            console.error('[AlbumsProvider] Error:', error)
        },
    })

    return (
        <AlbumsContext.Provider value={albumsState}>
            {children}
        </AlbumsContext.Provider>
    )
}

export function useAlbumsContext() {
    const context = useContext(AlbumsContext)
    if (context === undefined) {
        throw new Error('useAlbumsContext must be used within an AlbumsProvider')
    }
    return context
}
