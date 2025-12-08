"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth0/client";
import { useSubscriptionStatus, useAlbumGeneration, useAlbumInput } from "@/hooks";
import { useAlbumsContext } from "@/contexts/AlbumsContext";
import { EmptyTimeline } from "../_components/timeline/EmptyTimeline";
import { TimelineWithInput } from "../_components/timeline/TimelineWithInput";
import { EmptyGallery } from "../_components/gallery/EmptyGallery";
import { Gallery, type GalleryRef } from "../_components/gallery/Gallery";
import { shouldDisableSending } from "@/components/subscription/subscriptionUtils";
import { DashboardLayout } from "../../_components/DashboardLayout";
import type { TimelineEntry, GalleryImage } from "@/types";

/**
 * New Album Page
 * 
 * Route: /albums/new
 * 
 * Displays the new album creation interface.
 * User enters their first prompt, which triggers:
 * 1. Album creation with AI-generated name
 * 2. Image generation
 * 3. Redirect to the new album
 */
export default function NewAlbumPage() {
    const router = useRouter();
    const { user } = useUser();
    const { subscriptionStatus } = useSubscriptionStatus();
    const { fetchAlbums } = useAlbumsContext();

    // State management for timeline and gallery (enables real-time updates)
    const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
    const [albumName, setAlbumName] = useState("New Album");
    const galleryRef = useRef<GalleryRef>(null);

    // Unified input management
    const {
        inputValue,
        setInputValue,
        uploadedFiles,
        handleFileChange,
        handleRemoveFile,
        preferences,
        setPreferences,
        clearInput,
        canSubmit,
        getInputImageUrls,
    } = useAlbumInput(user?.sub);

    // Unified generation flow
    const { generate, isGenerating } = useAlbumGeneration({
        onTimelineUpdate: (entry) => {
            setTimelineEntries(prev => [...prev, entry]);
        },
        onGalleryUpdate: (image) => {
            setGalleryImages(prev => {
                // Update existing placeholder or add new image
                const existingIndex = prev.findIndex(img => img.id === image.id);
                if (existingIndex >= 0) {
                    const updated = [...prev];
                    updated[existingIndex] = image;
                    return updated;
                }
                return [...prev, image];
            });

            // Auto-scroll gallery to show new placeholders
            setTimeout(() => {
                galleryRef.current?.scrollToBottom();
            }, 100);
        },
        onAlbumCreated: async (albumId, albumName) => {
            console.log('[NewAlbumPage] Album created:', { albumId, albumName });

            // Update local state
            setAlbumName(albumName);

            // Refresh albums list to show the new album in sidebar
            console.log('[NewAlbumPage] Fetching albums to update sidebar...');
            await fetchAlbums();
            console.log('[NewAlbumPage] Albums fetched successfully');

            // Navigate immediately to albums page with new album auto-selected
            // SSE will continue on the albums page
            console.log('[NewAlbumPage] Navigating to albums page with album:', albumId);
            router.push(`/albums?selected=${albumId}`);
        },
    });

    const disableSendEnv = process.env.NEXT_PUBLIC_SUBSCRIPTION_DISABLE_GENERATE === "true";
    const forceDisableSend = disableSendEnv && shouldDisableSending(subscriptionStatus);

    const handleSubmit = async () => {
        if (!canSubmit) return;

        // Use unified generation flow
        await generate({
            prompt: inputValue,
            inputImages: getInputImageUrls(),
            preferences,
            albumId: undefined, // Explicitly undefined = create new album with new_album: true
        });

        // Clear input after successful submission
        clearInput();
    };

    // Determine which view to show based on content
    const hasContent = timelineEntries.length > 0 || galleryImages.length > 0;

    return (
        <DashboardLayout currentRoute="albums">
            {!hasContent ? (
                <>
                    {/* Empty state - shown initially */}
                    <EmptyTimeline
                        albumName={albumName}
                        inputValue={inputValue}
                        onInputChange={setInputValue}
                        uploadedFiles={uploadedFiles}
                        onFileChange={handleFileChange}
                        onRemoveFile={handleRemoveFile}
                        onSubmit={handleSubmit}
                        subscriptionStatus={subscriptionStatus}
                        forceDisableSend={forceDisableSend || isGenerating}
                        onPreferencesChange={setPreferences}
                    />
                    <EmptyGallery onFileChange={handleFileChange} />
                </>
            ) : (
                <>
                    {/* Populated state - shown after generation starts */}
                    <TimelineWithInput
                        albumName={albumName}
                        entries={timelineEntries}
                        inputValue={inputValue}
                        onInputChange={setInputValue}
                        uploadedFiles={uploadedFiles}
                        onFileChange={handleFileChange}
                        onRemoveFile={handleRemoveFile}
                        onSubmit={handleSubmit}
                        onLoadMore={() => { }} // No pagination for new album
                        isLoadingMore={false}
                        hasMore={false}
                        subscriptionStatus={subscriptionStatus}
                        forceDisableSend={forceDisableSend || isGenerating}
                        onPreferencesChange={setPreferences}
                    />
                    <Gallery
                        ref={galleryRef}
                        images={galleryImages}
                        onImageClick={() => { }} // Image viewer can be added later
                        onLoadMore={() => { }} // No pagination for new album
                        isLoadingMore={false}
                        hasMore={false}
                    />
                </>
            )}
        </DashboardLayout>
    );
}
