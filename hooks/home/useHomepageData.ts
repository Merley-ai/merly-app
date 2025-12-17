import { useState, useEffect, useCallback } from 'react';
import type { HomepageData } from '@/types';

interface UseHomepageDataReturn {
    data: HomepageData | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Hook to fetch homepage data (hero carousel, style templates, lookbook presets)
 */
export function useHomepageData(): UseHomepageDataReturn {
    const [data, setData] = useState<HomepageData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHomepageData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/home');

            if (!response.ok) {
                throw new Error(`Failed to fetch homepage data: ${response.status}`);
            }

            const homepageData: HomepageData = await response.json();
            setData(homepageData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch homepage data';
            setError(errorMessage);
            console.error('Error fetching homepage data:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHomepageData();
    }, [fetchHomepageData]);

    return {
        data,
        isLoading,
        error,
        refetch: fetchHomepageData,
    };
}
