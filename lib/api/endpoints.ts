/**
 * API Endpoints Library - Simplified Version
 * 
 * Centralized configuration for backend microservice endpoints.
 */

export type ApiService = 'melian' | 'sauron';

/**
 * Service configuration
 */
const SERVICE_CONFIG = {
    melian: {
        url: process.env.NEXT_PUBLIC_MELIAN_API_URL,
        envVar: 'NEXT_PUBLIC_MELIAN_API_URL',
    },
    sauron: {
        url: process.env.NEXT_PUBLIC_SAURON_API_URL,
        envVar: 'NEXT_PUBLIC_SAURON_API_URL',
    },
} as const;

/**
 * Build full URL for a service endpoint
 * @param service - Service identifier
 * @param endpoint - Endpoint path
 */
export function buildUrl(service: ApiService, endpoint: string): string {
    const config = SERVICE_CONFIG[service];

    if (!config.url) {
        console.error(`${config.envVar} is not set`);
        throw new Error(`${config.envVar} is not set`);
    }

    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${config.url}${path}`;
}

/**
 * Album API Endpoints (Sauron)
 */
export const Album = {
    getAllAlbums: (userId: string) => buildUrl('sauron', `/v1/album/get-all/${userId}`),
    getAlbum: (albumId: string) => buildUrl('sauron', `/v1/album/get/${albumId}`),
    getTimeline: (albumId: string) => buildUrl('sauron', `/v1/album/get/${albumId}/timeline`),
    getGallery: (albumId: string) => buildUrl('sauron', `/v1/album/get/${albumId}/gallery`),
    create: () => buildUrl('sauron', '/v1/album/create'),
    update: () => buildUrl('sauron', '/v1/album/update'),
    delete: () => buildUrl('sauron', '/v1/album/delete'),
} as const;

/**
 * Image Generation API Endpoints (Sauron)
 */
export const ImageGen = {
    generate: () => buildUrl('sauron', '/v1/image-gen/generate'),
    edit: () => buildUrl('sauron', '/v1/image-gen/edit'),
    remix: () => buildUrl('sauron', '/v1/image-gen/remix'),
    eventStream: (requestId: string) => buildUrl('sauron', `/v1/image-gen/${requestId}/event-stream`),
} as const;

/**
 * Stripe API Endpoints (Melian)
 */
export const Stripe = {
    customerSession: () => buildUrl('melian', 'v1/subscriptions/customer-session'),
} as const;

/**
 * Next.js Proxy Endpoints (local routes)
 */
export const Proxy = {
    events: (requestId: string) => `/api/events?requestId=${encodeURIComponent(requestId)}`,
} as const;
