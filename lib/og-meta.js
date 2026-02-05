/**
 * Open Graph Meta Utilities
 * Shared constants and helpers for OG and Twitter Card meta tags
 */

const BASE_URL = "https://kblog.kervinapps.com";
const DEFAULT_OG_IMAGE = `${BASE_URL}/assets/images/kblog.jpg`;
const OG_DESCRIPTION_MAX_LENGTH = 160;

/**
 * Get absolute URL for article og:image
 * @param {string|null|undefined} featuredImageFilename - Article featured image filename (e.g. "article-slug.jpg")
 * @returns {string} Absolute URL to article image or default kblog.jpg
 */
function getArticleOgImage(featuredImageFilename) {
  if (!featuredImageFilename || typeof featuredImageFilename !== "string") {
    return DEFAULT_OG_IMAGE;
  }
  const trimmed = featuredImageFilename.trim();
  if (!trimmed) return DEFAULT_OG_IMAGE;
  return `${BASE_URL}/assets/images/articles/${trimmed}`;
}

/**
 * Format article og:title
 * @param {string} title - Article title
 * @returns {string}
 */
function formatArticleOgTitle(title) {
  return title && typeof title === "string" ? title.trim() : "";
}

/**
 * Format article og:description (excerpt, truncated if needed)
 * @param {string} excerpt - Article excerpt
 * @returns {string}
 */
function formatArticleOgDescription(excerpt) {
  if (!excerpt || typeof excerpt !== "string") return "";
  const trimmed = excerpt.trim().replace(/\s+/g, " ");
  if (trimmed.length <= OG_DESCRIPTION_MAX_LENGTH) return trimmed;
  return trimmed.substring(0, OG_DESCRIPTION_MAX_LENGTH - 3) + "...";
}

// Export for Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    BASE_URL,
    DEFAULT_OG_IMAGE,
    getArticleOgImage,
    formatArticleOgTitle,
    formatArticleOgDescription,
  };
}
