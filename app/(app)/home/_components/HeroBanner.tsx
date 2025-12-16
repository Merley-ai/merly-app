"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/tw-merge";
import type { HeroCarouselItem, StyleTemplate, LookbookPreset } from "@/types";

interface HeroBannerProps {
    items: HeroCarouselItem[];
    onTemplateClick: (template: StyleTemplate) => void;
    onLookbookClick: (lookbook: LookbookPreset) => void;
}

export function HeroBanner({ items, onTemplateClick, onLookbookClick }: HeroBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const goToSlide = useCallback((index: number) => {
        setCurrentIndex(index);
    }, []);

    const goToPrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
    }, [items.length]);

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    }, [items.length]);

    // Auto-advance carousel every 5 seconds
    useEffect(() => {
        if (!isAutoPlaying || items.length <= 1) return;

        const interval = setInterval(() => {
            goToNext();
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, goToNext, items.length]);

    // Pause auto-play on user interaction
    const handleUserInteraction = useCallback(() => {
        setIsAutoPlaying(false);
        // Resume auto-play after 10 seconds of no interaction
        const timeout = setTimeout(() => setIsAutoPlaying(true), 10000);
        return () => clearTimeout(timeout);
    }, []);

    const handlePrevious = () => {
        handleUserInteraction();
        goToPrevious();
    };

    const handleNext = () => {
        handleUserInteraction();
        goToNext();
    };

    const handleDotClick = (index: number) => {
        handleUserInteraction();
        goToSlide(index);
    };

    const handleCtaClick = () => {
        const currentItem = items[currentIndex];
        if (currentItem.type === "template") {
            onTemplateClick(currentItem.linkedItem as StyleTemplate);
        } else {
            onLookbookClick(currentItem.linkedItem as LookbookPreset);
        }
    };

    if (items.length === 0) return null;

    const currentItem = items[currentIndex];

    return (
        <section className="relative w-full h-[60vh] min-h-[500px] overflow-hidden group">
            {/* Background Images with Fade Transition */}
            {items.map((item, index) => (
                <div
                    key={item.id}
                    className={cn(
                        "absolute inset-0 transition-opacity duration-500",
                        index === currentIndex ? "opacity-100" : "opacity-0"
                    )}
                >
                    <Image
                        src={item.backgroundImage}
                        alt={item.title}
                        fill
                        className="object-cover"
                        priority={index === 0}
                        sizes="100vw"
                        quality={90}
                    />
                    {/* Dark gradient overlay for text contrast */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
                </div>
            ))}

            {/* Content Overlay */}
            <div className="relative h-full flex items-center px-8 md:px-12 lg:px-16">
                <div className="max-w-2xl">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 text-balance">
                        {currentItem.title}
                    </h1>
                    <p className="text-neutral-300 text-base md:text-lg mb-8 text-pretty">
                        {currentItem.subtitle}
                    </p>
                    <button
                        onClick={handleCtaClick}
                        className="bg-white text-black px-8 py-4 rounded-lg text-base font-medium hover:bg-neutral-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                        {currentItem.ctaText}
                    </button>
                </div>
            </div>

            {/* Navigation Arrows */}
            {items.length > 1 && (
                <>
                    <button
                        onClick={handlePrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/50 focus:outline-none focus:ring-2 focus:ring-white/20"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/50 focus:outline-none focus:ring-2 focus:ring-white/20"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Dot Indicators */}
            {items.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handleDotClick(index)}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/20",
                                index === currentIndex
                                    ? "w-8 bg-white"
                                    : "w-1.5 bg-white/50 hover:bg-white/70"
                            )}
                            aria-label={`Go to slide ${index + 1}`}
                            aria-current={index === currentIndex ? "true" : "false"}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
