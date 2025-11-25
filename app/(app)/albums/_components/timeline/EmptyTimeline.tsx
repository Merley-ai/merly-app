"use client";

import { InputArea } from "../input/InputArea";
import { SubscriptionBanner } from "@/components/subscription";
import type { SubscriptionStatus, UploadedFile } from "@/types";

interface EmptyTimelineProps {
    albumName: string;
    inputValue: string;
    onInputChange: (value: string) => void;
    uploadedFiles: UploadedFile[];
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: (fileId: string) => void;
    onSubmit: () => void;
    subscriptionStatus: SubscriptionStatus | null;
    forceDisableSend?: boolean;
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
    subscriptionStatus,
    forceDisableSend = false,
}: EmptyTimelineProps) {
    return (
        <main className="bg-[#1a1a1a] w-[538px] flex-shrink-0 border-r-[1px] border-white/20 flex flex-col">
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
                    {/* Welcome Message */}
                    <div className="px-6 py-4">
                        <p
                            className="font-['Roboto:Regular',_sans-serif] text-white/80 text-[16px] leading-relaxed"
                            style={{ fontVariationSettings: "'wdth' 100" }}
                        >
                            Fresh album — describe what you want to see, or let&apos;s brainstorm about where to start.
                        </p>
                    </div>
                </div>
            </div>

            <SubscriptionBanner subscriptionStatus={subscriptionStatus} />

            {/* Input Area */}
            <InputArea
                inputValue={inputValue}
                onInputChange={onInputChange}
                uploadedFiles={uploadedFiles}
                onFileChange={onFileChange}
                onRemoveFile={onRemoveFile}
                onSubmit={onSubmit}
                forceDisableSend={forceDisableSend}
            />
        </main>
    );
}

