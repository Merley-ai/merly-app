/**
 * Backend API Client Library
 * Exports all functions and utilities for communicating with the backend API.
 * Includes image generation and album management.
 */

// Core utilities
export {
    apiFetch,
    getBackendURL,
    BACKEND_URL,
    API_TIMEOUT,
    POLLING_TIMEOUT,
    BackendAPIError,
    BackendTimeoutError,
} from './core'

// Image Generation API
export {
    generateImage,
    editImage,
    remixImages,
    checkJobStatus,
    getJobResults,
} from './image-gen/client'

// Album Management API
export {
    getAllAlbums,
    getAlbum,
    createAlbum,
    updateAlbum,
    deleteAlbum,
} from './album/client'

