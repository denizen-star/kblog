/**
 * Batch Script: Generate Responsive Image Sizes
 * 
 * This script processes all existing images in assets/images/articles/
 * and generates responsive sizes (400w, 600w, 900w, 1200w) for each image.
 * 
 * Usage: node scripts/generate-image-sizes.js
 */

const fs = require('fs');
const path = require('path');
const { processUploadedImage } = require('../lib/imageProcessor');

const IMAGES_DIR = path.join(__dirname, '..', 'assets', 'images', 'articles');
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

/**
 * Check if a file is an image file
 */
function isImageFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Check if responsive sizes already exist for an image
 */
function hasResponsiveSizes(imagePath) {
    const ext = path.extname(imagePath);
    const baseName = path.parse(imagePath).name;
    
    const sizes = [400, 600, 900, 1200];
    for (const width of sizes) {
        const sizePath = path.join(IMAGES_DIR, `${baseName}-${width}w${ext}`);
        if (!fs.existsSync(sizePath)) {
            return false;
        }
    }
    return true;
}

/**
 * Main function to process all images
 */
async function generateAllImageSizes() {
    console.log('🚀 Starting batch image size generation...\n');
    console.log(`📁 Scanning directory: ${IMAGES_DIR}\n`);

    // Check if images directory exists
    if (!fs.existsSync(IMAGES_DIR)) {
        console.error(`❌ Error: Images directory not found: ${IMAGES_DIR}`);
        process.exit(1);
    }

    // Get all files in the images directory
    const files = fs.readdirSync(IMAGES_DIR);
    const imageFiles = files.filter(file => {
        const filePath = path.join(IMAGES_DIR, file);
        return fs.statSync(filePath).isFile() && isImageFile(file);
    });

    if (imageFiles.length === 0) {
        console.log('ℹ️  No image files found in the directory.');
        return;
    }

    console.log(`📸 Found ${imageFiles.length} image file(s) to process\n`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    // Process each image
    for (const imageFile of imageFiles) {
        const imagePath = path.join(IMAGES_DIR, imageFile);
        
        // Skip if it's already a responsive size (contains -400w, -600w, etc.)
        if (/\d+w\.[^.]+$/.test(imageFile)) {
            console.log(`⏭️  Skipping responsive size file: ${imageFile}`);
            skipped++;
            continue;
        }

        // Check if responsive sizes already exist
        if (hasResponsiveSizes(imagePath)) {
            console.log(`✅ Responsive sizes already exist for: ${imageFile}`);
            skipped++;
            continue;
        }

        try {
            console.log(`\n🔄 Processing: ${imageFile}`);
            const baseFilename = path.parse(imageFile).name;
            
            await processUploadedImage(imagePath, baseFilename, IMAGES_DIR);
            
            processed++;
            console.log(`✅ Completed: ${imageFile}`);
        } catch (error) {
            errors++;
            console.error(`❌ Error processing ${imageFile}:`, error.message);
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   ✅ Processed: ${processed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('='.repeat(50));

    if (processed > 0) {
        console.log('\n✨ Batch processing complete!');
        console.log(`   Generated responsive sizes for ${processed} image(s).`);
    } else if (errors === 0) {
        console.log('\n✨ All images already have responsive sizes!');
    }
}

// Run the script
if (require.main === module) {
    generateAllImageSizes()
        .then(() => {
            console.log('\n🎉 Done!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { generateAllImageSizes };
