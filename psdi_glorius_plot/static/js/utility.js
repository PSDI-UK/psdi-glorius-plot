/**
 * @file Random utility functions not tied to any particular file
 * @date 2025-10-31
 * @author Bryan Gillis
 */

/**
 * Clamps a value between an allowed minimum and maximum
 * @param {number} x The value to be clamped
 * @param {number} min The minimum allowed value
 * @param {number} max The maximum allowed value
 * @returns {number} The clamped value
 */
export function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

let webkitMode = null;

/**
 * Get whether or not a WebKit-based browser such as Safari is being used
 * @returns {boolean}
 */
export function getWebKitMode() {
  if (webkitMode === null) {
    if (typeof window.webkitConvertPointFromNodeToPage === 'function')
      webkitMode = true;
    else
      webkitMode = false;
  }
  return webkitMode;
}