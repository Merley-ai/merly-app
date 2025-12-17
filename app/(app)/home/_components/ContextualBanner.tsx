"use client";

import Image from "next/image";
import { X, Clock } from "lucide-react";
import { cn } from "@/lib/utils/tw-merge";
import { useImageLoad } from "@/hooks";
import { ImagePlaceholderIcon } from "@/components/ui";

interface ContextualBannerProps {
    albumName: string;
    albumThumbnail?: string;
    imagesGenerating: number;
    isVisible: boolean;
    onContinue: () => void;
    onDismiss: () => void;
}

export function ContextualBanner({
    albumName,
    albumThumbnail,
    imagesGenerating,
    isVisible,
    onContinue,
    onDismiss,
}: ContextualBannerProps) {
    const { imageLoaded, handleLoad } = useImageLoad();

    if (!isVisible) return null;

    return (
        <div
            className={cn(
                "fixed bottom-6 left-1/2 -translate-x-1/2 z-40",
                "bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl",
                "flex items-center gap-4 px-4 py-3",
                "animate-in slide-in-from-bottom-4 fade-in duration-300"
            )}
            role="status"
            aria-live="polite"
        >
            {/* Album Thumbnail */}
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
                {albumThumbnail ? (
                    <>
                        {!imageLoaded && (
                            <div className="absolute inset-0 bg-neutral-700 animate-pulse" />
                        )}
                        <Image
                            src={albumThumbnail}
                            alt={albumName}
                            fill
                            className={cn(
                                "object-cover transition-opacity",
                                imageLoaded ? "opacity-100" : "opacity-0"
                            )}
                            onLoad={handleLoad}
                            sizes="48px"
                            quality={75}
                        />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImagePlaceholderIcon className="w-6 h-6" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-neutral-400 text-xs mb-0.5">
                    <Clock className="w-3 h-3" />
                    <span>Continue where you left off</span>
                </div>
                <p className="text-white text-sm font-medium truncate">{albumName}</p>
                <p className="text-emerald-400 text-xs">
                    {imagesGenerating} image{imagesGenerating !== 1 ? "s" : ""} generating
                </p>
            </div>

            {/* Continue Button */}
            <button
                onClick={onContinue}
                className="px-4 py-2 rounded-lg border border-neutral-700 text-white text-sm font-medium hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 flex-shrink-0"
            >
                Continue
            </button>

            {/* Dismiss Button */}
            <button
                onClick={onDismiss}
                className="p-1.5 rounded-full text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 flex-shrink-0"
                aria-label="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
