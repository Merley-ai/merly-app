/**
 * Downloads an image from a URL with a sanitized filename based on the description.
 * Handles cross-origin images by fetching as blob first.
 * 
 * @param url - The URL of the image to download
 * @param description - Optional description to use as the base filename
 * 
 * @example
 * await downloadImage('https://example.com/image.jpg', 'A beautiful sunset')
 * // Downloads as: a-beautiful-sunset.png
 */
export async function downloadImage(url: string, description?: string): Promise<void> {
  try {
    // Create filename from description or fallback to default
    let filename = 'image';
    if (description) {
      // Sanitize description: remove special chars, limit length, replace spaces with hyphens
      filename = description
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)
        .replace(/-+$/, ''); // Remove trailing hyphens
    }

    // Add timestamp to ensure uniqueness
    filename = `${filename}.png`;

    // Fetch image as blob to handle cross-origin downloads
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Failed to download image:', error);
    throw error;
  }
}

