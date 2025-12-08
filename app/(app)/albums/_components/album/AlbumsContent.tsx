"use client";

import { useState, useRef } from "react";
import { useUser } from "@/lib/auth0/client";
import { downloadImage } from "@/lib/utils";
import type { GalleryImage } from "@/types";
import type { Album } from "@/types/album";
import {
    useAlbumTimeline,
    useAlbumGallery,
    useSubscriptionStatus,
    useAlbumGeneration,
    useAlbumInput,
} from "@/hooks";
import { EmptyTimeline } from "../timeline/EmptyTimeline";
import { TimelineWithInput } from "../timeline/TimelineWithInput";
import { EmptyGallery } from "../gallery/EmptyGallery";
import { Gallery, type GalleryRef } from "../gallery/Gallery";
import { ImageViewer } from "../imageview/ImageViewer";
import { shouldDisableSending } from "@/components/subscription/subscriptionUtils";

interface AlbumsContentProps {
    selectedAlbum: Album | null;
}

/**
 * Albums Content Component
 * 
 * Displays timeline, gallery, and image generation interface for the selected album.
 * Does not manage album selection - that's handled by DashboardLayout.
 */
export function AlbumsContent({ selectedAlbum }: AlbumsContentProps) {
    const { user } = useUser();
    const { subscriptionStatus } = useSubscriptionStatus();

    // Gallery ref for scrolling to bottom when placeholders are added
    const galleryRef = useRef<GalleryRef>(null);

    // Timeline hook - auto-fetches when album is selected
    const {
        timelineEntries,
        isLoading: timelineLoading,
        isLoadingMore: timelineLoadingMore,
        hasMore: timelineHasMore,
        loadMore: loadMoreTimeline,
        appendEntry: appendTimelineEntry,
        updateEntry: updateTimelineEntry,
        removeEntry: removeTimelineEntry,
    } = useAlbumTimeline({
        albumId: selectedAlbum?.id || null,
        limit: 20,
        autoFetch: true,
        onError: () => {
            // Error handled by hook
        },
    });

    // Gallery hook - auto-fetches when album is selected
    const {
        galleryImages,
        isLoading: galleryLoading,
        isLoadingMore: galleryLoadingMore,
        hasMore: galleryHasMore,
        loadMore: loadMoreGallery,
        appendImage: appendGalleryImage,
    } = useAlbumGallery({
        albumId: selectedAlbum?.id || null,
        limit: 20,
        autoFetch: true,
        onError: () => {
            // Error handled by hook
        },
    });

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
        onTimelineUpdate: appendTimelineEntry,
        onGalleryUpdate: (image) => {
            appendGalleryImage(image);
            // Auto-scroll gallery to bottom to show new placeholders
            setTimeout(() => {
                galleryRef.current?.scrollToBottom();
            }, 100);
        },
    });

    // Gallery & viewer state
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
        null
    );

    // Filter complete images for navigation
    const completeImages = galleryImages.filter(
        (img) => img.status === "complete"
    );

    const disableSendEnv = process.env.NEXT_PUBLIC_SUBSCRIPTION_DISABLE_GENERATE === "true";
    const forceDisableSend = disableSendEnv && shouldDisableSending(subscriptionStatus);

    const handleSubmit = async () => {
        if (!canSubmit || !selectedAlbum?.id) return;

        // Use unified generation flow
        await generate({
            prompt: inputValue,
            inputImages: getInputImageUrls(),
            preferences,
            albumId: selectedAlbum.id,
        });

        // Clear input after successful submission
        clearInput();
    };


    const handleNavigateImage = (direction: "prev" | "next") => {
        if (selectedImageIndex === null) return;

        let newIndex = selectedImageIndex;

        if (direction === "prev") {
            // Search backwards for the previous complete image
            for (let i = selectedImageIndex - 1; i >= 0; i--) {
                if (galleryImages[i].status === "complete") {
                    newIndex = i;
                    break;
                }
            }
        } else if (direction === "next") {
            // Search forwards for the next complete image
            for (let i = selectedImageIndex + 1; i < galleryImages.length; i++) {
                if (galleryImages[i].status === "complete") {
                    newIndex = i;
                    break;
                }
            }
        }

        // Only update if we found a different image
        if (newIndex !== selectedImageIndex) {
            setSelectedImageIndex(newIndex);
        }
    };

    const handleDownloadImage = async (url: string) => {
        // Get the current image to use its description as filename
        const currentImage = selectedImageIndex !== null ? galleryImages[selectedImageIndex] : null;
        await downloadImage(url, currentImage?.description);
    };

    const handleDeleteImage = () => {
        setSelectedImageIndex(null);
    };

    // Check if navigation is possible by looking for complete images before/after current index
    const canNavigatePrev = selectedImageIndex !== null && selectedImageIndex > 0 &&
        galleryImages.slice(0, selectedImageIndex).some(img => img.status === "complete");

    const canNavigateNext = selectedImageIndex !== null && selectedImageIndex < galleryImages.length - 1 &&
        galleryImages.slice(selectedImageIndex + 1).some(img => img.status === "complete");

    // Determine which view to show
    const showNoAlbumSelected = !selectedAlbum;
    const isTimelineEmpty = !timelineLoading && timelineEntries.length === 0;

    return (
        <>
            {/* No Album Selected */}
            {showNoAlbumSelected && (
                <div className="flex-1 bg-black flex items-center justify-center">
                    <div className="text-white/60 text-center">
                        <p className="text-lg">No album selected</p>
                        <p className="text-sm mt-2">Select an album or create a new one to get started</p>
                    </div>
                </div>
            )}

            {/* Album Selected - Always show timeline and gallery structure */}
            {selectedAlbum && (
                <>
                    {/* Show EmptyTimeline only if confirmed empty after loading */}
                    {isTimelineEmpty ? (
                        <EmptyTimeline
                            albumName={selectedAlbum.name}
                            inputValue={inputValue}
                            onInputChange={setInputValue}
                            uploadedFiles={uploadedFiles}
                            onFileChange={handleFileChange}
                            onRemoveFile={handleRemoveFile}
                            onSubmit={handleSubmit}
                            subscriptionStatus={subscriptionStatus}
                            forceDisableSend={forceDisableSend}
                            onPreferencesChange={setPreferences}
                        />
                    ) : (
                        <TimelineWithInput
                            albumName={selectedAlbum.name}
                            entries={timelineEntries}
                            inputValue={inputValue}
                            onInputChange={setInputValue}
                            uploadedFiles={uploadedFiles}
                            onFileChange={handleFileChange}
                            onRemoveFile={handleRemoveFile}
                            onSubmit={handleSubmit}
                            onLoadMore={loadMoreTimeline}
                            isLoadingMore={timelineLoadingMore}
                            hasMore={timelineHasMore}
                            subscriptionStatus={subscriptionStatus}
                            forceDisableSend={forceDisableSend}
                            onPreferencesChange={setPreferences}
                        />
                    )}

                    {/* Show EmptyGallery only if confirmed empty after loading */}
                    {!galleryLoading && galleryImages.length === 0 ? (
                        <EmptyGallery onFileChange={handleFileChange} />
                    ) : (
                        <Gallery
                            ref={galleryRef}
                            images={galleryImages}
                            onImageClick={setSelectedImageIndex}
                            onLoadMore={loadMoreGallery}
                            isLoadingMore={galleryLoadingMore}
                            hasMore={galleryHasMore}
                        />
                    )}

                    {selectedImageIndex !== null && galleryImages[selectedImageIndex] && (
                        <ImageViewer
                            image={galleryImages[selectedImageIndex]}
                            imageIndex={selectedImageIndex}
                            totalImages={completeImages.length}
                            albumName={selectedAlbum.name}
                            onClose={() => setSelectedImageIndex(null)}
                            onNavigate={handleNavigateImage}
                            onDownload={handleDownloadImage}
                            onDelete={handleDeleteImage}
                            canNavigatePrev={canNavigatePrev}
                            canNavigateNext={canNavigateNext}
                        />
                    )}
                </>
            )}
        </>
    );
}
