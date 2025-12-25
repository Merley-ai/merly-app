import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, withAuth } from '@/lib/auth0'
import { apiFetchService, Album as AlbumEndpoints } from '@/lib/api'
import type { HomepageData, StyleTemplate, LookbookPreset, HeroCarouselItem } from '@/types'

/**
 * Raw API response types (snake_case from backend)
 */
interface RawStyleTemplate {
    id: string;
    name: string;
    preview_image: string;
    description: string;
    tags: string[];
    example_images: string[];
    best_for: string[];
    is_user_created: boolean;
}

interface RawLookbookPreset {
    id: string;
    name: string;
    preview_image: string;
    description: string;
    tags: string[];
    page_count: number;
}

interface RawHeroCarouselItem {
    id: string;
    type: 'lookbook' | 'template';
    title: string;
    subtitle: string;
    cta_text: string;
    background_image: string;
    linked_item: RawStyleTemplate | RawLookbookPreset;
}

interface RawHomepageData {
    hero_carousel_items: RawHeroCarouselItem[];
    style_templates: RawStyleTemplate[];
    lookbook_presets: RawLookbookPreset[];
}

/**
 * Transform snake_case API response to camelCase TypeScript interfaces
 */
function transformStyleTemplate(raw: RawStyleTemplate): StyleTemplate {
    return {
        id: raw.id,
        name: raw.name,
        previewImage: raw.preview_image,
        description: raw.description,
        tags: raw.tags,
        exampleImages: raw.example_images,
        bestFor: raw.best_for,
        isUserCreated: raw.is_user_created,
    };
}

function transformLookbookPreset(raw: RawLookbookPreset): LookbookPreset {
    return {
        id: raw.id,
        name: raw.name,
        previewImage: raw.preview_image,
        description: raw.description,
        tags: raw.tags,
        pageCount: raw.page_count,
    };
}

function transformHeroCarouselItem(raw: RawHeroCarouselItem): HeroCarouselItem {
    const isLookbook = raw.type === 'lookbook';
    const linkedItem = isLookbook
        ? transformLookbookPreset(raw.linked_item as RawLookbookPreset)
        : transformStyleTemplate(raw.linked_item as RawStyleTemplate);

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

function transformHomepageData(raw: RawHomepageData): HomepageData {
    return {
        heroCarouselItems: raw.hero_carousel_items.map(transformHeroCarouselItem),
        styleTemplates: raw.style_templates.map(transformStyleTemplate),
        lookbookPresets: raw.lookbook_presets.map(transformLookbookPreset),
    };
}

/**
 * GET /api/home
 * 
 * Fetch homepage data including hero carousel items, style templates, and lookbook presets
 */
export const GET = withAuth<HomepageData>(async (_request: NextRequest) => {
    const accessToken = await getAccessToken()

    const response = await apiFetchService<{ message: string; data: RawHomepageData | null }>(
        AlbumEndpoints.getHomeTemplateStyles(),
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        }
    )

    if (!response.data) {
        return NextResponse.json({
            heroCarouselItems: [],
            styleTemplates: [],
            lookbookPresets: [],
        })
    }

    const homepageData = transformHomepageData(response.data)

    return NextResponse.json(homepageData)
})
