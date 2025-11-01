/**
 * Image Generation Client Library
 * Exports all functions and utilities for communicating with the backend API.
 */

export {
    generateImage,
    editImage,
    remixImages,
    checkJobStatus,
    getJobResults,
    getBackendURL,
    BACKEND_URL,
    API_TIMEOUT,
    POLLING_TIMEOUT,
    BackendAPIError,
    BackendTimeoutError,
} from './client'

