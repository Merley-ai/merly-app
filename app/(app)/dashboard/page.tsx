"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./_components/Sidebar";
import { TimelineWithInput } from "./_components/TimelineWithInput";
import { Gallery } from "./_components/Gallery";
import { ImageViewer } from "./_components/ImageViewer";
import type { Album, TimelineEntry, GalleryImage } from "@/types";
import { downloadImage, formatShortDate } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [albums, setAlbums] = useState<Album[]>([
    { id: "1", name: "Modern Street Editorial", thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=100&h=100&fit=crop" },
    { id: "2", name: "Editorial Makeover", thumbnail: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=100&h=100&fit=crop" },
    { id: "3", name: "Lookbook Trials", thumbnail: "https://images.unsplash.com/photo-1558769132-cb1aea3c3e01?w=100&h=100&fit=crop" },
  ]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album>(albums[0]);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([
    {
      id: "1",
      date: "Oct 18",
      inputImages: [
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=150&h=150&fit=crop",
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=150&h=150&fit=crop"
      ],
      prompt: "Recreate these two images, remove the logo and add a green background",
      status: 'complete',
      outputLabel: "Remixed 2 images",
      outputImages: [
        { url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=450&fit=crop", description: "Modern street editorial with green background" },
        { url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=450&fit=crop", description: "Fashion portrait with vibrant styling" },
        { url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&h=450&fit=crop", description: "Clean editorial shot with minimalist aesthetic" },
      ],
      timestamp: new Date(),
    },
  ]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([
    { id: "g1", url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=1000&fit=crop", description: "Modern street editorial", status: 'complete', addedAt: new Date() },
    { id: "g2", url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1000&fit=crop", description: "Fashion portrait", status: 'complete', addedAt: new Date() },
    { id: "g3", url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&h=1000&fit=crop", description: "Editorial shot", status: 'complete', addedAt: new Date() },
    { id: "g4", url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop", description: "Contemporary fashion", status: 'complete', addedAt: new Date() },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleCreateAlbum = () => {
    const newAlbum: Album = {
      id: Date.now().toString(),
      name: `New Album ${albums.length + 1}`,
      thumbnail: "https://images.unsplash.com/photo-1558769132-cb1aea3c3e01?w=100&h=100&fit=crop",
    };
    setAlbums([...albums, newAlbum]);
    setSelectedAlbum(newAlbum);
    setTimelineEntries([]);
    setGalleryImages([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const handleDeleteImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    setSelectedImageIndex(null);
  };

  const handleDownloadImage = (url: string) => {
    downloadImage(url);
  };

  const handleNavigateImage = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;
    const completeImages = galleryImages.filter(img => img.status === 'complete');
    const currentIndexInComplete = completeImages.findIndex(
      (_, i) => galleryImages.indexOf(completeImages[i]) === selectedImageIndex
    );

    if (direction === 'prev' && currentIndexInComplete > 0) {
      const prevImage = completeImages[currentIndexInComplete - 1];
      setSelectedImageIndex(galleryImages.indexOf(prevImage));
    } else if (direction === 'next' && currentIndexInComplete < completeImages.length - 1) {
      const nextImage = completeImages[currentIndexInComplete + 1];
      setSelectedImageIndex(galleryImages.indexOf(nextImage));
    }
  };

  const handleSubmit = () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) return;

    const now = new Date();
    const dateStr = formatShortDate(now);

    // Create new timeline entry with thinking status
    const newEntry: TimelineEntry = {
      id: Date.now().toString(),
      date: dateStr,
      inputImages: uploadedFiles.map((file) => URL.createObjectURL(file)),
      prompt: inputValue,
      status: 'thinking',
      thinkingText: "I'll create three variations of your editorial with the requested modifications",
      timestamp: now,
    };

    setTimelineEntries([...timelineEntries, newEntry]);

    // Add rendering placeholder to gallery
    const renderingImages: GalleryImage[] = [
      { id: `render-${Date.now()}-1`, url: "", description: "Rendering...", status: 'rendering', addedAt: now },
      { id: `render-${Date.now()}-2`, url: "", description: "Rendering...", status: 'rendering', addedAt: now },
      { id: `render-${Date.now()}-3`, url: "", description: "Rendering...", status: 'rendering', addedAt: now },
    ];
    setGalleryImages([...renderingImages, ...galleryImages]);

    // Reset input immediately
    setInputValue("");
    setUploadedFiles([]);

    // Simulate AI processing - complete after 3 seconds
    setTimeout(() => {
      const completedImages = [
        { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop", description: "Contemporary fashion editorial" },
        { url: "https://images.unsplash.com/photo-1558769132-cb1aea3c3e01?w=800&h=1000&fit=crop", description: "High-fashion lookbook" },
        { url: "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&h=1000&fit=crop", description: "Editorial portrait" },
      ];

      // Update timeline
      setTimelineEntries((prev) =>
        prev.map((entry) =>
          entry.id === newEntry.id
            ? {
              ...entry,
              status: 'complete',
              outputLabel: `Remixed ${uploadedFiles.length || 0} image${uploadedFiles.length !== 1 ? 's' : ''}`,
              outputImages: completedImages,
            }
            : entry
        )
      );

      // Update gallery - replace rendering placeholders with actual images
      setGalleryImages((prev) => {
        const newImages = prev.map((img, idx) => {
          if (img.status === 'rendering' && idx < 3) {
            return {
              ...img,
              url: completedImages[idx].url,
              description: completedImages[idx].description,
              status: 'complete' as const,
            };
          }
          return img;
        });
        return newImages;
      });
    }, 3000);
  };

  const completeImages = galleryImages.filter(img => img.status === 'complete');
  const currentIndexInComplete = selectedImageIndex !== null
    ? completeImages.findIndex((_, i) => galleryImages.indexOf(completeImages[i]) === selectedImageIndex)
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
        onBackToHome={() => router.push('/')}
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

      <Gallery
        images={galleryImages}
        onImageClick={setSelectedImageIndex}
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
    </div>
  );
}
