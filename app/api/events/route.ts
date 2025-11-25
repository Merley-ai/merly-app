import { NextRequest } from 'next/server'
import type { ImageSSEStatus, GeneratedImage } from '@/types/image-generation'
import { SSEConnectionError } from '@/lib/api/core'
import { connectToImageGenerationSSE, createSSEHeaders } from '@/lib/api/image-gen/sse-server-client'
import { getAccessToken } from '@/lib/auth0/server'

/**
 * Backend SSE event types
 * Backend sends events with this wrapper structure:
 * {
 *   type: 'queued' | 'completed' | 'failed',
 *   request_id: string,
 *   timestamp: string,
 *   data: { ... actual event data ... }
 * }
 */

interface BackendEventWrapper {
  type: string
  request_id: string
  timestamp: string
  data: BackendEventData
}

interface BackendQueuedEventData {
  status: 'queued'
  timestamp: string
}

interface BackendCompletedEventData {
  status: 'completed'
  images: Array<{
    url: string
    content_type?: string
    file_name?: string
    file_size?: number
    width?: number
    height?: number
    seed?: number
  }>
  seed?: number
}

interface BackendFailedEventData {
  status: 'FAILED' | 'failed'
  message: string
  code?: string
}

interface BackendProcessingEventData {
  status: 'processing'
  progress?: number
  timestamp?: string
}

type BackendEventData = BackendQueuedEventData | BackendCompletedEventData | BackendFailedEventData | BackendProcessingEventData

/**
 * Transform backend event to frontend ImageSSEStatus format
 * Backend events come wrapped with type, request_id, timestamp, and data
 */
function transformBackendEvent(eventType: string, eventWrapper: BackendEventWrapper): ImageSSEStatus {

  const timestamp = Date.now()
  const eventData = eventWrapper.data

  // Handle queued event
  if (eventType === 'queued' || eventData.status === 'queued') {
    return {
      status: 'processing',
      progress: 0,
      message: 'Request queued, waiting to start...',
      timestamp,
    }
  }

  // Handle processing event
  if (eventType === 'processing' || eventData.status === 'processing') {
    const processingData = eventData as BackendProcessingEventData
    return {
      status: 'processing',
      progress: processingData.progress || 50,
      message: `Processing... ${processingData.progress || 50}%`,
      timestamp,
    }
  }

  // Handle completed event
  if (eventType === 'completed' || eventData.status === 'completed') {
    const completedData = eventData as BackendCompletedEventData

    // Check if images exist before mapping
    if (!completedData.images || !Array.isArray(completedData.images)) {
      return {
        status: 'error',
        progress: 0,
        message: 'Generation completed but no images received',
        timestamp,
      }
    }

    const images: GeneratedImage[] = completedData.images.map(img => ({
      url: img.url,
      width: img.width,
      height: img.height,
      seed: img.seed,
      content_type: img.content_type,
    }))

    return {
      status: 'complete',
      progress: 100,
      message: 'Generation complete!',
      images,
      timestamp,
    }
  }

  // Handle failed event
  if (eventType === 'failed' || eventData.status === 'FAILED' || eventData.status === 'failed') {
    const failedData = eventData as BackendFailedEventData
    return {
      status: 'error',
      progress: 0,
      message: failedData.message || 'Generation failed',
      timestamp,
    }
  }

  // Default fallback
  return {
    status: 'processing',
    progress: 0,
    message: 'Processing...',
    timestamp,
  }
}

/**
 * Parse SSE protocol from backend stream
 * Handles: event: type\ndata: json\n\n format
 */
async function* parseSSEStream(reader: ReadableStreamDefaultReader<Uint8Array>): AsyncGenerator<{ event: string; data: string }> {
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })

      // Split by double newline (SSE message boundary)
      const messages = buffer.split('\n\n')

      // Keep the last incomplete message in buffer
      buffer = messages.pop() || ''

      // Process complete messages
      for (const message of messages) {
        if (!message.trim()) continue

        let eventType = 'message'
        let data = ''

        const lines = message.split('\n')
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            data = line.slice(5).trim()
          }
        }

        if (data) {
          yield { event: eventType, data }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// Force dynamic rendering for SSE endpoints
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/events
 * 
 * Server-Sent Events (SSE) proxy endpoint
 * Proxies real-time SSE events from backend to frontend client
 * 
 * This endpoint establishes an SSE connection to the backend and pipes
 * events through to the browser, transforming the event format as needed.
 * 
 * Query Parameters:
 * - stream: The request_id to subscribe to (also accepts requestId)
 * 
 * @example
 * GET /api/events?requestId=abc-123-def
 */
export async function GET(request: NextRequest) {
  console.log('🔵 [SSE Route] Received request:', request.url)

  const searchParams = request.nextUrl.searchParams
  const streamId = searchParams.get('stream') || searchParams.get('requestId')

  console.log('🔵 [SSE Route] Stream ID:', streamId)

  if (!streamId) {
    console.log('❌ [SSE Route] Missing stream/requestId parameter')
    return new Response('Missing stream or requestId parameter', { status: 400 })
  }

  try {
    console.log('🔵 [SSE Route] Attempting to connect to backend SSE...')

    // Get access token for authentication
    const accessToken = await getAccessToken()
    console.log('🔵 [SSE Route] Access token retrieved:', accessToken ? 'Yes' : 'No')

    // Use the dedicated SSE server client to establish backend connection
    const { response: backendResponse } = await connectToImageGenerationSSE({
      requestId: streamId,
      timeout: 30000,
      accessToken: accessToken || undefined,
    })
    console.log('✅ [SSE Route] Connected to backend SSE successfully')

    // Create a readable stream that proxies backend SSE events
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        const initialMessage: ImageSSEStatus = {
          status: 'processing',
          progress: 0,
          message: 'Connected to generation service...',
          timestamp: Date.now(),
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(initialMessage)}\n\n`)
        )

        try {
          const reader = backendResponse.body!.getReader()

          // Parse and proxy backend SSE events
          for await (const { event, data } of parseSSEStream(reader)) {
            try {
              // Parse backend event data (wrapped structure)
              const eventWrapper: BackendEventWrapper = JSON.parse(data)

              // Transform to frontend format
              const frontendEvent = transformBackendEvent(event, eventWrapper)

              // Send to client
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(frontendEvent)}\n\n`)
              )

              // Close stream on completion or error
              if (frontendEvent.status === 'complete' || frontendEvent.status === 'error') {
                controller.close()
                break
              }
            } catch (_parseError) {
              // Continue processing other events
            }
          }
        } catch (error) {
          // Send error to client
          const errorEvent: ImageSSEStatus = {
            status: 'error',
            progress: 0,
            message: error instanceof Error ? error.message : 'Stream error',
            timestamp: Date.now(),
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
          )

          controller.close()
        }
      },
    })

    // Return SSE response to client with standardized headers
    return new Response(stream, {
      headers: createSSEHeaders(),
    })
  } catch (error) {
    console.error('❌ [SSE Route] Error caught:', error)
    console.error('❌ [SSE Route] Error type:', error?.constructor?.name)
    console.error('❌ [SSE Route] Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ [SSE Route] Error stack:', error instanceof Error ? error.stack : 'No stack trace')

    // Handle SSE connection errors with proper error class
    const sseError = error instanceof SSEConnectionError
      ? error
      : new SSEConnectionError(
        error instanceof Error ? error.message : 'Unknown error',
        streamId,
        500,
        error
      )

    console.log('❌ [SSE Route] Returning error response with status:', sseError.statusCode)

    return new Response(
      JSON.stringify({
        error: 'Failed to connect to backend SSE',
        details: sseError.message,
        requestId: sseError.requestId,
      }),
      {
        status: sseError.statusCode || 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

