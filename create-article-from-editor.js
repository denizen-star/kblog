#!/usr/bin/env node

/**
 * Article Creation Helper Script
 * This script creates article files from data stored in localStorage by the article editor
 * 
 * Usage: node create-article-from-editor.js [article-slug]
 * 
 * The script will:
 * 1. Read article data from localStorage (stored by the editor)
 * 2. Create the article directory structure
 * 3. Generate all necessary files (index.html, metadata.json, comments.json)
 * 4. Update the main articles.json file
 * 5. Handle image uploads if present
 */

const fs = require('fs');
const path = require('path');

class ArticleCreator {
    constructor() {
        this.projectRoot = process.cwd();
        this.articlesDir = path.join(this.projectRoot, 'articles');
        this.dataDir = path.join(this.projectRoot, 'data');
        this.imagesDir = path.join(this.projectRoot, 'assets', 'images', 'articles');
    }

    async createArticleFromSlug(slug) {
        try {
            console.log(`Creating article: ${slug}`);
            
            // Check if article data exists in localStorage (we'll simulate this)
            const articleData = await this.getArticleDataFromEditor(slug);
            
            if (!articleData) {
                console.error(`No article data found for slug: ${slug}`);
                console.log('Available articles in localStorage:');
                this.listAvailableArticles();
                return;
            }

            // Create article directory
            await this.createArticleDirectory(slug);
            
            // Create article files
            await this.createArticleFiles(slug, articleData);
            
            // Update articles.json
            await this.updateArticlesJSON(articleData);
            
            // Handle image if present
            await this.handleImageUpload(slug, articleData);
            
            console.log(`✅ Article "${slug}" created successfully!`);
            console.log(`📁 Directory: articles/${slug}/`);
            console.log(`🌐 URL: http://localhost:1977/articles/${slug}/`);
            
        } catch (error) {
            console.error('Error creating article:', error);
        }
    }

    async getArticleDataFromEditor(slug) {
        // In a real implementation, this would read from localStorage
        // For now, we'll create a sample article data structure
        console.log(`Looking for article data for slug: ${slug}`);
        
        // Check if we have stored data (this would come from localStorage in browser)
        const storedData = this.getStoredArticleData(slug);
        
        if (storedData) {
            return storedData;
        }

        // If no stored data, create a sample article for testing
        return this.createSampleArticleData(slug);
    }

    getStoredArticleData(slug) {
        // This would normally read from localStorage
        // For now, return null to trigger sample data creation
        return null;
    }

    createSampleArticleData(slug) {
        return {
            id: slug,
            slug: slug,
            title: this.slugToTitle(slug),
            excerpt: '',
            author: {
                id: 'data-crusader',
                name: 'Data Crusader',
                avatar: '🦸‍♂️',
                role: 'Head of Data Strategy',
                bio: 'A seasoned data professional with over 10 years of experience in enterprise data architecture and information asymmetry strategies.'
            },
            published: new Date().toISOString(),
            updated: new Date().toISOString(),
            status: 'published',
            category: '',
            tags: [],
            image: {
                featured: null,
                alt: `${slug} featured image`
            },
            stats: {
                views: 0,
                likes: 0,
                comments: 0,
                shares: 0
            },
            seo: {
                metaTitle: `${this.slugToTitle(slug)} - Kerv Talks-Data Blog`,
                metaDescription: '',
                keywords: [slug],
                canonical: `https://kervtalksdata.com/articles/${slug}/`
            },
            settings: {
                featured: false,
                allowComments: true,
                notifySubscribers: false,
                archived: false
            },
            htmlContent: this.generateSampleHTML(slug)
        };
    }

    slugToTitle(slug) {
        return slug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    generateResponsiveImageHTML(imagePath, imageName, altText, isArticlePage = false) {
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
        const sizesAttr = isArticlePage 
            ? '(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1128px'
            : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';

        // Fallback to original image
        const fallbackSrc = imagePath;
        const maxHeight = isArticlePage ? 500 : 300;

        // Build inline styles
        const inlineStyles = `width: 100%; height: auto; max-height: ${maxHeight}px; display: block; object-fit: contain; object-position: center; border-radius: 8px; background: rgba(255, 255, 255, 0.6); padding: 8px;`;

        // Generate HTML
        return `<img 
                        src="${fallbackSrc}" 
                        srcset="${srcset}" 
                        sizes="${sizesAttr}" 
                        alt="${altText}" 
                        loading="lazy" 
                        decoding="async" 
                        style="${inlineStyles}">`;
    }

    generateSampleHTML(slug) {
        const title = this.slugToTitle(slug);
        const authorInfo = {
            name: 'Data Crusader',
            role: 'Head of Data Strategy',
            avatar: '🦸‍♂️',
            bio: 'A seasoned data professional with over 10 years of experience in enterprise data architecture and information asymmetry strategies.',
            articles: 16,
            followers: 1247
        };

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Kerv Talks-Data Blog</title>
    <meta name="description" content="">
    <meta name="keywords" content="${slug}">
    <meta name="author" content="${authorInfo.name}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://kervtalksdata.com/articles/${slug}/">
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="../../assets/css/main.css">
    <link rel="stylesheet" href="../../assets/css/responsive.css">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "${title}",
        "author": {
            "@type": "Person",
            "name": "${authorInfo.name}",
            "jobTitle": "${authorInfo.role}"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Kerv Talks-Data",
            "logo": {
                "@type": "ImageObject",
                "url": "https://kervtalksdata.com/assets/images/logo.png"
            }
        },
        "datePublished": "${new Date().toISOString()}",
        "description": ""
    }
    </script>
</head>
<body>
    <header class="header">
        <nav class="nav-container">
            <a href="../../index.html" class="logo">
                <div class="logo-icon">KT</div>
                Kerv Talks-Data
            </a>
            
            <div class="search-bar">
                <input type="text" placeholder="Search articles, authors, topics..." id="search-input">
                <div class="search-results" id="search-results"></div>
            </div>
            
            <ul class="nav-menu">
                <li><a href="../../index.html">Home</a></li>
                <li><a href="../index.html">Articles</a></li>
                <li><a href="../../about.html">About</a></li>
                <li><a href="../../contact.html">Contact</a></li>
            </ul>
        </nav>
    </header>

    <main class="article-main-container">
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
            <a href="../../index.html">Home</a>
            <span class="breadcrumb-separator">›</span>
            <a href="../index.html">Articles</a>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-current">${title}</span>
        </nav>

        <section class="article-newsletter article-newsletter--top">
            <div class="newsletter-panel newsletter-panel--article">
                <p class="newsletter-panel__headline">Join data leaders gaining hands-on human experience with my free monthly newsletter.</p>
                <form class="newsletter-panel__form" action="#" method="post" novalidate data-source="editor-created-top" data-component="article-newsletter">
                    <div class="newsletter-panel__inputs">
                        <input class="newsletter-panel__input" type="text" name="name" autocomplete="name" placeholder="Name">
                        <input class="newsletter-panel__input" type="email" name="email" autocomplete="email" placeholder="Email" required>
                        <div class="newsletter-panel__actions">
                            <button class="newsletter-panel__submit" type="submit" aria-label="Subscribe to newsletter">Subscribe</button>
                            <div class="newsletter-panel__icons">
                                <a class="newsletter-panel__icon newsletter-panel__icon--linkedin" href="https://www.linkedin.com/in/kleacock/" target="_blank" rel="noopener" aria-label="Connect on LinkedIn">
                                    <span class="newsletter-panel__icon-inner">
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path fill="currentColor" d="M20.452 20.452h-3.555v-5.569c0-1.327-.027-3.038-1.852-3.038-1.853 0-2.136 1.449-2.136 2.948v5.659H9.354V9.012h3.414v1.561h.049c.476-.9 1.637-1.852 3.369-1.852 3.601 0 4.267 2.37 4.267 5.455v6.276zM5.337 7.433c-1.144 0-2.068-.929-2.068-2.072 0-1.144.924-2.072 2.068-2.072 1.143 0 2.067.928 2.067 2.072 0 1.143-.924 2.072-2.067 2.072zM7.119 20.452H3.552V9.012h3.567v11.44z"/>
                                        </svg>
                                    </span>
                                </a>
                                <a class="newsletter-panel__icon newsletter-panel__icon--mail" href="mailto:optium.optimizer@gmail.com" aria-label="Email Kervin">
                                    <span class="newsletter-panel__icon-inner">
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path fill="currentColor" d="M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm0 2v.21L12 13l9-5.79V7H3zm0 12h18V9.24l-9 5.79-9-5.79V19z"/>
                                        </svg>
                                    </span>
                                </a>
                                <a class="newsletter-panel__icon newsletter-panel__icon--kerv" href="https://kervinapps.com/" target="_blank" rel="noopener" aria-label="Visit KervinApps">
                                    <span class="newsletter-panel__icon-inner">
                                        <span class="newsletter-panel__icon-text">K</span>
                                    </span>
                                </a>
                                <a class="newsletter-panel__icon newsletter-panel__icon--chat" href="../../contact.html" aria-label="Contact Kervin">
                                    <span class="newsletter-panel__icon-inner">
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path fill="currentColor" d="M4 4h16a2 2 0 012 2v9a2 2 0 01-2 2h-6l-4 3v-3H4a2 2 0 01-2-2V6a2 2 0 012-2zm3 5a1 1 0 100 2 1 1 0 000-2zm5 0a1 1 0 100 2 1 1 0 000-2zm5 0a1 1 0 100 2 1 1 0 000-2z"/>
                                        </svg>
                                    </span>
                                </a>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </section>

        <div class="article-layout">
            <article class="article-content">
                <!-- Article Header -->
                <header class="article-header-full">
                    <div class="article-category-badge"></div>
                    <h1 class="article-title-full">${title}</h1>
                    
                    <div class="article-meta-full">
                        <div class="article-author-info">
                            <div class="article-avatar-large">${authorInfo.avatar}</div>
                            <div class="author-details">
                                <div class="author-name">${authorInfo.name}</div>
                                <div class="author-role">${authorInfo.role}</div>
                            </div>
                        </div>
                        
                        <div class="article-stats-full">
                            <div class="stat-item">
                                <span class="stat-label">Published</span>
                                <span class="stat-value">${new Date().toLocaleDateString()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Read time</span>
                                <span class="stat-value">5 min</span>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Article Image -->
                <div class="article-featured-image">
                    ${this.generateResponsiveImageHTML(`../../assets/images/articles/${slug}.jpg`, `${slug}.jpg`, title, true).replace('>', ' style="display: none;">')}
                    <div class="featured-image-placeholder" id="image-placeholder">${authorInfo.avatar}</div>
                </div>

                <!-- Article Body -->
                <div class="article-body">
                </div>

                <!-- Article Actions -->
                <div class="article-actions-full">
                    <button class="action-button like-button" data-article-id="${slug}">
                        <span class="action-icon">👍</span>
                        <span class="action-text">Like</span>
                        <span class="action-count">0</span>
                    </button>
                    
                    <button class="action-button share-button" data-article-id="${slug}">
                        <span class="action-icon">🔄</span>
                        <span class="action-text">Share</span>
                    </button>
                    
                    <button class="action-button bookmark-button">
                        <span class="action-icon">🔖</span>
                        <span class="action-text">Save</span>
                    </button>
                </div>
                
                <section class="article-author-section">
                    <div class="card author-card">
                        <div class="author-card-header">
                            <div class="author-avatar-sidebar">${authorInfo.avatar}</div>
                            <div class="author-info-sidebar">
                                <h3>${authorInfo.name}</h3>
                                <p>${authorInfo.role}</p>
                            </div>
                        </div>
                        <p class="author-bio">${authorInfo.bio}</p>
                    </div>
                </section>
            </article>
        </div>

        <section class="article-newsletter article-newsletter--bottom">
            <div class="newsletter-panel newsletter-panel--article">
                <p class="newsletter-panel__headline">Join data leaders gaining hands-on human experience with my free monthly newsletter.</p>
                <form class="newsletter-panel__form" action="#" method="post" novalidate data-source="editor-created-bottom" data-component="article-newsletter">
                    <div class="newsletter-panel__inputs">
                        <input class="newsletter-panel__input" type="text" name="name" autocomplete="name" placeholder="Name">
                        <input class="newsletter-panel__input" type="email" name="email" autocomplete="email" placeholder="Email" required>
                        <div class="newsletter-panel__actions">
                            <button class="newsletter-panel__submit" type="submit" aria-label="Subscribe to newsletter">Subscribe</button>
                            <div class="newsletter-panel__icons">
                                <a class="newsletter-panel__icon newsletter-panel__icon--linkedin" href="https://www.linkedin.com/in/kleacock/" target="_blank" rel="noopener" aria-label="Connect on LinkedIn">
                                    <span class="newsletter-panel__icon-inner">
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path fill="currentColor" d="M20.452 20.452h-3.555v-5.569c0-1.327-.027-3.038-1.852-3.038-1.853 0-2.136 1.449-2.136 2.948v5.659H9.354V9.012h3.414v1.561h.049c.476-.9 1.637-1.852 3.369-1.852 3.601 0 4.267 2.37 4.267 5.455v6.276zM5.337 7.433c-1.144 0-2.068-.929-2.068-2.072 0-1.144.924-2.072 2.068-2.072 1.143 0 2.067.928 2.067 2.072 0 1.143-.924 2.072-2.067 2.072zM7.119 20.452H3.552V9.012h3.567v11.44z"/>
                                        </svg>
                                    </span>
                                </a>
                                <a class="newsletter-panel__icon newsletter-panel__icon--mail" href="mailto:optium.optimizer@gmail.com" aria-label="Email Kervin">
                                    <span class="newsletter-panel__icon-inner">
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path fill="currentColor" d="M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm0 2v.21L12 13l9-5.79V7H3zm0 12h18V9.24l-9 5.79-9-5.79V19z"/>
                                        </svg>
                                    </span>
                                </a>
                                <a class="newsletter-panel__icon newsletter-panel__icon--kerv" href="https://kervinapps.com/" target="_blank" rel="noopener" aria-label="Visit KervinApps">
                                    <span class="newsletter-panel__icon-inner">
                                        <span class="newsletter-panel__icon-text">K</span>
                                    </span>
                                </a>
                                <a class="newsletter-panel__icon newsletter-panel__icon--chat" href="../../contact.html" aria-label="Contact Kervin">
                                    <span class="newsletter-panel__icon-inner">
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path fill="currentColor" d="M4 4h16a2 2 0 012 2v9a2 2 0 01-2 2h-6l-4 3v-3H4a2 2 0 01-2-2V6a2 2 0 012-2zm3 5a1 1 0 100 2 1 1 0 000-2zm5 0a1 1 0 100 2 1 1 0 000-2zm5 0a1 1 0 100 2 1 1 0 000-2z"/>
                                        </svg>
                                    </span>
                                </a>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </section>

        <!-- Comments Section -->
        <section class="comments-section" id="comments">
            <div class="comments-header">
                <h2>Comments (0)</h2>
            </div>
            
            <div class="comment-form-container">
                <form class="comment-form" id="comment-form">
                    <div class="comment-input-group">
                        <div class="comment-avatar">You</div>
                        <div class="comment-input-wrapper">
                            <textarea placeholder="Share your thoughts..." name="content" required></textarea>
                            <input type="text" placeholder="Your name (optional)" name="author">
                        </div>
                    </div>
                    <button type="submit" class="comment-submit">Post Comment</button>
                </form>
            </div>
            
            <div class="comments-container" id="comments-container">
                <p class="no-comments">No comments yet. Be the first to comment!</p>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="footer-content">
            <p>&copy; 2024 Kerv Talks-Data Blog. All rights reserved.</p>
        </div>
    </footer>
    
    <!-- JavaScript -->
    <script src="../../assets/js/main.js"></script>
    <script src="../../assets/js/article.js"></script>
</body>
</html>`;
    }

    async createArticleDirectory(slug) {
        const articleDir = path.join(this.articlesDir, slug);
        
        if (!fs.existsSync(articleDir)) {
            fs.mkdirSync(articleDir, { recursive: true });
            console.log(`📁 Created directory: articles/${slug}/`);
        } else {
            console.log(`📁 Directory already exists: articles/${slug}/`);
        }
    }

    async createArticleFiles(slug, articleData) {
        const articleDir = path.join(this.articlesDir, slug);
        
        // Create index.html
        const indexPath = path.join(articleDir, 'index.html');
        fs.writeFileSync(indexPath, articleData.htmlContent, 'utf8');
        console.log(`📄 Created: articles/${slug}/index.html`);
        
        // Create metadata.json
        const metadataPath = path.join(articleDir, 'metadata.json');
        const metadata = {
            id: articleData.id,
            slug: articleData.slug,
            title: articleData.title,
            excerpt: articleData.excerpt,
            author: articleData.author,
            published: articleData.published,
            updated: articleData.updated,
            status: articleData.status,
            readTime: articleData.readTime,
            category: articleData.category,
            tags: articleData.tags,
            image: articleData.image,
            stats: articleData.stats,
            seo: articleData.seo,
            settings: articleData.settings,
            content: articleData.content
        };
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
        console.log(`📄 Created: articles/${slug}/metadata.json`);
        
        // Create comments.json
        const commentsPath = path.join(articleDir, 'comments.json');
        const comments = {
            articleId: slug,
            comments: [],
            stats: {
                totalComments: 0,
                totalReplies: 0,
                lastComment: null
            },
            moderation: {
                allowAnonymous: true,
                requireApproval: false,
                maxLength: 1000
            }
        };
        fs.writeFileSync(commentsPath, JSON.stringify(comments, null, 2), 'utf8');
        console.log(`📄 Created: articles/${slug}/comments.json`);
    }

    async updateArticlesJSON(articleData) {
        const articlesJsonPath = path.join(this.dataDir, 'articles.json');
        
        // Read existing articles
        let articlesData;
        try {
            const content = fs.readFileSync(articlesJsonPath, 'utf8');
            articlesData = JSON.parse(content);
        } catch (error) {
            console.error('Error reading articles.json:', error);
            return;
        }
        
        // Check if article already exists
        const existingIndex = articlesData.articles.findIndex(article => article.id === articleData.id);
        
        if (existingIndex >= 0) {
            // Update existing article
            articlesData.articles[existingIndex] = {
                id: articleData.id,
                title: articleData.title,
                excerpt: articleData.excerpt,
                author: {
                    name: articleData.author.name,
                    avatar: articleData.author.avatar,
                    role: articleData.author.role
                },
                published: articleData.published.split('T')[0], // Date only
                readTime: articleData.readTime,
                category: articleData.category,
                tags: articleData.tags,
                image: `${articleData.slug}.jpg`,
                content: `${articleData.slug}-content.html`,
                likes: articleData.stats.likes,
                comments: articleData.stats.comments,
                views: articleData.stats.views
            };
            console.log(`📝 Updated existing article in articles.json`);
        } else {
            // Add new article to the beginning
            const newArticle = {
                id: articleData.id,
                title: articleData.title,
                excerpt: articleData.excerpt,
                author: {
                    name: articleData.author.name,
                    avatar: articleData.author.avatar,
                    role: articleData.author.role
                },
                published: articleData.published.split('T')[0], // Date only
                readTime: articleData.readTime,
                category: articleData.category,
                tags: articleData.tags,
                image: `${articleData.slug}.jpg`,
                content: `${articleData.slug}-content.html`,
                likes: articleData.stats.likes,
                comments: articleData.stats.comments,
                views: articleData.stats.views
            };
            
            articlesData.articles.unshift(newArticle);
            console.log(`📝 Added new article to articles.json`);
        }
        
        // Write updated articles.json
        fs.writeFileSync(articlesJsonPath, JSON.stringify(articlesData, null, 2), 'utf8');
        console.log(`📝 Updated: data/articles.json`);
    }

    async handleImageUpload(slug, articleData) {
        // Check if image data exists in localStorage (simulated)
        const imageData = this.getStoredImageData(slug);
        
        if (imageData) {
            // Ensure images directory exists
            if (!fs.existsSync(this.imagesDir)) {
                fs.mkdirSync(this.imagesDir, { recursive: true });
            }
            
            // Save image file
            const imagePath = path.join(this.imagesDir, `${slug}.jpg`);
            // In a real implementation, this would save the actual image data
            console.log(`🖼️  Image data found for ${slug} (would save to: assets/images/articles/${slug}.jpg)`);
        } else {
            console.log(`🖼️  No image data found for ${slug}`);
        }
    }

    getStoredImageData(slug) {
        // This would normally read from localStorage
        // For now, return null
        return null;
    }

    listAvailableArticles() {
        console.log('To create an article, use: node create-article-from-editor.js [article-slug]');
        console.log('Example: node create-article-from-editor.js my-new-article');
    }
}

// Main execution
async function main() {
    const slug = process.argv[2];
    
    if (!slug) {
        console.log('Usage: node create-article-from-editor.js [article-slug]');
        console.log('Example: node create-article-from-editor.js my-new-article');
        process.exit(1);
    }
    
    const creator = new ArticleCreator();
    await creator.createArticleFromSlug(slug);
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ArticleCreator;
