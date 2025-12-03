/**
 * New Relic Integration Library
 * 
 * Centralized exports for New Relic observability utilities.
 * Organized by domain following OpenTelemetry conventions.
 * 
 * @example
 * import { captureError, startTransaction, recordMetric } from '@/lib/new-relic'
 */

// =============================================================================
// Logging
// =============================================================================
export { logger } from './logger'
export type { LogLevel } from './logger'

// =============================================================================
// Error Handling
// =============================================================================
export {
    captureError,
    captureServerError,
    createErrorHandler,
    withErrorBoundary
} from './error-reporter'
export type { ErrorContext } from './error-reporter'

// =============================================================================
// User Context
// =============================================================================
export {
    // New names (recommended)
    setUser,
} from './error-reporter'

// =============================================================================
// Tracing (Server-Side)
// =============================================================================
export {
    // New names (recommended)
    startTransaction,
    startSpan,
    setAttributes,
} from './performance'

// =============================================================================
// Metrics & Actions
// =============================================================================
export {
    // New names (recommended)
    recordAction,
} from './error-reporter'

export {
    recordMetric,
    // New names (recommended)
    recordPageAction,
    startTimer,
} from './performance'

// =============================================================================
// Browser Interactions
// =============================================================================
export {
    // New names (recommended)
    startInteraction,
} from './performance'

// =============================================================================
// Specialized Spans
// =============================================================================
export {
    // New names (recommended)
    createSSESpan,
    createImageGenSpan,
} from './performance'
export type { SSEMetrics, ImageGenMetrics } from './performance'
