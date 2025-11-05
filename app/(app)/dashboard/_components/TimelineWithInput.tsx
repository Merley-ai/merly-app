import { ThinkingAnimation } from "./ThinkingAnimation";
import { InputArea } from "./InputArea";
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
}: TimelineWithInputProps) {
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
                                {entry.timestamp.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                            </p>

                            {/* Input Images */}
                            {entry.inputImages.length > 0 && (
                                <div className="flex gap-2">
                                    {entry.inputImages.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="w-[71px] h-[71px] bg-[#2e2e2e] rounded overflow-hidden relative flex-shrink-0"
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
                            {entry.status === 'thinking' && entry.thinkingText && (
                                <ThinkingAnimation text={entry.thinkingText} />
                            )}
                        </div>
                    ))}
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

