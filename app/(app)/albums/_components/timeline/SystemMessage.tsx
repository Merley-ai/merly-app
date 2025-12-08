interface SystemMessageProps {
    message: string;
}

/**
 * System Message Component
 * 
 * Displays system messages in the timeline (e.g., "Album created", "Generation started").
 * Left-aligned to match AI message positioning with distinct visual treatment.
 */
export function SystemMessage({ message }: SystemMessageProps) {
    return (
        <div className="flex flex-col items-start space-y-2">
            <p
                className="font-['Roboto:Regular',_sans-serif] text-white text-[16px] max-w-[80%]"
                style={{ fontVariationSettings: "'wdth' 100" }}
            >
                {message}
            </p>
        </div>
    );
}
