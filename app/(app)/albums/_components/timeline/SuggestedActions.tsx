import { LucideIcon, Paintbrush, Expand, Redo2 } from "lucide-react";

interface SuggestedAction {
    id: string;
    label: string;
    action?: string;
}

interface SuggestedActionsProps {
    actions: SuggestedAction[];
    onActionClick?: (actionId: string) => void;
}

/**
 * SuggestedActions Component
 * 
 * Displays a list of suggested action buttons below system messages.
 * Based on the reference design with icons and labels.
 */
export function SuggestedActions({ actions, onActionClick }: SuggestedActionsProps) {
    if (!actions || actions.length === 0) {
        return null;
    }

    // Map action IDs to appropriate Lucide icons
    const getIconForAction = (actionId: string): LucideIcon => {
        switch (actionId) {
            case 'generate-variations':
                return Redo2;
            case 'refine-style':
                return Paintbrush;
            case 'resize-image':
                return Expand;
            default:
                return Redo2;
        }
    };

    return (
        <div className="space-y-1">
            {actions.map((action) => {
                const Icon = getIconForAction(action.id);
                return (
                    <button
                        key={action.id}
                        onClick={() => onActionClick?.(action.id)}
                        className="flex items-center gap-3 w-full px-4 py-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200 text-left group"
                    >
                        <Icon
                            size={16}
                            className="text-white/60 group-hover:text-white/80 transition-colors duration-200"
                        />
                        <span
                            className="font-['Roboto:Regular',_sans-serif] text-white/55 group-hover:text-white/90 text-[14px] transition-colors duration-200"
                            style={{ fontVariationSettings: "'wdth' 100" }}
                        >
                            {action.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
