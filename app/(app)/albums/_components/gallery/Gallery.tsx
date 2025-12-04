import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import Image from "next/image";
import { Bookmark, MoreVertical } from "lucide-react";
import { humanizeDate } from "@/lib/utils";
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

export interface GalleryRef {
  scrollToBottom: () => void;
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

          {/* Gradient overlay at bottom - fades out on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent pointer-events-none transition-opacity duration-300 group-hover:opacity-0" />

          {/* Top left circle icon */}
          {/* <div className="absolute top-3 left-3 z-10">
            <div className="w-10 h-10 rounded-full border-2 border-white/40 backdrop-blur-sm" />
          </div> */}

          {/* Top right icons */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement bookmark functionality
              }}
              className="p-1.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              aria-label="Bookmark"
            >
              <Bookmark className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement menu functionality
              }}
              className="p-1.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              aria-label="More options"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Bottom info overlay - zooms in on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-3 z-10 transition-transform duration-300 group-hover:scale-105 origin-bottom-center">
            <h3 className="text-white text-sm font-semibold line-clamp-2">
              {image.description}
            </h3>
            <p className="text-white/80 text-xs font-medium mb-1">
              {humanizeDate(image.addedAt)}
            </p>
          </div>
        </button>
      )}
    </div>
  );
}

export const Gallery = forwardRef<GalleryRef, GalleryProps>(function Gallery({
  images,
  onImageClick,
  onLoadMore,
  isLoadingMore = false,
  hasMore = false,
}, ref) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const hasScrolledToBottomOnLoad = useRef(false);
  const prevScrollHeightRef = useRef<number>(0);
  const prevImagesLengthRef = useRef<number>(0);
  const isAdjustingScrollRef = useRef(false);

  // Expose scrollToBottom method via ref
  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      const container = galleryRef.current;
      if (!container) return;

      // Scroll to bottom smoothly
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }));

  // Scroll to bottom on initial load (newest images at bottom)
  useEffect(() => {
    const container = galleryRef.current;
    if (!container || images.length === 0 || hasScrolledToBottomOnLoad.current) return;

    hasScrolledToBottomOnLoad.current = true;
    prevImagesLengthRef.current = images.length;

    // Immediate scroll to bottom (no animation) to ensure we're at the bottom
    container.scrollTop = container.scrollHeight;

    // Then do a second scroll after a short delay to catch any layout shifts
    const timeoutId = setTimeout(() => {
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [images.length]);

  // Maintain scroll position when older images are prepended (scroll up to load more)
  useEffect(() => {
    const container = galleryRef.current;
    if (!container || !hasScrolledToBottomOnLoad.current) return;

    // Detect if images were prepended (length increased but we were at top)
    if (images.length > prevImagesLengthRef.current && prevScrollHeightRef.current > 0) {
      const newScrollHeight = container.scrollHeight;
      const addedHeight = newScrollHeight - prevScrollHeightRef.current;

      // Adjust scroll position to maintain view of current content
      if (addedHeight > 0) {
        isAdjustingScrollRef.current = true;
        container.scrollTop = addedHeight;

        // Reset flag after scroll adjustment completes
        setTimeout(() => {
          isAdjustingScrollRef.current = false;
        }, 100);
      }
    }

    prevImagesLengthRef.current = images.length;
  }, [images.length]);

  // Reset scroll flag when images are cleared (album change)
  useEffect(() => {
    if (images.length === 0) {
      hasScrolledToBottomOnLoad.current = false;
      prevScrollHeightRef.current = 0;
      prevImagesLengthRef.current = 0;
      isAdjustingScrollRef.current = false;
    }
  }, [images.length]);

  // Handle scroll for infinite scroll down (loads older images)
  useEffect(() => {
    const container = galleryRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Don't trigger loadMore if we're adjusting scroll position
      if (isAdjustingScrollRef.current) return;

      // Check if scrolled to top (with 100px threshold) - load older images
      const scrolledToTop = container.scrollTop < 100;

      if (scrolledToTop && hasMore && !isLoadingMore && onLoadMore) {
        // Store current scroll height before loading more
        prevScrollHeightRef.current = container.scrollHeight;
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
});

