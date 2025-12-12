"use client";

import { Upload } from "lucide-react";

interface EmptyGalleryProps {
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Empty Gallery State
 * 
 * Shown when an album has no images yet.
 * Provides upload functionality.
 */
export function EmptyGallery({ onFileChange }: EmptyGalleryProps) {
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            // Create a synthetic event to reuse the file change handler
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;

            const dataTransfer = new DataTransfer();
            files.forEach(file => dataTransfer.items.add(file));
            input.files = dataTransfer.files;

            const event = new Event('change', { bubbles: true });
            Object.defineProperty(event, 'target', { value: input, enumerable: true });
            onFileChange(event as unknown as React.ChangeEvent<HTMLInputElement>);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    return (
        <section className="bg-black flex-1 border-l-[0.5px] border-white/20 flex items-center justify-center">
            <div
                role="button"
                tabIndex={0}
                className="border-2 border-dashed border-white/20 rounded-lg p-12 flex flex-col items-center justify-center gap-4 hover:border-white/40 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('gallery-file-input')?.click()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        document.getElementById('gallery-file-input')?.click();
                    }
                }}
            >
                <Upload className="size-12 text-white/40" />
                <p className="font-['Roboto:Regular',_sans-serif] text-white/60 text-[14px] text-center">
                    Click or drag images to upload here
                </p>
                <input
                    id="gallery-file-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={onFileChange}
                    className="hidden"
                />
            </div>
        </section>
    );
}

