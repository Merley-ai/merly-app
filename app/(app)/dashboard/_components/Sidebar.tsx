"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import dashboardSvgPaths from "@/lib/constants/dashboard-svg-paths";
import { UserMenu } from "@/components/auth";
import type { Album } from "@/types";

interface SidebarProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    albums: Album[];
    selectedAlbum: Album | null;
    onSelectAlbum: (album: Album) => void;
    onCreateAlbum: () => void;
    onGoToHome: () => void;
    onBackToWebsite?: () => void;
    isLoading?: boolean;
    error?: string | null;
    isHomeView?: boolean;
}

export function Sidebar({
    isCollapsed,
    onToggleCollapse,
    albums,
    selectedAlbum,
    onSelectAlbum,
    onCreateAlbum,
    onGoToHome,
    onBackToWebsite,
    isLoading = false,
    error = null,
    isHomeView = false,
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
                        {onBackToWebsite ? (
                            <Link href="/" className="block hover:opacity-80 transition-opacity cursor-pointer">
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
                    {/* Home Button */}
                    <button
                        onClick={onGoToHome}
                        className={`mx-3 mt-4 px-3 py-2 flex items-center gap-3 hover:bg-white/5 rounded transition-colors ${isHomeView ? 'bg-white/10' : ''
                            }`}
                    >
                        <svg className="size-[14px]" fill="none" viewBox="0 0 14 14">
                            <path d="M7 1.5L1.5 6v6.5h4V9h3v3.5h4V6L7 1.5z" fill="#666666" />
                        </svg>
                        <p
                            className="font-['Roboto:Regular',_sans-serif] text-white text-[14px]"
                            style={{ fontVariationSettings: "'wdth' 100" }}
                        >
                            Home
                        </p>
                    </button>

                    {/* Create New Album Button */}
                    <button
                        onClick={onCreateAlbum}
                        disabled={isLoading}
                        className="mx-3 mb-4 px-3 py-2 flex items-center gap-3 hover:bg-white/5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        {/* Loading State */}
                        {isLoading && albums.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60"></div>
                                <p className="font-['Roboto:Regular',_sans-serif] text-white/60 text-[12px]">
                                    Loading albums...
                                </p>
                            </div>
                        )}

                        {/* Error State */}
                        {error && albums.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 px-4 space-y-2">
                                <p className="font-['Roboto:Regular',_sans-serif] text-red-400 text-[12px] text-center">
                                    Failed to load albums
                                </p>
                                <p className="font-['Roboto:Regular',_sans-serif] text-white/40 text-[11px] text-center">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!isLoading && !error && albums.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 px-4 space-y-2">
                                <p className="font-['Roboto:Regular',_sans-serif] text-white/60 text-[12px] text-center">
                                    No albums yet
                                </p>
                                <p className="font-['Roboto:Regular',_sans-serif] text-white/40 text-[11px] text-center">
                                    Create your first album to get started
                                </p>
                            </div>
                        )}

                        {/* Albums */}
                        {albums.map((album, index) => (
                            <button
                                key={album.id || `album-${index}`}
                                onClick={() => onSelectAlbum(album)}
                                className={`w-full flex items-center gap-3 p-2 rounded transition-colors ${selectedAlbum?.id === album.id ? "bg-white/10" : "hover:bg-white/5"
                                    }`}
                            >
                                <div className="size-[37px] bg-[#2e2e2e] rounded overflow-hidden flex-shrink-0">
                                    {album.thumbnail_url ? (
                                        <img
                                            src={album.thumbnail_url}
                                            alt={album.name}
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <div className="size-full flex items-center justify-center">
                                            <svg className="size-[16px]" fill="none" viewBox="0 0 14 14">
                                                <path d={dashboardSvgPaths.p2d909600} fill="#666666" />
                                            </svg>
                                        </div>
                                    )}
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
                        <UserMenu />
                    </div>
                </>
            )}
        </aside>
    );
}

