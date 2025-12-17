"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/tw-merge";
import { humanizeDate } from "@/lib/utils";
import { useImageLoad } from "@/hooks";
import { ImagePlaceholderIcon } from "@/components/ui";
import { Section } from "./Section";
import type { Album } from "@/types";

interface AlbumsGridProps {
    albums: Album[];
    isLoading?: boolean;
    onAlbumClick: (album: Album) => void;
}

interface AlbumCardProps {
    album: Album;
    onClick: () => void;
}

function AlbumCard({ album, onClick }: AlbumCardProps) {
    const { imageLoaded, imageError, handleLoad, handleError } = useImageLoad();

    return (
        <button
            onClick={onClick}
            className="group relative w-full text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 rounded-xl"
            aria-label={`Open ${album.name} album`}
        >
            {/* Image Container */}
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-neutral-900">
                {/* Skeleton loader */}
                {!imageLoaded && !imageError && album.thumbnail_url && (
                    <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
                )}

                {/* Placeholder for albums without thumbnail */}
                {(!album.thumbnail_url || imageError) && (
                    <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center">
                        <ImagePlaceholderIcon className="w-12 h-12" />
                    </div>
                )}

                {/* Album Thumbnail */}
                {album.thumbnail_url && !imageError && (
                    <Image
                        src={album.thumbnail_url}
                        alt={album.name}
                        fill
                        className={cn(
                            "object-cover transition-all duration-300 group-hover:scale-105",
                            imageLoaded ? "opacity-100" : "opacity-0"
                        )}
                        onLoad={handleLoad}
                        onError={handleError}
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        quality={85}
                    />
                )}
            </div>

            {/* Album Info */}
            <div className="mt-3">
                <h3 className="text-sm font-medium text-white truncate">
                    {album.name}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                    {humanizeDate(album.updatedAt)}
                </p>
            </div>
        </button>
    );
}

export function AlbumCardSkeleton() {
    return (
        <div className="w-full">
            <div className="aspect-[4/5] rounded-xl bg-neutral-800 animate-pulse" />
            <div className="mt-3">
                <div className="h-4 w-24 bg-neutral-800 rounded animate-pulse" />
                <div className="h-3 w-16 bg-neutral-800 rounded mt-1.5 animate-pulse" />
            </div>
        </div>
    );
}

export function AlbumsGrid({ albums, isLoading = false, onAlbumClick }: AlbumsGridProps) {
    // Loading state
    if (isLoading) {
        return (
            <Section>
                <h2 className="text-2xl font-semibold text-white mb-6">Your Albums</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <AlbumCardSkeleton key={i} />
                    ))}
                </div>
            </Section>
        );
    }

    // Empty state
    if (albums.length === 0) {
        return (
            <Section>
                <h2 className="text-2xl font-semibold text-white mb-6">Your Albums</h2>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
                        <svg
                            className="w-8 h-8 text-neutral-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                        </svg>
                    </div>
                    <p className="text-neutral-400 text-sm">No albums found</p>
                    <p className="text-neutral-500 text-xs mt-1">
                        Create your first album to get started
                    </p>
                </div>
            </Section>
        );
    }

    return (
        <Section>
            <h2 className="text-2xl font-semibold text-white mb-6">Your Albums</h2>
            <div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
                role="list"
                aria-label="Your albums"
            >
                {albums.map((album) => (
                    <AlbumCard
                        key={album.id}
                        album={album}
                        onClick={() => onAlbumClick(album)}
                    />
                ))}
            </div>
        </Section>
    );
}

