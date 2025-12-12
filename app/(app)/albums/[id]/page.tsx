import type { Metadata } from 'next';
import { AlbumPageClient } from './_components/AlbumPageClient';

export const metadata: Metadata = {
    title: 'Album - Merley Dashboard',
    description: 'Create and manage your AI-generated fashion editorial album.',
};

/**
 * Dynamic Album Page
 * 
 * Route: /albums/[id]
 * 
 * Handles both new album creation and existing album viewing using UUID-based routing.
 * All albums use UUID format - new albums have pre-generated UUIDs.
 * 
 * Features:
 * - UUID-based routing (no special 'new' route)
 * - Optimistic UI updates (album appears in sidebar immediately)
 * - Real-time SSE updates for image generation
 * - Timeline and gallery management
 * - Seamless state management via AlbumsContext
 */
export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <AlbumPageClient albumId={id} />;
}
