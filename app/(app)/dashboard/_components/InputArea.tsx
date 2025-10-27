"use client";

import { useRef } from "react";
import dashboardSvgPaths from "@/lib/constants/dashboard-svg-paths";

interface InputAreaProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  uploadedFiles: File[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}

export function InputArea({
  inputValue,
  onInputChange,
  uploadedFiles,
  onFileChange,
  onSubmit,
}: InputAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4 border-t border-[#6b6b6b]/30">
      <div className="bg-[#2e2e2e] rounded-[29px] px-6 py-4 flex flex-col gap-3">
        {/* Uploaded Image Thumbnails */}
        {uploadedFiles.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {uploadedFiles.map((file, idx) => (
              <div
                key={idx}
                className="w-[71px] h-[71px] bg-black rounded overflow-hidden relative flex-shrink-0"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Upload ${idx + 1}`}
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

        {/* Text Area and Buttons */}
        <div className="flex items-end gap-3">
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
                onSubmit();
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
            <button
              onClick={handleAttachClick}
              type="button"
              className="flex-none hover:opacity-80 transition-opacity cursor-pointer"
              aria-label="Attach file"
            >
              <svg className="size-[18px]" fill="none" viewBox="0 0 18 18">
                <path d={dashboardSvgPaths.p110a4400} fill="#666666" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={onFileChange}
              className="hidden"
              accept="image/*"
              multiple
            />
            <button
              onClick={onSubmit}
              type="button"
              className="flex-none hover:opacity-80 transition-opacity cursor-pointer"
              aria-label="Send"
            >
              <svg className="size-[28px]" fill="none" viewBox="0 0 28 28">
                <path d={dashboardSvgPaths.p3865f100} fill="#666666" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

