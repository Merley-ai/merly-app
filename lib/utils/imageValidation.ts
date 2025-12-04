/**
 * Image Validation Utilities
 * 
 * Validates image dimensions for upload constraints
 */

export interface ImageDimensionLimits {
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
}

export const IMAGE_DIMENSION_LIMITS: ImageDimensionLimits = {
    minWidth: 200,
    minHeight: 200,
    maxWidth: 4096,
    maxHeight: 4096,
};

export interface ImageValidationResult {
    isValid: boolean;
    error?: 'too_small' | 'too_large';
    message?: string;
    dimensions?: { width: number; height: number };
}

/**
 * Get image dimensions from a File object
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

/**
 * Validate image dimensions against limits
 */
export async function validateImageDimensions(
    file: File,
    limits: ImageDimensionLimits = IMAGE_DIMENSION_LIMITS
): Promise<ImageValidationResult> {
    try {
        const dimensions = await getImageDimensions(file);
        const { width, height } = dimensions;

        // Check minimum size
        if (width < limits.minWidth || height < limits.minHeight) {
            return {
                isValid: false,
                error: 'too_small',
                message: `Resolution for uploaded image is too low. Minimum size: ${limits.minWidth} × ${limits.minHeight} pixels.`,
                dimensions,
            };
        }

        // Check maximum size
        if (width > limits.maxWidth || height > limits.maxHeight) {
            return {
                isValid: false,
                error: 'too_large',
                message: `The uploaded image exceeds the upload limit. Maximum size: ${limits.maxWidth} × ${limits.maxHeight} pixels.`,
                dimensions,
            };
        }

        return { isValid: true, dimensions };
    } catch {
        return {
            isValid: false,
            error: 'too_small',
            message: 'Failed to validate image dimensions.',
        };
    }
}

/**
 * Validate multiple images and return results for each
 */
export async function validateMultipleImages(
    files: File[],
    limits: ImageDimensionLimits = IMAGE_DIMENSION_LIMITS
): Promise<Map<File, ImageValidationResult>> {
    const results = new Map<File, ImageValidationResult>();

    await Promise.all(
        files.map(async (file) => {
            const result = await validateImageDimensions(file, limits);
            results.set(file, result);
        })
    );

    return results;
}
