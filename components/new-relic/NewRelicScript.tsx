import Script from 'next/script'

/**
 * NewRelicScript - Server Component for Browser Agent Injection
 * 
 * Injects the New Relic browser agent script into the page using APM auto-injection.
 * This enables Real User Monitoring (RUM) for client-side performance tracking.
 * 
 * Features enabled:
 * - Page load timing (LCP, FID, CLS)
 * - AJAX request tracking
 * - JavaScript error capture
 * - Session traces
 * - SPA route change monitoring
 * 
 * @see https://docs.newrelic.com/docs/browser/browser-monitoring/getting-started/introduction-browser-monitoring/
 */
export async function NewRelicScript() {
    // Only inject in server environment
    if (typeof window !== 'undefined') {
        return null
    }

    // Check if New Relic is enabled
    if (process.env.NEW_RELIC_ENABLED !== 'true') {
        return null
    }

    try {
        // Dynamic import to avoid bundling issues
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const newrelic = require('newrelic')

        // Check if agent is available and has the required properties
        if (!newrelic?.agent?.collector) {
            // Agent not properly initialized (likely disabled)
            return null
        }

        // Wait for agent to connect before getting browser timing header
        // This ensures the browser agent script is properly configured
        if (newrelic.agent.collector.isConnected() === false) {
            await new Promise<void>((resolve) => {
                newrelic.agent.on('connected', resolve)
                // Timeout after 5 seconds to prevent blocking
                setTimeout(resolve, 5000)
            })
        }

        // Get the browser timing header script
        // hasToRemoveScriptWrapper: true - returns script without <script> tags (we use next/script)
        // allowTransactionlessInjection: true - allows injection outside of a transaction context
        const browserTimingHeader = newrelic.getBrowserTimingHeader({
            hasToRemoveScriptWrapper: true,
            allowTransactionlessInjection: true,
        })

        // If no script returned, agent may not be properly configured
        if (!browserTimingHeader) {
            return null
        }

        return (
            <Script
                id="nr-browser-agent"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{ __html: browserTimingHeader }}
            />
        )
    } catch (error) {
        // Log error but don't break the app
        if (process.env.NODE_ENV === 'development') {
            console.warn('[NewRelicScript] Failed to inject browser agent:', error)
        }
        return null
    }
}

export default NewRelicScript
