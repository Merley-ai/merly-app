"use client";

interface PlaceholderImageProps {
    index?: number;
    delay?: number;
    className?: string;
}

/**
 * PlaceholderImage Component
 * 
 * Displays an animated placeholder while images are being generated.
 * Uses AnimatedImage for smooth fade-in animation.
 * Shows a gradient shimmer effect to indicate loading state.
 */
export function PlaceholderImage({
    index = 0,
    className = ""
}: PlaceholderImageProps) {
    // Generate a unique gradient based on index for visual variety
    const gradientColors = [
        'from-gray-700 via-gray-600 to-gray-700',
        'from-gray-600 via-gray-500 to-gray-600',
        'from-gray-800 via-gray-700 to-gray-800',
        'from-gray-700 via-gray-800 to-gray-700',
    ];

    const gradientClass = gradientColors[index % gradientColors.length];

    return (
        <div className={`aspect-[4/5] rounded-lg overflow-hidden relative ${className}`}>
            {/* Animated gradient background */}
            <div className={`w-full h-full bg-gradient-to-br ${gradientClass} animate-pulse`} />

            {/* Shimmer effect overlay */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* Loading indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    {/* Spinner */}
                    <div className="w-10 h-10 border-4 border-white/20 border-t-white/80 rounded-full animate-spin" />

                    {/* Loading text */}
                    <p className="font-['Roboto:Regular',_sans-serif] text-white/60 text-[12px]">
                        Generating...
                    </p>
                </div>
            </div>
        </div>
    );
}

/**
 * PlaceholderThumbnail Component
 * 
 * Smaller version for timeline thumbnails
 */
export function PlaceholderThumbnail({
    className = ""
}: {
    delay?: number;
    className?: string;
}) {
    return (
        <div className={`w-[71px] h-[71px] rounded overflow-hidden relative ${className}`}>
            {/* Animated gradient background */}
            <div className="w-full h-full bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 animate-pulse" />

            {/* Shimmer effect overlay */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* Small loading indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
            </div>
        </div>
    );
}

