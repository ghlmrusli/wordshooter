// ---------------------------------------------------------------------------
// Word Shooter - Share / copy-to-clipboard utilities
// Ported from the original copyToClipboard() and fallbackCopy() functions.
// ---------------------------------------------------------------------------

/**
 * Fallback clipboard copy using the legacy execCommand API.
 * Used when the Clipboard API is unavailable or fails.
 */
function fallbackCopy(text: string): boolean {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  } catch {
    document.body.removeChild(textArea);
    return false;
  }
}

/**
 * Copy text to the clipboard using the modern Clipboard API with
 * a fallback to document.execCommand('copy').
 * Returns `true` if the copy succeeded.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopy(text);
    }
  }
  return fallbackCopy(text);
}

/**
 * Share game results using the Web Share API when available,
 * falling back to clipboard copy.
 *
 * @param statsText - The formatted stats text to share/copy.
 * @returns `true` if the share/copy succeeded.
 */
export async function shareResults(statsText: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: 'Type to Shoot - My Results',
        text: statsText,
      });
      return true;
    } catch (err: unknown) {
      // User cancelled the share sheet -- not an error
      if (err instanceof Error && err.name === 'AbortError') {
        return false;
      }
      // Share failed for another reason -- fall back to clipboard
      return copyToClipboard(statsText);
    }
  }
  return copyToClipboard(statsText);
}
