/**
 * Represents an image displayed in the Gallery component.
 * 
 * - `id` : Unique identifier for the image.
 * - `url` : Direct URL of the image (empty string for rendering placeholders).
 * - `description` : Short user-visible description of the image.
 * - `status` : Current status of the image (either 'rendering' if in progress, or 'complete').
 * - `addedAt` : Timestamp marking when the image was added to the gallery.
 * - `requestId` : Optional request ID for tracking generation progress.
 * - `index` : Optional index within the generation batch (for placeholders).
 */
export interface GalleryImage {
    id: string;
    url: string;
    name: string;
    description: string;
    status: 'rendering' | 'complete';
    addedAt: Date;
    requestId?: string;
    index?: number;
}

/**
 * Backend API response for gallery images
 */
export interface GalleryImageResponse {
    id: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    album_id: string;
    prompt_request_id: string;
    parent_image_id: string;
    file_name: string;
    fal_url: string;
    storage_url: string;
}

/**
 * Request parameters for getting album gallery
 */
export interface GetAlbumGalleryRequest {
    albumId: string;
    limit?: number;
    offset?: number;
    order_by?: string;
    ascending?: boolean;
}

