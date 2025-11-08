/**
 * Backend API Client Library
 * Exports all functions and utilities for communicating with the backend API.
 * Includes image generation (HTTP and SSE), album management, and core utilities.
 */

// Core utilities
export {
    apiFetch,
    getBackendURL,
    BACKEND_URL,
    API_TIMEOUT,
    BackendAPIError,
    BackendTimeoutError,
} from './core'

// Image Generation API
export {
    generateImage,
    editImage,
    remixImages,
} from './image-gen/client'

// Image Generation SSE Client
export {
    createImageGenerationSSE,
    getSSEUrl,
} from './image-gen/sse-client'

// Album Management API
export {
    getAllAlbums,
    getAlbum,
    createAlbum,
    updateAlbum,
    deleteAlbum,
} from './album/client'

