/**
 * Date formatting utilities for Colombian timezone (GMT-5)
 */

const COLOMBIA_TZ = "America/Bogota"; // GMT-5

/**
 * Format timestamp to Colombian date (e.g., "Jan 15, 2026")
 */
export function formatColombianDate(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) {
    return "Invalid Date";
  }
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: COLOMBIA_TZ,
  });
}

/**
 * Format timestamp to Colombian date without year (e.g., "Jan 15")
 */
export function formatColombianDateShort(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) {
    return "Invalid Date";
  }
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: COLOMBIA_TZ,
  });
}

/**
 * Format timestamp to Colombian time (e.g., "2:30 PM")
 */
export function formatColombianTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: COLOMBIA_TZ,
  });
}
