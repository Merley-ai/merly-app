"use client";

import { useState, useRef, useCallback } from "react";
import { useUser } from "@/lib/auth0/client";
import { downloadImage } from "@/lib/utils";
import type { Album } from "@/types/album";
import type { GalleryImage, PendingGeneration } from "@/types";
import {
    useAlbumTimeline,
    useAlbumGallery,
    useSubscriptionStatus,
    useAlbumGeneration,
    useAlbumInput,
    useGenerationSSE,
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
    } = useAlbumTimeline({
        albumId: selectedAlbum?.id || null,
        limit: 20,
        autoFetch: true,
        onError: () => {
            // Error handled by hook
        },
    });

    // Gallery hook - auto-fetches when album is selected
    const gallery = useAlbumGallery({
        albumId: selectedAlbum?.id || null,
        limit: 20,
        autoFetch: true,
        onError: () => {
            // Error handled by hook
        },
    });

    // Pending generation state for SSE connection
    const [pendingGeneration, setPendingGeneration] = useState<PendingGeneration | null>(null);

    // Stable callback for SSE gallery updates
    const handleSSEGalleryUpdate = useCallback((image: GalleryImage) => {
        gallery.appendImage(image);
        setTimeout(() => {
            galleryRef.current?.scrollToBottom();
        }, 100);
    }, [gallery]);

    const handleSSEComplete = useCallback(() => {
        setPendingGeneration(null);
    }, []);

    const handleSSEError = useCallback(() => {
        setPendingGeneration(null);
    }, []);

    // Connect SSE for pending generation
    useGenerationSSE({
        pendingGeneration,
        onGalleryUpdate: handleSSEGalleryUpdate,
        onComplete: handleSSEComplete,
        onError: handleSSEError,
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
    });

    // Gallery & viewer state
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
        null
    );

    // Filter complete images for navigation
    const completeImages = gallery.galleryImages.filter(
        (img) => img.status === "complete"
    );

    const disableSendEnv = process.env.NEXT_PUBLIC_SUBSCRIPTION_DISABLE_GENERATE === "true";
    const forceDisableSend = disableSendEnv && shouldDisableSending(subscriptionStatus);

    const handleSubmit = async () => {
        if (!canSubmit || !selectedAlbum?.id) return;

        const promptValue = inputValue;
        const inputImagesUrls = getInputImageUrls();

        clearInput();

        // Call API and get generation result
        const result = await generate({
            prompt: promptValue,
            inputImages: inputImagesUrls,
            preferences,
            albumId: selectedAlbum.id,
        });

        // If generation started successfully, create placeholders and connect SSE
        if (result) {
            const { requestId, numImages, prompt, inputImages } = result;

            // Add placeholders with correct requestId
            for (let i = 0; i < numImages; i++) {
                gallery.appendImage({
                    id: `placeholder-${requestId}-${i}`,
                    url: '',
                    name: '',
                    description: prompt,
                    status: 'rendering',
                    addedAt: new Date(),
                    requestId,
                    index: i,
                });
            }

            // Auto-scroll to show placeholders
            setTimeout(() => {
                galleryRef.current?.scrollToBottom();
            }, 100);

            // Set pending generation to trigger SSE connection
            const newPendingGeneration: PendingGeneration = {
                requestId,
                numImages,
                prompt,
                inputImages,
                albumId: selectedAlbum.id,
                albumName: result.albumName,
                systemMessage: result.systemMessage,
            };
            setPendingGeneration(newPendingGeneration);
        }
    };


    const handleNavigateImage = (direction: "prev" | "next") => {
        if (selectedImageIndex === null) return;

        let newIndex = selectedImageIndex;

        if (direction === "prev") {
            // Search backwards for the previous complete image
            for (let i = selectedImageIndex - 1; i >= 0; i--) {
                if (gallery.galleryImages[i].status === "complete") {
                    newIndex = i;
                    break;
                }
            }
        } else if (direction === "next") {
            // Search forwards for the next complete image
            for (let i = selectedImageIndex + 1; i < gallery.galleryImages.length; i++) {
                if (gallery.galleryImages[i].status === "complete") {
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
        const currentImage = selectedImageIndex !== null ? gallery.galleryImages[selectedImageIndex] : null;
        await downloadImage(url, currentImage?.description);
    };

    const handleDeleteImage = () => {
        setSelectedImageIndex(null);
    };

    // Check if navigation is possible by looking for complete images before/after current index
    const canNavigatePrev = selectedImageIndex !== null && selectedImageIndex > 0 &&
        gallery.galleryImages.slice(0, selectedImageIndex).some(img => img.status === "complete");

    const canNavigateNext = selectedImageIndex !== null && selectedImageIndex < gallery.galleryImages.length - 1 &&
        gallery.galleryImages.slice(selectedImageIndex + 1).some(img => img.status === "complete");

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
                            forceDisableSend={forceDisableSend || isGenerating}
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
                            forceDisableSend={forceDisableSend || isGenerating}
                            onPreferencesChange={setPreferences}
                        />
                    )}

                    {/* Show EmptyGallery only if confirmed empty after loading */}
                    {!gallery.isLoading && gallery.galleryImages.length === 0 ? (
                        <EmptyGallery onFileChange={handleFileChange} />
                    ) : (
                        <Gallery
                            ref={galleryRef}
                            images={gallery.galleryImages}
                            onImageClick={setSelectedImageIndex}
                            onLoadMore={gallery.loadMore}
                            isLoadingMore={gallery.isLoadingMore}
                            hasMore={gallery.hasMore}
                        />
                    )}

                    {selectedImageIndex !== null && gallery.galleryImages[selectedImageIndex] && (
                        <ImageViewer
                            image={gallery.galleryImages[selectedImageIndex]}
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
