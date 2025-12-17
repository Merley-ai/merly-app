'use client'

import { Toaster as SonnerToast } from 'sonner'

/**
 * Toaster Provider Component
 * 
 * Renders the Sonner toast container with custom styling per notification type.
 * 
 * Styles:
 * - Error: Dark red background with red border (critical errors)
 * - Warning: Dark amber/brown background with amber border (warnings)
 * - Success: Dark green background with green border
 * - Info: Dark neutral background with subtle border
 */
export function Toast() {
    return (
        <SonnerToast
            position="top-right"
            gap={12}
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast: 'w-full max-w-[420px] rounded-lg p-4 shadow-lg flex items-start gap-3',
                    title: 'text-sm font-medium',
                    description: 'text-sm opacity-90 mt-1',
                    closeButton: 'absolute top-3 right-3 text-current opacity-50 hover:opacity-100 transition-opacity',
                    // Type-specific styles
                    error: 'bg-[#2a1215] border border-[#5c2328] text-[#fca5a5]',
                    warning: 'bg-[#2d2006] border border-[#78500a] text-[#fcd34d]',
                    success: 'bg-[#052e16] border border-[#166534] text-[#86efac]',
                    info: 'bg-[#18181b] border border-[#3f3f46] text-[#e4e4e7]',
                },
            }}
            closeButton
            visibleToasts={5}
            style={{ zIndex: 9999 }}
        />
    )
}

export { Toast as default }
