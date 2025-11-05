/**
 * Represents a single entry in the timeline, detailing the generation process.
 * 
 * - `id`: Unique identifier for this timeline entry.
 * - `date`: Human-readable string representing the date of the entry (e.g. "2024-06-14").
 * - `inputImages`: Array of image URLs that served as input for this entry.
 * - `prompt`: The prompt text used for generating the output.
 * - `status`: Current state of the entry; either:
 *      - 'thinking' (generation in progress)
 *      - 'complete' (generation finished)
 * - `thinkingText` (optional): Status message shown while `status` is 'thinking'.
 * - `outputImages` (optional): Array of output images generated, each with:
 *      - `url`: Image URL string (empty for rendering placeholders).
 *      - `description`: Short description or caption for the image.
 *      - `isPlaceholder`: True if this is a placeholder waiting for generation.
 * - `outputLabel` (optional): A label or summary for the output content.
 * - `timestamp`: Exact Date instance marking when this entry was created or updated.
 * - `requestId` (optional): Request ID for tracking generation progress.
 * - `numImages` (optional): Number of images being generated (for placeholders).
 */
export interface TimelineEntry {
    id: string;
    type: 'user' | 'ai';
    content: string;
    inputImages: string[];
    prompt: string;
    status: 'thinking' | 'complete';
    thinkingText?: string;
    outputImages?: Array<{ url: string; description: string; isPlaceholder?: boolean }>;
    outputLabel?: string;
    timestamp: Date;
    isGenerating?: boolean;
    requestId?: string;
    numImages?: number;
}
