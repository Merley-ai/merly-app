"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronRight, Eye, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils/tw-merge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/Menus/Popover";
import { Separator } from "@/components/ui/Menus/Separator";
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
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isStyleListOpen, setIsStyleListOpen] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const handleChangeStyle = (style: StyleTemplate) => {
        onChangeStyle?.(style);
        setIsStyleListOpen(false);
        setIsPopoverOpen(false);
    };

    const handleViewDetails = () => {
        onViewDetails?.(selectedStyle);
        setIsPopoverOpen(false);
    };

    const handleRemoveStyle = () => {
        onRemoveStyle?.();
        setIsPopoverOpen(false);
    };

    return (
        <div className="px-4 pb-2">
            <div className="bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-4">
                {/* Preview Image */}
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
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
                    {/* Style Name */}
                    <p className="text-black font-semibold text-base leading-tight">
                        {selectedStyle.name}
                    </p>

                    {/* Tag Badge */}
                    {selectedStyle.tags.length > 0 && (
                        <span className="inline-block mt-1 bg-neutral-100 text-neutral-600 text-xs px-2 py-0.5 rounded">
                            {selectedStyle.tags[0]}
                        </span>
                    )}

                    {/* Description */}
                    {selectedStyle.description && (
                        <p className="mt-1 text-neutral-500 text-sm line-clamp-2 leading-snug">
                            {selectedStyle.description}
                        </p>
                    )}
                </div>

                {/* Chevron Button with Popover */}
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-200"
                            aria-label="Style options"
                        >
                            <ChevronRight className="w-5 h-5 text-neutral-400" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent
                        side="top"
                        align="end"
                        className="w-56 p-2 bg-white border-neutral-200 rounded-xl"
                    >
                        {/* Change Style - Opens nested list */}
                        <Popover open={isStyleListOpen} onOpenChange={setIsStyleListOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <RefreshCw className="w-4 h-4" />
                                        Change Style
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent
                                side="left"
                                align="start"
                                className="w-64 max-h-72 overflow-y-auto p-2 bg-white border-neutral-200 rounded-xl"
                            >
                                {availableStyles.length === 0 ? (
                                    <p className="px-3 py-2 text-sm text-neutral-400">
                                        No other styles available
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        {availableStyles
                                            .filter((s) => s.id !== selectedStyle.id)
                                            .map((style) => (
                                                <button
                                                    key={style.id}
                                                    type="button"
                                                    onClick={() => handleChangeStyle(style)}
                                                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-neutral-100 transition-colors"
                                                >
                                                    <div className="relative w-8 h-8 rounded overflow-hidden bg-neutral-100 flex-shrink-0">
                                                        {style.previewImage && (
                                                            <Image
                                                                src={style.previewImage}
                                                                alt={style.name}
                                                                fill
                                                                className="object-cover"
                                                                sizes="32px"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-neutral-700 truncate">
                                                            {style.name}
                                                        </p>
                                                        {style.tags.length > 0 && (
                                                            <p className="text-xs text-neutral-400 truncate">
                                                                {style.tags[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>

                        {/* View Details */}
                        <button
                            type="button"
                            onClick={handleViewDetails}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                            View Details
                        </button>

                        <Separator className="my-1 bg-neutral-200" />

                        {/* Remove Style */}
                        <button
                            type="button"
                            onClick={handleRemoveStyle}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Remove Style
                        </button>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
