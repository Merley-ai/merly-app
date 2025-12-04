"use client";

import { useState, useCallback, useRef } from "react";
import { useUser } from "@/lib/auth0/client";
import { downloadImage, validateImageDimensions } from "@/lib/utils";
import { toast } from "@/lib/notifications";
import type { TimelineEntry, GalleryImage, UploadedFile } from "@/types";
import type { Album } from "@/types/album";
import type { GeneratedImage } from "@/types/image-generation";
import {
    type PreferencesState,
    DEFAULT_PREFERENCES,
    resolvePreferences
} from "@/components/ui/PreferencesPopover";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useSupabaseUpload } from "@/hooks/useSupabaseUpload";
import { useAlbumTimeline } from "@/hooks/useAlbumTimeline";
import { useAlbumGallery } from "@/hooks/useAlbumGallery";
import { useSubscriptionStatus } from "@/hooks";
import { EmptyTimeline } from "./timeline/EmptyTimeline";
import { TimelineWithInput } from "./timeline/TimelineWithInput";
import { EmptyGallery } from "./gallery/EmptyGallery";
import { Gallery } from "./gallery/Gallery";
import { ImageViewer } from "./imageview/ImageViewer";
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

    // Track current generation request ID for updating placeholders
    const currentGenerationRef = useRef<{ aiEntryId: string; numImages: number } | null>(null);

    // Image generation hook with WebSocket support
    const { create } = useImageGeneration({
        onComplete: (images) => {
            handleGenerationComplete(images);
        },
        onError: (error) => {
            handleGenerationError(error);
        },
    });

    // Supabase upload hook
    const { uploadFile } = useSupabaseUpload();

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
        updateImage: updateGalleryImage,
    } = useAlbumGallery({
        albumId: selectedAlbum?.id || null,
        limit: 20,
        autoFetch: true,
        onError: () => {
            // Error handled by hook
        },
    });

    // Input state
    const [inputValue, setInputValue] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [preferences, setPreferences] = useState<PreferencesState>(DEFAULT_PREFERENCES);

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

    const handleRemoveFile = (fileId: string) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!user) return;

        // Validate each image's dimensions before processing
        const validFiles: File[] = [];
        for (const file of files) {
            const validation = await validateImageDimensions(file);
            if (!validation.isValid && validation.message) {
                toast.error(validation.message, {
                    context: 'imageUpload',
                    attributes: {
                        fileName: file.name,
                        fileSize: file.size,
                        dimensions: validation.dimensions,
                        errorType: validation.error,
                    },
                });
            } else {
                validFiles.push(file);
            }
        }

        // Only proceed with valid files
        if (validFiles.length === 0) return;

        // Create UploadedFile objects with pending state
        const newUploadedFiles: UploadedFile[] = validFiles.map(file => ({
            file,
            id: `${file.name}-${file.size}-${file.lastModified}`,
            status: 'pending' as const,
            progress: 0,
            previewUrl: URL.createObjectURL(file),
        }));

        // Add to state immediately
        setUploadedFiles(prev => [...prev, ...newUploadedFiles]);

        // Upload each file to Supabase
        for (const uploadedFile of newUploadedFiles) {
            try {
                // Update status to uploading
                setUploadedFiles(prev =>
                    prev.map(uf =>
                        uf.id === uploadedFile.id
                            ? { ...uf, status: 'uploading' as const }
                            : uf
                    )
                );

                // Upload to Supabase
                const result = await uploadFile(uploadedFile.file, user.sub);

                // Update with signed URL
                setUploadedFiles(prev =>
                    prev.map(uf =>
                        uf.id === uploadedFile.id
                            ? {
                                ...uf,
                                status: 'completed' as const,
                                progress: 100,
                                signedUrl: result.url,
                                storagePath: result.path,
                            }
                            : uf
                    )
                );
            } catch (error) {
                // Update status to error
                setUploadedFiles(prev =>
                    prev.map(uf =>
                        uf.id === uploadedFile.id
                            ? {
                                ...uf,
                                status: 'error' as const,
                                error: error instanceof Error ? error.message : 'Upload failed',
                            }
                            : uf
                    )
                );
            }
        }
    };

    const handleSubmit = async () => {
        if (!inputValue.trim() && uploadedFiles.length === 0) return;

        // Only allow submission if all files are uploaded successfully
        const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
        if (uploadedFiles.length > 0 && completedFiles.length !== uploadedFiles.length) {
            return;
        }

        const prompt = inputValue;
        // Use signed URLs from Supabase instead of blob URLs
        const inputImageUrls = completedFiles
            .map(f => f.signedUrl)
            .filter((url): url is string => !!url);

        // Resolve preferences to actual values
        const resolvedPrefs = resolvePreferences(preferences);

        const userEntry: TimelineEntry = {
            id: Date.now().toString(),
            type: "user",
            content: prompt,
            inputImages: inputImageUrls,
            prompt,
            status: "complete",
            timestamp: new Date(),
        };

        appendTimelineEntry(userEntry);

        const numImages = resolvedPrefs.count;
        const aiEntryId = (Date.now() + 1).toString();

        // Add AI entry with thinking state (NO images in timeline per new design)
        const aiEntry: TimelineEntry = {
            id: aiEntryId,
            type: "ai",
            content: "",
            inputImages: [],
            prompt,
            status: "thinking",
            thinkingText: "Creating your masterpiece...",
            timestamp: new Date(),
            isGenerating: true,
            numImages,
        };

        appendTimelineEntry(aiEntry);

        // Store generation info in ref for later placeholder updates
        currentGenerationRef.current = { aiEntryId, numImages };

        // Add placeholder images to gallery with 'rendering' status
        const placeholders: GalleryImage[] = Array.from({ length: numImages }, (_, i) => ({
            id: `placeholder-${aiEntryId}-${i}`,
            url: "",
            description: prompt,
            status: "rendering" as const,
            addedAt: new Date(),
            requestId: aiEntryId,
            index: i,
        }));

        // Append placeholders to the end of the gallery (newest at bottom)
        placeholders.forEach(placeholder => appendGalleryImage(placeholder));

        // Clear input
        setInputValue("");
        setUploadedFiles([]);

        if (!selectedAlbum) {
            updateTimelineEntry(aiEntryId, {
                content: "Error: No album selected. Please select or create an album first.",
                status: "complete",
                isGenerating: false,
                thinkingText: undefined,
            });
            return;
        }

        if (!selectedAlbum.id) {
            updateTimelineEntry(aiEntryId, {
                content: "Error: Invalid album. Please try again.",
                status: "complete",
                isGenerating: false,
                thinkingText: undefined,
            });
            return;
        }

        try {
            await create({
                prompt,
                input_images: inputImageUrls.length > 0 ? inputImageUrls : undefined,
                num_images: numImages,
                aspect_ratio: resolvedPrefs.aspectRatio,
                album_id: selectedAlbum.id,
            });

        } catch {
            // Error handled by onError callback
        }
    };

    // Handle generation completion
    const handleGenerationComplete = useCallback((images: GeneratedImage[]) => {
        const generationInfo = currentGenerationRef.current;

        if (generationInfo) {
            const { aiEntryId } = generationInfo;

            removeTimelineEntry(aiEntryId);

            // Update placeholder images in gallery using the stored ID
            const placeholderPrefix = `placeholder-${aiEntryId}-`;

            images.forEach((img, index) => {
                const placeholderId = `${placeholderPrefix}${index}`;
                updateGalleryImage(placeholderId, {
                    url: img.url,
                    description: "Generated image",
                    status: "complete",
                });
            });

            // Clear the ref after successful update
            currentGenerationRef.current = null;
        }
    }, [removeTimelineEntry, updateGalleryImage]);

    // Handle generation error
    const handleGenerationError = (error: string) => {
        const generationInfo = currentGenerationRef.current;
        if (generationInfo) {
            const { aiEntryId } = generationInfo;

            // Try to update the timeline entry if it still exists
            const generatingEntry = timelineEntries.find(e => e.id === aiEntryId);
            if (generatingEntry) {
                updateTimelineEntry(aiEntryId, {
                    content: `Sorry, something went wrong: ${error}`,
                    status: "complete",
                    isGenerating: false,
                    thinkingText: undefined,
                });
            }

            // Clear the ref
            currentGenerationRef.current = null;
        }
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
