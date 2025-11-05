import { NextRequest } from 'next/server'
import { getUser } from '@/lib/auth0/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs' // Ensure Node.js runtime for streaming support
export const maxDuration = 300 // Allow up to 5 minutes for long-lived connections

/**
 * SSE (Server-Sent Events) endpoint for real-time image generation updates
 * 
 * This endpoint proxies SSE events from the backend to authenticated frontend clients.
 * It maintains an open connection and streams events as they arrive from the backend.
 * 
 * @route GET /api/image-gen/events
 * @query request_id - Optional: filter events for a specific request
 */
export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const user = await getUser()
        if (!user) {
            return new Response('Unauthorized', { status: 401 })
        }

        const userId = user?.user_id
        const searchParams = request.nextUrl.searchParams
        const requestId = searchParams.get('request_id')

        // Validate request_id is provided
        if (!requestId) {
            console.error('[SSE] Missing request_id parameter')
            return new Response(
                JSON.stringify({ error: 'request_id parameter is required' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }

        console.log(`[SSE] Opening connection for user ${userId}, request: ${requestId}`)

        // Get backend URL from environment
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL
        if (!backendUrl) {
            console.error('[SSE] Backend URL not configured')
            return new Response('Backend not configured', { status: 500 })
        }

        // Build backend SSE URL with request_id parameter
        const backendSSEUrl = new URL('/v1/image-gen/events', backendUrl)
        backendSSEUrl.searchParams.set('request_id', requestId)

        console.log('[SSE] Connecting to backend:', backendSSEUrl.toString())

        // Create abort controller for backend fetch
        const backendAbortController = new AbortController()
        let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
        let controllerClosed = false

        // Create a stream that properly handles client disconnection
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const backendResponse = await fetch(backendSSEUrl.toString(), {
                        headers: {
                            Accept: 'text/event-stream',
                            'Cache-Control': 'no-cache',
                            Connection: 'keep-alive',
                        },
                        cache: 'no-store',
                        signal: backendAbortController.signal,
                    })

                    console.log('[SSE] Backend response status:', backendResponse.status)

                    if (!backendResponse.ok) {
                        const errorText = await backendResponse.text()
                        console.error('[SSE] Backend error:', errorText)
                        if (!controllerClosed) {
                            controller.error(new Error(`Backend SSE connection failed: ${backendResponse.status} - ${errorText}`))
                        }
                        return
                    }

                    if (!backendResponse.body) {
                        console.error('[SSE] Backend response missing body')
                        if (!controllerClosed) {
                            controller.error(new Error('Backend response missing body'))
                        }
                        return
                    }

                    console.log('[SSE] Backend connected, starting stream...')

                    // Send initial connection message to establish SSE connection
                    const encoder = new TextEncoder()
                    const initialMessage = `: connected\n\n`
                    if (!controllerClosed) {
                        controller.enqueue(encoder.encode(initialMessage))
                    }

                    // Pipe backend body to client
                    reader = backendResponse.body.getReader()

                    try {
                        while (true) {
                            const { done, value } = await reader.read()

                            if (done) {
                                console.log('[SSE] Backend stream ended naturally')
                                if (!controllerClosed) {
                                    controller.close()
                                    controllerClosed = true
                                }
                                break
                            }

                            // Forward chunks to client
                            if (!controllerClosed) {
                                controller.enqueue(value)
                            } else {
                                break
                            }
                        }
                    } catch (readError) {
                        // If client disconnected, this is expected - don't log as error
                        if (readError instanceof Error && readError.name === 'AbortError') {
                            console.log('[SSE] Backend fetch aborted (client disconnected)')
                        } else {
                            console.error('[SSE] Error reading from backend:', readError)
                        }

                        // Only close if not already closed
                        if (!controllerClosed) {
                            try {
                                controller.close()
                                controllerClosed = true
                            } catch {
                                // Controller already closed, ignore
                            }
                        }
                    }
                } catch (fetchError) {
                    console.error('[SSE] Error fetching from backend:', fetchError)
                    if (!controllerClosed) {
                        try {
                            controller.error(fetchError)
                        } catch (errorError) {
                            // Controller may already be closed
                            console.error('[SSE] Error reporting fetch error:', errorError)
                        }
                    }
                }
            },

            cancel(reason) {
                console.log('[SSE] Client disconnected, cancelling backend fetch', reason)
                controllerClosed = true

                // Cancel the backend fetch
                backendAbortController.abort()

                // Cancel the reader if it exists
                if (reader) {
                    reader.cancel().catch(() => {
                        // Ignore cancellation errors
                    })
                }
            },
        })

        const headers = new Headers()
        headers.set('Content-Type', 'text/event-stream')
        headers.set('Cache-Control', 'no-cache, no-transform')
        headers.set('Connection', 'keep-alive')
        headers.set('X-Accel-Buffering', 'no')

        return new Response(stream, {
            status: 200,
            headers,
        })

    } catch (error) {
        console.error('[SSE] Error setting up SSE connection:', error)
        return new Response(
            JSON.stringify({
                error: 'Failed to establish SSE connection',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    })
}

