/**
 * Represents a photo album, containing metadata used in the dashboard to organize images.
 * - `id`: Unique identifier for the album.
 * - `user_id`: The user who owns this album (Auth0 user ID).
 * - `name`: Display name for the album.
 * - `description`: Optional description of the album contents.
 * - `thumbnail_url`: URL of the thumbnail_url image representing the album.
 * - `createdAt`: Date when the album was created.
 * - `updatedAt`: Date when the album was last updated.
 */
export interface Album {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Album data structure from backend API responses
 * Backend returns snake_case fields and ISO date strings
 */
export interface AlbumResponse {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  created_at: string; // ISO date string from backend
  updated_at?: string;
  status?: string; // 'active' | 'archived' | etc
}

/**
 * Request payload for creating a new album
 */
export interface CreateAlbumRequest {
  user_id: string;
  name: string;
  description?: string;
}

/**
 * Request payload for updating an album
 */
export interface UpdateAlbumRequest {
  user_id: string;
  album_id: string;
  name: string;
  description?: string;
}

/**
 * Request payload for deleting an album
 */
export interface DeleteAlbumRequest {
  user_id: string;
  album_id: string;
}

/**
 * Request payload for getting a specific album
 */
export interface GetAlbumRequest {
  user_id: string;
  album_id: string;
}

/**
 * Request payload for getting all albums
 */
export interface GetAllAlbumsRequest {
  user_id: string;
}

/**
 * Transform backend album response to frontend Album type
 */
export function transformAlbumResponse(response: AlbumResponse): Album {
  return {
    id: response.id,
    user_id: response.user_id,
    name: response.name,
    description: response.description,
    thumbnail_url: response.thumbnail_url,
    createdAt: new Date(response.created_at),
    updatedAt: new Date(response.updated_at || response.created_at),
  };
}
