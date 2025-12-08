/**
 * Image Utilities
 * Helper functions for generating responsive image HTML
 */

/**
 * Generate responsive image HTML with srcset and lazy loading
 * @param {string} imagePath - Full path to the image (e.g., "../../assets/images/articles/image.jpg")
 * @param {string} imageName - Just the filename (e.g., "image.jpg")
 * @param {string} altText - Alt text for the image
 * @param {Object} options - Optional configuration
 * @param {boolean} options.isArticlePage - Whether this is for an article page (affects path prefix)
 * @param {number} options.maxHeight - Maximum height in pixels (default: 500 for article pages, 300 for listing)
 * @returns {string} HTML string for responsive image
 */
function generateResponsiveImageHTML(imagePath, imageName, altText, options = {}) {
    const {
        isArticlePage = false,
        maxHeight = isArticlePage ? 500 : 300
    } = options;

    // Extract image name and extension
    const imageExt = imageName.substring(imageName.lastIndexOf('.'));
    const imageNameWithoutExt = imageName.substring(0, imageName.lastIndexOf('.'));

    // Get base path (directory part)
    const basePath = imagePath.substring(0, imagePath.lastIndexOf('/') + 1);

    // Build srcset for responsive images (400w, 600w, 900w, 1200w)
    const sizes = [400, 600, 900, 1200];
    const srcsetParts = sizes.map(size => {
        const responsiveImagePath = `${basePath}${imageNameWithoutExt}-${size}w${imageExt}`;
        return `${responsiveImagePath} ${size}w`;
    });
    const srcset = srcsetParts.join(', ');

    // Sizes attribute for responsive image selection
    // For article pages: full width on mobile, 90vw on tablet, fixed 1128px on desktop
    // For listing pages: responsive grid layout
    const sizesAttr = isArticlePage 
        ? '(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1128px'
        : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';

    // Fallback to original image if responsive sizes don't exist
    const fallbackSrc = imagePath;

    // Build inline styles - ensure white transparent background
    const inlineStyles = `width: 100%; height: auto; max-height: ${maxHeight}px; display: block; object-fit: contain; object-position: center; border-radius: 8px; background: rgba(255, 255, 255, 0.6) !important; padding: 8px;`;

    // Generate HTML
    return `<img 
                        src="${fallbackSrc}" 
                        srcset="${srcset}" 
                        sizes="${sizesAttr}" 
                        alt="${altText}" 
                        loading="lazy" 
                        decoding="async" 
                        style="${inlineStyles}" 
                        id="featured-image">`;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateResponsiveImageHTML };
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.imageUtils = { generateResponsiveImageHTML };
}
