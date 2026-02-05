/**
 * Backfill og:image and Twitter Card meta tags to existing article HTML files
 * Run once: node scripts/add-og-meta-to-articles.js
 */

const fs = require("fs");
const path = require("path");
const {
  getArticleOgImage,
  formatArticleOgTitle,
  formatArticleOgDescription,
} = require("../lib/og-meta.js");

const ARTICLES_DIR = path.join(__dirname, "..", "articles");

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getArticleDirectories() {
  const entries = fs.readdirSync(ARTICLES_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => path.join(ARTICLES_DIR, e.name))
    .filter((dir) => {
      const indexPath = path.join(dir, "index.html");
      const metaPath = path.join(dir, "metadata.json");
      return fs.existsSync(indexPath) && fs.existsSync(metaPath);
    });
}

function addOrUpdateOgMeta(html, metadata) {
  const featuredImage =
    metadata.image && metadata.image.featured
      ? metadata.image.featured
      : null;
  const ogImageUrl = getArticleOgImage(featuredImage);
  const ogTitle = formatArticleOgTitle(metadata.title || "");
  const ogDescription = formatArticleOgDescription(metadata.excerpt || "");
  const escapedTitle = escapeHtml(ogTitle);
  const escapedDescription = escapeHtml(ogDescription);
  const escapedOgImageUrl = escapeHtml(ogImageUrl);

  const newMetaTags = `
    <meta property="og:image" content="${escapedOgImageUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${escapedOgImageUrl}">
    <meta name="twitter:title" content="${escapedTitle}">
    <meta name="twitter:description" content="${escapedDescription}">`;

  let modified = html;

  modified = modified.replace(
    /<meta\s+property="og:title"\s+content="[^"]*">/,
    `<meta property="og:title" content="${escapedTitle}">`
  );

  modified = modified.replace(
    /<meta\s+property="og:description"\s+content="[\s\S]*?">/,
    `<meta property="og:description" content="${escapedDescription}">`
  );

  if (!modified.includes('property="og:image"')) {
    modified = modified.replace(
      /(<meta\s+property="og:url"\s+content="[^"]*">)/,
      `$1${newMetaTags}`
    );
  } else {
    modified = modified.replace(
      /<meta\s+property="og:image"\s+content="[^"]*">/,
      `<meta property="og:image" content="${escapedOgImageUrl}">`
    );
    if (modified.includes('name="twitter:image"')) {
      modified = modified.replace(
        /<meta\s+name="twitter:image"\s+content="[^"]*">/,
        `<meta name="twitter:image" content="${escapedOgImageUrl}">`
      );
      modified = modified.replace(
        /<meta\s+name="twitter:title"\s+content="[^"]*">/,
        `<meta name="twitter:title" content="${escapedTitle}">`
      );
      modified = modified.replace(
        /<meta\s+name="twitter:description"\s+content="[^"]*">/,
        `<meta name="twitter:description" content="${escapedDescription}">`
      );
    } else {
      modified = modified.replace(
        /(<meta\s+property="og:image"\s+content="[^"]*">)/,
        `$1
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${escapedOgImageUrl}">
    <meta name="twitter:title" content="${escapedTitle}">
    <meta name="twitter:description" content="${escapedDescription}">`
      );
    }
  }

  return modified;
}

function main() {
  const dirs = getArticleDirectories();
  console.log(`Found ${dirs.length} article directories`);

  let updated = 0;
  for (const dir of dirs) {
    const indexPath = path.join(dir, "index.html");
    const metaPath = path.join(dir, "metadata.json");

    const metadata = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    let html = fs.readFileSync(indexPath, "utf8");

    const newHtml = addOrUpdateOgMeta(html, metadata);
    if (newHtml !== html) {
      fs.writeFileSync(indexPath, newHtml, "utf8");
      updated++;
      console.log(`Updated: ${path.basename(dir)}`);
    }
  }

  console.log(`Done. Updated ${updated} article(s).`);
}

main();
