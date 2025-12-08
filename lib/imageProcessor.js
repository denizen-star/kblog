/**
 * Image Processor Utility
 * Generates multiple responsive image sizes from uploaded images
 * Uses Sharp library for high-performance image processing
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Image sizes to generate (in pixels width)
const IMAGE_SIZES = [400, 600, 900, 1200];

/**
 * Generate responsive image sizes from an original image
 * @param {string} imagePath - Full path to the original image file
 * @param {string} outputDir - Directory where resized images should be saved
 * @param {string} baseFilename - Base filename (without extension) for output files
 * @returns {Promise<Array<string>>} Array of generated file paths
 */
async function generateImageSizes(imagePath, outputDir, baseFilename) {
    try {
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Get file extension from original image
        const ext = path.extname(imagePath).toLowerCase();
        const generatedFiles = [];

        // Get image metadata to preserve aspect ratio
        const metadata = await sharp(imagePath).metadata();
        const originalWidth = metadata.width;
        const originalHeight = metadata.height;

        // Generate each size
        for (const width of IMAGE_SIZES) {
            // Only resize if target width is smaller than original
            // Otherwise, use original dimensions
            const targetWidth = Math.min(width, originalWidth);
            
            // Calculate height to maintain aspect ratio
            const targetHeight = Math.round((targetWidth / originalWidth) * originalHeight);

            const outputFilename = `${baseFilename}-${width}w${ext}`;
            const outputPath = path.join(outputDir, outputFilename);

            try {
                // Create sharp instance with resize
                let sharpInstance = sharp(imagePath)
                    .resize(targetWidth, targetHeight, {
                        fit: 'inside',
                        withoutEnlargement: true
                    });

                // Apply format-specific optimizations based on output extension
                if (ext === '.jpg' || ext === '.jpeg') {
                    sharpInstance = sharpInstance.jpeg({ quality: 85, mozjpeg: true });
                } else if (ext === '.png') {
                    sharpInstance = sharpInstance.png({ quality: 85, compressionLevel: 9 });
                } else if (ext === '.webp') {
                    sharpInstance = sharpInstance.webp({ quality: 85 });
                } else {
                    // For other formats, keep original format
                    sharpInstance = sharpInstance.jpeg({ quality: 85, mozjpeg: true });
                }

                await sharpInstance.toFile(outputPath);

                generatedFiles.push(outputPath);
                console.log(`✅ Generated: ${outputFilename} (${targetWidth}x${targetHeight})`);
            } catch (error) {
                console.error(`❌ Error generating ${outputFilename}:`, error.message);
                // Continue with other sizes even if one fails
            }
        }

        return generatedFiles;
    } catch (error) {
        console.error('❌ Error in generateImageSizes:', error);
        throw error;
    }
}

/**
 * Generate responsive image sizes from an uploaded image file
 * This is the main function to use after image upload
 * @param {string} uploadedImagePath - Full path to the uploaded image
 * @param {string} baseFilename - Base filename (without extension) for output files
 * @param {string} outputDir - Directory where resized images should be saved (optional, defaults to same as uploaded)
 * @returns {Promise<Array<string>>} Array of generated file paths
 */
async function processUploadedImage(uploadedImagePath, baseFilename, outputDir = null) {
    try {
        // If outputDir not specified, use the same directory as uploaded image
        if (!outputDir) {
            outputDir = path.dirname(uploadedImagePath);
        }

        // Remove extension from baseFilename if present
        const filenameWithoutExt = path.parse(baseFilename).name;

        // Generate all sizes
        const generatedFiles = await generateImageSizes(
            uploadedImagePath,
            outputDir,
            filenameWithoutExt
        );

        console.log(`✅ Successfully processed image: ${baseFilename}`);
        console.log(`   Generated ${generatedFiles.length} responsive sizes`);

        return generatedFiles;
    } catch (error) {
        console.error('❌ Error processing uploaded image:', error);
        throw error;
    }
}

/**
 * Check if responsive image sizes exist for a given base filename
 * @param {string} baseFilename - Base filename (without size suffix)
 * @param {string} imagesDir - Directory to check
 * @returns {boolean} True if all sizes exist
 */
function checkResponsiveSizesExist(baseFilename, imagesDir) {
    const ext = path.extname(baseFilename);
    const nameWithoutExt = path.parse(baseFilename).name;

    for (const width of IMAGE_SIZES) {
        const sizeFilename = `${nameWithoutExt}-${width}w${ext}`;
        const sizePath = path.join(imagesDir, sizeFilename);
        
        if (!fs.existsSync(sizePath)) {
            return false;
        }
    }

    return true;
}

/**
 * Get the base filename from a responsive image filename
 * Example: "article-400w.jpg" -> "article.jpg"
 * @param {string} responsiveFilename - Filename with size suffix
 * @returns {string} Base filename
 */
function getBaseFilename(responsiveFilename) {
    // Remove size suffix pattern: -400w, -600w, etc.
    return responsiveFilename.replace(/-\d+w(\.[^.]+)$/, '$1');
}

module.exports = {
    generateImageSizes,
    processUploadedImage,
    checkResponsiveSizesExist,
    getBaseFilename,
    IMAGE_SIZES
};
