import type { ReactNode } from "react";

interface TimelineLayoutProps {
    albumName: string;
    children: ReactNode;
}

/**
 * Timeline Layout Wrapper
 * 
 * Provides consistent container and header structure for all timeline views.
 */
export function TimelineLayout({ albumName, children }: TimelineLayoutProps) {
    return (
        <main className="bg-[#1a1a1a] w-[530px] flex-shrink-0 border-r-[1px] border-white/20 flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-[#6b6b6b]/30">
                <p
                    className="font-['Roboto:Regular',_sans-serif] text-white text-[14px]"
                    style={{ fontVariationSettings: "'wdth' 100" }}
                >
                    {albumName}
                </p>
            </header>
            {children}
        </main>
    );
}
