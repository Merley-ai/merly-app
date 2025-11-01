/**
 * Backend Image Generation API Client
 * 
 * Handles all HTTP communication, error handling, and timeouts.
 */

import type {
  GenerateImageRequest,
  EditImageRequest,
  RemixImageRequest,
  GenerationResponse,
  JobStatusResponse,
  JobResultsResponse,
} from '@/types/image-generation'

// Config

/**
 * Backend API base URL
 * Can be configured via environment variable
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
if (!BACKEND_URL) {
  throw new Error('NEXT_PUBLIC_BACKEND_URL is not set')
}

const API_TIMEOUT = 30000
const POLLING_TIMEOUT = 10000

// Custom error for API-related failures
export class BackendAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'BackendAPIError'
  }
}
// Custom error for timeout failures
export class BackendTimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message)
    this.name = 'BackendTimeoutError'
  }
}


// Fetch Wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = API_TIMEOUT
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const url = `${BACKEND_URL}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Parse response body
    let data: any
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    // Handle non-OK responses
    if (!response.ok) {
      throw new BackendAPIError(
        data?.error || data?.message || `API error: ${response.status}`,
        response.status,
        data
      )
    }
    return data as T

  } catch (error) {
    clearTimeout(timeoutId)

    // Handle abort/timeout
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Backend API] Request timeout')
      throw new BackendTimeoutError()
    }

    // Ccustom errors
    if (error instanceof BackendAPIError || error instanceof BackendTimeoutError) {
      console.error('[Backend API] Error:', error)
      throw error
    }

    // Handle network errors
    console.error('[Backend API] Network error:', error)
    throw new BackendAPIError(
      'Network error: Unable to connect to backend',
      0,
      error
    )
  }
}

// Generate Image
export async function generateImage(
  request: GenerateImageRequest
): Promise<GenerationResponse> {
  return apiFetch<GenerationResponse>('/v1/image-gen/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

// Edit Image
export async function editImage(
  request: EditImageRequest
): Promise<GenerationResponse> {
  return apiFetch<GenerationResponse>('/v1/image-gen/edit', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

// Remix Images
export async function remixImages(
  request: RemixImageRequest
): Promise<GenerationResponse> {
  return apiFetch<GenerationResponse>('/v1/image-gen/remix', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

// Job Status & Results Functions
export async function checkJobStatus(
  jobId: string
): Promise<JobStatusResponse> {
  return apiFetch<JobStatusResponse>(
    `/v1/jobs/${jobId}/status`,
    { method: 'GET' },
    POLLING_TIMEOUT // Use shorter timeout for polling
  )
}

// Get Job Results
export async function getJobResults(
  jobId: string
): Promise<JobResultsResponse> {
  return apiFetch<JobResultsResponse>(
    `/v1/jobs/${jobId}/results`,
    { method: 'GET' },
    POLLING_TIMEOUT
  )
}

// Get Backend URL
export function getBackendURL(): string {
  if (!BACKEND_URL) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL is not set')
  }
  return BACKEND_URL
}


export {
  BACKEND_URL,
  API_TIMEOUT,
  POLLING_TIMEOUT,
}

