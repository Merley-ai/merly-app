"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth0/client";
import type { TimelineEntry, GalleryImage, UploadedFile } from "@/types";
import type { Album } from "@/types/album";
import type { GeneratedImage } from "@/types/image-generation";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useAlbums } from "@/hooks/useAlbums";
import { useSupabaseUpload } from "@/hooks/useSupabaseUpload";
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

    // Timeline state - empty by default, will be loaded from API
    const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);

    // Input state
    const [inputValue, setInputValue] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

    // Gallery & viewer state
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
        null
    );

    // Extract images for gallery (including placeholders)
    const galleryImages: GalleryImage[] = timelineEntries
        .filter((entry) => entry.type === "ai")
        .flatMap((entry) =>
            entry.outputImages?.map((img, idx) => ({
                id: `${entry.id}-${idx}`,
                url: img.url,
                description: img.description,
                status: img.isPlaceholder ? ("rendering" as const) : ("complete" as const),
                addedAt: entry.timestamp,
                requestId: entry.requestId,
                index: idx,
            })) || []
        ) as GalleryImage[];

    const completeImages = galleryImages.filter(
        (img) => img.status === "complete"
    );

    // Handle create album - uses placeholder values automatically
    const handleCreateAlbum = async () => {
        try {
            await createAlbum();
            setIsHomeView(false);
            // Clear timeline for new album
            setTimelineEntries([]);
        } catch (error) {
            console.error("[Dashboard] Failed to create album:", error);
        }
    };

    // Handle select album
    const handleSelectAlbum = (album: Album) => {
        selectAlbum(album);
        setIsHomeView(false);
        // TODO: Load timeline entries from API for this album
        // For now, clear timeline - will be implemented later
        setTimelineEntries([]);
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

        // Add user entry to timeline
        const userEntry: TimelineEntry = {
            id: Date.now().toString(),
            type: "user",
            content: prompt,
            inputImages: inputImageUrls,
            prompt,
            status: "complete",
            timestamp: new Date(),
        };

        setTimelineEntries([...timelineEntries, userEntry]);

        const numImages = 4;
        const aiEntryId = (Date.now() + 1).toString();

        // Add AI entry with placeholder images immediately
        const aiEntry: TimelineEntry = {
            id: aiEntryId,
            type: "ai",
            content: "Generating your images...",
            inputImages: [],
            prompt,
            status: "thinking",
            thinkingText: "Creating your masterpiece...",
            timestamp: new Date(),
            isGenerating: true,
            numImages,
            outputImages: Array.from({ length: numImages }, () => ({
                url: '', // Empty URL for placeholder
                description: 'Generating...',
                isPlaceholder: true,
            })),
            outputLabel: 'Generating Images',
        };

        setTimelineEntries((prev) => [...prev, aiEntry]);

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

                // Placeholders are already showing from the AI entry above
                // They will be replaced when handleGenerationComplete is called

            } catch (error) {
                console.error("Generation error:", error);
                // Error handled by onError callback
            }
        }
    };

    // Handle generation completion
    const handleGenerationComplete = (images: GeneratedImage[]) => {
        // Update the generating entry with real images (replace placeholders)
        setTimelineEntries((prev) =>
            prev.map((entry) =>
                entry.isGenerating
                    ? {
                        ...entry,
                        id: Date.now().toString(),
                        content: "Here are your generated images!",
                        status: "complete" as const,
                        isGenerating: false,
                        outputImages: images.map((img) => ({
                            url: img.url,
                            description: "Generated image",
                            isPlaceholder: false,
                        })),
                        outputLabel: "Generated Images",
                    }
                    : entry
            )
        );
    };

    // Handle generation error
    const handleGenerationError = (error: string) => {
        const errorEntry: TimelineEntry = {
            id: Date.now().toString(),
            type: "ai",
            content: `Sorry, something went wrong: ${error}`,
            inputImages: [],
            prompt: "",
            status: "complete",
            timestamp: new Date(),
        };

        // Replace the "thinking" entry with error entry
        setTimelineEntries((prev) =>
            prev.map((entry) => (entry.isGenerating ? errorEntry : entry))
        );
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
    const showEmptyAlbum = !showHome && selectedAlbum && timelineEntries.length === 0;
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
                    />

                    <Gallery images={galleryImages} onImageClick={setSelectedImageIndex} />

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

