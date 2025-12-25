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
    useStyleTemplates,
    useConsumeNavigationState,
} from "@/hooks";
import { useAlbumsContext } from "@/contexts/AlbumsContext";
import { consumePendingGeneration } from "@/lib/storage/generation-storage";
import type { GalleryImage, PendingGeneration, TimelineImage } from "@/types";
import { EmptyTimeline } from "../../_components/timeline/EmptyTimeline";
import { TimelineWithInput } from "../../_components/timeline/TimelineWithInput";
import { EmptyGallery } from "../../_components/gallery/EmptyGallery";
import { Gallery, type GalleryRef } from "../../_components/gallery/Gallery";
import { ImageViewer } from "../../_components/imageview/ImageViewer";
import { shouldDisableSending } from "@/components/subscription/subscriptionUtils";
import { DashboardLayout } from "../../../_components/DashboardLayout";
import { TemplateDetailModal } from "../../../../../components/ui/Modals/TemplateDetailModal";
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
    const navigationState = useConsumeNavigationState();
    const { user } = useUser();
    const { subscriptionStatus } = useSubscriptionStatus();
    const { fetchAlbums, albums, selectAlbum, addOptimisticAlbum, updateOptimisticAlbum, removeOptimisticAlbum } = useAlbumsContext();

    // Style templates management
    const {
        styles: availableStyles,
        selectedStyle,
        setSelectedStyle,
        selectStyleById,
    } = useStyleTemplates();

    // Read styleId from navigation state on mount (passed from homepage)
    useEffect(() => {
        if (navigationState?.styleId && availableStyles.length > 0) {
            selectStyleById(navigationState.styleId);
        }
    }, [navigationState, availableStyles, selectStyleById]);

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
            // Transform string URLs to TimelineImage objects
            const timelineInputImages = inputImages.map((url, idx) => ({
                id: `input-${requestId}-${idx}`,
                storageUrl: url,
                name: `Input ${idx + 1}`,
                description: '',
            }));

            const userEntry = {
                id: timelineEventId || `user-${requestId}`,
                type: 'user' as const,
                content: prompt,
                inputImages: timelineInputImages,
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

    // Stable callback for SSE gallery updates
    const handleSSEGalleryUpdate = useCallback((image: GalleryImage) => {
        gallery.appendImage(image);

        // Auto-scroll to show updated images
        setTimeout(() => {
            galleryRef.current?.scrollToBottom();
        }, 100);
    }, [gallery]);

    const handleSSEComplete = useCallback(() => {
        setPendingGeneration(null);
    }, []);

    const handleSSEError = useCallback((_error: string) => {
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
        onGenerationError: () => {
            // For new albums, remove from sidebar since generation failed
            if (isNewAlbum) {
                removeOptimisticAlbum(albumId);
                router.push('/albums');
            }
        },
    });

    const disableSendEnv = process.env.NEXT_PUBLIC_SUBSCRIPTION_DISABLE_GENERATE === "true";
    const forceDisableSend = disableSendEnv && shouldDisableSending(subscriptionStatus);

    const handleSubmit = async () => {
        if (!canSubmit) return;

        const promptValue = inputValue;
        const inputImagesUrls = getInputImageUrls();

        clearInput();

        // Add optimistic album to sidebar when generation request is sent (for new albums)
        if (isNewAlbum) {
            addOptimisticAlbum(albumId);
        }

        // Call API and get generation result
        const result = await generate({
            prompt: promptValue,
            inputImages: inputImagesUrls,
            preferences,
            albumId,
            isNewAlbum,
            styleTemplateId: selectedStyle?.id,
        });

        // If generation started successfully, create placeholders and connect SSE
        if (result) {
            const { requestId, numImages, prompt, inputImages } = result;

            // Add placeholders with correct requestId (SSE will find these)
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
                albumId,
                albumName: result.albumName,
                systemMessage: result.systemMessage,
            };
            setPendingGeneration(newPendingGeneration);
        }
    };

    // Handle retry for failed generation requests
    const handleRetry = async (prompt: string, inputImages: TimelineImage[]) => {
        // Extract URLs from TimelineImage objects
        const inputImageUrls = inputImages.map(img => img.storageUrl);

        // Call API and get generation result
        const result = await generate({
            prompt,
            inputImages: inputImageUrls,
            preferences,
            albumId,
            isNewAlbum: false, // Retry is always on existing album
            styleTemplateId: selectedStyle?.id,
        });

        // If generation started successfully, create placeholders and connect SSE
        if (result) {
            const { requestId, numImages } = result;

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
                inputImages: inputImageUrls,
                albumId,
                albumName: result.albumName,
                systemMessage: result.systemMessage,
            };
            setPendingGeneration(newPendingGeneration);
        }
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

    // Style modal state
    const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);

    // Style banner handlers
    const handleChangeStyle = useCallback((style: typeof selectedStyle) => {
        if (style) {
            setSelectedStyle(style);
        }
    }, [setSelectedStyle]);

    const handleViewStyleDetails = useCallback(() => {
        if (selectedStyle) {
            setIsStyleModalOpen(true);
        }
    }, [selectedStyle]);

    const handleRemoveStyle = useCallback(() => {
        setSelectedStyle(null);
    }, [setSelectedStyle]);

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
                        selectedStyle={selectedStyle}
                        availableStyles={availableStyles}
                        onChangeStyle={handleChangeStyle}
                        onViewStyleDetails={handleViewStyleDetails}
                        onRemoveStyle={handleRemoveStyle}
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
                        selectedStyle={selectedStyle}
                        availableStyles={availableStyles}
                        onChangeStyle={handleChangeStyle}
                        onViewStyleDetails={handleViewStyleDetails}
                        onRemoveStyle={handleRemoveStyle}
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

            {/* Style Detail Modal */}
            <TemplateDetailModal
                template={selectedStyle}
                isOpen={isStyleModalOpen}
                onClose={() => setIsStyleModalOpen(false)}
                albums={albums}
                selectedAlbum={currentAlbum || null}
                onCreateNewAlbum={() => { }}
                onApplyStyle={(template) => {
                    setSelectedStyle(template);
                    setIsStyleModalOpen(false);
                }}
            />
        </DashboardLayout>
    );
}
