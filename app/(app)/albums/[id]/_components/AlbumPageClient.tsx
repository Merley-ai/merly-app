"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth0/client";
import {
    useSubscriptionStatus,
    useAlbumGeneration,
    useAlbumInput,
    useAlbumTimeline,
    useAlbumGallery,
    useGenerationSSE,
} from "@/hooks";
import { useAlbumsContext } from "@/contexts/AlbumsContext";
import { consumePendingGeneration } from "@/lib/storage/generation-storage";
import type { GalleryImage } from "@/types";
import { EmptyTimeline } from "../../_components/timeline/EmptyTimeline";
import { TimelineWithInput } from "../../_components/timeline/TimelineWithInput";
import { EmptyGallery } from "../../_components/gallery/EmptyGallery";
import { Gallery, type GalleryRef } from "../../_components/gallery/Gallery";
import { ImageViewer } from "../../_components/imageview/ImageViewer";
import { shouldDisableSending } from "@/components/subscription/subscriptionUtils";
import { DashboardLayout } from "../../../_components/DashboardLayout";
import { downloadImage } from "@/lib/utils";

interface AlbumPageClientProps {
    albumId: string;
}

/**
 * Album Page Client Component
 * 
 * Handles both new album creation and existing album viewing using UUID-based routing.
 * 
 * Detection:
 * - NEW: Album UUID not in albums list → New album being created
 * - EXISTING: Album UUID found in albums list → Existing album
 * 
 * New Album Flow (UUID-based):
 * 1. User clicks "Create New Album" → UUID generated client-side
 * 2. Navigate to /albums/{uuid}
 * 3. Optimistic album added to sidebar as "New Album"
 * 4. User submits prompt → API call with pre-generated UUID
 * 5. Backend creates album with UUID, returns album_name and request_id
 * 6. Sidebar updates from "New Album" to actual name
 * 7. SSE connects after API response (album exists in backend)
 * 8. Images stream in real-time
 * 
 * Existing Album Flow:
 * 1. Direct navigation to /albums/{uuid}
 * 2. Album found in context, fetches timeline + gallery from API
 * 3. User can generate new images
 * 4. SSE updates in real-time
 */
export function AlbumPageClient({ albumId }: AlbumPageClientProps) {
    const router = useRouter();
    const { user } = useUser();
    const { subscriptionStatus } = useSubscriptionStatus();
    const { fetchAlbums, albums, selectAlbum, addOptimisticAlbum, updateOptimisticAlbum, removeOptimisticAlbum } = useAlbumsContext();

    // Get album from context
    const currentAlbum = albums.find(a => a.id === albumId);

    // Determine if this is a new album
    // New album = not in list OR is an optimistic album (name is "New Album")
    // Capture on mount and preserve - don't recalculate after optimistic album is added
    const [isNewAlbum] = useState(() => {
        const isNew = !currentAlbum || currentAlbum.name === 'New Album';
        console.log('[AlbumPageClient] isNewAlbum determination:', {
            albumId,
            currentAlbum: currentAlbum ? { id: currentAlbum.id, name: currentAlbum.name } : null,
            isNew,
        });
        return isNew;
    });

    // Use albumId directly for both new and existing albums
    const effectiveAlbumId = albumId;

    // Select album in sidebar when navigating to it (for existing albums)
    useEffect(() => {
        if (currentAlbum && !isNewAlbum) {
            selectAlbum(currentAlbum);
        }
    }, [currentAlbum?.id, isNewAlbum, selectAlbum]); // Only run when album ID changes

    const timeline = useAlbumTimeline({
        albumId: effectiveAlbumId,
        limit: 20,
        autoFetch: false,
    });

    const gallery = useAlbumGallery({
        albumId: effectiveAlbumId,
        limit: 20,
        autoFetch: false,
    });

    const galleryRef = useRef<GalleryRef>(null);

    // Track current request ID for placeholder cleanup on error
    const currentRequestIdRef = useRef<string | null>(null);

    // Check for pending generation on mount (from redirect)
    const [pendingGeneration, setPendingGeneration] = useState(() => {
        const pending = consumePendingGeneration();
        if (pending && pending.albumId === albumId) {
            return pending;
        }
        return null;
    });

    // Derive album name from context, pending generation, or default
    const albumName = currentAlbum?.name || pendingGeneration?.albumName || "New Album";

    // Add placeholders and timeline entries for pending generation (on mount, before SSE)
    useEffect(() => {
        if (pendingGeneration) {
            const { requestId, numImages, prompt, systemMessage, timelineEventId, inputImages = [] } = pendingGeneration;

            // Clean slate: Reset both timeline and gallery for new album
            timeline.reset();
            gallery.reset();

            // Add user prompt to timeline immediately (no API fetch needed)
            const userEntry = {
                id: timelineEventId || `user-${requestId}`,
                type: 'user' as const,
                content: prompt,
                inputImages: inputImages, // Show input image thumbnails if present
                prompt,
                status: 'complete' as const,
                timestamp: new Date(),
            };
            timeline.appendEntry(userEntry);

            // Add system message to timeline if available
            if (systemMessage) {
                const systemEntry = {
                    id: `${timelineEventId || requestId}-system`,
                    type: 'system' as const,
                    content: systemMessage,
                    inputImages: [],
                    prompt: '',
                    status: 'complete' as const,
                    timestamp: new Date(),
                    systemMessage,
                };
                timeline.appendEntry(systemEntry);
            }

            // Add placeholder images with backend requestId
            for (let i = 0; i < numImages; i++) {
                gallery.appendImage({
                    id: `placeholder-${requestId}-${i}`,
                    url: '',
                    name: '',
                    description: prompt,
                    status: 'rendering',
                    addedAt: new Date(),
                    requestId,
                });
            }
        }
    }, []); // Run once on mount

    // Stable callbacks for SSE (prevent reconnections)
    const handleSSEGalleryUpdate = useCallback((image: GalleryImage) => {
        gallery.appendImage(image);

        // Auto-scroll to show updated images
        setTimeout(() => {
            galleryRef.current?.scrollToBottom();
        }, 100);
    }, [gallery]);

    const handleSSEComplete = useCallback(() => {
        console.log('[AlbumPageClient] Generation complete');
        setPendingGeneration(null);
    }, []);

    const handleSSEError = useCallback((error: string) => {
        console.error('[AlbumPageClient] Generation error:', error);
        setPendingGeneration(null);
    }, []);

    // Connect SSE for pending generation
    useGenerationSSE({
        pendingGeneration,
        onGalleryUpdate: handleSSEGalleryUpdate,
        onComplete: handleSSEComplete,
        onError: handleSSEError,
    });

    // Fetch initial data when loading existing album directly (not from new album creation)
    useEffect(() => {
        if (effectiveAlbumId && !pendingGeneration) {
            gallery.fetchGallery();
            timeline.fetchTimeline();
        }
    }, []); // Run once on mount

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
            timeline.appendEntry(entry);
        },
        onGalleryUpdate: (image) => {
            gallery.appendImage(image);

            // Auto-scroll gallery to show new placeholders
            setTimeout(() => {
                galleryRef.current?.scrollToBottom();
            }, 100);
        },
        onAlbumCreated: async (newAlbumId, createdAlbumName) => {
            // Album created in backend - update optimistic album with real name
            updateOptimisticAlbum(newAlbumId, createdAlbumName);

            // Refresh albums list to get full album data
            const updatedAlbums = await fetchAlbums();
            const newAlbum = updatedAlbums.find(a => a.id === newAlbumId);
            if (newAlbum) {
                selectAlbum(newAlbum);
            }
        },
        onGenerationError: (requestId) => {
            // Remove placeholder images when generation fails
            // Use requestId from hook (existing albums) or currentRequestIdRef (new albums)
            const idToRemove = requestId || currentRequestIdRef.current;
            if (idToRemove) {
                gallery.removeImagesByRequestId(idToRemove);
                currentRequestIdRef.current = null; // Clear after use
            }

            // For new albums, remove from sidebar since generation failed
            if (isNewAlbum) {
                removeOptimisticAlbum(albumId);
                // Navigate back to home or albums list
                router.push('/albums');
            }
        },
        onRequestIdReceived: (requestId) => {
            // For new albums, update placeholder IDs and requestIds to match SSE expectations
            // SSE will look for placeholders with ID: `placeholder-${requestId}-${index}`
            if (isNewAlbum && currentRequestIdRef.current) {
                const tempRequestId = currentRequestIdRef.current;

                // Update all placeholders: change both ID and requestId
                gallery.galleryImages.forEach((image, index) => {
                    if (image.requestId === tempRequestId && image.id.startsWith('placeholder-')) {
                        // Extract index from old ID: placeholder-temp-123-0 -> 0
                        const parts = image.id.split('-');
                        const imageIndex = parseInt(parts[parts.length - 1], 10);

                        // Create new ID that SSE will recognize
                        const newId = `placeholder-${requestId}-${imageIndex}`;

                        // Remove old placeholder and add updated one
                        gallery.updateImage(image.id, {
                            id: newId,
                            requestId,
                        });
                    }
                });

                currentRequestIdRef.current = requestId; // Update ref to real requestId
            }
        },
    });

    const disableSendEnv = process.env.NEXT_PUBLIC_SUBSCRIPTION_DISABLE_GENERATE === "true";
    const forceDisableSend = disableSendEnv && shouldDisableSending(subscriptionStatus);

    const handleSubmit = async () => {
        if (!canSubmit) return;

        // Add optimistic album to sidebar when generation request is sent
        if (isNewAlbum) {
            addOptimisticAlbum(albumId);

            const tempRequestId = `temp-${Date.now()}`;
            currentRequestIdRef.current = tempRequestId; // Track for error cleanup
            const numImages = Number(preferences.count) || 2;

            // Add temporary placeholders
            for (let i = 0; i < numImages; i++) {
                gallery.appendImage({
                    id: `placeholder-${tempRequestId}-${i}`,
                    url: '',
                    name: '',
                    description: inputValue,
                    status: 'rendering',
                    addedAt: new Date(),
                    requestId: tempRequestId,
                });
            }
        }

        // Use unified generation flow - always pass albumId (pre-generated UUID for new albums)
        await generate({
            prompt: inputValue,
            inputImages: getInputImageUrls(),
            preferences,
            albumId,
            isNewAlbum, // Explicitly indicate if this is a new album
        });

        // Clear input after successful submission
        clearInput();
    };

    // Handle retry for failed generation requests
    const handleRetry = async (prompt: string, inputImages: string[]) => {

        // Retry with the stored prompt and input images
        await generate({
            prompt,
            inputImages,
            preferences,
            albumId,
            isNewAlbum, // Preserve new album flag on retry
        });
    };

    // Gallery & viewer state
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

    // Filter complete images for navigation
    const completeImages = gallery.galleryImages.filter(
        (img) => img.status === "complete"
    );

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

    // Determine which view to show based on content
    const hasContent = timeline.timelineEntries.length > 0 || gallery.galleryImages.length > 0;

    return (
        <DashboardLayout currentRoute="albums" isNewAlbumView={isNewAlbum}>
            {!hasContent ? (
                <>
                    {/* Empty state - only for truly empty albums */}
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
                        isLoading={!isNewAlbum && timeline.isLoading}
                    />
                    <EmptyGallery onFileChange={handleFileChange} />
                </>
            ) : (
                <>
                    {/* Populated state - shown after generation starts */}
                    <TimelineWithInput
                        albumName={albumName}
                        entries={timeline.timelineEntries}
                        inputValue={inputValue}
                        onInputChange={setInputValue}
                        uploadedFiles={uploadedFiles}
                        onFileChange={handleFileChange}
                        onRemoveFile={handleRemoveFile}
                        onSubmit={handleSubmit}
                        onRetry={handleRetry}
                        onLoadMore={timeline.loadMore}
                        isLoadingMore={timeline.isLoadingMore}
                        hasMore={timeline.hasMore}
                        subscriptionStatus={subscriptionStatus}
                        forceDisableSend={forceDisableSend || isGenerating}
                        onPreferencesChange={setPreferences}
                    />
                    <Gallery
                        ref={galleryRef}
                        images={gallery.galleryImages}
                        onImageClick={setSelectedImageIndex}
                        onLoadMore={gallery.loadMore}
                        isLoadingMore={gallery.isLoadingMore}
                        hasMore={gallery.hasMore}
                    />

                    {selectedImageIndex !== null && gallery.galleryImages[selectedImageIndex] && (
                        <ImageViewer
                            image={gallery.galleryImages[selectedImageIndex]}
                            imageIndex={selectedImageIndex}
                            totalImages={completeImages.length}
                            albumName={albumName}
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
        </DashboardLayout>
    );
}
