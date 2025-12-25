/**
 * Homepage Data Types
 * 
 * Type definitions for the homepage components including
 * hero carousel, style templates, and lookbook presets.
 */

/**
 * Style Template - Individual aesthetic/style applied to images
 */
export interface StyleTemplate {
    id: string;
    name: string;
    previewImage: string;
    description: string;
    tags: string[];
    exampleImages: string[];
    bestFor: string[];
    isUserCreated: boolean;
}

/**
 * Lookbook Preset - Multi-page structured collection template
 */
export interface LookbookPreset {
    id: string;
    name: string;
    previewImage: string;
    description: string;
    tags: string[];
    pageCount: number;
}

/**
 * Hero Carousel Item - Slide data for the hero banner
 */
export interface HeroCarouselItem {
    id: string;
    type: 'lookbook' | 'template';
    title: string;
    subtitle: string;
    ctaText: string;
    backgroundImage: string;
    linkedItem: LookbookPreset | StyleTemplate;
}

/**
 * Homepage Data - Complete data structure for the homepage
 */
export interface HomepageData {
    heroCarouselItems: HeroCarouselItem[];
    styleTemplates: StyleTemplate[];
    lookbookPresets: LookbookPreset[];
}
