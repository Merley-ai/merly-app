"use client";

import { InputArea } from "../input/InputArea";
import { SubscriptionBanner } from "@/components/subscription";
import { TypedMessage } from "@/components/ui/TypedMessage";
import { TimelineLayout } from "./TimelineLayout";
import type { SubscriptionStatus, UploadedFile } from "@/types";
import type { PreferencesState } from "@/components/ui/PreferencesPopover";

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
    onPreferencesChange?: (preferences: PreferencesState) => void;
    isLoading?: boolean;
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
    onPreferencesChange,
    isLoading = false,
}: EmptyTimelineProps) {
    return (
        <TimelineLayout albumName={albumName}>
            <div className="flex-1 overflow-y-auto px-4 py-6">
                {!isLoading && (
                    <div className="space-y-4">
                        <div className="px-6 py-4">
                            <p
                                className="font-['Roboto:Regular',_sans-serif] text-white/80 text-[16px] leading-relaxed"
                                style={{ fontVariationSettings: "'wdth' 100" }}
                            >
                                <TypedMessage
                                    message="Fresh album — describe what you want to see, or let's brainstorm about where to start."
                                    typingSpeed={7}
                                    startDelay={100}
                                />
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <SubscriptionBanner subscriptionStatus={subscriptionStatus} />

            <InputArea
                inputValue={inputValue}
                onInputChange={onInputChange}
                uploadedFiles={uploadedFiles}
                onFileChange={onFileChange}
                onRemoveFile={onRemoveFile}
                onSubmit={onSubmit}
                forceDisableSend={forceDisableSend}
                onPreferencesChange={onPreferencesChange}
            />
        </TimelineLayout>
    );
}

