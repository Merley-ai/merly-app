"use client";

import { ChevronLeft, Menu } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import dashboardSvgPaths from "@/lib/constants/dashboard-svg-paths";
import { UserMenu } from "@/components/auth";
import { Tooltip } from "@/components/ui/Tooltip";
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
            className={`bg-black flex-shrink-0 border-r-[0.5px] border-white/20 flex flex-col transition-all duration-300 overflow-visible ${isCollapsed ? 'w-[66px]' : 'w-[260px]'
                }`}
        >
            {/* Header with collapse button */}
            <div className={`px-3 py-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
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
                    className={`text-white/60 hover:text-white transition-colors cursor-pointer ${!isCollapsed ? 'ml-auto' : ''}`}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? (
                        <Menu className="size-6" />
                    ) : (
                        <ChevronLeft className="size-6" />
                    )}
                </button>
            </div>

            {isCollapsed ? (
                <>
                    {/* Collapsed View - Icons with Tooltips */}
                    <div className="flex flex-col items-center gap-3 px-3 mt-4 mb-4">
                        {/* Home Button */}
                        <Tooltip text="Home" position="right">
                            <button
                                onClick={onGoToHome}
                                className={`p-2 hover:bg-white/5 rounded transition-colors cursor-pointer ${isHomeView ? 'bg-white/10' : ''
                                    }`}
                            >
                                <svg className="size-[27px]" fill="none" viewBox="0 0 14 14">
                                    <path d="M7 1.5L1.5 6v6.5h4V9h3v3.5h4V6L7 1.5z" fill="#ddddddff" />
                                </svg>
                            </button>
                        </Tooltip>

                        {/* Create New Album Button */}
                        <Tooltip text="Create New Album" position="right">
                            <button
                                onClick={onCreateAlbum}
                                disabled={isLoading}
                                className="p-2 hover:bg-white/5 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="size-[17px]" fill="none" viewBox="0 0 14 14">
                                    <path d={dashboardSvgPaths.p2d909600} fill="#ddddddff" />
                                </svg>
                            </button>
                        </Tooltip>
                    </div>

                    {/* Albums List - Collapsed */}
                    <div className="flex-1 overflow-y-auto flex flex-col items-center gap-3 px-2 pt-2">
                        {albums.map((album, index) => (
                            <Tooltip key={album.id || `album-${index}`} text={album.name} position="right">
                                <button
                                    onClick={() => onSelectAlbum(album)}
                                    className={`size-[37px] rounded-4xl overflow-hidden flex-shrink-0 relative transition-all cursor-pointer ${!isHomeView && selectedAlbum?.id === album.id
                                        ? "ring-2 ring-white/40"
                                        : "hover:ring-2 hover:ring-white/60"
                                        }`}
                                >
                                    {album.thumbnail_url ? (
                                        <Image
                                            src={album.thumbnail_url}
                                            alt={album.name}
                                            fill
                                            className="object-cover"
                                            sizes="37px"
                                            quality={75}
                                            unoptimized={album.thumbnail_url.includes('fal.media') || album.thumbnail_url.includes('fal.ai')}
                                        />
                                    ) : (
                                        <div className="size-full bg-[#666666] flex items-center justify-center">
                                            <svg className="size-[16px] " fill="none" viewBox="0 0 14 14">
                                                {/* <path d={dashboardSvgPaths.p2d909600} fill="#666666" /> */}
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            </Tooltip>
                        ))}
                    </div>

                    {/* User Info - Collapsed */}
                    <div className="p-3 flex justify-center">
                        <Tooltip text="Account Profile" position="right">
                            <div>
                                <UserMenu />
                            </div>
                        </Tooltip>
                    </div>
                </>
            ) : (
                <>
                    {/* Expanded View */}
                    {/* Home Button */}
                    <button
                        onClick={onGoToHome}
                        className={`mx-3 mt-4 p-2 flex items-center gap-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer ${isHomeView ? 'bg-white/10' : ''
                            }`}
                    >
                        <div className="size-[37px] flex items-center justify-center flex-shrink-0">
                            <svg className="size-[27px]" fill="none" viewBox="0 0 14 14">
                                <path d="M7 1.5L1.5 6v6.5h4V9h3v3.5h4V6L7 1.5z" fill="#ddddddff" />
                            </svg>
                        </div>
                        <p
                            className="p-1 font-['Roboto:Regular',_sans-serif] text-white text-[14px]"
                            style={{ fontVariationSettings: "'wdth' 100" }}
                        >
                            Home
                        </p>
                    </button>

                    {/* Create New Album Button */}
                    <button
                        onClick={onCreateAlbum}
                        disabled={isLoading}
                        className="mx-3 mb-4 p-2 flex items-center gap-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="size-[37px] flex items-center justify-center flex-shrink-0">
                            <svg className="size-[17px]" fill="none" viewBox="0 0 14 14">
                                <path d={dashboardSvgPaths.p2d909600} fill="#ddddddff" />
                            </svg>
                        </div>
                        <p
                            className="p-1 font-['Roboto:Regular',_sans-serif] text-white text-[14px]"
                            style={{ fontVariationSettings: "'wdth' 100" }}
                        >
                            Create New Album
                        </p>
                    </button>

                    {/* Albums List */}
                    <div className="flex-1 overflow-y-auto px-3 space-y-3">
                        {/* Loading State - Skeleton Loaders */}
                        {isLoading && albums.length === 0 && (
                            <>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="w-full flex items-center gap-2 p-2 rounded-xl bg-white/5 animate-pulse">
                                        <div className="size-[37px] bg-white/7 rounded-4xl flex-shrink-0" />
                                        <div className="flex-1 h-4 bg-white/7 rounded" />
                                    </div>
                                ))}
                            </>
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
                                className={`w-full flex items-center gap-2 p-2 rounded-xl transition-colors cursor-pointer ${!isHomeView && selectedAlbum?.id === album.id ? "bg-white/20" : "hover:bg-white/20"
                                    }`}
                            >
                                <div className="size-[37px] bg-[#2e2e2e] rounded-4xl overflow-hidden flex-shrink-0 relative">
                                    {album.thumbnail_url ? (
                                        <Image
                                            src={album.thumbnail_url}
                                            alt={album.name}
                                            fill
                                            className="object-cover"
                                            sizes="37px"
                                            quality={75}
                                            unoptimized={album.thumbnail_url.includes('fal.media') || album.thumbnail_url.includes('fal.ai')}
                                        />
                                    ) : (
                                        <div className="size-full flex items-center justify-center">
                                            <svg className="size-[16px]" fill="none" viewBox="0 0 14 14">
                                                <path d={dashboardSvgPaths.p2d909600} fill="#ddddddff" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <p
                                    className={`p-1 font-['Roboto:Regular',_sans-serif] text-white text-[14px] text-left truncate ${!isHomeView && selectedAlbum?.id === album.id ? 'font-semibold' : ''}`}
                                    style={{ fontVariationSettings: "'wdth' 100" }}
                                >
                                    {album.name}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* User Info */}
                    <div className="p-7">
                        <UserMenu />
                    </div>
                </>
            )}
        </aside>
    );
}

