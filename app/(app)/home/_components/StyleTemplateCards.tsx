"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/tw-merge";
import { useImageLoad } from "@/hooks";
import { Section } from "./Section";
import type { StyleTemplate } from "@/types";

interface StyleTemplateCardsProps {
    templates: StyleTemplate[];
    onTemplateClick: (template: StyleTemplate) => void;
}

interface StyleTemplateCardProps {
    template: StyleTemplate;
    onClick: () => void;
}

function StyleTemplateCard({ template, onClick }: StyleTemplateCardProps) {
    const { imageLoaded, handleLoad } = useImageLoad();

    return (
        <button
            onClick={onClick}
            className="group relative w-64 flex-shrink-0 aspect-[3/4] rounded-xl overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label={`View ${template.name} style template`}
        >
            {/* Skeleton loader */}
            {!imageLoaded && (
                <div className="absolute inset-0 bg-neutral-900 animate-pulse" />
            )}

            {/* Background Image */}
            <Image
                src={template.previewImage}
                alt={template.name}
                fill
                className={cn(
                    "object-cover transition-transform duration-300 group-hover:scale-105",
                    imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={handleLoad}
                sizes="256px"
                quality={85}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Text Content - Bottom aligned */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-base font-medium text-white mb-2">
                    {template.name}
                </p>
                {template.tags.length > 0 && (
                    <span className="inline-block px-2 py-1 bg-white/10 backdrop-blur-sm text-xs text-white rounded-md">
                        {template.tags[0]}
                    </span>
                )}
            </div>
        </button>
    );
}

export function StyleTemplateCardSkeleton() {
    return (
        <div className="w-64 flex-shrink-0 aspect-[3/4] rounded-xl overflow-hidden bg-neutral-900 animate-pulse">
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="h-5 w-24 bg-neutral-800 rounded mb-2" />
                <div className="h-6 w-16 bg-neutral-800 rounded" />
            </div>
        </div>
    );
}

export function StyleTemplateCards({ templates, onTemplateClick }: StyleTemplateCardsProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const updateScrollButtons = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }, []);

    const scroll = (direction: "left" | "right") => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const scrollAmount = 280; // Card width + gap
        const newScrollLeft = direction === "left"
            ? container.scrollLeft - scrollAmount
            : container.scrollLeft + scrollAmount;

        container.scrollTo({
            left: newScrollLeft,
            behavior: "smooth",
        });
    };

    // Empty state
    if (templates.length === 0) {
        return (
            <Section>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-white mb-1">Styles</h2>
                        <p className="text-neutral-500 text-sm">No templates available</p>
                    </div>
                </div>
                <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">
                    No templates found
                </div>
            </Section>
        );
    }

    return (
        <Section>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-white mb-1">Styles</h2>
                    <p className="text-neutral-500 text-sm">
                        {templates.length} templates available
                    </p>
                </div>

                {/* Scroll Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => scroll("left")}
                        disabled={!canScrollLeft}
                        className={cn(
                            "p-2 rounded-lg border border-neutral-800 text-neutral-400 transition-colors duration-200",
                            canScrollLeft
                                ? "hover:text-white hover:border-neutral-700 cursor-pointer"
                                : "opacity-50 cursor-not-allowed"
                        )}
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        disabled={!canScrollRight}
                        className={cn(
                            "p-2 rounded-lg border border-neutral-800 text-neutral-400 transition-colors duration-200",
                            canScrollRight
                                ? "hover:text-white hover:border-neutral-700 cursor-pointer"
                                : "opacity-50 cursor-not-allowed"
                        )}
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Horizontal Scroll Container */}
            <div
                ref={scrollContainerRef}
                onScroll={updateScrollButtons}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                role="list"
                aria-label="Style templates"
            >
                {templates.map((template) => (
                    <StyleTemplateCard
                        key={template.id}
                        template={template}
                        onClick={() => onTemplateClick(template)}
                    />
                ))}
            </div>
        </Section>
    );
}

