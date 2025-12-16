"use client";

import { useEffect } from "react";
import { ChevronLeft, Menu, Home, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { UserMenu } from "@/components/auth";
import { Tooltip } from "@/components/ui/Tooltip";
import { useUser } from "@/lib/auth0/client";
import { toast } from "@/lib/notifications";
import type { Album } from "@/types";
import type { LucideIcon } from "lucide-react";

interface NavButtonProps {
    icon: LucideIcon;
    label: string;
    isActive: boolean;
    isCollapsed: boolean;
    onClick: () => void;
    disabled?: boolean;
}

function NavButton({ icon: Icon, label, isActive, isCollapsed, onClick, disabled = false }: NavButtonProps) {
    const baseStyles = "flex items-center w-full px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer";
    const stateStyles = isActive
        ? "bg-neutral-800 text-white"
        : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white";
    const disabledStyles = disabled ? "disabled:opacity-50 disabled:cursor-not-allowed" : "";

    const button = (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${stateStyles} ${disabledStyles} ${isCollapsed ? "justify-center" : "gap-3"}`}
        >
            <Icon className="w-5 h-5" />
            {!isCollapsed && <span>{label}</span>}
        </button>
    );

    if (isCollapsed) {
        return (
            <Tooltip text={label} position="right">
                {button}
            </Tooltip>
        );
    }

    return button;
}

interface AlbumThumbnailProps {
    thumbnailUrl?: string;
    name: string;
}

function AlbumThumbnail({ thumbnailUrl, name }: AlbumThumbnailProps) {
    return (
        <div className="w-6 h-6 bg-neutral-800 rounded-full overflow-hidden flex-shrink-0 relative">
            {thumbnailUrl ? (
                <Image
                    src={thumbnailUrl}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="24px"
                    quality={75}
                    unoptimized={thumbnailUrl.includes('fal.media') || thumbnailUrl.includes('fal.ai')}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                </div>
            )}
        </div>
    );
}

interface AlbumButtonProps {
    album: Album;
    isActive: boolean;
    isCollapsed: boolean;
    onClick: () => void;
}

function AlbumButton({ album, isActive, isCollapsed, onClick }: AlbumButtonProps) {
    const baseStyles = "flex items-center w-full px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer";
    const stateStyles = isActive
        ? "bg-neutral-800 text-white"
        : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white";

    const button = (
        <button
            onClick={onClick}
            className={`${baseStyles} ${stateStyles} ${isCollapsed ? "justify-center" : "gap-3"}`}
        >
            <AlbumThumbnail thumbnailUrl={album.thumbnail_url} name={album.name} />
            {!isCollapsed && <span className="truncate">{album.name}</span>}
        </button>
    );

    if (isCollapsed) {
        return (
            <Tooltip text={album.name} position="right">
                {button}
            </Tooltip>
        );
    }

    return button;
}

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
    isNewAlbumView?: boolean;
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
    isNewAlbumView = false,
}: SidebarProps) {
    const { user } = useUser();

    // Show toast when album loading fails
    useEffect(() => {
        if (error) {
            toast.apiError(error, {
                context: 'sidebar.albums',
            })
        }
    }, [error])

    return (
        <aside
            className={`bg-black flex-shrink-0 border-r border-neutral-800/50 flex flex-col h-full transition-all duration-200 ease-out font-['Roboto',_sans-serif] ${isCollapsed ? 'w-[66px] overflow-hidden' : 'w-[240px]'
                }`}
        >
            {/* Header with collapse button */}
            <div className={`p-4 pb-2 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <>
                        {onBackToWebsite ? (
                            <Link href="/" className="block hover:opacity-80 transition-opacity cursor-pointer">
                                <span className="font-['Roboto_Serif'] text-[20px] tracking-tight text-white">
                                    Merley
                                </span>
                            </Link>
                        ) : (
                            <span className="font-['Roboto_Serif'] text-[20px] tracking-tight text-white">
                                Merley
                            </span>
                        )}
                    </>
                )}
                <button
                    onClick={onToggleCollapse}
                    className="p-1 rounded text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? (
                        <Menu className="w-5 h-5" />
                    ) : (
                        <ChevronLeft className="w-5 h-5" />
                    )}
                </button>
            </div>

            {isCollapsed ? (
                <>
                    {/* Collapsed View - Icons with Tooltips */}
                    <nav className="flex flex-col items-center px-2 py-4">
                        <NavButton
                            icon={Home}
                            label="Home"
                            isActive={isHomeView}
                            isCollapsed={true}
                            onClick={onGoToHome}
                        />
                        <NavButton
                            icon={Plus}
                            label="Create New Album"
                            isActive={isNewAlbumView}
                            isCollapsed={true}
                            onClick={onCreateAlbum}
                            disabled={isLoading}
                        />
                    </nav>

                    {/* Albums List - Collapsed */}
                    <div className="mt-0.5 space-y-1.5 flex-1 overflow-y-auto px-2">
                        {albums.map((album, index) => (
                            <AlbumButton
                                key={album.id || `album-${index}`}
                                album={album}
                                isActive={!isHomeView && !isNewAlbumView && selectedAlbum?.id === album.id}
                                isCollapsed={true}
                                onClick={() => onSelectAlbum(album)}
                            />
                        ))}
                    </div>

                    {/* User Info - Collapsed */}
                    <div className="p-3 flex justify-center">
                        <Tooltip
                            text={
                                user ? (
                                    <div className="whitespace-nowrap">
                                        <p className="font-semibold">{user.name || user.nickname || 'User'}</p>
                                        <p className="text-[12px] text-black/70">{user.email}</p>
                                    </div>
                                ) : (
                                    "Account Profile"
                                )
                            }
                            position="right"
                        >
                            <div>
                                <UserMenu isCollapsed={true} />
                            </div>
                        </Tooltip>
                    </div>
                </>
            ) : (
                <>
                    {/* Expanded View */}
                    {/* Navigation Menu */}
                    <nav className="px-2 py-4">
                        <NavButton
                            icon={Home}
                            label="Home"
                            isActive={isHomeView}
                            isCollapsed={false}
                            onClick={onGoToHome}
                        />
                        <NavButton
                            icon={Plus}
                            label="Create New Album"
                            isActive={isNewAlbumView}
                            isCollapsed={false}
                            onClick={onCreateAlbum}
                            disabled={isLoading}
                        />
                    </nav>

                    {/* Albums List */}
                    <div className="mt-0.5 space-y-1.5 flex-1 overflow-y-auto px-2">
                        {/* Loading State - Skeleton Loaders */}
                        {isLoading && albums.length === 0 && (
                            <>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg bg-neutral-800/30 animate-pulse">
                                        <div className="w-6 h-6 bg-neutral-800 rounded-full flex-shrink-0" />
                                        <div className="flex-1 h-4 bg-neutral-800 rounded" />
                                    </div>
                                ))}
                            </>
                        )}

                        {/* Error State */}
                        {error && albums.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 px-4 space-y-2">
                                <p className="text-red-400 text-xs text-center">
                                    Failed to load albums
                                </p>
                                <p className="text-neutral-500 text-xs text-center">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!isLoading && !error && albums.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 px-4 space-y-2">
                                <p className="text-neutral-400 text-xs text-center">
                                    No albums yet
                                </p>
                                <p className="text-neutral-500 text-xs text-center">
                                    Create your first album to get started
                                </p>
                            </div>
                        )}

                        {/* Albums */}
                        {albums.map((album, index) => (
                            <AlbumButton
                                key={album.id || `album-${index}`}
                                album={album}
                                isActive={!isHomeView && !isNewAlbumView && selectedAlbum?.id === album.id}
                                isCollapsed={false}
                                onClick={() => onSelectAlbum(album)}
                            />
                        ))}
                    </div>

                    {/* User Info */}
                    <div className="p-4">
                        <UserMenu isCollapsed={false} />
                    </div>
                </>
            )}
        </aside>
    );
}

