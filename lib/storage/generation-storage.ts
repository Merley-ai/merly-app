/**
 * Pending Generation Storage
 * 
 * One-time use storage for generation metadata during page redirect.
 * Stores data before redirect, consumes on mount, then immediately deletes.
 * 
 * Flow:
 * 1. Generation starts → store metadata
 * 2. Redirect to album page
 * 3. New page reads metadata → adds placeholders + connects SSE
 * 4. Metadata deleted (one-time use)
 */

import type { PendingGeneration } from '@/types'

export type { PendingGeneration }

const PENDING_KEY = 'merley:pending-generation'

/**
 * Store generation metadata before redirect (one-time use)
 */
export function storePendingGeneration(generation: PendingGeneration): void {
    if (typeof window === 'undefined') return

    try {
        sessionStorage.setItem(PENDING_KEY, JSON.stringify(generation))
    } catch (error) {
        console.error('[PendingGeneration] Failed to store:', error)
    }
}

/**
 * Get and remove pending generation (one-time use)
 * Returns null if no pending generation exists
 */
export function consumePendingGeneration(): PendingGeneration | null {
    if (typeof window === 'undefined') return null

    try {
        const data = sessionStorage.getItem(PENDING_KEY)

        if (!data) return null

        // Delete immediately (one-time use)
        sessionStorage.removeItem(PENDING_KEY)

        return JSON.parse(data) as PendingGeneration
    } catch (error) {
        console.error('[PendingGeneration] Failed to consume:', error)
        return null
    }
}

/**
 * Clear pending generation (cleanup on error)
 */
export function clearPendingGeneration(): void {
    if (typeof window === 'undefined') return

    try {
        sessionStorage.removeItem(PENDING_KEY)
    } catch (error) {
        console.error('[PendingGeneration] Failed to clear:', error)
    }
}
