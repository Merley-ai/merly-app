"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "../../../_components/DashboardLayout";
import { AlbumsContent } from "./AlbumsContent";
import { useAlbumsContext } from "@/contexts/AlbumsContext";

/**
 * Albums Page Client Component
 * 
 * Client wrapper for the albums page that:
 * - Wraps content with DashboardLayout
 * - Receives selectedAlbum from DashboardLayout via function-as-children pattern
 * - Passes selectedAlbum to AlbumsContent
 * - Handles auto-selection via query parameter (e.g., ?selected=album-id)
 * 
 * This ensures single source of truth for selectedAlbum state.
 */
export function AlbumsPageClient() {
    const searchParams = useSearchParams();
    const { albums, selectAlbum, selectedAlbum } = useAlbumsContext();

    // Auto-select album from query parameter
    useEffect(() => {
        const selectedId = searchParams.get('selected');
        if (selectedId && albums.length > 0) {
            // Find album by ID
            const albumToSelect = albums.find(album => album.id === selectedId);
            if (albumToSelect && albumToSelect.id !== selectedAlbum?.id) {
                selectAlbum(albumToSelect);
            }
        }
    }, [searchParams, albums, selectAlbum, selectedAlbum]);

    return (
        <DashboardLayout currentRoute="albums">
            {(selectedAlbum) => <AlbumsContent selectedAlbum={selectedAlbum} />}
        </DashboardLayout>
    );
}
