interface ErrorMessageProps {
    message: string;
}

/**
 * Error Message Component
 * 
 * Displays error messages in the timeline (e.g., "Failed to load album", "Generation failed").
 * Styled similarly to the "Failed to load album" error in AlbumsContent.
 */
export function ErrorMessage({ message }: ErrorMessageProps) {
    return (
        <div className="flex justify-center py-4">
            <div className="px-6 py-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <p
                    className="font-['Roboto:Regular',_sans-serif] text-red-400 text-[14px] text-center"
                    style={{ fontVariationSettings: "'wdth' 100" }}
                >
                    {message}
                </p>
            </div>
        </div>
    );
}
