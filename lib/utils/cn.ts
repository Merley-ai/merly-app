/**
 * Utility function for conditionally joining classNames together.
 * Useful for combining Tailwind CSS classes.
 * 
 * @param classes - Array of class names or conditional class objects
 * @returns Combined class string
 * 
 * @example
 * cn('base-class', isActive && 'active-class', 'another-class')
 * // Returns: "base-class active-class another-class" (if isActive is true)
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

