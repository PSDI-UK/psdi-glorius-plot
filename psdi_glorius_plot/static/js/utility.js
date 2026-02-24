/**
 * @file Random utility functions not tied to any particular file
 * @date 2025-10-31
 * @author Bryan Gillis
 */

const ORCID_URL_BASE = "https://orcid.org/";

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

/**
 * Convert a forename into initials, e.g. John -> "J.", "Ann Marie" -> "A.M."
 * @param {String} forename 
 * @returns {String}
 */
export function forenameToInitials(forename) {
  let initials = "";
  const forenameSegments = forename.split(/\s+/u);
  forenameSegments.forEach((s) => {
    initials += `${s[0].toUpperCase()}.`;
  });
  return initials;
}

/**
 * Capitalize a surname as best as we can guess how it should be, e.g. SMITH -> Smith, O'FLANNERY -> O'Flannery,
 * MACDONALD -> MacDonald, MACKENZIE -> Mackenzie
 * @param {String} surname The surname to try to capitalize
 * @returns {String}
 */
export function surnameToCapitalized(s) {
  // Start by making the string all lowercase except the first letter, which should be upper case
  s = s[0].toUpperCase() + s.slice(1).toLowerCase();

  // Check for prefixes which commonly indicate the letter afterwards will be capitalised, and do so
  if (s.match(/^(Mc|O')/ui) && s.length > 2) {
    // "Mc" and "O'" prefixes are almost universally followed by another capital letter, so capitalize whatever the
    // next letter is
    s = s.slice(0, 2) + s[2].toUpperCase() + s.slice(3);
  } else if (s.startsWith("Mac") && !s.startsWith("Mack") && s.length > 3) {
    // "Mac" is usually but not always followed a capital letter, e.g. "MacDonald" but not "Mackenzie". The best
    // rule here is to capitalize after "Mac" but not "Mack"
    s = s.slice(0, 3) + s[3].toUpperCase() + s.slice(4);
  }

  return s;
}

/**
 * Check how a string is formatted to see if it's an ORCID - if it matches an ORCID format, convert it to a URL,
 * otherwise leave it as entered
 * @param {String} s
 * @returns {String}
 */
export function formatORCIDUrl(s) {
  const orcIdMatch = s.match(/^(\d\d\d\d)-?(\d\d\d\d)-?(\d\d\d\d)-?(\d\d\d\d)$/);
  if (orcIdMatch)
    s = `${ORCID_URL_BASE}${orcIdMatch[1]}-${orcIdMatch[2]}-${orcIdMatch[3]}-${orcIdMatch[4]}`;
  return s;
}

