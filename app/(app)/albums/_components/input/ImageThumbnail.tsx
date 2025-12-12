"use client";

import Image from "next/image";
import type { UploadedFile } from "@/types";

interface ImageThumbnailProps {
    uploadedFile: UploadedFile;
    index: number;
    onRemove: () => void;
}

/** Reusable remove button - appears on hover for all states */
function RemoveButton({ onRemove, label }: { onRemove: () => void; label: string }) {
    return (
        <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-[24px] h-[24px] bg-black/80 rounded-full flex items-center justify-center hover:bg-black transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-10"
            aria-label={label}
        >
            <span className="text-white text-[14px] font-bold leading-none">×</span>
        </button>
    );
}

/** Badge container - positioned to float at corner */
const BADGE_CLASSES = "absolute -top-2 -right-2 w-[24px] h-[24px] rounded-full flex items-center justify-center transition-opacity z-10";

export function ImageThumbnail({ uploadedFile, index, onRemove }: ImageThumbnailProps) {
    const { status, previewUrl } = uploadedFile;
    const showBadge = status !== 'pending';
    const hideOnHover = status === 'completed' || status === 'error';

    return (
        <div className="relative group">
            {/* Image container */}
            <div className="w-[71px] h-[71px] bg-black rounded-lg overflow-hidden relative">
                <Image
                    src={previewUrl}
                    alt={`Upload ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                />
            </div>

            {/* Status badge - floats at corner */}
            {showBadge && (
                <div className={`${BADGE_CLASSES} ${hideOnHover ? 'group-hover:opacity-0' : ''} ${status === 'uploading' ? 'bg-black/70' :
                    status === 'error' ? 'bg-red-500' :
                        'bg-[#D9D9D9]'
                    }`}>
                    {status === 'uploading' && (
                        <div className="w-[14px] h-[14px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {status === 'error' && (
                        <span className="text-white text-[14px] font-bold leading-none">!</span>
                    )}
                    {status === 'completed' && (
                        <span className="text-black text-[12px] font-semibold">{index + 1}</span>
                    )}
                </div>
            )}

            {/* Remove button - always available on hover */}
            <RemoveButton onRemove={onRemove} label="Remove image" />
        </div>
    );
}
