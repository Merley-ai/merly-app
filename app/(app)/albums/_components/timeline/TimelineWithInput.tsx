import { useRef, useEffect, useState } from "react";
import { ThinkingAnimation } from "../render-image/ThinkingAnimation";
import { InputArea } from "../input/InputArea";
import { humanizeDate, isSameDay } from "@/lib/utils";
import type { TimelineEntry, UploadedFile } from "@/types";

interface TimelineWithInputProps {
    albumName: string;
    entries: TimelineEntry[];
    inputValue: string;
    onInputChange: (value: string) => void;
    uploadedFiles: UploadedFile[];
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: (fileId: string) => void;
    onSubmit: () => void;
    onLoadMore?: () => void;
    isLoadingMore?: boolean;
    hasMore?: boolean;
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
    onLoadMore,
    isLoadingMore = false,
    hasMore = false,
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

                                {/* Conversation Flow - User on right, AI on left */}
                                {entry.type === 'user' ? (
                                    /* User Message - Right aligned */
                                    <div className="flex flex-col items-end space-y-2">
                                        {/* Input Images */}
                                        {entry.inputImages.length > 0 && (
                                            <div className="flex gap-2">
                                                {entry.inputImages.map((img, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="w-[120px] h-[120px] bg-[#2e2e2e] rounded overflow-hidden relative flex-shrink-0"
                                                    >
                                                        <img
                                                            src={img}
                                                            alt={`Input ${idx + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute top-1 right-1 w-[12px] h-[12px] bg-[#D9D9D9] rounded-full flex items-center justify-center">
                                                            <p
                                                                className="font-['Roboto:Regular',_sans-serif] text-black text-[10px]"
                                                                style={{ fontVariationSettings: "'wdth' 100" }}
                                                            >
                                                                {idx + 1}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* User Prompt */}
                                        {entry.prompt && (
                                            <div className="bg-[#2e2e2e] rounded-[40px] px-6 py-4 max-w-[80%]">
                                                <p
                                                    className="font-['Roboto:Regular',_sans-serif] text-white text-[16px]"
                                                    style={{ fontVariationSettings: "'wdth' 100" }}
                                                >
                                                    {entry.prompt}
                                                </p>
                                            </div>
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

            {/* Input Area */}
            <InputArea
                inputValue={inputValue}
                onInputChange={onInputChange}
                uploadedFiles={uploadedFiles}
                onFileChange={onFileChange}
                onRemoveFile={onRemoveFile}
                onSubmit={onSubmit}
                hasScrolledContent={hasScrolledContent}
            />
        </main>
    );
}

