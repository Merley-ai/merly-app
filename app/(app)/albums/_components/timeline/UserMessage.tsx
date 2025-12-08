interface UserPromptBubbleProps {
    prompt: string;
    maxWidth?: string;
}

/**
 * User Prompt Bubble
 * 
 * Displays user's prompt text in a rounded bubble
 */
export function UserPromptBubble({ prompt, maxWidth = "80%" }: UserPromptBubbleProps) {
    return (
        <div
            className="bg-[#2e2e2e] rounded-[40px] px-6 py-4"
            style={{ maxWidth }}
        >
            <p
                className="font-['Roboto:Regular',_sans-serif] text-white text-[16px]"
                style={{ fontVariationSettings: "'wdth' 100" }}
            >
                {prompt}
            </p>
        </div>
    );
}
