import { cn } from "@/lib/utils/tw-merge";

interface ImagePlaceholderIconProps {
    className?: string;
}

/**
 * Reusable image placeholder icon
 * 
 * Used as a fallback when images fail to load or are not available
 */
export function ImagePlaceholderIcon({ className }: ImagePlaceholderIconProps) {
    return (
        <svg
            className={cn("text-neutral-600", className)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
        </svg>
    );
}
