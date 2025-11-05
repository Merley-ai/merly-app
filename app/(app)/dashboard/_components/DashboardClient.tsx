"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TimelineEntry, GalleryImage } from "@/types";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useAlbums } from "@/hooks/useAlbums";
import { Sidebar } from "./Sidebar";
import { HomePage } from "./HomePage";
import { EmptyTimeline } from "./EmptyTimeline";
import { TimelineWithInput } from "./TimelineWithInput";
import { EmptyGallery } from "./EmptyGallery";
import { Gallery } from "./Gallery";
import { ImageViewer } from "./ImageViewer";

export function DashboardClient() {
    const router = useRouter();
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

    // Image generation hook
    const { create, status: genStatus, images: generatedImages, progress, error: genError } = useImageGeneration({
        onComplete: (images) => {
            handleGenerationComplete(images);
        },
        onError: (error) => {
            handleGenerationError(error);
        },
    });

    // Timeline state - empty by default, will be loaded from API
    const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);

    // Input state
    const [inputValue, setInputValue] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

    // Gallery & viewer state
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
        null
    );

    // Extract images for gallery
    const galleryImages: GalleryImage[] = timelineEntries
        .filter((entry) => entry.type === "ai" && !entry.isGenerating)
        .flatMap((entry) =>
            entry.outputImages?.map((img, idx) => ({
                id: `${entry.id}-${idx}`,
                url: img.url,
                description: img.description,
                status: "complete",
                addedAt: entry.timestamp,
            })) || []
        ) as GalleryImage[];

    const completeImages = galleryImages.filter(
        (img) => img.status === "complete"
    );

    // Handle create album - uses placeholder values automatically
    const handleCreateAlbum = async () => {
        try {
            const newAlbum = await createAlbum();
            setIsHomeView(false);
            // Clear timeline for new album
            setTimelineEntries([]);
        } catch (error) {
            console.error("[Dashboard] Failed to create album:", error);
        }
    };

    // Handle select album
    const handleSelectAlbum = (album: any) => {
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setUploadedFiles([...uploadedFiles, ...files]);
    };

    const handleSubmit = async () => {
        if (!inputValue.trim() && uploadedFiles.length === 0) return;

        const prompt = inputValue;
        const inputImageUrls = uploadedFiles.map((file) => URL.createObjectURL(file));

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

        // Add AI "thinking" entry
        const aiEntry: TimelineEntry = {
            id: (Date.now() + 1).toString(),
            type: "ai",
            content: "Generating your images...",
            inputImages: [],
            prompt,
            status: "thinking",
            thinkingText: "Creating your masterpiece...",
            timestamp: new Date(),
            isGenerating: true,
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
                    num_images: 4,
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
    const handleGenerationComplete = (images: any[]) => {
        const completedEntry: TimelineEntry = {
            id: Date.now().toString(),
            type: "ai",
            content: "Here are your generated images!",
            inputImages: [],
            prompt: "",
            status: "complete",
            timestamp: new Date(),
            outputImages: images.map((img) => ({
                url: img.url,
                description: "Generated image",
            })),
            outputLabel: "Generated Images",
        };

        // Replace the "thinking" entry with completed entry
        setTimelineEntries((prev) =>
            prev.map((entry) => (entry.isGenerating ? completedEntry : entry))
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
                (img, i) => galleryImages[selectedImageIndex]?.id === img.id
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

