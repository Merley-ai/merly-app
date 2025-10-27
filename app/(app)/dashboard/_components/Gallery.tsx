import { RenderingImageTile } from "./RenderingImageTile";
import type { GalleryImage } from "@/types";

interface GalleryProps {
  images: GalleryImage[];
  onImageClick: (index: number) => void;
}

export function Gallery({ images, onImageClick }: GalleryProps) {
  return (
    <section className="bg-[#1a1a1a] flex-1 overflow-y-auto p-2">
      <div className="grid grid-cols-2 gap-2">
        {images.map((image, index) => (
          <div key={image.id}>
            {image.status === 'rendering' ? (
              <RenderingImageTile />
            ) : (
              <button
                onClick={() => onImageClick(index)}
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
  );
}

