/**
 * Utility functions for formatting values
 */

/**
 * Format a number with K, M, B suffixes for compact display
 * @param num - The number to format
 * @returns Formatted string (e.g., 1.5K, 2.3M, 1.2B)
 */
export function formatNumber(num: number): string {
  if (num === 0) return "0";

  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  }

  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }

  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }

  return num.toString();
}
