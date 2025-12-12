"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Album } from "@/types/album";
import { useAlbumsContext } from "@/contexts/AlbumsContext";
import { Sidebar } from "@/dashboard/sidebar/Sidebar";

type DashboardLayoutChildren = ReactNode | ((selectedAlbum: Album | null) => ReactNode);

interface DashboardLayoutProps {
    children: DashboardLayoutChildren;
    currentRoute: 'home' | 'albums' | 'accounts';
    isNewAlbumView?: boolean;
}

/**
 * Shared Dashboard Layout
 * 
 * Provides consistent sidebar navigation across all dashboard routes.
 * Manages album state and sidebar state from context (persists across routes).
 */
export function DashboardLayout({ children, currentRoute, isNewAlbumView = false }: DashboardLayoutProps) {
    const router = useRouter();

    // Get albums and sidebar state from context
    const {
        albums,
        selectedAlbum,
        isLoading: albumsLoading,
        error: albumsError,
        selectAlbum,
        findNewAlbum,
        isSidebarCollapsed,
        toggleSidebar,
    } = useAlbumsContext();

    const handleCreateAlbum = () => {
        const existingNewAlbum = findNewAlbum();

        if (existingNewAlbum) {
            // Reuse existing new album - navigate to it
            router.push(`/albums/${existingNewAlbum.id}`);
        } else {
            // Create new album UUID and navigate
            const newAlbumId: string = crypto.randomUUID();
            router.push(`/albums/${newAlbumId}`);
        }
    };

    // Handle select album
    const handleSelectAlbum = (album: Album) => {
        selectAlbum(album);
        // Navigate to specific album route
        router.push(`/albums/${album.id}`);
    };

    // Handle go to home
    const handleGoToHome = () => {
        router.push('/home');
    };

    return (
        <div className="bg-black h-screen w-full flex overflow-hidden">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={toggleSidebar}
                albums={albums}
                selectedAlbum={selectedAlbum}
                onSelectAlbum={handleSelectAlbum}
                onCreateAlbum={handleCreateAlbum}
                onGoToHome={handleGoToHome}
                onBackToWebsite={() => router.push("/")}
                isLoading={albumsLoading}
                error={albumsError}
                isHomeView={currentRoute === 'home'}
                isNewAlbumView={isNewAlbumView}
            />

            {typeof children === 'function' ? children(selectedAlbum) : children}
        </div>
    );
}
