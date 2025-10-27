"use client";

import { useState, useEffect } from "react";

interface ThinkingAnimationProps {
    text: string;
}

export function ThinkingAnimation({ text }: ThinkingAnimationProps) {
    const [dots, setDots] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-start gap-3 py-4">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3.5a1 1 0 011 1V10h5.5a1 1 0 110 2H11v5.5a1 1 0 11-2 0V12H3.5a1 1 0 110-2H9V4.5a1 1 0 011-1z" />
                </svg>
            </div>
            <p
                className="font-['Roboto:Regular',_sans-serif] text-white/60 text-[14px] pt-1.5"
                style={{ fontVariationSettings: "'wdth' 100" }}
            >
                {text}{dots}
            </p>
        </div>
    );
}

