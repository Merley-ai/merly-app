/**
 * Application Logger with New Relic Integration
 * 
 * Provides structured logging with different log levels that integrate
 * with New Relic's log forwarding for centralized observability.
 * 
 * Usage:
 * ```ts
 * import { logger } from '@/lib/logger'
 * 
 * logger.info('User logged in', { userId: '123', method: 'oauth' })
 * logger.error('Payment failed', { orderId: '456', error: err.message })
 * logger.debug('Cache hit', { key: 'user:123' })
 * ```
 */

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'

interface LogContext {
    [key: string]: unknown
}

interface LogEntry {
    timestamp: string
    level: LogLevel
    message: string
    context?: LogContext
    service: string
    environment: string
}

/**
 * Log level priority (lower = more severe)
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
}

/**
 * ANSI color codes for terminal output
 */
const LOG_COLORS: Record<LogLevel, string> = {
    fatal: '\x1b[35m', // Magenta
    error: '\x1b[31m', // Red
    warn: '\x1b[33m',  // Yellow
    info: '\x1b[36m',  // Cyan
    debug: '\x1b[32m', // Green
    trace: '\x1b[90m', // Gray
}

const RESET_COLOR = '\x1b[0m'

/**
 * Get current log level from environment
 * Defaults to 'info' in production, 'debug' in development
 */
function getCurrentLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL || process.env.NEW_RELIC_LOG_LEVEL
    if (envLevel && envLevel in LOG_LEVEL_PRIORITY) {
        return envLevel as LogLevel
    }
    return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

/**
 * Check if a log level should be output based on current configuration
 */
function shouldLog(level: LogLevel): boolean {
    const currentLevel = getCurrentLogLevel()
    return LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[currentLevel]
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry, useColors: boolean = true): string {
    const color = useColors ? LOG_COLORS[entry.level] : ''
    const reset = useColors ? RESET_COLOR : ''

    const levelStr = entry.level.toUpperCase().padEnd(5)
    const contextStr = entry.context
        ? ` ${JSON.stringify(entry.context)}`
        : ''

    // Structured format for production (JSON)
    if (process.env.NODE_ENV === 'production' || process.env.LOG_FORMAT === 'json') {
        return JSON.stringify(entry)
    }

    // Human-readable format for development
    return `${color}[${entry.timestamp}] ${levelStr}${reset} ${entry.message}${contextStr}`
}

/**
 * Create a log entry and output it
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
    if (!shouldLog(level)) return

    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        context,
        service: process.env.NEW_RELIC_APP_NAME || 'merly-app',
        environment: process.env.NODE_ENV || 'development',
    }

    const formatted = formatLogEntry(entry, process.env.NODE_ENV !== 'production')

    // Use appropriate console method for log level
    switch (level) {
        case 'fatal':
        case 'error':
            console.error(formatted)
            break
        case 'warn':
            console.warn(formatted)
            break
        case 'debug':
        case 'trace':
            console.debug(formatted)
            break
        default:
            console.log(formatted)
    }

    // Send to New Relic as custom event for important logs
    if (typeof window === 'undefined' && (level === 'error' || level === 'fatal')) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const newrelic = require('newrelic')
            newrelic.recordCustomEvent('ApplicationLog', {
                level,
                message,
                ...context,
            })
        } catch {
            // New Relic not available, skip
        }
    }
}

/**
 * Logger instance with methods for each log level
 */
export const logger = {
    /**
     * Fatal: Application crash, unrecoverable errors
     * Use when the app cannot continue running
     */
    fatal: (message: string, context?: LogContext) => log('fatal', message, context),

    /**
     * Error: Errors that need attention but app can continue
     * Use for caught exceptions, failed operations
     */
    error: (message: string, context?: LogContext) => log('error', message, context),

    /**
     * Warn: Potential issues, deprecations, unusual situations
     * Use for recoverable issues that should be investigated
     */
    warn: (message: string, context?: LogContext) => log('warn', message, context),

    /**
     * Info: General operational messages
     * Use for significant events: user actions, API calls, state changes
     */
    info: (message: string, context?: LogContext) => log('info', message, context),

    /**
     * Debug: Detailed debugging information
     * Use for development troubleshooting, variable states
     */
    debug: (message: string, context?: LogContext) => log('debug', message, context),

    /**
     * Trace: Most granular logging
     * Use for function entry/exit, loop iterations, detailed flow
     */
    trace: (message: string, context?: LogContext) => log('trace', message, context),

    /**
     * Create a child logger with preset context
     * Useful for adding request IDs, user IDs to all logs in a scope
     */
    child: (defaultContext: LogContext) => ({
        fatal: (message: string, context?: LogContext) =>
            log('fatal', message, { ...defaultContext, ...context }),
        error: (message: string, context?: LogContext) =>
            log('error', message, { ...defaultContext, ...context }),
        warn: (message: string, context?: LogContext) =>
            log('warn', message, { ...defaultContext, ...context }),
        info: (message: string, context?: LogContext) =>
            log('info', message, { ...defaultContext, ...context }),
        debug: (message: string, context?: LogContext) =>
            log('debug', message, { ...defaultContext, ...context }),
        trace: (message: string, context?: LogContext) =>
            log('trace', message, { ...defaultContext, ...context }),
    }),

    /**
     * Time an operation and log its duration
     */
    time: async <T>(
        label: string,
        operation: () => Promise<T>,
        context?: LogContext
    ): Promise<T> => {
        const start = performance.now()
        try {
            const result = await operation()
            const duration = performance.now() - start
            log('debug', `${label} completed`, { ...context, durationMs: Math.round(duration) })
            return result
        } catch (error) {
            const duration = performance.now() - start
            log('error', `${label} failed`, {
                ...context,
                durationMs: Math.round(duration),
                error: error instanceof Error ? error.message : 'Unknown error'
            })
            throw error
        }
    },
}

export default logger
