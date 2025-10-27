"use client";

import { useState, useRef } from "react";
import { Paperclip } from "lucide-react";
import svgPaths from "@/lib/constants/website-svg-paths";

export function Hero() {
    const [inputValue, setInputValue] = useState("Wide angle full body lookbook shot with monogram tshirt");
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFile(file);
        }
    };

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <section className="px-4 pt-16 md:pt-24 pb-8">
            <h1 className="max-w-[775px] mx-auto text-center text-white leading-[45px]">
                <span className="font-['Circular_Std:Medium',_sans-serif] text-[32px] md:text-[48px]">Create </span>
                <span className="font-['Roboto_Serif'] italic text-[32px] md:text-[48px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100" }}>
                    Editorials
                </span>
                <span className="font-['Circular_Std:Medium',_sans-serif] text-[32px] md:text-[48px]"> for your fashion brand with AI</span>
            </h1>

            {/* Search Bar */}
            <div className="max-w-[556px] mx-auto mt-12 relative">
                <div className="bg-[#474747] opacity-75 rounded-[50px] px-6 py-3 border border-black flex items-center justify-between gap-3">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Wide angle full body lookbook shot with monogram tshirt"
                        className="font-['Roboto:Regular',_sans-serif] text-white/50 text-[16px] md:text-[18px] leading-[40px] flex-1 bg-transparent border-none outline-none placeholder:text-white/40"
                        style={{ fontVariationSettings: "'wdth' 100" }}
                    />
                    {uploadedFile && (
                        <span className="font-['Roboto:Regular',_sans-serif] text-white/80 text-[14px] hidden sm:block">
                            {uploadedFile.name}
                        </span>
                    )}
                    <button
                        onClick={handleAttachClick}
                        type="button"
                        className="flex-none hover:opacity-80 transition-opacity"
                        aria-label="Attach file"
                    >
                        <Paperclip className="size-5 text-[#858585]" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <button type="submit" className="flex-none rotate-90">
                        <svg className="size-[27px]" fill="none" viewBox="0 0 27 27">
                            <path d={svgPaths.p81bc480} fill="#858585" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    );
}

