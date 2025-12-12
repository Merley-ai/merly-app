import { SuggestedActions } from "./SuggestedActions";

interface SystemMessageProps {
    message: string;
    suggestedActions?: Array<{ id: string; label: string; action?: string }>;
    onActionClick?: (actionId: string) => void;
}

/**
 * System Message Component
 * 
 * Displays system messages in the timeline (e.g., "Album created", "Generation started").
 * Left-aligned to match AI message positioning with distinct visual treatment.
 * Can optionally display suggested action buttons below the message.
 */
export function SystemMessage({ message, suggestedActions, onActionClick }: SystemMessageProps) {
    return (
        <div className="flex flex-col items-start space-y-2 max-w-[80%]">
            <p
                className="font-['Roboto:Regular',_sans-serif] text-white text-[16px]"
                style={{ fontVariationSettings: "'wdth' 100" }}
            >
                {message}
            </p>
            {suggestedActions && suggestedActions.length > 0 && (
                <SuggestedActions actions={suggestedActions} onActionClick={onActionClick} />
            )}
        </div>
    );
}
