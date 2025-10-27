/**
 * Represents a photo album, containing metadata used in the dashboard to organize images.
 * - `id`: Unique identifier for the album.
 * - `name`: Display name for the album.
 * - `thumbnail`: URL of the thumbnail image representing the album.
 */
export interface Album {
  id: string;
  name: string;
  thumbnail: string;
}
