/**
 * Date Utility Functions
 * 
 * Provides reusable date formatting and manipulation utilities
 */

/**
 * Humanize a date to a readable format: "14 November 2025"
 * 
 * @param date - The date to format (Date object or timestamp)
 * @returns Formatted date string in "DD Month YYYY" format
 * 
 * @example
 * ```typescript
 * humanizeDate(new Date('2025-11-14'))
 * // Returns: "14 November 2025"
 * 
 * humanizeDate(Date.now())
 * // Returns: "14 November 2025" (current date)
 * ```
 */
export function humanizeDate(date: Date | number): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date;

  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-US', { month: 'long' });
  const year = dateObj.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Check if two dates are on the same day
 * 
 * @param date1 - First date to compare
 * @param date2 - Second date to compare
 * @returns True if both dates are on the same day
 * 
 * @example
 * ```typescript
 * isSameDay(new Date('2025-11-14T10:00:00'), new Date('2025-11-14T15:00:00'))
 * // Returns: true
 * 
 * isSameDay(new Date('2025-11-14'), new Date('2025-11-15'))
 * // Returns: false
 * ```
 */
export function isSameDay(date1: Date | number, date2: Date | number): boolean {
  const d1 = typeof date1 === 'number' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'number' ? new Date(date2) : date2;

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Get relative time string (e.g., "2 hours ago", "just now")
 * 
 * @param date - The date to get relative time for
 * @returns Human-readable relative time string
 * 
 * @example
 * ```typescript
 * getRelativeTime(Date.now() - 60000)
 * // Returns: "1 minute ago"
 * 
 * getRelativeTime(Date.now() - 3600000)
 * // Returns: "1 hour ago"
 * ```
 */
export function getRelativeTime(date: Date | number): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return humanizeDate(dateObj);
  }
}
