"use client";

import { useRef, useEffect } from "react";
import { InputButtons } from "./InputButtons";
import { ImageThumbnail } from "./ImageThumbnail";
import type { UploadedFile } from "@/types";
import type { PreferencesState } from "@/components/ui/Menus/PreferencesPopover";

interface InputAreaProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  uploadedFiles: UploadedFile[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (fileId: string) => void;
  onSubmit: () => void;
  hasScrolledContent?: boolean;
  forceDisableSend?: boolean;
  onPreferencesChange?: (preferences: PreferencesState) => void;
}

export function InputArea({
  inputValue,
  onInputChange,
  uploadedFiles,
  onFileChange,
  onRemoveFile,
  onSubmit,
  hasScrolledContent = false,
  forceDisableSend = false,
  onPreferencesChange,
}: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check if send button should be disabled
  const isSendDisabled = forceDisableSend || (!inputValue.trim() && uploadedFiles.length === 0);

  const handleSubmit = () => {
    if (isSendDisabled) return;
    onSubmit();
  };

  // Reset textarea height when input is cleared
  useEffect(() => {
    if (inputValue === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [inputValue]);

  return (
    <div
      className={`pb-4 pl-4 pr-4 pt-3  transition-shadow duration-300 relative ${hasScrolledContent
        ? 'shadow-[0_-16px_48px_0px_rgba(0,0,0,0.4)]'
        : ''
        }`}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-b from-white/20 to-transparent blur-[4px]" />
      <div className="bg-[#2e2e2e] rounded-[29px] px-4 py-4 flex flex-col gap-2 transition-all duration-200 hover:bg-[#333333] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]">
        {/* Uploaded Image Thumbnails */}
        {uploadedFiles.length > 0 && (
          <div className="flex gap-4 flex-wrap">
            {uploadedFiles.map((uploadedFile, idx) => (
              <ImageThumbnail
                key={uploadedFile.id}
                uploadedFile={uploadedFile}
                index={idx}
                onRemove={() => onRemoveFile(uploadedFile.id)}
              />
            ))}
          </div>
        )}

        {/* Text Area - Full Width, Scrollable */}
        <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-white scrollbar-track-transparent">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask Merley"
            rows={1}
            className="font-['Roboto:Regular',_sans-serif] text-white text-[16px] w-full bg-transparent border-none outline-none placeholder:text-white/50 resize-none min-h-[16px] overflow-hidden caret-white animate-[blink_1s_ease-in-out_infinite]"
            style={{
              fontVariationSettings: "'wdth' 100",
              lineHeight: '1.6'
            }}
          />
        </div>

        {/* CTA Component - Always at Bottom */}
        <InputButtons
          onAttachClick={() => { }}
          onSendClick={handleSubmit}
          isSendDisabled={isSendDisabled}
          onFileChange={onFileChange}
          onPreferencesChange={onPreferencesChange}
        />
      </div>
    </div>
  );
}
