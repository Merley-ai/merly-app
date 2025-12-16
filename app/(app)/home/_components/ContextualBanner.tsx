"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Clock } from "lucide-react";
import { cn } from "@/lib/utils/tw-merge";

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
    const [imageLoaded, setImageLoaded] = useState(false);

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
                            onLoad={() => setImageLoaded(true)}
                            sizes="48px"
                            quality={75}
                        />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg
                            className="w-6 h-6 text-neutral-600"
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
