"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Download, Trash2 } from "lucide-react";
import dashboardSvgPaths from "@/lib/constants/dashboard-svg-paths";
import { Tooltip } from "@/components/ui/Tooltip";
import type { GalleryImage } from "@/types";

interface ImageViewerProps {
    image: GalleryImage;
    imageIndex: number;
    totalImages: number;
    albumName: string;
    onClose: () => void;
    onNavigate: (direction: 'prev' | 'next') => void;
    onDownload: (url: string) => void;
    onDelete: (index: number) => void;
    canNavigatePrev: boolean;
    canNavigateNext: boolean;
}

export function ImageViewer({
    image,
    imageIndex,
    albumName: _albumName,
    onClose,
    onNavigate,
    onDownload,
    onDelete,
    canNavigatePrev,
    canNavigateNext,
}: ImageViewerProps) {
    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowLeft' && canNavigatePrev) {
                onNavigate('prev');
            } else if (e.key === 'ArrowRight' && canNavigateNext) {
                onNavigate('next');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, onNavigate, canNavigatePrev, canNavigateNext]);

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Top Bar */}
            <div className="flex items-center justify-between p-4 border-b border-[#6b6b6b]/30">
                <div className="flex items-center gap-3">
                    <p
                        className="font-['Roboto:Regular',_sans-serif] text-white text-[16px]"
                        style={{ fontVariationSettings: "'wdth' 100" }}
                    >
                        {image.description}
                    </p>
                    <div className="flex items-center gap-2">
                        <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                        </svg>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Navigation Arrows */}
                    <div className="flex items-center bg-[#2e2e2e] rounded-full">
                        <Tooltip text="Previous" position="bottom" disabled={!canNavigatePrev}>
                            <button
                                onClick={() => onNavigate('prev')}
                                className="text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer px-3 py-2"
                                disabled={!canNavigatePrev}
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="size-4" strokeWidth={2} />
                            </button>
                        </Tooltip>
                        <div className="w-px h-4 bg-white/20" />
                        <Tooltip text="Next" position="bottom" disabled={!canNavigateNext}>
                            <button
                                onClick={() => onNavigate('next')}
                                className="text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer px-3 py-2"
                                disabled={!canNavigateNext}
                                aria-label="Next image"
                            >
                                <ChevronRight className="size-4" strokeWidth={2} />
                            </button>
                        </Tooltip>
                    </div>

                    {/* Download Button */}
                    <Tooltip text="Download" position="bottom">
                        <button
                            onClick={() => onDownload(image.url)}
                            className="text-white/80 hover:text-white transition-colors cursor-pointer p-2"
                            aria-label="Download image"
                        >
                            <Download className="size-4" strokeWidth={2} />
                        </button>
                    </Tooltip>

                    {/* Delete Button */}
                    <Tooltip text="Delete" position="bottom">
                        <button
                            onClick={() => onDelete(imageIndex)}
                            className="text-white/80 hover:text-white transition-colors cursor-pointer p-2"
                            aria-label="Delete image"
                        >
                            <Trash2 className="size-4" strokeWidth={2} />
                        </button>
                    </Tooltip>

                    {/* Close Button */}
                    <Tooltip text="Close" position="bottom">
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors cursor-pointer p-2"
                            aria-label="Close"
                        >
                            <X className="size-5" strokeWidth={2} />
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Image Container */}
            <div className="flex-1 flex items-center justify-center p-8 relative">
                <Image
                    src={image.url}
                    alt={image.description}
                    fill
                    className="object-contain rounded-lg"
                    sizes="90vw"
                    quality={95}
                    priority
                    unoptimized={image.url.includes('fal.media') || image.url.includes('fal.ai')}
                />
            </div>
        </div>
    );
}

