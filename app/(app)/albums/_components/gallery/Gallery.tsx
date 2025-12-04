import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { PlaceholderImage } from "../render-image/PlaceholderImage";
import type { GalleryImage } from "@/types";

function hasValidImageExtension(url: string): boolean {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];
  const urlPath = url.split('?')[0].toLowerCase();
  return validExtensions.some(ext => urlPath.endsWith(ext));
}

interface GalleryProps {
  images: GalleryImage[];
  onImageClick: (index: number) => void;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
}

/**
 * Individual gallery image item with smooth placeholder-to-image transition
 */
function GalleryImageItem({
  image,
  index,
  onImageClick,
}: {
  image: GalleryImage;
  index: number;
  onImageClick: (index: number) => void;
}) {
  // Use image URL as part of the key to reset state when URL changes
  // This avoids setState in effects by letting React handle state reset through remounting
  const [imageLoaded, setImageLoaded] = useState(false);

  // Derive placeholder visibility from image status
  const shouldShowPlaceholder = image.status === 'rendering' || (image.status === 'complete' && image.url && !imageLoaded);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
      {/* Placeholder layer - fades out when image loads */}
      {shouldShowPlaceholder && (
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{ opacity: imageLoaded ? 0 : 1 }}
        >
          <PlaceholderImage index={image.index || index} />
        </div>
      )}

      {/* Image layer - fades in when loaded */}
      {image.status === 'complete' && image.url && (
        <button
          onClick={() => onImageClick(index)}
          className="absolute inset-0 group w-full cursor-pointer transition-opacity duration-300"
          style={{ opacity: imageLoaded ? 1 : 0 }}
        >
          <Image
            src={image.url}
            alt={image.description}
            fill
            className="object-cover"
            onLoad={handleImageLoad}
            loading="lazy"
            sizes="(max-width: 768px) 50vw, 33vw"
            quality={85}
            unoptimized={!hasValidImageExtension(image.url)}
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
  );
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
    <section ref={galleryRef} className="bg-[#1a1a1a] flex-1 overflow-y-auto p-2 scrollbar-minimal">
      <div className="grid grid-cols-3 gap-0.5">
        {images.map((image, index) => (
          <GalleryImageItem
            key={`${image.id}-${image.url || 'no-url'}`}
            image={image}
            index={index}
            onImageClick={onImageClick}
          />
        ))}
      </div>
    </section>
  );
}

