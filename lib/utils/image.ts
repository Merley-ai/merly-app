/**
 * Triggers a download of an image from a given URL.
 * Creates a temporary anchor element and clicks it to start the download.
 * 
 * @param url - The URL of the image to download
 * @param filename - Optional custom filename (defaults to timestamp-based name)
 * 
 * @example
 * downloadImage('https://example.com/image.jpg', 'my-image.jpg')
 */
export function downloadImage(url: string, filename?: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `merley-image-${Date.now()}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

