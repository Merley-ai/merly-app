interface InputImageThumbnailProps {
    src: string;
    index: number;
    alt?: string;
}

/**
 * Input Image Thumbnail
 * 
 * Displays a numbered thumbnail for input images in the timeline
 */
export function InputImageThumbnail({ src, index, alt }: InputImageThumbnailProps) {
    return (
        <div className="w-[120px] h-[120px] bg-[#2e2e2e] rounded overflow-hidden relative flex-shrink-0">
            <img
                src={src}
                alt={alt || `Input ${index + 1}`}
                className="w-full h-full object-cover"
            />
            <div className="absolute top-1 right-1 w-[12px] h-[12px] bg-[#D9D9D9] rounded-full flex items-center justify-center">
                <p
                    className="font-['Roboto:Regular',_sans-serif] text-black text-[10px]"
                    style={{ fontVariationSettings: "'wdth' 100" }}
                >
                    {index + 1}
                </p>
            </div>
        </div>
    );
}
