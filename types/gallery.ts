/**
 * Represents an image displayed in the Gallery component.
 * 
 * - `id` : Unique identifier for the image.
 * - `url` : Direct URL of the image.
 * - `description` : Short user-visible description of the image.
 * - `status` : Current status of the image (either 'rendering' if in progress, or 'complete').
 * - `addedAt` : Timestamp marking when the image was added to the gallery.
 */
export interface GalleryImage {
    id: string;
    url: string;
    description: string;
    status: 'rendering' | 'complete';
    addedAt: Date;
}

