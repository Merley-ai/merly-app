'use strict'

/**
 * New Relic APM Configuration
 * 
 * This file configures the New Relic Node.js agent for monitoring
 * the Merly Next.js application.
 * 
 * Environment Variables Required:
 * - NEW_RELIC_LICENSE_KEY: Your New Relic license key
 * - NEW_RELIC_APP_NAME: Application name in New Relic dashboard
 * 
 * @see https://docs.newrelic.com/docs/apm/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration/
 */
exports.config = {
    /**
     * Application name in New Relic dashboard
     * Can be overridden with NEW_RELIC_APP_NAME environment variable
     */
    app_name: [process.env.NEW_RELIC_APP_NAME],

    /**
     * License key for New Relic account
     * REQUIRED: Set via NEW_RELIC_LICENSE_KEY environment variable
     */
    license_key: process.env.NEW_RELIC_LICENSE_KEY,

    /**
     * Enable/disable the agent
     * Disabled by default - enable via NEW_RELIC_ENABLED=true
     */
    agent_enabled: process.env.NEW_RELIC_ENABLED === 'true',

    /**
     * Logging configuration
     */
    logging: {
        /**
         * Log level: 'fatal', 'error', 'warn', 'info', 'debug', 'trace'
         * 
         * - fatal: Only critical errors that crash the app
         * - error: Errors that need attention
         * - warn:  Potential issues, deprecations
         * - info:  General operational messages (recommended for production)
         * - debug: Detailed debugging info (recommended for development)
         * - trace: Most granular - function calls, variable states (temporary debugging only)
         */
        level: process.env.NEW_RELIC_LOG_LEVEL,

        /**
         * Log to stdout for containerized environments
         * Use 'newrelic_agent.log' for file-based logging
         */
        filepath: 'stdout',
    },

    /**
     * Distributed tracing for cross-service correlation
     * Links frontend requests to backend microservices (Sauron, Melian)
     */
    distributed_tracing: {
        enabled: true,
    },

    /**
     * Transaction tracer for detailed performance insights
     */
    transaction_tracer: {
        enabled: true,
        /**
         * Threshold in seconds for slow transaction traces
         * 'apdex_f' = 4x the Apdex T value
         */
        transaction_threshold: 'apdex_f',
        /**
         * Record SQL queries for database monitoring
         */
        record_sql: 'obfuscated',
        /**
         * Explain plan threshold in milliseconds
         */
        explain_threshold: 500,
    },

    /**
     * Error collector configuration
     */
    error_collector: {
        enabled: true,
        /**
         * Ignore specific HTTP status codes
         * 404s are typically not actionable errors
         */
        ignore_status_codes: [404],
        /**
         * Capture custom attributes on errors
         */
        capture_events: true,
    },

    /**
     * Browser monitoring (Real User Monitoring)
     * Enables injection of browser agent script
     */
    browser_monitoring: {
        enable: true,
        /**
         * Auto-instrument browser agent
         */
        auto_instrument: true,
    },

    /**
     * Application logging configuration
     * Forwards logs to New Relic with trace correlation
     */
    application_logging: {
        enabled: true,
        forwarding: {
            /**
             * Enable log forwarding to New Relic
             */
            enabled: true,
            /**
             * Maximum logs per minute to forward
             */
            max_samples_stored: 10000,
        },
        metrics: {
            enabled: true,
        },
        local_decorating: {
            enabled: false,
        },
    },

    /**
     * Allow all headers to be captured for debugging
     * Excludes sensitive headers by default
     */
    allow_all_headers: true,

    /**
     * Custom attributes to add to all transactions
     */
    attributes: {
        /**
         * Exclude sensitive data from being sent to New Relic
         */
        exclude: [
            'request.headers.cookie',
            'request.headers.authorization',
            'request.headers.proxyAuthorization',
            'request.headers.setCookie*',
            'request.headers.x*',
            'response.headers.cookie',
            'response.headers.authorization',
            'response.headers.proxyAuthorization',
            'response.headers.setCookie*',
            'response.headers.x*',
        ],
    },

    /**
     * Transaction events for analytics
     */
    transaction_events: {
        enabled: true,
        max_samples_stored: 10000,
    },

    /**
     * Slow SQL tracking
     */
    slow_sql: {
        enabled: true,
        max_samples: 10,
    },

    /**
     * Custom instrumentation settings
     */
    custom_insights_events: {
        enabled: true,
        max_samples_stored: 30000,
    },
}
