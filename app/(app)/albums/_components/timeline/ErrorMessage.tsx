import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
}

/**
 * Error Message Component
 * 
 * Displays error messages in the timeline with an error icon and optional retry button.
 * Left-aligned like system messages for consistency.
 */
export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
    return (
        <div className="flex flex-col items-start gap-3">
            {/* Error Icon and Message */}
            <div className="flex items-center gap-2">
                <AlertCircle className="size-5 text-red-400 flex-shrink-0" />
                <p
                    className="font-['Roboto:Regular',_sans-serif] text-red-400 text-[14px]"
                    style={{ fontVariationSettings: "'wdth' 100" }}
                >
                    {message}
                </p>
            </div>

            {/* Retry Button */}
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                >
                    <p
                        className="font-['Roboto:Regular',_sans-serif] text-white text-[14px]"
                        style={{ fontVariationSettings: "'wdth' 100" }}
                    >
                        Retry
                    </p>
                </button>
            )}
        </div>
    );
}
