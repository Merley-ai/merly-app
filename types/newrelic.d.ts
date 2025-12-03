/**
 * New Relic Browser Agent Type Definitions
 * 
 * Provides TypeScript types for the New Relic browser agent
 * that is injected into the window object.
 * 
 * @see https://docs.newrelic.com/docs/browser/new-relic-browser/browser-apis/
 */

interface NewRelicBrowserAgent {
    /**
     * Report a caught or handled error to New Relic
     * Use this for errors you catch but want to track
     * 
     * @example
     * try {
     *   riskyOperation()
     * } catch (error) {
     *   window.newrelic?.noticeError(error, { context: 'payment' })
     * }
     */
    noticeError(error: Error | string, customAttributes?: Record<string, unknown>): void

    /**
     * Add a custom attribute to the current page view
     * Attributes appear in PageView events in New Relic
     * 
     * @example
     * window.newrelic?.setCustomAttribute('userId', '12345')
     * window.newrelic?.setCustomAttribute('plan', 'premium')
     */
    setCustomAttribute(name: string, value: string | number | boolean): void

    /**
     * Set the current user ID for session tracking
     * 
     * @example
     * window.newrelic?.setUserId('user-123')
     */
    setUserId(userId: string): void

    /**
     * Set the application version
     * Useful for tracking errors by release
     * 
     * @example
     * window.newrelic?.setApplicationVersion('1.2.3')
     */
    setApplicationVersion(version: string): void

    /**
     * Add a page action event with custom attributes
     * Use for tracking user interactions
     * 
     * @example
     * window.newrelic?.addPageAction('buttonClick', {
     *   buttonId: 'generate-image',
     *   albumId: 'abc-123'
     * })
     */
    addPageAction(name: string, attributes?: Record<string, unknown>): void

    /**
     * Start a browser interaction for SPA tracking
     * Returns an interaction object to manage the interaction lifecycle
     * 
     * @example
     * const interaction = window.newrelic?.interaction()
     * interaction?.setName('loadAlbum')
     * // ... do work
     * interaction?.end()
     */
    interaction(): NewRelicInteraction | undefined

    /**
     * Set a custom name for the current page view
     * 
     * @example
     * window.newrelic?.setPageViewName('/albums/[id]')
     */
    setPageViewName(name: string, host?: string): void

    /**
     * Set error group callback for custom error grouping
     */
    setErrorHandler(callback: (error: Error) => string | undefined): void

    /**
     * Add release information for source map correlation
     */
    addRelease(releaseName: string, releaseId: string): void

    /**
     * Record a custom event
     */
    recordCustomEvent(eventType: string, attributes?: Record<string, unknown>): void

    /**
     * Start tracking a custom metric
     */
    finished(timestamp?: number): void
}

interface NewRelicInteraction {
    /**
     * Set a custom name for this interaction
     */
    setName(name: string): NewRelicInteraction

    /**
     * Add a custom attribute to this interaction
     */
    setAttribute(name: string, value: string | number | boolean): NewRelicInteraction

    /**
     * Save the interaction (prevents automatic ending)
     */
    save(): NewRelicInteraction

    /**
     * Ignore this interaction (don't send to New Relic)
     */
    ignore(): NewRelicInteraction

    /**
     * End the interaction
     */
    end(): void

    /**
     * Get the interaction context for async operations
     */
    getContext(): unknown

    /**
     * Callback when interaction ends
     */
    onEnd(callback: () => void): NewRelicInteraction
}

declare global {
    interface Window {
        /**
         * New Relic Browser Agent
         * Available after the browser agent script loads
         * Always use optional chaining: window.newrelic?.method()
         */
        newrelic?: NewRelicBrowserAgent
    }
}

export type { NewRelicBrowserAgent, NewRelicInteraction }
