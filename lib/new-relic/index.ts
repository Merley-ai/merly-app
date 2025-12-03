/**
 * New Relic Integration Library
 * 
 * Centralized exports for New Relic observability utilities.
 * 
 * @example
 * import { logger, reportError, trackAction } from '@/lib/new-relic'
 */

export { logger } from './logger'
export type { LogLevel } from './logger'

export {
    reportError,
    reportServerError,
    createErrorReporter,
    withErrorReporting,
    trackAction,
    setUserIdentity,
} from './error-reporter'
export type { ErrorContext } from './error-reporter'
