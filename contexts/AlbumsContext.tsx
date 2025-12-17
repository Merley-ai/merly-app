'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { useAlbums } from '@/hooks/albums/useAlbums'
import type { Album } from '@/types'

const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed'

interface AlbumsContextType {
    albums: Album[]
    selectedAlbum: Album | null
    isLoading: boolean
    error: string | null
    fetchAlbums: () => Promise<Album[]>
    createAlbum: (name?: string, description?: string) => Promise<Album>
    updateAlbum: (albumId: string, name: string, description?: string) => Promise<void>
    deleteAlbum: (albumId: string) => Promise<void>
    selectAlbum: (album: Album) => void
    refreshAlbum: (albumId: string) => Promise<void>
    addOptimisticAlbum: (albumId: string) => void
    updateOptimisticAlbum: (albumId: string, name: string) => void
    removeOptimisticAlbum: (albumId: string) => void
    findNewAlbum: () => Album | null
    isSidebarCollapsed: boolean
    toggleSidebar: () => void
}

const AlbumsContext = createContext<AlbumsContextType | undefined>(undefined)

export function AlbumsProvider({ children }: { children: ReactNode }) {
    const albumsState = useAlbums({
        autoFetch: true,
        onError: (error) => {
            console.error('[AlbumsProvider] Error:', error)
        },
    })

    // Sidebar state - always initialize with true for SSR consistency
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
    const [isHydrated, setIsHydrated] = useState(false)

    // Hydrate from localStorage after mount to avoid hydration mismatch
    useEffect(() => {
        const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
        if (stored !== null) {
            setIsSidebarCollapsed(JSON.parse(stored))
        }
        setIsHydrated(true)
    }, [])

    // Persist sidebar state to localStorage (only after hydration)
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(isSidebarCollapsed))
        }
    }, [isSidebarCollapsed, isHydrated])

    const toggleSidebar = () => {
        setIsSidebarCollapsed(prev => !prev)
    }

    return (
        <AlbumsContext.Provider value={{
            ...albumsState,
            isSidebarCollapsed,
            toggleSidebar,
        }}>
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
