"use client";

import { useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Album } from "@/types/album";
import { useAlbums } from "@/hooks/useAlbums";
import { Sidebar } from "@/dashboard/sidebar/Sidebar";

type DashboardLayoutChildren = ReactNode | ((selectedAlbum: Album | null) => ReactNode);

interface DashboardLayoutProps {
    children: DashboardLayoutChildren;
    currentRoute: 'home' | 'albums' | 'accounts';
}

/**
 * Shared Dashboard Layout
 * 
 * Provides consistent sidebar navigation across all dashboard routes.
 * Manages album state and sidebar collapse state.
 */
export function DashboardLayout({ children, currentRoute }: DashboardLayoutProps) {
    const router = useRouter();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Albums hook - automatically fetches albums on mount
    const {
        albums,
        selectedAlbum,
        isLoading: albumsLoading,
        error: albumsError,
        createAlbum,
        selectAlbum,
    } = useAlbums({
        onError: () => {
            // Error handled by hook
        },
    });

    // Handle create album
    const handleCreateAlbum = async () => {
        try {
            const newAlbum = await createAlbum();
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
