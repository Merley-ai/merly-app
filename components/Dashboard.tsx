"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, ArrowUp, ChevronLeft, ChevronRight, X, Download, Trash2 } from "lucide-react";
import dashboardSvgPaths from "@/lib/dashboard-svg-paths";

interface Album {
  id: string;
  name: string;
  thumbnail: string;
}

interface TimelineEntry {
  id: string;
  date: string;
  inputImages: string[];
  prompt: string;
  status: 'thinking' | 'complete';
  thinkingText?: string;
  outputImages?: Array<{url: string; description: string}>;
  outputLabel?: string;
  timestamp: Date;
}

interface GalleryImage {
  id: string;
  url: string;
  description: string;
  status: 'rendering' | 'complete';
  addedAt: Date;
}

interface DashboardProps {
  onBackToHome?: () => void;
}

function ThinkingAnimation({ text }: { text: string }) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-start gap-3 py-4">
      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 3.5a1 1 0 011 1V10h5.5a1 1 0 110 2H11v5.5a1 1 0 11-2 0V12H3.5a1 1 0 110-2H9V4.5a1 1 0 011-1z"/>
        </svg>
      </div>
      <p
        className="font-['Roboto:Regular',_sans-serif] text-white/60 text-[14px] pt-1.5"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        {text}{dots}
      </p>
    </div>
  );
}

function RenderingImageTile() {
  return (
    <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-orange-500/30 animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-transparent to-yellow-500/20" 
           style={{ animation: 'gradient 3s ease infinite' }} />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
           style={{ animation: 'shimmer 2s infinite' }} />
      
      {/* Rendering text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="font-['Roboto:Regular',_sans-serif] text-white text-[14px]"
             style={{ fontVariationSettings: "'wdth' 100" }}>
            Rendering...
          </p>
        </div>
      </div>
    </div>
  );
}

export function Dashboard({ onBackToHome }: DashboardProps = {}) {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    setSelectedImageIndex(null);
  };

  const handleDownloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `merley-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Keyboard navigation
  useEffect(() => {
    if (selectedImageIndex === null) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImageIndex(null);
      } else if (e.key === 'ArrowLeft') {
        handleNavigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        handleNavigateImage('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, galleryImages]);

  const handleSubmit = () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
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

  return (
    <div className="bg-black h-screen w-full flex overflow-hidden">
      {/* Left Sidebar - Collapsable */}
      <aside 
        className={`bg-black flex-shrink-0 border-r border-[#6b6b6b] flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'w-[60px]' : 'w-[294px]'
        }`}
      >
        {/* Header with collapse button */}
        <div className="px-3 py-4 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <>
              {onBackToHome ? (
                <a href="/" className="p-4 block hover:opacity-80 transition-opacity cursor-pointer">
                <p className="font-['Roboto_Serif'] text-white text-[20px]">
                  Merley
                </p>
              </a>
              ) : (
                <p
                  className="font-['Roboto_Serif'] text-white text-[20px]"
                  style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100" }}
                >
                  Merley
                </p>
              )}
            </>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-white/60 hover:text-white transition-colors ml-auto"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="size-5" />
            ) : (
              <ChevronLeft className="size-5" />
            )}
          </button>
        </div>

        {!isSidebarCollapsed && (
          <>
            {/* Create New Album Button */}
            <button
              onClick={handleCreateAlbum}
              className="mx-3 my-4 px-3 py-2 flex items-center gap-3 hover:bg-white/5 rounded transition-colors"
            >
              <svg className="size-[14px]" fill="none" viewBox="0 0 14 14">
                <path d={dashboardSvgPaths.p2d909600} fill="#666666" />
              </svg>
              <p
                className="font-['Roboto:Regular',_sans-serif] text-white text-[14px]"
                style={{ fontVariationSettings: "'wdth' 100" }}
              >
                Create New Album
              </p>
            </button>

            {/* Albums List */}
            <div className="flex-1 overflow-y-auto px-3 space-y-3">
              {albums.map((album) => (
                <button
                  key={album.id}
                  onClick={() => setSelectedAlbum(album)}
                  className={`w-full flex items-center gap-3 p-2 rounded transition-colors ${
                    selectedAlbum.id === album.id ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="size-[37px] bg-[#2e2e2e] rounded overflow-hidden flex-shrink-0">
                    <img
                      src={album.thumbnail}
                      alt={album.name}
                      className="size-full object-cover"
                    />
                  </div>
                  <p
                    className="font-['Roboto:Regular',_sans-serif] text-white text-[14px] text-left truncate"
                    style={{ fontVariationSettings: "'wdth' 100" }}
                  >
                    {album.name}
                  </p>
                </button>
              ))}
            </div>

            {/* User Info */}
            <div className="p-4 border-t border-[#6b6b6b]/30">
              <p
                className="font-['Roboto:Regular',_sans-serif] text-white text-[14px]"
                style={{ fontVariationSettings: "'wdth' 100" }}
              >
                Mark Kiarie
              </p>
              <p
                className="font-['Roboto:Regular',_sans-serif] text-neutral-300 text-[12px]"
                style={{ fontVariationSettings: "'wdth' 100" }}
              >
                Pro
              </p>
            </div>
          </>
        )}
      </aside>

      {/* Middle Timeline Section */}
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

        {/* Timeline Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-8">
            {timelineEntries.map((entry) => (
              <div key={entry.id} className="space-y-4">
                {/* Date Header */}
                <p
                  className="font-['Roboto:Regular',_sans-serif] text-white/40 text-[12px]"
                  style={{ fontVariationSettings: "'wdth' 100" }}
                >
                  {entry.date}
                </p>

                {/* Input Images */}
                {entry.inputImages.length > 0 && (
                  <div className="flex gap-2">
                    {entry.inputImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="w-[71px] h-[71px] bg-[#2e2e2e] rounded overflow-hidden relative flex-shrink-0"
                      >
                        <img
                          src={img}
                          alt={`Input ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 right-1 w-[12px] h-[12px] bg-[#D9D9D9] rounded-full flex items-center justify-center">
                          <p
                            className="font-['Roboto:Regular',_sans-serif] text-black text-[10px]"
                            style={{ fontVariationSettings: "'wdth' 100" }}
                          >
                            {idx + 1}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* User Prompt */}
                {entry.prompt && (
                  <div className="bg-[#2e2e2e] rounded-[40px] px-6 py-4">
                    <p
                      className="font-['Roboto:Regular',_sans-serif] text-white text-[16px]"
                      style={{ fontVariationSettings: "'wdth' 100" }}
                    >
                      {entry.prompt}
                    </p>
                  </div>
                )}

                {/* Thinking Animation */}
                {entry.status === 'thinking' && entry.thinkingText && (
                  <ThinkingAnimation text={entry.thinkingText} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[#6b6b6b]/30">
          <div className="bg-[#2e2e2e] rounded-[29px] px-6 py-4 flex flex-col gap-3">
            {/* Uploaded Image Thumbnails */}
            {uploadedFiles.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="w-[71px] h-[71px] bg-black rounded overflow-hidden relative flex-shrink-0"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 right-1 w-[12px] h-[12px] bg-[#D9D9D9] rounded-full flex items-center justify-center">
                      <p
                        className="font-['Roboto:Regular',_sans-serif] text-black text-[10px]"
                        style={{ fontVariationSettings: "'wdth' 100" }}
                      >
                        {idx + 1}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Text Area and Buttons */}
            <div className="flex items-end gap-3">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Ask Merley"
                rows={1}
                className="font-['Roboto:Regular',_sans-serif] text-white text-[16px] flex-1 bg-transparent border-none outline-none placeholder:text-white/40 resize-none min-h-[24px] overflow-hidden caret-white animate-[blink_1s_ease-in-out_infinite]"
                style={{
                  fontVariationSettings: "'wdth' 100",
                  lineHeight: '1.5'
                }}
              />
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={handleAttachClick}
                  type="button"
                  className="flex-none hover:opacity-80 transition-opacity cursor-pointer"
                  aria-label="Attach file"
                >
                  <svg className="size-[18px]" fill="none" viewBox="0 0 18 18">
                    <path d={dashboardSvgPaths.p110a4400} fill="#666666" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                  multiple
                />
                <button
                  onClick={handleSubmit}
                  type="button"
                  className="flex-none hover:opacity-80 transition-opacity cursor-pointer"
                  aria-label="Send"
                >
                  <svg className="size-[28px]" fill="none" viewBox="0 0 28 28">
                    <path d={dashboardSvgPaths.p3865f100} fill="#666666" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Right Gallery Section */}
      <section className="bg-[#1a1a1a] flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-2">
          {galleryImages.map((image, index) => (
            <div key={image.id}>
              {image.status === 'rendering' ? (
                <RenderingImageTile />
              ) : (
                <button
                  onClick={() => setSelectedImageIndex(index)}
                  className="aspect-[4/5] rounded-lg overflow-hidden relative group w-full cursor-pointer"
                >
                  <img
                    src={image.url}
                    alt={image.description}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200">
                    <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <p
                        className="font-['Roboto:Regular',_sans-serif] text-white text-[12px]"
                        style={{ fontVariationSettings: "'wdth' 100" }}
                      >
                        {image.description}
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Image Detail Viewer */}
      {selectedImageIndex !== null && galleryImages[selectedImageIndex] && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4 border-b border-[#6b6b6b]/30">
            <div className="flex items-center gap-3">
              <p
                className="font-['Roboto:Regular',_sans-serif] text-white text-[16px]"
                style={{ fontVariationSettings: "'wdth' 100" }}
              >
                {selectedAlbum.name}
              </p>
              <div className="flex items-center gap-2">
                <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                  <path d={dashboardSvgPaths.p17f63800} fill="white" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Navigation Arrows */}
              <div className="flex items-center bg-[#2e2e2e] rounded-full overflow-hidden">
                <button
                  onClick={() => handleNavigateImage('prev')}
                  className="text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2"
                  disabled={selectedImageIndex === 0}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-4" strokeWidth={2} />
                </button>
                <div className="w-px h-4 bg-white/20" />
                <button
                  onClick={() => handleNavigateImage('next')}
                  className="text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2"
                  disabled={selectedImageIndex === galleryImages.filter(img => img.status === 'complete').length - 1}
                  aria-label="Next image"
                >
                  <ChevronRight className="size-4" strokeWidth={2} />
                </button>
              </div>

              {/* Download Button */}
              <button
                onClick={() => handleDownloadImage(galleryImages[selectedImageIndex].url)}
                className="text-white/80 hover:text-white transition-colors p-2"
                aria-label="Download image"
              >
                <Download className="size-4" strokeWidth={2} />
              </button>

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteImage(selectedImageIndex)}
                className="text-white/80 hover:text-white transition-colors p-2"
                aria-label="Delete image"
              >
                <Trash2 className="size-4" strokeWidth={2} />
              </button>

              {/* Close Button */}
              <button
                onClick={() => setSelectedImageIndex(null)}
                className="text-white/80 hover:text-white transition-colors p-2"
                aria-label="Close"
              >
                <X className="size-5" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center p-8">
            <img
              src={galleryImages[selectedImageIndex].url}
              alt={galleryImages[selectedImageIndex].description}
              className="max-w-[90%] max-h-[90%] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}