import { trackEvent, update } from '@intercom/messenger-js-sdk';

/**
 * Intercom Custom Attributes
 * Use these to update user attributes for segmentation and personalization
 */
export interface StyleUsage {
    style: string;
    used: number;
}

export interface IntercomUserAttributes {
    plan?: string;
    subscription_status?: 'active' | 'inactive' | 'trialing' | 'canceled';
    albums_created?: number;
    total_prompt_requests?: number;
    total_image_generations?: number;
    total_video_generations?: number;
    beta_user?: boolean;
    styles_used?: StyleUsage[];
    [key: string]: string | number | boolean | StyleUsage[] | undefined;
}

/**
 * Update Intercom user attributes
 */
export function updateIntercomAttributes(attributes: IntercomUserAttributes) {
    update(attributes);
}

/**
 * Intercom Event Metadata types
 */
export interface AlbumEventMetadata {
    album_id: string;
    album_name?: string;
}

export interface GenerationEventMetadata {
    generation_id: string;
    style?: string;
    duration_seconds?: number;
}

export interface SubscriptionEventMetadata {
    from_plan?: string;
    to_plan?: string;
}

/**
 * Track album created event
 */
export function trackAlbumCreated(metadata: AlbumEventMetadata) {
    trackEvent('album-created', metadata);
}

/**
 * Track album deleted event
 */
export function trackAlbumDeleted(metadata: AlbumEventMetadata) {
    trackEvent('album-deleted', metadata);
}

/**
 * Track generation completed event
 */
export function trackGenerationCompleted(metadata: GenerationEventMetadata) {
    trackEvent('generation-completed', metadata);
}

/**
 * Track generation failed event
 */
export function trackGenerationFailed(metadata: GenerationEventMetadata & { error?: string }) {
    trackEvent('generation-failed', metadata);
}

/**
 * Track subscription upgraded event
 */
export function trackSubscriptionUpgraded(metadata: SubscriptionEventMetadata) {
    trackEvent('subscription-upgraded', metadata);
}

/**
 * Track subscription created event
 */
export function trackSubscriptionCreated(metadata: SubscriptionEventMetadata) {
    trackEvent('subscription-created', metadata);
}

/**
 * Track subscription canceled event
 */
export function trackSubscriptionCanceled(metadata: SubscriptionEventMetadata) {
    trackEvent('subscription-canceled', metadata);
}

/**
 * Track generic custom event
 */
export function trackIntercomEvent(eventName: string, metadata?: Record<string, unknown>) {
    trackEvent(eventName, metadata);
}
