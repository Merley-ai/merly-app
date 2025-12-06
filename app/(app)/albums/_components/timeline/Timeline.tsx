import { ThinkingAnimation } from "../render-image/ThinkingAnimation";
import { PlaceholderThumbnail } from "../render-image/PlaceholderImage";
import { AnimatedImage } from "@/components/ui/AnimatedImage";
import type { TimelineEntry } from "@/types";

interface TimelineProps {
    albumName: string;
    entries: TimelineEntry[];
}

export function Timeline({ albumName, entries }: TimelineProps) {
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
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="space-y-8">
                    {entries.map((entry) => (
                        <div key={entry.id} className="space-y-4">
                            {/* Date Header */}
                            <p
                                className="font-['Roboto:Regular',_sans-serif] text-white/40 text-[12px]"
                                style={{ fontVariationSettings: "'wdth' 100" }}
                            >
                                {entry.timestamp.toLocaleDateString()}
                            </p>

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
                                <div className="bg-[#2e2e2e] rounded-[40px] px-6 py-4">
                                    <p
                                        className="font-['Roboto:Regular',_sans-serif] text-white text-[16px]"
                                        style={{ fontVariationSettings: "'wdth' 100" }}
                                    >
                                        {entry.prompt}
                                    </p>
                                </div>
                            )}

                            {/* Thinking Animation */}
                            {entry.status === 'thinking' && entry.thinkingText && !entry.outputImages && (
                                <ThinkingAnimation text={entry.thinkingText} />
                            )}

                            {/* Output Images (or Placeholders) */}
                            {entry.outputImages && entry.outputImages.length > 0 && (
                                <div className="space-y-2">
                                    {entry.outputLabel && (
                                        <p
                                            className="font-['Roboto:Regular',_sans-serif] text-white/60 text-[12px]"
                                            style={{ fontVariationSettings: "'wdth' 100" }}
                                        >
                                            {entry.outputLabel}
                                        </p>
                                    )}
                                    <div className="flex gap-2 flex-wrap">
                                        {entry.outputImages.map((img, idx) => (
                                            <div key={idx} className="space-y-1">
                                                {img.isPlaceholder ? (
                                                    <PlaceholderThumbnail delay={0.3 * idx} />
                                                ) : (
                                                    <div className="w-[120px] h-[120px] bg-[#2e2e2e] rounded overflow-hidden relative flex-shrink-0">
                                                        <AnimatedImage
                                                            src={img.url}
                                                            alt={img.description}
                                                            className="w-full h-full object-cover"
                                                            delay={0.1 * idx}
                                                        />
                                                    </div>
                                                )}
                                                {img.description && !img.isPlaceholder && (
                                                    <p
                                                        className="font-['Roboto:Regular',_sans-serif] text-white/40 text-[10px] w-[120px]"
                                                        style={{ fontVariationSettings: "'wdth' 100" }}
                                                    >
                                                        {img.description}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}

