"use client";

import { useRef } from "react";
import dashboardSvgPaths from "@/lib/constants/dashboard-svg-paths";
import { Tooltip } from "@/components/ui/Tooltip";
import type { UploadedFile } from "@/types";

interface InputAreaProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  uploadedFiles: UploadedFile[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (fileId: string) => void;
  onSubmit: () => void;
  hasScrolledContent?: boolean;
}

export function InputArea({
  inputValue,
  onInputChange,
  uploadedFiles,
  onFileChange,
  onRemoveFile,
  onSubmit,
  hasScrolledContent = false,
}: InputAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if send button should be disabled
  const isSendDisabled = !inputValue.trim() && uploadedFiles.length === 0;

  const handleAttachClick = () => {
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  };

  const handleSubmit = () => {
    if (isSendDisabled) return;
    onSubmit();
  };

  return (
    <div
      className={`pb-4 pl-4 pr-4 pt-3  transition-shadow duration-300 relative ${hasScrolledContent
        ? 'shadow-[0_-16px_48px_0px_rgba(0,0,0,0.4)]'
        : ''
        }`}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-b from-white/20 to-transparent blur-[4px]" />
      <div className="bg-[#2e2e2e] rounded-[29px] px-6 py-4 flex flex-col gap-3">
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

        {/* Text Area and Buttons */}
        <div className="flex items-center gap-3">
          <textarea
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
            className="font-['Roboto:Regular',_sans-serif] text-white text-[16px] flex-1 bg-transparent border-none outline-none placeholder:text-white/40 resize-none min-h-[24px] overflow-hidden caret-white animate-[blink_1s_ease-in-out_infinite]"
            style={{
              fontVariationSettings: "'wdth' 100",
              lineHeight: '1.5'
            }}
          />
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Upload Button with Tooltip */}
            <Tooltip text="Upload image" position="top">
              <button
                onClick={handleAttachClick}
                type="button"
                className="flex-none transition-all duration-200 hover:scale-110 cursor-pointer"
                aria-label="Upload image"
              >
                <svg className="size-[18px]" fill="none" viewBox="0 0 18 18">
                  <path d={dashboardSvgPaths.p110a4400} fill="#666666" />
                </svg>
              </button>
            </Tooltip>

            <input
              ref={fileInputRef}
              type="file"
              onChange={onFileChange}
              className="hidden"
              accept="image/*"
              multiple
            />

            {/* Send Button with Tooltip */}
            <Tooltip text="Send" position="top" disabled={isSendDisabled}>
              <button
                onClick={handleSubmit}
                type="button"
                disabled={isSendDisabled}
                className={`flex-none transition-all duration-200 ${isSendDisabled
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:scale-110 cursor-pointer'
                  }`}
                aria-label="Send"
              >
                <svg className="size-[28px]" fill="none" viewBox="0 0 28 28">
                  <path d={dashboardSvgPaths.p3865f100} fill="#666666" />
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}

