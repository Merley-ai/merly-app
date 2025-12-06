/**
 * Backend API Client Library
 * Exports all functions and utilities for communicating with the backend API.
 * Includes image generation (HTTP and SSE), album management, and core utilities.
 */

// API Endpoints Library
export {
    Album,
    ImageGen,
    Stripe,
    Proxy,
    buildUrl,
} from './endpoints'
export type { ApiService } from './endpoints'

// Core utilities
export {
    apiFetch,
    apiFetchService,
    API_TIMEOUT,
    BackendAPIError,
    BackendTimeoutError,
    SSEConnectionError,
} from './core'

// Client-side fetch wrapper
export { clientFetch } from './client-fetch'

// Image Generation SSE Client
export {
    createImageGenerationSSE,
    getSSEUrl,
} from './image-gen/sse-client'

// Image Generation SSE Server
export {
    connectToImageGenerationSSE,
    createSSEHeaders,
} from './image-gen/sse-server-client'
export type {
    SSEConnectionOptions,
    SSEConnectionResult,
} from './image-gen/sse-server-client'

