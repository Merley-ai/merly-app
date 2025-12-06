"use client";

import { DashboardLayout } from "../../../_components/DashboardLayout";
import { AlbumsContent } from "./AlbumsContent";

/**
 * Albums Page Client Component
 * 
 * Client wrapper for the albums page that:
 * - Wraps content with DashboardLayout
 * - Receives selectedAlbum from DashboardLayout via function-as-children pattern
 * - Passes selectedAlbum to AlbumsContent
 * 
 * This ensures single source of truth for selectedAlbum state.
 */
export function AlbumsPageClient() {
    return (
        <DashboardLayout currentRoute="albums">
            {(selectedAlbum) => <AlbumsContent selectedAlbum={selectedAlbum} />}
        </DashboardLayout>
    );
}
