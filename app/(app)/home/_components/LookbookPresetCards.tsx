"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/tw-merge";
import type { LookbookPreset } from "@/types";

interface LookbookPresetCardsProps {
    presets: LookbookPreset[];
    onPresetClick: (preset: LookbookPreset) => void;
}

interface LookbookPresetCardProps {
    preset: LookbookPreset;
    onClick: () => void;
}

function LookbookPresetCard({ preset, onClick }: LookbookPresetCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <button
            onClick={onClick}
            className="group relative w-full aspect-video rounded-xl overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label={`Create ${preset.name} lookbook`}
        >
            {/* Skeleton loader */}
            {!imageLoaded && (
                <div className="absolute inset-0 bg-neutral-900 animate-pulse" />
            )}

            {/* Background Image */}
            <Image
                src={preset.previewImage}
                alt={preset.name}
                fill
                className={cn(
                    "object-cover transition-transform duration-300 group-hover:scale-105",
                    imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={85}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Tags - Top Right */}
            {preset.tags.length > 0 && (
                <div className="absolute top-3 right-3 flex flex-wrap gap-1.5 justify-end">
                    {preset.tags.slice(0, 2).map((tag) => (
                        <span
                            key={tag}
                            className="px-2 py-1 bg-black/40 backdrop-blur-sm border border-white/10 text-xs text-white rounded-md"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Text Content - Bottom Left */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-lg font-medium text-white mb-1">
                    {preset.name}
                </p>
                <p className="text-xs text-neutral-400">
                    {preset.pageCount} pages
                </p>
            </div>
        </button>
    );
}

function LookbookPresetCardSkeleton() {
    return (
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-neutral-900 animate-pulse">
            <div className="absolute top-3 right-3 flex gap-1.5">
                <div className="h-6 w-16 bg-neutral-800 rounded" />
                <div className="h-6 w-14 bg-neutral-800 rounded" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="h-6 w-32 bg-neutral-800 rounded mb-2" />
                <div className="h-4 w-16 bg-neutral-800 rounded" />
            </div>
        </div>
    );
}

export function LookbookPresetCards({ presets, onPresetClick }: LookbookPresetCardsProps) {
    // Empty state
    if (presets.length === 0) {
        return (
            <section className="py-12 px-8 md:px-12 lg:px-16">
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-white mb-1">Lookbooks</h2>
                    <p className="text-neutral-500 text-sm">Multi-page collections and campaigns</p>
                </div>
                <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">
                    No lookbook presets available
                </div>
            </section>
        );
    }

    return (
        <section className="py-12 px-8 md:px-12 lg:px-16">
            {/* Section Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-white mb-1">Lookbooks</h2>
                <p className="text-neutral-500 text-sm">Multi-page collections and campaigns</p>
            </div>

            {/* Grid Layout */}
            <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                role="list"
                aria-label="Lookbook presets"
            >
                {presets.map((preset) => (
                    <LookbookPresetCard
                        key={preset.id}
                        preset={preset}
                        onClick={() => onPresetClick(preset)}
                    />
                ))}
            </div>
        </section>
    );
}

export { LookbookPresetCardSkeleton };
