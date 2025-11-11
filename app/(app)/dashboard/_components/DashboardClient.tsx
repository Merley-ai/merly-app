"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth0/client";
import type { TimelineEntry, GalleryImage, UploadedFile } from "@/types";
import type { Album } from "@/types/album";
import type { GeneratedImage } from "@/types/image-generation";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useAlbums } from "@/hooks/useAlbums";
import { useSupabaseUpload } from "@/hooks/useSupabaseUpload";
import { useAlbumTimeline } from "@/hooks/useAlbumTimeline";
import { useAlbumGallery } from "@/hooks/useAlbumGallery";
import { Sidebar } from "./Sidebar";
import { HomePage } from "./HomePage";
import { EmptyTimeline } from "./EmptyTimeline";
import { TimelineWithInput } from "./TimelineWithInput";
import { EmptyGallery } from "./EmptyGallery";
import { Gallery } from "./Gallery";
import { ImageViewer } from "./ImageViewer";

export function DashboardClient() {
    const router = useRouter();
    const { user } = useUser();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isHomeView, setIsHomeView] = useState(true);

    // Track current generation request ID for updating placeholders
    const currentGenerationRef = useRef<{ aiEntryId: string; numImages: number } | null>(null);

    // Albums hook - automatically fetches albums on mount
    const {
        albums,
        selectedAlbum,
        isLoading: albumsLoading,
        error: albumsError,
        createAlbum,
        selectAlbum,
    } = useAlbums({
        onError: (error) => {
            console.error("[Dashboard] Album error:", error);
        },
    });

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
        onError: (error) => {
            console.error('[Dashboard] Timeline error:', error);
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
        onError: (error) => {
            console.error('[Dashboard] Gallery error:', error);
        },
    });

    // Input state
    const [inputValue, setInputValue] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

    // Gallery & viewer state
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
        null
    );

    // Filter complete images for navigation
    const completeImages = galleryImages.filter(
        (img) => img.status === "complete"
    );

    // Handle create album - uses placeholder values automatically
    const handleCreateAlbum = async () => {
        try {
            await createAlbum();
            setIsHomeView(false);
            // Timeline and gallery will auto-load via hooks
        } catch (error) {
            console.error("[Dashboard] Failed to create album:", error);
        }
    };

    // Handle select album
    const handleSelectAlbum = (album: Album) => {
        selectAlbum(album);
        setIsHomeView(false);
        // Timeline and gallery will auto-load via hooks when selectedAlbum changes
    };

    // Handle go to home
    const handleGoToHome = () => {
        setIsHomeView(true);
        // Don't clear selectedAlbum, just show home view
    };

    const handleRemoveFile = (fileId: string) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!user) return;

        // Create UploadedFile objects with pending state
        const newUploadedFiles: UploadedFile[] = files.map(file => ({
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
                console.error('[Dashboard] Upload error:', error);

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
            console.warn('[Dashboard] Cannot submit: Some files are still uploading or failed');
            return;
        }

        const prompt = inputValue;
        // Use signed URLs from Supabase instead of blob URLs
        const inputImageUrls = completedFiles
            .map(f => f.signedUrl)
            .filter((url): url is string => !!url);

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

        const numImages = 2;
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

        // Call generation API (only if album is selected)
        if (selectedAlbum) {
            try {
                await create({
                    prompt,
                    input_images: inputImageUrls.length > 0 ? inputImageUrls : undefined,
                    num_images: numImages,
                    aspect_ratio: "16:9",
                    album_id: selectedAlbum.id,
                });

            } catch (error) {
                console.error("Generation error:", error);
                // Error handled by onError callback
            }
        }
    };

    // Handle generation completion
    // Use ref to track generation info instead of searching timeline (which may have been replaced by backend data)
    const handleGenerationComplete = useCallback((images: GeneratedImage[]) => {
        console.log('[Dashboard] 🎉 handleGenerationComplete called with', images.length, 'images');
        console.log('[Dashboard] 🖼️ Current gallery images:', galleryImages.length);

        const generationInfo = currentGenerationRef.current;
        console.log('[Dashboard] 🔍 Generation info from ref:', generationInfo);

        if (generationInfo) {
            const { aiEntryId } = generationInfo;

            // Remove the AI thinking entry from timeline (no longer needed)
            const generatingEntry = timelineEntries.find(e => e.id === aiEntryId);
            if (generatingEntry) {
                console.log('[Dashboard] ✅ Found timeline entry, removing it');
                removeTimelineEntry(aiEntryId);
            } else {
                console.log('[Dashboard] ℹ️ Timeline entry not found (likely replaced by backend data)');
            }

            // Update placeholder images in gallery using the stored ID
            const placeholderPrefix = `placeholder-${aiEntryId}-`;
            console.log('[Dashboard] 🔍 Looking for placeholders with prefix:', placeholderPrefix);
            console.log('[Dashboard] 🖼️ Gallery image IDs:', galleryImages.map(img => img.id));

            images.forEach((img, index) => {
                const placeholderId = `${placeholderPrefix}${index}`;
                console.log('[Dashboard] 🔄 Updating placeholder:', placeholderId, 'with URL:', img.url);
                updateGalleryImage(placeholderId, {
                    url: img.url,
                    description: "Generated image",
                    status: "complete",
                });
            });

            // Clear the ref after successful update
            currentGenerationRef.current = null;
        } else {
            console.warn('[Dashboard] ⚠️ No generation info found in ref');
        }
    }, [timelineEntries, galleryImages, removeTimelineEntry, updateGalleryImage]);

    // Handle generation error
    const handleGenerationError = (error: string) => {
        console.log('[Dashboard] ❌ handleGenerationError called:', error);

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

            // Remove placeholder images from gallery
            const placeholderPrefix = `placeholder-${aiEntryId}-`;
            galleryImages.forEach(img => {
                if (img.id.startsWith(placeholderPrefix)) {
                    // Note: We don't have a removeImage function, so placeholders will remain
                    // They could be updated to show error state instead
                    console.log('[Dashboard] ⚠️ Placeholder remains:', img.id);
                }
            });

            // Clear the ref
            currentGenerationRef.current = null;
        }
    };

    const handleNavigateImage = (direction: "prev" | "next") => {
        if (selectedImageIndex === null) return;

        const currentIndexInComplete = completeImages.findIndex(
            (img) => img.id === galleryImages[selectedImageIndex].id
        );

        if (direction === "prev" && currentIndexInComplete > 0) {
            const prevImage = completeImages[currentIndexInComplete - 1];
            const newIndex = galleryImages.findIndex((img) => img.id === prevImage.id);
            setSelectedImageIndex(newIndex);
        } else if (
            direction === "next" &&
            currentIndexInComplete < completeImages.length - 1
        ) {
            const nextImage = completeImages[currentIndexInComplete + 1];
            const newIndex = galleryImages.findIndex((img) => img.id === nextImage.id);
            setSelectedImageIndex(newIndex);
        }
    };

    const handleDownloadImage = () => {
        if (selectedImageIndex !== null && galleryImages[selectedImageIndex]) {
            console.log("Downloading:", galleryImages[selectedImageIndex].url);
        }
    };

    const handleDeleteImage = () => {
        console.log("Delete image:", selectedImageIndex);
        setSelectedImageIndex(null);
    };

    const currentIndexInComplete =
        selectedImageIndex !== null
            ? completeImages.findIndex(
                (img) => galleryImages[selectedImageIndex]?.id === img.id
            )
            : -1;

    // Determine which view to show
    const showHome = isHomeView || !selectedAlbum;
    const showLoadingAlbum = !showHome && selectedAlbum && timelineEntries.length === 0 && (timelineLoading || galleryLoading);
    const showEmptyAlbum = !showHome && selectedAlbum && timelineEntries.length === 0 && !timelineLoading && !galleryLoading;
    const showLoadedAlbum = !showHome && selectedAlbum && timelineEntries.length > 0;

    return (
        <div className="bg-black h-screen w-full flex overflow-hidden">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                albums={albums}
                selectedAlbum={selectedAlbum}
                onSelectAlbum={handleSelectAlbum}
                onCreateAlbum={handleCreateAlbum}
                onGoToHome={handleGoToHome}
                onBackToWebsite={() => router.push("/")}
                isLoading={albumsLoading}
                error={albumsError}
                isHomeView={showHome}
            />

            {/* Home View - No album selected */}
            {showHome && <HomePage />}

            {/* Loading Album View - Fetching timeline and gallery */}
            {showLoadingAlbum && (
                <>
                    <main className="bg-[#1a1a1a] w-[538px] flex-shrink-0 border-r border-[#6b6b6b] flex flex-col">
                        {/* Header */}
                        <header className="flex items-center justify-between p-4 border-b border-[#6b6b6b]/30">
                            <p
                                className="font-['Roboto:Regular',_sans-serif] text-white text-[14px]"
                                style={{ fontVariationSettings: "'wdth' 100" }}
                            >
                                {selectedAlbum.name}
                            </p>
                        </header>
                        {/* Loading Indicator */}
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-10 h-10 border-4 border-white/20 border-t-white/80 rounded-full animate-spin" />
                                <p className="font-['Roboto:Regular',_sans-serif] text-white/60 text-[14px]">
                                    Loading timeline...
                                </p>
                            </div>
                        </div>
                    </main>
                    <section className="bg-[#1a1a1a] flex-1 border-l border-[#6b6b6b] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-white/20 border-t-white/80 rounded-full animate-spin" />
                            <p className="font-['Roboto:Regular',_sans-serif] text-white/60 text-[14px]">
                                Loading gallery...
                            </p>
                        </div>
                    </section>
                </>
            )}

            {/* Empty Album View - New album with no timeline */}
            {showEmptyAlbum && (
                <>
                    <EmptyTimeline
                        albumName={selectedAlbum.name}
                        inputValue={inputValue}
                        onInputChange={setInputValue}
                        uploadedFiles={uploadedFiles}
                        onFileChange={handleFileChange}
                        onRemoveFile={handleRemoveFile}
                        onSubmit={handleSubmit}
                    />
                    <EmptyGallery onFileChange={handleFileChange} />
                </>
            )}

            {/* Loaded Album View - Album with timeline and gallery */}
            {showLoadedAlbum && (
                <>
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
                    />

                    <Gallery
                        images={galleryImages}
                        onImageClick={setSelectedImageIndex}
                        onLoadMore={loadMoreGallery}
                        isLoadingMore={galleryLoadingMore}
                        hasMore={galleryHasMore}
                    />

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
                            canNavigatePrev={currentIndexInComplete > 0}
                            canNavigateNext={currentIndexInComplete < completeImages.length - 1}
                        />
                    )}
                </>
            )}
        </div>
    );
}

