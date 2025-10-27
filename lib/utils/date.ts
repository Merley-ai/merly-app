/**
 * Formats a Date object into a short date string.
 * 
 * @param date - The Date object to format
 * @returns Formatted date string (e.g., "Oct 27")
 * 
 * @example
 * formatShortDate(new Date())
 * // Returns: "Oct 27"
 */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Formats a Date object into a full date string.
 * 
 * @param date - The Date object to format
 * @returns Formatted date string (e.g., "October 27, 2025")
 * 
 * @example
 * formatFullDate(new Date())
 * // Returns: "October 27, 2025"
 */
export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

