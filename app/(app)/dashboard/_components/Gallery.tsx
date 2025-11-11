import { useRef, useEffect } from "react";
import { PlaceholderImage } from "./PlaceholderImage";
import { AnimatedImage } from "@/components/ui/AnimatedImage";
import type { GalleryImage } from "@/types";

interface GalleryProps {
  images: GalleryImage[];
  onImageClick: (index: number) => void;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
}

export function Gallery({
  images,
  onImageClick,
  onLoadMore,
  isLoadingMore = false,
  hasMore = false,
}: GalleryProps) {
  const galleryRef = useRef<HTMLDivElement>(null);

  // Handle scroll for infinite scroll down
  useEffect(() => {
    const container = galleryRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Check if scrolled to bottom (with 100px threshold)
      const scrolledToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;

      if (scrolledToBottom && hasMore && !isLoadingMore && onLoadMore) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, onLoadMore]);

  return (
    <section ref={galleryRef} className="bg-[#1a1a1a] flex-1 overflow-y-auto p-2">
      <div className="grid grid-cols-2 gap-2">
        {images.map((image, index) => (
          <div key={image.id}>
            {image.status === 'rendering' ? (
              <PlaceholderImage index={image.index || index} delay={0.1 * (image.index || index)} />
            ) : (
              <button
                onClick={() => onImageClick(index)}
                className="aspect-[4/5] rounded-lg overflow-hidden relative group w-full cursor-pointer"
              >
                <AnimatedImage
                  src={image.url}
                  alt={image.description}
                  className="w-full h-full object-cover"
                  delay={0}
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

        {/* Loading indicator at bottom */}
        {isLoadingMore && (
          <div className="col-span-2 flex items-center justify-center py-6">
            <p
              className="font-['Roboto:Regular',_sans-serif] text-white/40 text-[12px]"
              style={{ fontVariationSettings: "'wdth' 100" }}
            >
              ....loading
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

