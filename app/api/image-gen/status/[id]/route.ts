import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth0/server'
import { checkJobStatus, getJobResults } from '@/lib/api'

/**
 * GET /api/image-gen/status/[id]
 * 
 * Check status of a job and fetch results if completed
 * This endpoint is used for polling async operations
 * 
 * Flow:
 * 1. Authenticate user via Auth0
 * 2. Check backend job status
 * 3. If completed, fetch and return results
 * 4. Return current status to client
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authenticate User
        const user = await getUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Await params (Next.js 15+ requirement)
        const resolvedParams = await params
        const requestId = resolvedParams.id

        // Check Backend Request Status
        try {
            const statusResponse = await checkJobStatus(requestId)

            // If Backend Completed, Fetch and Return Results
            if (statusResponse.status === 'completed') {
                try {
                    const resultsResponse = await getJobResults(requestId)

                    if (resultsResponse.images && resultsResponse.images.length > 0) {
                        return NextResponse.json({
                            status: 'completed',
                            request_id: requestId,
                            images: resultsResponse.images,
                            metadata: resultsResponse.metadata,
                        })
                    } else {
                        throw new Error('No images in results response')
                    }
                } catch (resultsError) {
                    const errorMessage = resultsError instanceof Error
                        ? resultsError.message
                        : 'Failed to fetch results from backend'

                    return NextResponse.json({
                        status: 'failed',
                        request_id: requestId,
                        error: errorMessage,
                    })
                }
            }

            // If Backend Failed
            if (statusResponse.status === 'failed') {
                return NextResponse.json({
                    status: 'failed',
                    request_id: requestId,
                    error: statusResponse.error || 'Backend processing failed',
                })
            }

            // Still Processing
            return NextResponse.json({
                status: statusResponse.status,
                request_id: requestId,
                progress: statusResponse.progress,
            })

        } catch (backendError) {
            // Backend Status Check Failed
            const errorMessage = backendError instanceof Error
                ? backendError.message
                : 'Failed to check backend status'

            // Return processing status with error note
            // (might be temporary network issue)
            return NextResponse.json({
                status: 'processing',
                request_id: requestId,
                error: errorMessage,
            })
        }

    } catch (error) {
        // Unexpected Error
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}
