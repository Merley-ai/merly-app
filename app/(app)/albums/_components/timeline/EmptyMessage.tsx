interface EmptyMessageProps {
    message: string;
}

/**
 * Empty Message Component
 * 
 * Reusable empty state message for timeline views.
 */
export function EmptyMessage({ message }: EmptyMessageProps) {
    return (
        <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-4">
                <div className="px-6 py-4">
                    <p
                        className="font-['Roboto:Regular',_sans-serif] text-white/80 text-[16px] leading-relaxed"
                        style={{ fontVariationSettings: "'wdth' 100" }}
                    >
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
}
