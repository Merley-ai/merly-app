"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Album, TimelineEntry, GalleryImage } from "@/types";
import { Sidebar } from "./Sidebar";
import { TimelineWithInput } from "./TimelineWithInput";
import { Gallery } from "./Gallery";
import { ImageViewer } from "./ImageViewer";

export function DashboardClient() {
    const router = useRouter();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

    const handleSubmit = () => {
        if (!inputValue.trim() && uploadedFiles.length === 0) return;

        const newEntry: TimelineEntry = {
            id: Date.now().toString(),
            type: "user",
            content: inputValue,
            inputImages: uploadedFiles.map((file) => URL.createObjectURL(file)),
            prompt: inputValue,
            status: "thinking",
            thinkingText: "Thinking about your request...",
            timestamp: new Date(),
            isGenerating: true,
        };

        setTimelineEntries([...timelineEntries, newEntry]);
        setInputValue("");
        setUploadedFiles([]);

        // Simulate AI response
        setTimeout(() => {
            const aiEntry: TimelineEntry = {
                id: (Date.now() + 1).toString(),
                type: "ai",
                content: "Processing your request...",
                inputImages: [],
                prompt: inputValue,
                status: "thinking",
                thinkingText: "Thinking about your request...",
                timestamp: new Date(),
                isGenerating: true,
            };
            setTimelineEntries((prev) => [...prev, aiEntry]);
        }, 500);
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

