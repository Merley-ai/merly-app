"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils/tw-merge";
import { useModal } from "@/hooks";
import { ImagePlaceholderIcon } from "@/components/ui";
import type { StyleTemplate, Album } from "@/types";

interface TemplateDetailModalProps {
    template: StyleTemplate | null;
    isOpen: boolean;
    onClose: () => void;
    albums: Album[];
    selectedAlbum: Album | null;
    onCreateNewAlbum: () => void;
    onApplyStyle: (template: StyleTemplate, albumId: string | null) => void;
}

export function TemplateDetailModal({
    template,
    isOpen,
    onClose,
    albums,
    selectedAlbum,
    onCreateNewAlbum,
    onApplyStyle,
}: TemplateDetailModalProps) {
    const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(
        selectedAlbum?.id ?? null
    );
    const [isAlbumDropdownOpen, setIsAlbumDropdownOpen] = useState(false);
    const [previewImageLoaded, setPreviewImageLoaded] = useState(false);

    const { handleBackdropClick } = useModal({ isOpen, onClose });

    const handleApplyStyle = () => {
        if (template) {
            onApplyStyle(template, null);
            onClose();
        }
    };

    const selectedAlbumForDropdown = albums.find((a) => a.id === selectedAlbumId);

    if (!isOpen || !template) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-modal-title"
        >
            <div className="relative w-full max-w-4xl mx-4 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col md:flex-row">
                    {/* Preview Image - Left Side */}
                    <div className="relative w-full md:w-1/2 aspect-[3/4] bg-neutral-800">
                        {!previewImageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full border-2 border-neutral-700 flex items-center justify-center">
                                    <ImagePlaceholderIcon className="w-8 h-8" />
                                </div>
                            </div>
                        )}
                        <Image
                            src={template.previewImage}
                            alt={template.name}
                            fill
                            className={cn(
                                "object-cover transition-opacity duration-300",
                                previewImageLoaded ? "opacity-100" : "opacity-0"
                            )}
                            onLoad={() => setPreviewImageLoaded(true)}
                            sizes="(max-width: 768px) 100vw, 50vw"
                            quality={90}
                            priority
                        />
                    </div>

                    {/* Content - Right Side */}
                    <div className="w-full md:w-1/2 p-6 flex flex-col">
                        {/* Header */}
                        <div className="mb-4">
                            <h2
                                id="template-modal-title"
                                className="text-2xl font-semibold text-white mb-2"
                            >
                                {template.name}
                            </h2>
                            <p className="text-neutral-400 text-sm leading-relaxed">
                                {template.description}
                            </p>
                        </div>

                        {/* Tags */}
                        {template.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {template.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1.5 bg-neutral-800 text-neutral-300 text-xs rounded-full"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Example Generations */}
                        {template.exampleImages.length > 0 && (
                            <div className="mb-6">
                                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
                                    Example Generations
                                </p>
                                <div className="flex gap-2">
                                    {template.exampleImages.slice(0, 3).map((img, index) => (
                                        <div
                                            key={index}
                                            className="relative w-20 h-24 rounded-lg overflow-hidden bg-neutral-800"
                                        >
                                            <Image
                                                src={img}
                                                alt={`Example ${index + 1}`}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                                quality={75}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Actions */}
                        <div className="space-y-3">
                            {/* Create New Album Button */}
                            {/* <button
                                onClick={handleCreateNewAlbum}
                                className="w-full py-3 px-4 rounded-lg border border-neutral-700 text-white text-sm font-medium hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                            >
                                Create New Album
                            </button> */}

                            {/* Album Selector Dropdown */}
                            {/* <div className="relative"> */}
                            {/* <button
                                    onClick={() => setIsAlbumDropdownOpen(!isAlbumDropdownOpen)}
                                    className="w-full py-3 px-4 rounded-lg border border-neutral-700 text-white text-sm font-medium hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 flex items-center justify-between"
                                    aria-expanded={isAlbumDropdownOpen}
                                    aria-haspopup="listbox"
                                >
                                    <span className="flex items-center gap-2 truncate">
                                        {selectedAlbumForDropdown ? (
                                            <>
                                                {selectedAlbumForDropdown.thumbnail_url && (
                                                    <div className="relative w-5 h-5 rounded overflow-hidden flex-shrink-0">
                                                        <Image
                                                            src={selectedAlbumForDropdown.thumbnail_url}
                                                            alt=""
                                                            fill
                                                            className="object-cover"
                                                            sizes="20px"
                                                        />
                                                    </div>
                                                )}
                                                <span className="truncate">
                                                    {selectedAlbumForDropdown.name}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-neutral-400">Select an album</span>
                                        )}
                                    </span>
                                    <ChevronDown
                                        className={cn(
                                            "w-4 h-4 text-neutral-400 transition-transform",
                                            isAlbumDropdownOpen && "rotate-180"
                                        )}
                                    />
                                </button> */}

                            {/* Dropdown Menu */}
                            {/* {isAlbumDropdownOpen && (
                                    <div className="absolute bottom-full left-0 right-0 mb-1 max-h-48 overflow-y-auto bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-10">
                                        {albums.length === 0 ? (
                                            <div className="px-4 py-3 text-sm text-neutral-400">
                                                No albums available
                                            </div>
                                        ) : (
                                            <ul role="listbox" className="py-1">
                                                {albums.map((album) => (
                                                    <li key={album.id}>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedAlbumId(album.id);
                                                                setIsAlbumDropdownOpen(false);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-neutral-700 flex items-center gap-2"
                                                            role="option"
                                                            aria-selected={selectedAlbumId === album.id}
                                                        >
                                                            {album.thumbnail_url && (
                                                                <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0">
                                                                    <Image
                                                                        src={album.thumbnail_url}
                                                                        alt=""
                                                                        fill
                                                                        className="object-cover"
                                                                        sizes="24px"
                                                                    />
                                                                </div>
                                                            )}
                                                            <span className="truncate flex-1">
                                                                {album.name}
                                                            </span>
                                                            {selectedAlbumId === album.id && (
                                                                <Check className="w-4 h-4 text-white flex-shrink-0" />
                                                            )}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )} */}
                            {/* </div> */}

                            {/* Apply Style Button */}
                            <button
                                onClick={handleApplyStyle}
                                className="w-full py-3 px-4 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
