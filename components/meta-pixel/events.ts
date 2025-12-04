import type { StandardEvent } from "react-facebook-pixel";

/**
 * Track a standard Meta Pixel event
 */
export async function trackEvent(
    event: StandardEvent,
    data?: Record<string, unknown>
) {
    const { default: ReactPixel } = await import("react-facebook-pixel");
    ReactPixel.track(event, data);
}

/**
 * Track a custom Meta Pixel event
 */
export async function trackCustomEvent(
    eventName: string,
    data?: Record<string, unknown>
) {
    const { default: ReactPixel } = await import("react-facebook-pixel");
    ReactPixel.trackCustom(eventName, data);
}

/**
 * Track a purchase conversion
 */
export async function trackPurchase(value: number, currency = "USD") {
    const { default: ReactPixel } = await import("react-facebook-pixel");
    ReactPixel.track("Purchase", { value, currency });
}

/**
 * Track a lead conversion
 */
export async function trackLead(data?: {
    content_name?: string;
    content_category?: string;
    value?: number;
    currency?: string;
}) {
    const { default: ReactPixel } = await import("react-facebook-pixel");
    ReactPixel.track("Lead", data);
}

/**
 * Track a complete registration conversion
 */
export async function trackCompleteRegistration(data?: {
    content_name?: string;
    status?: string;
    value?: number;
    currency?: string;
}) {
    const { default: ReactPixel } = await import("react-facebook-pixel");
    ReactPixel.track("CompleteRegistration", data);
}

/**
 * Track subscription start
 */
export async function trackSubscribe(value: number, currency = "USD") {
    const { default: ReactPixel } = await import("react-facebook-pixel");
    ReactPixel.track("Subscribe", { value, currency });
}

/**
 * Track content view
 */
export async function trackViewContent(data?: {
    content_ids?: string[];
    content_name?: string;
    content_type?: string;
    value?: number;
    currency?: string;
}) {
    const { default: ReactPixel } = await import("react-facebook-pixel");
    ReactPixel.track("ViewContent", data);
}
