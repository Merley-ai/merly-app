"use client";

import * as React from "react";
import Image from "next/image";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils/tw-merge";
import { useModal } from "@/hooks";
import type { StyleTemplate } from "@/types";

export interface StyleSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    styles: StyleTemplate[];
    selectedStyle?: StyleTemplate | null;
    onStyleSelect: (style: StyleTemplate | null) => void;
}

export function StyleSelectModal({
    isOpen,
    onClose,
    styles,
    selectedStyle = null,
    onStyleSelect,
}: StyleSelectModalProps) {
    const { handleBackdropClick } = useModal({ isOpen, onClose });

    const handleStyleSelect = (style: StyleTemplate) => {
        const newSelection = selectedStyle?.id === style.id ? null : style;
        onStyleSelect(newSelection);
    };

    const handleApply = () => {
        onClose();
    };

    const handleClear = () => {
        onStyleSelect(null);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="style-select-modal-title"
        >
            <div className="relative w-full max-w-6xl max-h-[110vh] mx-4 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        {/* Title - Center */}
                        <h2
                            id="style-select-modal-title"
                            className="text-2xl font-semibold text-white"
                        >
                            Select Style
                        </h2>
                        {/* Close Button - Right */}
                        <div className="w-64 flex justify-end gap-5">
                            {selectedStyle && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="text-sm text-white/60 hover:text-white transition-colors"
                                >
                                    Clear Selection
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Styles Grid */}
                    {styles.length === 0 ? (
                        <div className="flex items-center justify-center py-16">
                            <p className="text-neutral-400">No styles available</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pl-3 pr-4 pt-3 scrollbar-minimal">
                            {styles.map((style) => (
                                <div key={style.id} className="flex flex-col">
                                    <button
                                        type="button"
                                        onClick={() => handleStyleSelect(style)}
                                        className={cn(
                                            "relative aspect-[3/4] rounded-xl overflow-hidden transition-all duration-200",
                                            "hover:ring-2 hover:ring-white/50 hover:scale-[1.03]",
                                            selectedStyle?.id === style.id && "ring-2 ring-white"
                                        )}
                                    >
                                        <Image
                                            src={style.previewImage}
                                            alt={style.name}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                        />
                                        {/* Selected indicator */}
                                        {selectedStyle?.id === style.id && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                                <Check className="w-4 h-4 text-black" />
                                            </div>
                                        )}
                                    </button>
                                    {/* Name below image */}
                                    <span className="mt-2 text-sm text-white font-medium line-clamp-1 text-left">
                                        {style.name}
                                    </span>
                                    {style.tags.length > 0 && (
                                        <span className="text-xs text-white/60 line-clamp-1">
                                            {style.tags[0]}, {style.tags[1]}, {style.tags[2]}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Apply Button */}
                    {selectedStyle && (
                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={handleApply}
                                className="px-6 py-3 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                            >
                                Apply Style
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
