"use client";

import { InputArea } from "./InputArea";
import type { UploadedFile } from "@/types";

interface EmptyTimelineProps {
    albumName: string;
    inputValue: string;
    onInputChange: (value: string) => void;
    uploadedFiles: UploadedFile[];
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: (fileId: string) => void;
    onSubmit: () => void;
}

/**
 * Empty Timeline State
 * 
 * Shown when a new album is created with no timeline entries yet.
 * Displays a welcome message and input area.
 */
export function EmptyTimeline({
    albumName,
    inputValue,
    onInputChange,
    uploadedFiles,
    onFileChange,
    onRemoveFile,
    onSubmit,
}: EmptyTimelineProps) {
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <main className="bg-[#1a1a1a] w-[538px] flex-shrink-0 border-r border-[#6b6b6b] flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-[#6b6b6b]/30">
                <p
                    className="font-['Roboto:Regular',_sans-serif] text-white text-[14px]"
                    style={{ fontVariationSettings: "'wdth' 100" }}
                >
                    {albumName}
                </p>
            </header>

            {/* Empty State Message */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="space-y-4">
                    {/* Date */}
                    <p
                        className="font-['Roboto:Regular',_sans-serif] text-white/40 text-[12px]"
                        style={{ fontVariationSettings: "'wdth' 100" }}
                    >
                        {currentDate}
                    </p>

                    {/* Welcome Message */}
                    <div className="bg-[#2e2e2e] rounded-[20px] px-6 py-4">
                        <p
                            className="font-['Roboto:Regular',_sans-serif] text-white/80 text-[16px] leading-relaxed"
                            style={{ fontVariationSettings: "'wdth' 100" }}
                        >
                            Fresh album — describe what you want to see, or let's brainstorm about where to start.
                        </p>
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <InputArea
                inputValue={inputValue}
                onInputChange={onInputChange}
                uploadedFiles={uploadedFiles}
                onFileChange={onFileChange}
                onRemoveFile={onRemoveFile}
                onSubmit={onSubmit}
            />
        </main>
    );
}

