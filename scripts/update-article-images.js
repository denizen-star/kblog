/**
 * Batch Script: Update Existing Article HTML Files with Responsive Images
 * 
 * This script scans all existing article HTML files and updates their
 * featured image tags to use responsive images with srcset.
 * 
 * Usage: node scripts/update-article-images.js
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(__dirname, '..', 'articles');

/**
 * Generate responsive image HTML
 */
function generateResponsiveImageHTML(imagePath, imageName, altText) {
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

    // Sizes attribute for article pages
    const sizesAttr = '(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1128px';

    // Fallback to original image
    const fallbackSrc = imagePath;

    // Build inline styles
    const inlineStyles = 'width: 100%; height: auto; max-height: 500px; display: block; object-fit: contain; object-position: center; border-radius: 8px; background: rgba(255, 255, 255, 0.6); padding: 8px;';

    // Generate HTML
    return `<img src="${fallbackSrc}" 
     srcset="${srcset}" 
     sizes="${sizesAttr}" 
     alt="${altText}" 
     loading="lazy" 
     decoding="async" 
     style="${inlineStyles}" 
     id="featured-image">`;
}

/**
 * Extract image information from existing img tag
 */
function extractImageInfo(imgTag) {
    // Extract src
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/);
    if (!srcMatch) return null;

    const src = srcMatch[1];
    
    // Extract alt
    const altMatch = imgTag.match(/alt=["']([^"']*)["']/);
    const alt = altMatch ? altMatch[1] : '';

    // Extract image name from path
    const imageName = src.substring(src.lastIndexOf('/') + 1);

    return { src, alt, imageName };
}

/**
 * Update article HTML file
 */
function updateArticleHTML(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let updated = false;

        // Pattern to match article-featured-image div with img tag
        // Matches: <div class="article-featured-image">...<img ...>...</div>
        const imagePattern = /<div\s+class=["']article-featured-image["'][^>]*>[\s\S]*?<img([^>]+)id=["']featured-image["'][^>]*>[\s\S]*?<\/div>/g;

        content = content.replace(imagePattern, (match, imgAttributes) => {
            // Extract image info from the img tag
            const fullImgTag = `<img${imgAttributes}id="featured-image">`;
            const imageInfo = extractImageInfo(fullImgTag);

            if (!imageInfo) {
                console.log(`⚠️  Could not extract image info from: ${filePath}`);
                return match; // Return original if we can't parse it
            }

            updated = true;
            const responsiveImg = generateResponsiveImageHTML(imageInfo.src, imageInfo.imageName, imageInfo.alt);

            // Replace the img tag but keep the div structure
            return match.replace(/<img[^>]+id=["']featured-image["'][^>]*>/, responsiveImg);
        });

        // Also handle standalone img tags (without the div wrapper check)
        const standaloneImgPattern = /<img\s+src=["']([^"']*assets\/images\/articles\/[^"']+)["'][^>]*id=["']featured-image["'][^>]*>/g;
        
        content = content.replace(standaloneImgPattern, (match, src) => {
            const imageName = src.substring(src.lastIndexOf('/') + 1);
            const altMatch = match.match(/alt=["']([^"']*)["']/);
            const alt = altMatch ? altMatch[1] : '';
            
            updated = true;
            return generateResponsiveImageHTML(src, imageName, alt);
        });

        if (updated) {
            fs.writeFileSync(filePath, content, 'utf8');
            return true;
        }

        return false;
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
        return false;
    }
}

/**
 * Main function to process all article HTML files
 */
function updateAllArticleImages() {
    console.log('🚀 Starting batch update of article images...\n');
    console.log(`📁 Scanning directory: ${ARTICLES_DIR}\n`);

    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error(`❌ Error: Articles directory not found: ${ARTICLES_DIR}`);
        process.exit(1);
    }

    // Get all article directories
    const articleDirs = fs.readdirSync(ARTICLES_DIR).filter(item => {
        const itemPath = path.join(ARTICLES_DIR, item);
        return fs.statSync(itemPath).isDirectory();
    });

    if (articleDirs.length === 0) {
        console.log('ℹ️  No article directories found.');
        return;
    }

    console.log(`📄 Found ${articleDirs.length} article directory(ies)\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Process each article directory
    for (const articleDir of articleDirs) {
        const indexPath = path.join(ARTICLES_DIR, articleDir, 'index.html');

        if (!fs.existsSync(indexPath)) {
            console.log(`⏭️  Skipping ${articleDir}: no index.html found`);
            skipped++;
            continue;
        }

        try {
            console.log(`🔄 Processing: ${articleDir}/index.html`);
            const wasUpdated = updateArticleHTML(indexPath);

            if (wasUpdated) {
                updated++;
                console.log(`✅ Updated: ${articleDir}/index.html`);
            } else {
                skipped++;
                console.log(`⏭️  No changes needed: ${articleDir}/index.html`);
            }
        } catch (error) {
            errors++;
            console.error(`❌ Error processing ${articleDir}:`, error.message);
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('='.repeat(50));

    if (updated > 0) {
        console.log('\n✨ Batch update complete!');
        console.log(`   Updated ${updated} article HTML file(s) with responsive images.`);
    } else if (errors === 0) {
        console.log('\n✨ All article files already use responsive images!');
    }
}

// Run the script
if (require.main === module) {
    try {
        updateAllArticleImages();
        console.log('\n🎉 Done!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    }
}

module.exports = { updateAllArticleImages, generateResponsiveImageHTML };
