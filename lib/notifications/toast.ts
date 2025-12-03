import { toast as sonnerToast } from 'sonner'
import { reportError } from '@/lib/new-relic/error-reporter'
import { BackendAPIError, BackendTimeoutError, SSEConnectionError } from '@/lib/api/core'

/**
 * Toast Notification System
 * 
 * Centralized toast notifications with New Relic integration.
 * Automatically reports errors to New Relic when showing error toasts.
 * 
 * @example
 * import { toast } from '@/lib/notifications'
 * 
 * // Basic usage
 * toast.success('Image generated!')
 * toast.error('Generation failed', { context: 'imageGen' })
 * toast.warning('Low credits remaining')
 * toast.info('Processing your request...')
 * 
 * // Dynamic error from caught exception
 * toast.apiError(error) // Auto-formats based on error type
 */

export interface ToastAction {
    label: string
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export interface ToastOptions {
    /** Toast description/subtitle */
    description?: string
    /** Duration in milliseconds (default: 4000) */
    duration?: number
    /** Action button configuration */
    action?: ToastAction
    /** Cancel button configuration */
    cancel?: ToastAction
    /** Custom toast ID for updates */
    id?: string | number
    /** Error context for New Relic reporting */
    context?: string
    /** Additional attributes for error reporting */
    attributes?: Record<string, unknown>
}

/**
 * Error message mapping for common error types
 */
const ERROR_MESSAGES: Record<string, { title: string; description?: string }> = {
    // Network errors
    'Network error': {
        title: 'Connection failed',
        description: 'Please check your internet connection and try again.',
    },
    'fetch failed': {
        title: 'Unable to connect',
        description: 'The server is not responding. Please try again later.',
    },
    // Auth errors
    'Unauthorized': {
        title: 'Session expired',
        description: 'Please log in again to continue.',
    },
    'Forbidden': {
        title: 'Access denied',
        description: 'You don\'t have permission to perform this action.',
    },
    // API errors
    'Request timeout': {
        title: 'Request timed out',
        description: 'The operation took too long. Please try again.',
    },
}

/**
 * Get user-friendly error message based on error type
 */
function getErrorMessage(error: Error | string): { title: string; description?: string } {
    const errorMessage = typeof error === 'string' ? error : error.message

    // Check for known error patterns
    for (const [pattern, message] of Object.entries(ERROR_MESSAGES)) {
        if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
            return message
        }
    }

    // Handle specific error classes
    if (error instanceof BackendTimeoutError) {
        return ERROR_MESSAGES['Request timeout']
    }

    if (error instanceof SSEConnectionError) {
        return {
            title: 'Connection interrupted',
            description: 'The live connection was lost. Please refresh.',
        }
    }

    if (error instanceof BackendAPIError) {
        const statusCode = error.statusCode
        if (statusCode === 401) return ERROR_MESSAGES['Unauthorized']
        if (statusCode === 403) return ERROR_MESSAGES['Forbidden']
        if (statusCode === 404) {
            return { title: 'Not found', description: 'The requested resource was not found.' }
        }
        if (statusCode && statusCode >= 500) {
            return { title: 'Server error', description: 'Something went wrong on our end. Please try again.' }
        }
    }

    // Default: use the error message directly
    return {
        title: typeof error === 'string' ? error : error.message || 'An error occurred',
    }
}

/**
 * Show a success toast
 */
function success(message: string, options?: ToastOptions) {
    return sonnerToast.success(message, {
        description: options?.description,
        duration: options?.duration ?? 4000,
        action: options?.action,
        cancel: options?.cancel,
        id: options?.id,
    })
}

/**
 * Show an error toast and report to New Relic
 */
function error(message: string, options?: ToastOptions & { error?: Error }) {
    // Report to New Relic
    const errorObj = options?.error || new Error(message)
    reportError(errorObj, {
        context: options?.context || 'toast',
        toastMessage: message,
        ...options?.attributes,
    })

    return sonnerToast.error(message, {
        description: options?.description,
        duration: options?.duration ?? 6000, // Longer for errors
        action: options?.action,
        cancel: options?.cancel,
        id: options?.id,
    })
}

/**
 * Show a warning toast
 */
function warning(message: string, options?: ToastOptions) {
    return sonnerToast.warning(message, {
        description: options?.description,
        duration: options?.duration ?? 5000,
        action: options?.action,
        cancel: options?.cancel,
        id: options?.id,
    })
}

/**
 * Show an info toast
 */
function info(message: string, options?: ToastOptions) {
    return sonnerToast.info(message, {
        description: options?.description,
        duration: options?.duration ?? 4000,
        action: options?.action,
        cancel: options?.cancel,
        id: options?.id,
    })
}

/**
 * Show a loading toast (returns ID for dismissal)
 */
function loading(message: string, options?: Omit<ToastOptions, 'duration'>) {
    return sonnerToast.loading(message, {
        description: options?.description,
        action: options?.action,
        cancel: options?.cancel,
        id: options?.id,
    })
}

/**
 * Show a promise toast (loading → success/error)
 */
function promise<T>(
    promise: Promise<T>,
    messages: {
        loading: string
        success: string | ((data: T) => string)
        error: string | ((error: Error) => string)
    },
    options?: ToastOptions
) {
    return sonnerToast.promise(promise, {
        loading: messages.loading,
        success: messages.success,
        error: (err: Error) => {
            // Report error to New Relic
            reportError(err, {
                context: options?.context || 'promiseToast',
                ...options?.attributes,
            })
            return typeof messages.error === 'function'
                ? messages.error(err)
                : messages.error
        },
    })
}

/**
 * Dismiss a specific toast or all toasts
 */
function dismiss(toastId?: string | number) {
    sonnerToast.dismiss(toastId)
}

/**
 * Custom toast with full control
 */
function custom(
    message: string | React.ReactNode,
    options?: ToastOptions & { type?: 'success' | 'error' | 'warning' | 'info' }
) {
    return sonnerToast(message, {
        description: options?.description,
        duration: options?.duration ?? 4000,
        action: options?.action,
        cancel: options?.cancel,
        id: options?.id,
    })
}

/**
 * Show a dynamic error toast based on error type
 * Automatically formats the message based on the error class
 */
function apiError(
    err: Error | string,
    options?: Omit<ToastOptions, 'description'> & {
        fallbackMessage?: string
        showDetails?: boolean
    }
) {
    const errorObj = typeof err === 'string' ? new Error(err) : err
    const { title, description } = getErrorMessage(errorObj)

    // Report to New Relic
    reportError(errorObj, {
        context: options?.context || 'apiError',
        ...options?.attributes,
    })

    // Show detailed error in development
    const finalDescription = options?.showDetails && process.env.NODE_ENV === 'development'
        ? errorObj.message
        : description

    return sonnerToast.error(title, {
        description: finalDescription,
        duration: options?.duration ?? 6000,
        action: options?.action,
        cancel: options?.cancel,
        id: options?.id,
    })
}

/**
 * Show a system notification (info style, for non-user-initiated events)
 */
function system(message: string, options?: ToastOptions) {
    return sonnerToast(message, {
        description: options?.description,
        duration: options?.duration ?? 5000,
        action: options?.action,
        cancel: options?.cancel,
        id: options?.id,
    })
}

export const toast = {
    success,
    error,
    warning,
    info,
    loading,
    promise,
    dismiss,
    custom,
    apiError,
    system,
}

export default toast
