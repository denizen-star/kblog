#!/usr/bin/env node

/**
 * Article Creation Helper Script
 * 
 * This script helps you create actual article files from the data stored in localStorage
 * by the article editor. Run this after creating an article in the editor.
 * 
 * Usage: node create-article.js [article-slug]
 */

const fs = require('fs');
const path = require('path');

// Get article slug from command line argument
const articleSlug = process.argv[2];

if (!articleSlug) {
    console.log('Usage: node create-article.js [article-slug]');
    console.log('Example: node create-article.js my-new-article');
    process.exit(1);
}

// Check if we have the article data
const articleDir = path.join(__dirname, 'articles', articleSlug);
const htmlFile = path.join(articleDir, 'index.html');

console.log(`Creating article: ${articleSlug}`);

// Create directory if it doesn't exist
if (!fs.existsSync(articleDir)) {
    fs.mkdirSync(articleDir, { recursive: true });
    console.log(`✅ Created directory: ${articleDir}`);
} else {
    console.log(`📁 Directory already exists: ${articleDir}`);
}

// Check if we have HTML content in localStorage simulation
// In a real app, this would come from a database or API
console.log('\n📝 To complete the article creation:');
console.log('1. Open your browser and go to the article editor');
console.log('2. Create your article and publish it');
console.log('3. Check the browser console for the HTML content');
console.log('4. Copy the HTML content and create the file manually');
console.log(`5. Save it as: ${htmlFile}`);

console.log('\n🔧 Alternative: Use the browser developer tools:');
console.log('1. Open DevTools (F12)');
console.log('2. Go to Application/Storage tab');
console.log('3. Look for localStorage entries starting with "article_"');
console.log('4. Copy the HTML content and create the file');

console.log('\n📂 File structure will be:');
console.log(`articles/${articleSlug}/`);
console.log(`├── index.html (your article content)`);
console.log(`└── (image files if any)`);

console.log('\n✨ Once created, your article will be accessible at:');
console.log(`http://localhost:1977/articles/${articleSlug}/`);
