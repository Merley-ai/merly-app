'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Job status response from backend
 */
interface JobStatus {
    status: 'pending' | 'processing' | 'completed' | 'failed'
    job_id: string
    progress?: number
    images?: Array<{
        url: string
        width?: number
        height?: number
        seed?: number
        content_type?: string
    }>
    metadata?: any
    error?: string
}

/**
 * Hook options
 */
interface UseGenerationPollingOptions {
    jobId: string | null
    enabled?: boolean
    interval?: number // milliseconds
    maxAttempts?: number // maximum polling attempts
    onComplete?: (images: any[]) => void
    onError?: (error: string) => void
    onProgress?: (progress: number) => void
}

/**
 * useGenerationPolling Hook
 * 
 * Automatically polls a job until completion or failure
 * 
 * @example
 * ```typescript
 * const { status, images, progress, error, isPolling } = useGenerationPolling({
 *   jobId: 'job_123',
 *   enabled: true,
 *   onComplete: (images) => console.log('Done!', images),
 * })
 * ```
 */
export function useGenerationPolling({
    jobId,
    enabled = true,
    interval = 2000, // Poll every 2 seconds
    maxAttempts = 60, // 2 minutes max (60 * 2s)
    onComplete,
    onError,
    onProgress,
}: UseGenerationPollingOptions) {
    const [status, setStatus] = useState<JobStatus['status']>('pending')
    const [images, setImages] = useState<any[]>([])
    const [progress, setProgress] = useState<number>(0)
    const [error, setError] = useState<string | null>(null)
    const [isPolling, setIsPolling] = useState(false)
    const [attempts, setAttempts] = useState(0)

    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const attemptCountRef = useRef(0)

    // Check status function
    const checkStatus = useCallback(async () => {
        if (!jobId) return false

        try {
            const response = await fetch(`/api/image-gen/status/${jobId}`)

            if (!response.ok) {
                throw new Error(`Status check failed: ${response.status}`)
            }

            const data: JobStatus = await response.json()

            // Update state
            setStatus(data.status)

            if (data.progress !== undefined) {
                setProgress(data.progress)
                onProgress?.(data.progress)
            }

            // Handle completion
            if (data.status === 'completed' && data.images) {
                setImages(data.images)
                setIsPolling(false)
                onComplete?.(data.images)
                return true // Stop polling
            }

            // Handle failure
            if (data.status === 'failed') {
                const errorMsg = data.error || 'Generation failed'
                setError(errorMsg)
                setIsPolling(false)
                onError?.(errorMsg)
                return true // Stop polling
            }

            // Still processing
            return false // Continue polling

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error'
            console.error('[useGenerationPolling] Error:', errorMsg)

            // Don't stop polling on temporary network errors
            // Just increment attempt counter
            attemptCountRef.current++
            setAttempts(attemptCountRef.current)

            // Stop if max attempts reached
            if (attemptCountRef.current >= maxAttempts) {
                setError('Timeout: Maximum polling attempts reached')
                setIsPolling(false)
                onError?.('Timeout: Maximum polling attempts reached')
                return true // Stop polling
            }

            return false // Continue polling
        }
    }, [jobId, maxAttempts, onComplete, onError, onProgress])

    // Start/stop polling based on enabled flag
    useEffect(() => {
        if (!enabled || !jobId || status === 'completed' || status === 'failed') {
            // Clear existing interval
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            setIsPolling(false)
            return
        }

        // Start polling
        setIsPolling(true)
        attemptCountRef.current = 0
        setAttempts(0)

        // Initial check
        checkStatus()

        // Set up polling interval
        intervalRef.current = setInterval(async () => {
            const shouldStop = await checkStatus()

            if (shouldStop && intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
                setIsPolling(false)
            }
        }, interval)

        // Cleanup on unmount or when dependencies change
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            setIsPolling(false)
        }
    }, [enabled, jobId, status, interval, checkStatus])

    // Manual retry function
    const retry = useCallback(() => {
        if (!jobId) return

        setError(null)
        setStatus('pending')
        attemptCountRef.current = 0
        setAttempts(0)
        checkStatus()
    }, [jobId, checkStatus])

    return {
        status,
        images,
        progress,
        error,
        isPolling,
        attempts,
        retry,
    }
}

