// ---------------------------------------------------------------------------
// Word Shooter - Time formatting utilities
// ---------------------------------------------------------------------------

/**
 * Format a duration in seconds to a MM:SS string.
 * Examples:
 *   formatTime(0)   => "0:00"
 *   formatTime(65)  => "1:05"
 *   formatTime(600) => "10:00"
 */
export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format milliseconds to a MM:SS string.
 */
export function formatTimeMs(ms: number): string {
  return formatTime(ms / 1000);
}
