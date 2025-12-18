import { useState, useEffect, useCallback } from 'react';
import type { StyleTemplate } from '@/types';

interface UseStyleTemplatesReturn {
    styles: StyleTemplate[];
    isLoading: boolean;
    error: string | null;
    selectedStyle: StyleTemplate | null;
    setSelectedStyle: (style: StyleTemplate | null) => void;
    selectStyleById: (styleId: string) => void;
    refetch: () => Promise<void>;
}

/**
 * Hook to manage style templates state
 * Fetches available styles and manages selected style for album generation
 */
export function useStyleTemplates(): UseStyleTemplatesReturn {
    const [styles, setStyles] = useState<StyleTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<StyleTemplate | null>(null);

    const fetchStyles = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/home');

            if (!response.ok) {
                throw new Error(`Failed to fetch styles: ${response.status}`);
            }

            const data = await response.json();
            setStyles(data.styleTemplates || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch styles';
            setError(errorMessage);
            console.error('Error fetching style templates:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStyles();
    }, [fetchStyles]);

    const selectStyleById = useCallback((styleId: string) => {
        const style = styles.find(s => s.id === styleId);
        if (style) {
            setSelectedStyle(style);
        }
    }, [styles]);

    return {
        styles,
        isLoading,
        error,
        selectedStyle,
        setSelectedStyle,
        selectStyleById,
        refetch: fetchStyles,
    };
}
