import { useRef, useEffect, useState } from "react";
import { ThinkingAnimation } from "../render-image/ThinkingAnimation";
import { InputArea } from "../input/InputArea";
import { TimelineLayout } from "./TimelineLayout";
import { InputImageThumbnail } from "./InputImageThumbnail";
import { UserPromptBubble } from "./UserMessage";
import { ErrorMessage } from "./ErrorMessage";
import { SystemMessage } from "./SystemMessage";
import { humanizeDate, isSameDay } from "@/lib/utils";
import type { SubscriptionStatus, TimelineEntry, UploadedFile, StyleTemplate } from "@/types";
import { SubscriptionBanner } from "@/components/subscription";
import type { PreferencesState } from "@/components/ui/Menus/PreferencesPopover";
import { SelectedStyleBanner } from "@/components/template-style";

interface TimelineWithInputProps {
    albumName: string;
    entries: TimelineEntry[];
    inputValue: string;
    onInputChange: (value: string) => void;
    uploadedFiles: UploadedFile[];
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: (fileId: string) => void;
    onSubmit: () => void;
    onRetry?: (prompt: string, inputImages: string[]) => void;
    onLoadMore?: () => void;
    isLoadingMore?: boolean;
    hasMore?: boolean;
    subscriptionStatus: SubscriptionStatus | null;
    forceDisableSend?: boolean;
    onPreferencesChange?: (preferences: PreferencesState) => void;
    selectedStyle?: StyleTemplate | null;
    availableStyles?: StyleTemplate[];
    onChangeStyle?: (style: StyleTemplate) => void;
    onViewStyleDetails?: () => void;
    onRemoveStyle?: () => void;
}

export function TimelineWithInput({
    albumName,
    entries,
    inputValue,
    onInputChange,
    uploadedFiles,
    onFileChange,
    onRemoveFile,
    onSubmit,
    onRetry,
    onLoadMore,
    isLoadingMore = false,
    hasMore = false,
    subscriptionStatus,
    forceDisableSend = false,
    onPreferencesChange,
    selectedStyle,
    availableStyles = [],
    onChangeStyle,
    onViewStyleDetails,
    onRemoveStyle,
}: TimelineWithInputProps) {
    const timelineRef = useRef<HTMLDivElement>(null);
    const scrollPositionRef = useRef<number>(0);
    const [hasScrolledContent, setHasScrolledContent] = useState(false);

    // Handle scroll for infinite scroll up and shadow detection
    useEffect(() => {
        const container = timelineRef.current;
        if (!container) return;

        const handleScroll = () => {
            // Check if scrolled to top (with 50px threshold)
            if (container.scrollTop < 50 && hasMore && !isLoadingMore && onLoadMore) {
                // Save scroll position before loading
                scrollPositionRef.current = container.scrollHeight - container.scrollTop;
                onLoadMore();
            }

            // Check if there's content below (not scrolled to bottom)
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
            setHasScrolledContent(!isAtBottom);
        };

        container.addEventListener('scroll', handleScroll);

        // Initial check
        handleScroll();

        return () => container.removeEventListener('scroll', handleScroll);
    }, [hasMore, isLoadingMore, onLoadMore]);

    // Restore scroll position after loading more, or scroll to bottom for new messages
    useEffect(() => {
        const container = timelineRef.current;
        if (!container) return;

        if (scrollPositionRef.current > 0) {
            // Restore position after loading older messages
            const newScrollTop = container.scrollHeight - scrollPositionRef.current;
            container.scrollTop = newScrollTop;
            scrollPositionRef.current = 0;
        } else {
            // Auto-scroll to bottom for new messages (latest at bottom)
            setTimeout(() => {
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            }, 0);
        }
    }, [entries.length]);

    return (
        <TimelineLayout albumName={albumName}>
            {/* Timeline Feed */}
            <div ref={timelineRef} className="flex-1 overflow-y-auto px-4 py-6 scrollbar-minimal">
                <div className="space-y-8">
                    {entries.map((entry, index) => {
                        // Show date only if it's the first entry OR if the date is different from the previous entry
                        const showDate = index === 0 || !isSameDay(entry.timestamp, entries[index - 1].timestamp);

                        return (
                            <div key={entry.id} className="space-y-4">
                                {/* Date Header - Only show at beginning of each day, centered */}
                                {showDate && (
                                    <p
                                        className="font-['Roboto:Regular',_sans-serif] text-white/40 text-[16px] text-center"
                                        style={{ fontVariationSettings: "'wdth' 100" }}
                                    >
                                        {humanizeDate(entry.timestamp)}
                                    </p>
                                )}

                                {/* Conversation Flow - User on right, AI on left, System/Error left-aligned */}
                                {entry.type === 'system' ? (
                                    /* System Message - Left-aligned */
                                    <SystemMessage
                                        message={entry.systemMessage || entry.content}
                                        suggestedActions={index === entries.length - 1 ? entry.suggested_actions : undefined}
                                    />
                                ) : entry.type === 'error' ? (
                                    /* Error Message - Centered with retry */
                                    <ErrorMessage
                                        message={entry.errorMessage || entry.content}
                                        onRetry={entry.prompt && onRetry ? () => onRetry(entry.prompt, entry.inputImages) : undefined}
                                    />
                                ) : entry.type === 'user' ? (
                                    /* User Message - Right aligned */
                                    <div className="flex flex-col items-end space-y-2">
                                        {/* Input Images */}
                                        {entry.inputImages.length > 0 && (
                                            <div className="flex gap-2">
                                                {entry.inputImages.map((img, idx) => (
                                                    <InputImageThumbnail
                                                        key={idx}
                                                        src={img}
                                                        index={idx}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* User Prompt */}
                                        {entry.prompt && (
                                            <UserPromptBubble prompt={entry.prompt} />
                                        )}
                                    </div>
                                ) : (
                                    /* AI Message - Left aligned */
                                    <div className="flex flex-col items-start space-y-2">
                                        {/* AI Content */}
                                        {entry.content && (
                                            <p
                                                className="font-['Roboto:Regular',_sans-serif] text-white/60 text-[16px] max-w-[80%]"
                                                style={{ fontVariationSettings: "'wdth' 100" }}
                                            >
                                                {entry.content}
                                            </p>
                                        )}

                                        {/* Thinking Animation */}
                                        {entry.status === 'thinking' && entry.thinkingText && (
                                            <ThinkingAnimation text={entry.thinkingText} />
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Selected Style Banner - Above subscription banner */}
            {selectedStyle && (
                <SelectedStyleBanner
                    selectedStyle={selectedStyle}
                    availableStyles={availableStyles}
                    onChangeStyle={onChangeStyle}
                    onViewDetails={onViewStyleDetails ? () => onViewStyleDetails() : undefined}
                    onRemoveStyle={onRemoveStyle}
                />
            )}

            {/* Subscription Status */}
            <SubscriptionBanner subscriptionStatus={subscriptionStatus} />

            {/* Input Area */}
            <InputArea
                inputValue={inputValue}
                onInputChange={onInputChange}
                uploadedFiles={uploadedFiles}
                onFileChange={onFileChange}
                onRemoveFile={onRemoveFile}
                onSubmit={onSubmit}
                hasScrolledContent={hasScrolledContent}
                forceDisableSend={forceDisableSend}
                onPreferencesChange={onPreferencesChange}
            />
        </TimelineLayout>
    );
}

