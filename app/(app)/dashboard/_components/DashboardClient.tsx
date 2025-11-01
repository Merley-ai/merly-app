"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Album, TimelineEntry, GalleryImage } from "@/types";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { Sidebar } from "./Sidebar";
import { TimelineWithInput } from "./TimelineWithInput";
import { Gallery } from "./Gallery";
import { ImageViewer } from "./ImageViewer";

export function DashboardClient() {
    const router = useRouter();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Image generation hook
    const { create, status: genStatus, images: generatedImages, progress, error: genError } = useImageGeneration({
        onComplete: (images) => {
            handleGenerationComplete(images);
        },
        onError: (error) => {
            handleGenerationError(error);
        },
    });

    // Albums state
    const [albums, setAlbums] = useState<Album[]>([
        {
            id: "1",
            name: "Summer Collection",
            thumbnail: "/images/product-1.png",
            createdAt: new Date("2024-01-15"),
        },
        {
            id: "2",
            name: "Winter Editorial",
            thumbnail: "/images/editorial-1.png",
            createdAt: new Date("2024-02-01"),
        },
        {
            id: "3",
            name: "Spring Lookbook",
            thumbnail: "/images/model-1.png",
            createdAt: new Date("2024-03-10"),
        },
    ]);

    const [selectedAlbum, setSelectedAlbum] = useState<Album>(albums[0]);

    // Timeline state
    const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([
        {
            id: "1",
            type: "user",
            content: "Create a minimalist fashion editorial",
            inputImages: ["/images/product-1.png"],
            prompt: "Create a minimalist fashion editorial",
            status: "thinking",
            timestamp: new Date("2024-03-15T10:00:00"),
        },
        {
            id: "2",
            type: "ai",
            content: "I'll create a minimalist fashion editorial for you...",
            inputImages: [],
            prompt: "Create a minimalist fashion editorial",
            status: "thinking",
            timestamp: new Date("2024-03-15T10:01:00"),
            isGenerating: true,
        },
        {
            id: "3",
            type: "ai",
            content: "Here are your images",
            inputImages: [
                "/images/editorial-1.png",
                "/images/editorial-2.png",
                "/images/product-2.png",
                "/images/product-3.png",
            ],
            prompt: "Create a minimalist fashion editorial",
            status: "complete",
            timestamp: new Date("2024-03-15T10:02:00"),
            outputImages: [
                {
                    url: "/images/editorial-1.png",
                    description: "A minimalist fashion editorial",
                },
            ],
            outputLabel: "Minimalist fashion editorial",
        },
    ]);

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

    const handleCreateAlbum = () => {
        const newAlbum: Album = {
            id: Date.now().toString(),
            name: `New Album ${albums.length + 1}`,
            thumbnail: "/images/model-1.png",
            createdAt: new Date(),
        };
        setAlbums([...albums, newAlbum]);
        setSelectedAlbum(newAlbum);
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

        // Call generation API
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

    return (
        <div className="bg-black h-screen w-full flex overflow-hidden">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                albums={albums}
                selectedAlbum={selectedAlbum}
                onSelectAlbum={setSelectedAlbum}
                onCreateAlbum={handleCreateAlbum}
                onBackToHome={() => router.push("/")}
            />

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
        </div>
    );
}

