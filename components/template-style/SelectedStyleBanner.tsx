"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/tw-merge";
import type { StyleTemplate } from "@/types";

interface SelectedStyleBannerProps {
    selectedStyle: StyleTemplate;
    availableStyles?: StyleTemplate[];
    onChangeStyle?: (style: StyleTemplate) => void;
    onViewDetails?: (style: StyleTemplate) => void;
    onRemoveStyle?: () => void;
}

export function SelectedStyleBanner({
    selectedStyle,
    availableStyles = [],
    onChangeStyle,
    onViewDetails,
    onRemoveStyle,
}: SelectedStyleBannerProps) {
    const [imageLoaded, setImageLoaded] = useState(false);

    const handleViewDetails = () => {
        onViewDetails?.(selectedStyle);
    };

    const handleRemoveStyle = () => {
        onRemoveStyle?.();
    };

    return (
        <div className="px-4 pb-2 shadow-[0_-16px_48px_0px_rgba(0,0,0,0.4)]">
            <div className="group relative bg-white rounded-xl px-3 py-3 flex items-center gap-3">
                {/* Close Button - styled like remove image */}
                <button
                    onClick={handleRemoveStyle}
                    className="absolute -top-3 -right-3 w-[24px] h-[24px] bg-black rounded-full flex items-center justify-center hover:bg-black transition-all cursor-pointer z-10 opacity-0 group-hover:opacity-100"
                    aria-label="Remove style"
                >
                    <span className="text-black/70 text-[21px] justify-center group-hover:text-white">×</span>
                </button>

                {/* Preview Image */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-neutral-200 animate-pulse" />
                        </div>
                    )}
                    {selectedStyle.previewImage && (
                        <Image
                            src={selectedStyle.previewImage}
                            alt={selectedStyle.name}
                            fill
                            className={cn(
                                "object-cover transition-opacity duration-200",
                                imageLoaded ? "opacity-100" : "opacity-0"
                            )}
                            onLoad={() => setImageLoaded(true)}
                            sizes="56px"
                            quality={75}
                        />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Style Name & Tag Badge - Inline */}
                    <div className="flex items-center gap-3">
                        <p className="text-black font-semibold text-base leading-tight">
                            {selectedStyle.name}
                        </p>
                        {selectedStyle.tags.length > 0 && (
                            <span className="bg-neutral-100 text-neutral-600 text-xs px-2 py-0.5 rounded">
                                {selectedStyle.tags[0]}
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    {selectedStyle.description && (
                        <p className="mt-1 text-neutral-500 text-xs line-clamp-2">
                            {selectedStyle.description}
                        </p>
                    )}
                </div>

                {/* View Details Button */}
                <button
                    type="button"
                    onClick={handleViewDetails}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center hover:bg-neutral-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-200"
                    aria-label="View style details"
                >
                    <ChevronRight className="w-7 h-7 text-black hover:text-teal-500" />
                </button>
            </div>
        </div>
    );
}
