"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Album } from "@/types/album";
import { useAlbumsContext } from "@/contexts/AlbumsContext";
import { Sidebar } from "@/dashboard/sidebar/Sidebar";

type DashboardLayoutChildren = ReactNode | ((selectedAlbum: Album | null) => ReactNode);

interface DashboardLayoutProps {
    children: DashboardLayoutChildren;
    currentRoute: 'home' | 'albums' | 'accounts';
}

const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed';

/**
 * Shared Dashboard Layout
 * 
 * Provides consistent sidebar navigation across all dashboard routes.
 * Manages album state and sidebar collapse state.
 */
export function DashboardLayout({ children, currentRoute }: DashboardLayoutProps) {
    const router = useRouter();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        // Initialize from localStorage if available
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
            return stored ? JSON.parse(stored) : true;
        }
        return true;
    });

    // Persist sidebar state to localStorage
    useEffect(() => {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(isSidebarCollapsed));
    }, [isSidebarCollapsed]);

    // Get albums from context - persists across route changes
    const {
        albums,
        selectedAlbum,
        isLoading: albumsLoading,
        error: albumsError,
        createAlbum,
        selectAlbum,
    } = useAlbumsContext();

    // Handle create album
    const handleCreateAlbum = async () => {
        try {
            await createAlbum();
            // Navigate to albums route with new album selected
            router.push('/albums');
        } catch (error) {
            console.error('Failed to create album:', error);
        }
    };

    // Handle select album
    const handleSelectAlbum = (album: Album) => {
        selectAlbum(album);
        // Navigate to albums route
        router.push('/albums');
    };

    // Handle go to home
    const handleGoToHome = () => {
        router.push('/home');
    };

    return (
        <div className="bg-black h-screen w-full flex overflow-hidden">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                albums={albums}
                selectedAlbum={selectedAlbum}
                onSelectAlbum={handleSelectAlbum}
                onCreateAlbum={handleCreateAlbum}
                onGoToHome={handleGoToHome}
                onBackToWebsite={() => router.push("/")}
                isLoading={albumsLoading}
                error={albumsError}
                isHomeView={currentRoute === 'home'}
            />

            {typeof children === 'function' ? children(selectedAlbum) : children}
        </div>
    );
}
