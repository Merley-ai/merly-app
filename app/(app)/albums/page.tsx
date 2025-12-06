import type { Metadata } from 'next';
import { AlbumsPageClient } from './_components/album/AlbumsPageClient';

export const metadata: Metadata = {
    title: 'Albums - Merley Dashboard',
    description: 'Create and manage your AI-generated fashion editorial albums.',
};

/**
 * Dashboard Albums Page
 * 
 * Displays the album timeline and gallery interface for creating
 * and managing AI-generated fashion images.
 * 
 * Features:
 * - Album selection and creation
 * - Timeline view with conversation history
 * - Gallery view with generated images
 * - Image generation with prompts and uploads
 * - Protected by authentication (via app layout)
 */
export default async function AlbumsPage() {
    return <AlbumsPageClient />;
}
