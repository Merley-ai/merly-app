"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAlbumsContext } from "@/contexts/AlbumsContext";
import { useHomepageData } from "@/hooks/home/useHomepageData";
import { useNavigateWithState } from "@/hooks";
import type { StyleTemplate, LookbookPreset } from "@/types";

import { HeroBanner } from "./HeroBanner";
import { StyleTemplateCards } from "./StyleTemplateCards";
import { LookbookPresetCards } from "./LookbookPresetCards";
import { AlbumsGrid } from "./AlbumsGrid";
import { TemplateDetailModal } from "../../../../components/ui/Modals/TemplateDetailModal";
import { LookbookCreationModal } from "./LookbookCreationModal";
// import { ContextualBanner } from "./ContextualBanner";
import { HomePageSkeleton } from "../../../../components/ui/Skeletons/HomePageSkeleton";

/**
 * Dashboard Home Page
 * 
 * Main homepage component that composes all sections:
 * 1. Hero Banner (Carousel)
 * 2. Style Templates (Horizontal Scroll)
 * 3. Lookbook Presets (Grid)
 * 4. User Albums (Grid)
 */
export function HomePageClient() {
    const router = useRouter();
    const { navigateWithState } = useNavigateWithState();
    const {
        albums,
        selectedAlbum,
        isLoading: albumsLoading,
    } = useAlbumsContext();

    const { data: homepageData, isLoading: homepageLoading } = useHomepageData();

    // Modal states
    const [selectedTemplate, setSelectedTemplate] = useState<StyleTemplate | null>(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [selectedLookbookPreset, setSelectedLookbookPreset] = useState<LookbookPreset | null>(null);
    const [isLookbookModalOpen, setIsLookbookModalOpen] = useState(false);

    // Contextual banner state (for generation progress)
    // TODO: Connect to actual generation state from context/API
    // const [showContextualBanner, setShowContextualBanner] = useState(false);

    // Template modal handlers
    const handleTemplateClick = useCallback((template: StyleTemplate) => {
        setSelectedTemplate(template);
        setIsTemplateModalOpen(true);
    }, []);

    const handleTemplateModalClose = useCallback(() => {
        setIsTemplateModalOpen(false);
        setSelectedTemplate(null);
    }, []);

    const navigateToAlbum = useCallback(
        (albumId?: string | null) => {
            const targetAlbumId = albumId || crypto.randomUUID();
            router.push(`/albums/${targetAlbumId}`);
        },
        [router]
    );

    const handleCreateNewAlbum = useCallback(() => {
        navigateToAlbum();
    }, [navigateToAlbum]);

    const handleApplyStyle = useCallback(
        (template: StyleTemplate, albumId: string | null) => {
            const targetAlbumId = albumId || crypto.randomUUID();
            console.log(`Navigating to /albums/${targetAlbumId} with style ${template.id}`);
            // Navigate to album with style state via History API
            navigateWithState(`/albums/${targetAlbumId}`, { styleId: template.id });
        },
        [navigateWithState]
    );

    // Lookbook modal handlers
    const handleLookbookClick = useCallback((preset: LookbookPreset) => {
        setSelectedLookbookPreset(preset);
        setIsLookbookModalOpen(true);
    }, []);

    const handleLookbookModalClose = useCallback(() => {
        setIsLookbookModalOpen(false);
        setSelectedLookbookPreset(null);
    }, []);

    const handleCreateLookbook = useCallback(
        (name: string, selectedStyles: StyleTemplate[]) => {
            // TODO: Complete the journey - create lookbook with selected styles
            console.log("Creating lookbook:", { name, selectedStyles });
            // For now, just close the modal
        },
        []
    );

    // Album click handler
    const handleAlbumClick = useCallback(
        (album: { id: string }) => {
            router.push(`/albums/${album.id}`);
        },
        [router]
    );

    // // Contextual banner handlers
    // const handleContinueGeneration = useCallback(() => {
    //     // TODO: Navigate to the album with active generation
    //     setShowContextualBanner(false);
    // }, []);

    // const handleDismissBanner = useCallback(() => {
    //     setShowContextualBanner(false);
    // }, []);

    // Show skeleton while loading homepage data
    if (homepageLoading || !homepageData) {
        return <HomePageSkeleton />;
    }

    const { heroCarouselItems, styleTemplates, lookbookPresets } = homepageData;

    return (
        <div className="flex-1 bg-black overflow-y-auto">
            {/* Hero Section */}
            <HeroBanner
                items={heroCarouselItems}
                onTemplateClick={handleTemplateClick}
                onLookbookClick={handleLookbookClick}
            />

            {/* Style Templates Section */}
            <StyleTemplateCards
                templates={styleTemplates}
                onTemplateClick={handleTemplateClick}
            />

            {/* Lookbook Presets Section */}
            <LookbookPresetCards
                presets={lookbookPresets}
                onPresetClick={handleLookbookClick}
            />

            {/* User Albums Section */}
            <AlbumsGrid
                albums={albums}
                isLoading={albumsLoading}
                onAlbumClick={handleAlbumClick}
            />

            {/* Template Detail Modal */}
            <TemplateDetailModal
                key={selectedTemplate?.id ?? 'no-template'}
                template={selectedTemplate}
                isOpen={isTemplateModalOpen}
                onClose={handleTemplateModalClose}
                albums={albums}
                selectedAlbum={selectedAlbum}
                onCreateNewAlbum={handleCreateNewAlbum}
                onApplyStyle={handleApplyStyle}
            />

            {/* Lookbook Creation Modal */}
            <LookbookCreationModal
                key={selectedLookbookPreset?.id ?? 'no-preset'}
                preset={selectedLookbookPreset}
                isOpen={isLookbookModalOpen}
                onClose={handleLookbookModalClose}
                styleTemplates={styleTemplates}
                onCreateLookbook={handleCreateLookbook}
            />

            {/* Contextual Banner for Generation Progress */}
            {/* <ContextualBanner
                albumName="Fashion Fusion"
                albumThumbnail={undefined}
                imagesGenerating={3}
                isVisible={showContextualBanner}
                onContinue={handleContinueGeneration}
                onDismiss={handleDismissBanner}
            /> */}
        </div>
    );
}

