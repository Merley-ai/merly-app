"use client";

import { ChevronLeft, ChevronRight, Link } from "lucide-react";
import dashboardSvgPaths from "@/lib/constants/dashboard-svg-paths";
import type { Album } from "@/types";

interface SidebarProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    albums: Album[];
    selectedAlbum: Album;
    onSelectAlbum: (album: Album) => void;
    onCreateAlbum: () => void;
    onBackToHome?: () => void;
}

export function Sidebar({
    isCollapsed,
    onToggleCollapse,
    albums,
    selectedAlbum,
    onSelectAlbum,
    onCreateAlbum,
    onBackToHome,
}: SidebarProps) {
    return (
        <aside
            className={`bg-black flex-shrink-0 border-r border-[#6b6b6b] flex flex-col transition-all duration-300 ${isCollapsed ? 'w-[60px]' : 'w-[294px]'
                }`}
        >
            {/* Header with collapse button */}
            <div className="px-3 py-4 flex items-center justify-between">
                {!isCollapsed && (
                    <>
                        {onBackToHome ? (
                            <Link href="/" className="p-4 block hover:opacity-80 transition-opacity cursor-pointer">
                                <p className="font-['Roboto_Serif'] text-white text-[20px]">
                                    Merley
                                </p>
                            </Link>
                        ) : (
                            <p
                                className="font-['Roboto_Serif'] text-white text-[20px]"
                                style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100" }}
                            >
                                Merley
                            </p>
                        )}
                    </>
                )}
                <button
                    onClick={onToggleCollapse}
                    className="text-white/60 hover:text-white transition-colors ml-auto"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? (
                        <ChevronRight className="size-5" />
                    ) : (
                        <ChevronLeft className="size-5" />
                    )}
                </button>
            </div>

            {!isCollapsed && (
                <>
                    {/* Create New Album Button */}
                    <button
                        onClick={onCreateAlbum}
                        className="mx-3 my-4 px-3 py-2 flex items-center gap-3 hover:bg-white/5 rounded transition-colors"
                    >
                        <svg className="size-[14px]" fill="none" viewBox="0 0 14 14">
                            <path d={dashboardSvgPaths.p2d909600} fill="#666666" />
                        </svg>
                        <p
                            className="font-['Roboto:Regular',_sans-serif] text-white text-[14px]"
                            style={{ fontVariationSettings: "'wdth' 100" }}
                        >
                            Create New Album
                        </p>
                    </button>

                    {/* Albums List */}
                    <div className="flex-1 overflow-y-auto px-3 space-y-3">
                        {albums.map((album) => (
                            <button
                                key={album.id}
                                onClick={() => onSelectAlbum(album)}
                                className={`w-full flex items-center gap-3 p-2 rounded transition-colors ${selectedAlbum.id === album.id ? "bg-white/10" : "hover:bg-white/5"
                                    }`}
                            >
                                <div className="size-[37px] bg-[#2e2e2e] rounded overflow-hidden flex-shrink-0">
                                    <img
                                        src={album.thumbnail}
                                        alt={album.name}
                                        className="size-full object-cover"
                                    />
                                </div>
                                <p
                                    className="font-['Roboto:Regular',_sans-serif] text-white text-[14px] text-left truncate"
                                    style={{ fontVariationSettings: "'wdth' 100" }}
                                >
                                    {album.name}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* User Info */}
                    <div className="p-4 border-t border-[#6b6b6b]/30">
                        <p
                            className="font-['Roboto:Regular',_sans-serif] text-white text-[14px]"
                            style={{ fontVariationSettings: "'wdth' 100" }}
                        >
                            Mark Kiarie
                        </p>
                        <p
                            className="font-['Roboto:Regular',_sans-serif] text-neutral-300 text-[12px]"
                            style={{ fontVariationSettings: "'wdth' 100" }}
                        >
                            Pro
                        </p>
                    </div>
                </>
            )}
        </aside>
    );
}

