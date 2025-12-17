import { useState, useCallback } from "react";

interface UseImageLoadReturn {
    imageLoaded: boolean;
    imageError: boolean;
    handleLoad: () => void;
    handleError: () => void;
    reset: () => void;
}

/**
 * Custom hook for managing image loading state
 * 
 * Handles:
 * - Image loaded state
 * - Image error state
 * - Callbacks for onLoad and onError events
 * - Reset function for when image source changes
 */
export function useImageLoad(): UseImageLoadReturn {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleLoad = useCallback(() => {
        setImageLoaded(true);
        setImageError(false);
    }, []);

    const handleError = useCallback(() => {
        setImageError(true);
        setImageLoaded(false);
    }, []);

    const reset = useCallback(() => {
        setImageLoaded(false);
        setImageError(false);
    }, []);

    return {
        imageLoaded,
        imageError,
        handleLoad,
        handleError,
        reset,
    };
}
