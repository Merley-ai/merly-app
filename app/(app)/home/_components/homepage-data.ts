/**
 * Homepage Data Layer
 * 
 * Transforms mock JSON data into typed objects for the homepage.
 * TODO: Replace with API endpoint that fetches homepage data from backend
 */

import type {
    HeroCarouselItem,
    StyleTemplate,
    LookbookPreset,
    HomepageData,
} from '@/types';

import homepageDataJson from './hompage-data-obj.json';

/**
 * Transform snake_case JSON to camelCase TypeScript interfaces
 */
function transformStyleTemplate(raw: {
    id: string;
    name: string;
    preview_image: string;
    description: string;
    tags: string[];
    example_images: string[];
    is_user_created: boolean;
}): StyleTemplate {
    return {
        id: raw.id,
        name: raw.name,
        previewImage: raw.preview_image,
        description: raw.description,
        tags: raw.tags,
        exampleImages: raw.example_images,
        isUserCreated: raw.is_user_created,
    };
}

function transformLookbookPreset(raw: {
    id: string;
    name: string;
    preview_image: string;
    description: string;
    tags: string[];
    page_count: number;
}): LookbookPreset {
    return {
        id: raw.id,
        name: raw.name,
        previewImage: raw.preview_image,
        description: raw.description,
        tags: raw.tags,
        pageCount: raw.page_count,
    };
}

function transformHeroCarouselItem(raw: {
    id: string;
    type: 'lookbook' | 'template';
    title: string;
    subtitle: string;
    cta_text: string;
    background_image: string;
    linked_item: {
        id: string;
        name: string;
        preview_image: string;
        description: string;
        tags: string[];
        page_count?: number;
        example_images?: string[];
        is_user_created?: boolean;
    };
}): HeroCarouselItem {
    const linkedItem = raw.type === 'lookbook'
        ? transformLookbookPreset({
            id: raw.linked_item.id,
            name: raw.linked_item.name,
            preview_image: raw.linked_item.preview_image,
            description: raw.linked_item.description,
            tags: raw.linked_item.tags,
            page_count: raw.linked_item.page_count ?? 0,
        })
        : transformStyleTemplate({
            id: raw.linked_item.id,
            name: raw.linked_item.name,
            preview_image: raw.linked_item.preview_image,
            description: raw.linked_item.description,
            tags: raw.linked_item.tags,
            example_images: raw.linked_item.example_images ?? [],
            is_user_created: raw.linked_item.is_user_created ?? false,
        });

    return {
        id: raw.id,
        type: raw.type,
        title: raw.title,
        subtitle: raw.subtitle,
        ctaText: raw.cta_text,
        backgroundImage: raw.background_image,
        linkedItem,
    };
}

/**
 * Get homepage data from mock JSON
 * TODO: Replace with API call to fetch homepage data
 */
export function getHomepageData(): HomepageData {
    const rawData = homepageDataJson as {
        hero_arousel_items: Array<{
            id: string;
            type: 'lookbook' | 'template';
            title: string;
            subtitle: string;
            cta_text: string;
            background_image: string;
            linked_item: {
                id: string;
                name: string;
                preview_image: string;
                description: string;
                tags: string[];
                page_count?: number;
                example_images?: string[];
                is_user_created?: boolean;
            };
        }>;
        style_templates: Array<{
            id: string;
            name: string;
            preview_image: string;
            description: string;
            tags: string[];
            example_images: string[];
            is_user_created: boolean;
        }>;
        lookbook_presets: Array<{
            id: string;
            name: string;
            preview_image: string;
            description: string;
            tags: string[];
            page_count: number;
        }>;
    };

    return {
        heroCarouselItems: rawData.hero_arousel_items.map(transformHeroCarouselItem),
        styleTemplates: rawData.style_templates.map(transformStyleTemplate),
        lookbookPresets: rawData.lookbook_presets.map(transformLookbookPreset),
    };
}

// Export pre-transformed data for convenience
const homepageData = getHomepageData();

export const heroCarouselItems = homepageData.heroCarouselItems;
export const styleTemplates = homepageData.styleTemplates;
export const lookbookPresets = homepageData.lookbookPresets;
