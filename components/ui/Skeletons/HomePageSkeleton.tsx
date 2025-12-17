"use client";

import { Skeleton } from "@/components/ui/Skeletons/Skeleton";
import { StyleTemplateCardSkeleton } from "../../../app/(app)/home/_components/StyleTemplateCards";
import { LookbookPresetCardSkeleton } from "../../../app/(app)/home/_components/LookbookPresetCards";
import { AlbumCardSkeleton } from "../../../app/(app)/home/_components/AlbumsGrid";
import { Section } from "../../../app/(app)/home/_components/Section";

/**
 * Homepage Skeleton Loader
 * 
 * Composes reusable skeleton components for initial page load
 */
export function HomePageSkeleton() {
    return (
        <div className="flex-1 bg-black overflow-y-auto">
            {/* Hero Section Skeleton */}
            <div className="relative w-full h-[60vh] min-h-[500px] bg-neutral-900 animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
                <div className="relative h-full flex items-center px-8 md:px-12 lg:px-16">
                    <div className="max-w-2xl">
                        <Skeleton className="h-12 w-96 rounded-lg mb-4" />
                        <Skeleton className="h-6 w-64 mb-8" />
                        <Skeleton className="h-12 w-40 rounded-lg" />
                    </div>
                </div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-1.5 w-1.5 rounded-full bg-white/30" />
                    ))}
                </div>
            </div>

            {/* Style Templates Section Skeleton */}
            <Section>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <Skeleton className="h-7 w-24 mb-2" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-9 h-9 rounded-lg" />
                        <Skeleton className="w-9 h-9 rounded-lg" />
                    </div>
                </div>
                <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <StyleTemplateCardSkeleton key={i} />
                    ))}
                </div>
            </Section>

            {/* Lookbook Presets Section Skeleton */}
            <Section>
                <div className="mb-6">
                    <Skeleton className="h-7 w-32 mb-2" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map((i) => (
                        <LookbookPresetCardSkeleton key={i} />
                    ))}
                </div>
            </Section>

            {/* Albums Section Skeleton */}
            <Section>
                <Skeleton className="h-7 w-32 mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <AlbumCardSkeleton key={i} />
                    ))}
                </div>
            </Section>
        </div>
    );
}
