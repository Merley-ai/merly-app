"use client";

import { useRef, useEffect } from "react";
import { InputButtons } from "./InputButtons";
import type { UploadedFile } from "@/types";

interface InputAreaProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  uploadedFiles: UploadedFile[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (fileId: string) => void;
  onSubmit: () => void;
  hasScrolledContent?: boolean;
  forceDisableSend?: boolean;
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
          <div className="flex gap-2 flex-wrap">
            {uploadedFiles.map((uploadedFile, idx) => (
              <div
                key={uploadedFile.id}
                className="w-[71px] h-[71px] bg-black rounded overflow-hidden relative flex-shrink-0 group"
              >
                <img
                  src={uploadedFile.previewUrl}
                  alt={`Upload ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Loading spinner for uploading state */}
                {uploadedFile.status === 'uploading' && (
                  <div className="absolute top-1 right-1 w-[16px] h-[16px] bg-black/60 rounded-full flex items-center justify-center">
                    <div className="w-[10px] h-[10px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}

                {/* Error indicator with remove button */}
                {uploadedFile.status === 'error' && (
                  <button
                    onClick={() => onRemoveFile(uploadedFile.id)}
                    className="absolute top-1 right-1 w-[16px] h-[16px] bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                    aria-label="Remove failed upload"
                  >
                    <span className="text-white text-[12px] font-bold leading-none">×</span>
                  </button>
                )}

                {/* Success indicator with number and remove button */}
                {uploadedFile.status === 'completed' && (
                  <>
                    <div className="absolute top-1 right-1 w-[12px] h-[12px] bg-[#D9D9D9] rounded-full flex items-center justify-center">
                      <p
                        className="font-['Roboto:Regular',_sans-serif] text-black text-[10px]"
                        style={{ fontVariationSettings: "'wdth' 100" }}
                      >
                        {idx + 1}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveFile(uploadedFile.id)}
                      className="absolute top-1 left-1 w-[16px] h-[16px] bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                      aria-label="Remove image"
                    >
                      <span className="text-white text-[12px] font-bold leading-none">×</span>
                    </button>
                  </>
                )}

                {/* Pending state - show remove button on hover */}
                {uploadedFile.status === 'pending' && (
                  <button
                    onClick={() => onRemoveFile(uploadedFile.id)}
                    className="absolute top-1 right-1 w-[16px] h-[16px] bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <span className="text-white text-[12px] font-bold leading-none">×</span>
                  </button>
                )}
              </div>
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
        />
      </div>
    </div>
  );
}
