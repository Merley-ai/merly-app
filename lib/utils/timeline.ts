/**
 * Timeline Transformation Utilities
 * 
 * Converts backend TimelineEvent format to frontend TimelineEntry format
 * for display in the conversation UI
 */

import type { TimelineEvent, TimelineEntry } from '@/types'

/**
 * Transform a single backend TimelineEvent to frontend TimelineEntry(s)
 * 
 * Mapping rules:
 * - prompt_request -> type: 'user' (right side) + optional system message (left side)
 * - system_message -> type: 'system' (left side)
 * - image_gen -> type: 'ai' (left side) - NO IMAGES shown in timeline
 * - video_gen -> type: 'ai' (left side) - NO IMAGES shown in timeline
 * 
 * @returns Array of timeline entries (can be multiple if system message exists)
 */
export function transformTimelineEvent(event: TimelineEvent): TimelineEntry[] {
    const timestamp = new Date(event.created_at)

    console.log("Timeline Event [transformTimelineEvent]:", event)

    // Handle prompt_request type (user messages)
    if (event.type === 'prompt_request' && event.prompt_request) {
        const { prompt_request } = event

        const entries: TimelineEntry[] = [
            {
                id: event.id,
                type: 'user',
                content: prompt_request.prompt,
                inputImages: prompt_request.image_url ? [prompt_request.image_url] : [],
                prompt: prompt_request.prompt,
                status: prompt_request.status === 'IN_QUEUE' ? 'thinking' : 'complete',
                timestamp,
            }
        ]

        // Add system message as a separate entry if it exists
        if (event.system_message) {
            entries.push({
                id: `${event.id}-system`,
                type: 'system',
                content: event.system_message,
                inputImages: [],
                prompt: '',
                status: 'complete',
                timestamp,
                systemMessage: event.system_message,
                suggested_actions: event.suggested_actions,
            })
        }

        return entries
    }

    // Handle system_message type (System messages - centered)
    if (event.type === 'system_message' && event.system_message) {
        return [{
            id: event.id,
            type: 'system',
            content: event.system_message,
            inputImages: [],
            prompt: '',
            status: 'complete',
            timestamp,
            systemMessage: event.system_message,
        }]
    }

    // Handle image_gen type (AI generated images - NO IMAGES in timeline)
    if (event.type === 'image_gen') {
        return [{
            id: event.id,
            type: 'ai',
            content: 'Images generated successfully',
            inputImages: [],
            prompt: '',
            status: 'complete',
            timestamp,
            // NO outputImages - images are shown in gallery only
        }]
    }

    // Handle video_gen type (AI generated videos - NO VIDEOS in timeline)
    if (event.type === 'video_gen') {
        return [{
            id: event.id,
            type: 'ai',
            content: 'Video generated successfully',
            inputImages: [],
            prompt: '',
            status: 'complete',
            timestamp,
            // NO outputImages/videos - videos are shown in gallery only
        }]
    }

    // Fallback for unknown types
    return [{
        id: event.id,
        type: 'ai',
        content: 'Unknown event',
        inputImages: [],
        prompt: '',
        status: 'complete',
        timestamp,
    }]
}

/**
 * Transform array of backend TimelineEvents to frontend TimelineEntries
 * 
 * @param events - Array of backend timeline events
 * @returns Array of frontend timeline entries (flattened)
 */
export function transformTimelineEvents(events: TimelineEvent[]): TimelineEntry[] {
    return events.flatMap(transformTimelineEvent)
}

/**
 * Group timeline entries by date for display
 * 
 * @param entries - Array of timeline entries
 * @returns Map of date string to entries
 */
export function groupTimelineEventsByDate(
    entries: TimelineEntry[]
): Map<string, TimelineEntry[]> {
    const grouped = new Map<string, TimelineEntry[]>()

    entries.forEach(entry => {
        const dateKey = entry.timestamp.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        })

        if (!grouped.has(dateKey)) {
            grouped.set(dateKey, [])
        }

        grouped.get(dateKey)!.push(entry)
    })

    return grouped
}

/**
 * Merge new events with existing events, avoiding duplicates
 * 
 * @param existing - Existing timeline entries
 * @param newEvents - New timeline entries to merge
 * @returns Merged array without duplicates
 */
export function mergeTimelineEvents(
    existing: TimelineEntry[],
    newEvents: TimelineEntry[]
): TimelineEntry[] {
    const existingIds = new Set(existing.map(e => e.id))
    const uniqueNewEvents = newEvents.filter(e => !existingIds.has(e.id))

    return [...existing, ...uniqueNewEvents]
}

