#!/usr/bin/env node

/**
 * Kerv Talks-Data Blog Server
 * Real backend API for article creation and management
 * NO SIMULATION - ACTUAL FILE CREATION
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 1978; // Different port from the static server

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'assets', 'images', 'articles');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const slug = req.body.slug || 'article';
        const ext = path.extname(file.originalname);
        cb(null, `${slug}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Project paths
const PROJECT_ROOT = __dirname;
const ARTICLES_DIR = path.join(PROJECT_ROOT, 'articles');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'assets', 'images', 'articles');

// Ensure directories exist
[ARTICLES_DIR, DATA_DIR, IMAGES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

/**
 * API Routes
 */

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Kerv Talks-Data Blog API is running' });
});

// Create article endpoint
app.post('/api/create-article', upload.single('featuredImage'), async (req, res) => {
    try {
        console.log('📝 Creating new article...');
        
        const {
            title,
            excerpt,
            category,
            author,
            tags,
            content,
            featured,
            comments,
            notification
        } = req.body;

        // Validate required fields
        if (!title || !category || !content) {
            return res.status(400).json({
                error: 'Missing required fields: title, category, and content are required'
            });
        }

        // Generate slug
        const slug = generateSlug(title);
        const articleId = slug;
        
        // Create article data
        const articleData = {
            id: articleId,
            slug: slug,
            title: title,
            excerpt: excerpt || '',
            author: getAuthorInfo(author),
            published: new Date().toISOString(),
            updated: new Date().toISOString(),
            status: 'published',
            readTime: calculateReadingTime(content),
            category: category,
            tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            image: {
                featured: req.file ? `${slug}${path.extname(req.file.originalname)}` : null,
                alt: `${title} featured image`
            },
            stats: {
                views: 0,
                likes: 0,
                comments: 0,
                shares: 0
            },
            seo: {
                metaTitle: `${title} - Kerv Talks-Data Blog`,
                metaDescription: excerpt || `Professional insights on ${title} and data architecture.`,
                keywords: tags ? tags.split(',').map(tag => tag.trim()) : [],
                canonical: `https://kervtalksdata.com/articles/${slug}/`
            },
            settings: {
                featured: featured === 'true',
                allowComments: comments === 'true',
                notifySubscribers: notification === 'true',
                archived: false
            },
            content: {
                wordCount: content.replace(/<[^>]*>/g, '').split(/\s+/).length,
                characterCount: content.length,
                hasImages: content.includes('<img'),
                hasCode: content.includes('<code') || content.includes('<pre'),
                readingLevel: 'intermediate'
            }
        };

        // Create article directory
        const articleDir = path.join(ARTICLES_DIR, slug);
        if (!fs.existsSync(articleDir)) {
            fs.mkdirSync(articleDir, { recursive: true });
            console.log(`📁 Created directory: articles/${slug}/`);
        }

        // Create article HTML file
        const articleHTML = generateArticleHTML(articleData);
        const indexPath = path.join(articleDir, 'index.html');
        fs.writeFileSync(indexPath, articleHTML, 'utf8');
        console.log(`📄 Created: articles/${slug}/index.html`);

        // Create metadata.json
        const metadataPath = path.join(articleDir, 'metadata.json');
        fs.writeFileSync(metadataPath, JSON.stringify(articleData, null, 2), 'utf8');
        console.log(`📄 Created: articles/${slug}/metadata.json`);

        // Create comments.json
        const commentsPath = path.join(articleDir, 'comments.json');
        const commentsData = {
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
        fs.writeFileSync(commentsPath, JSON.stringify(commentsData, null, 2), 'utf8');
        console.log(`📄 Created: articles/${slug}/comments.json`);

        // Update articles.json
        await updateArticlesJSON(articleData);
        console.log(`📝 Updated: data/articles.json`);

        // Handle image if uploaded
        if (req.file) {
            console.log(`🖼️  Image uploaded: ${req.file.filename}`);
        }

        console.log(`✅ Article "${slug}" created successfully!`);
        
        res.json({
            success: true,
            message: 'Article created successfully!',
            article: {
                id: articleData.id,
                slug: articleData.slug,
                title: articleData.title,
                url: `http://localhost:1977/articles/${slug}/`
            }
        });

    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({
            error: 'Failed to create article',
            message: error.message
        });
    }
});

// Get articles list
app.get('/api/articles', (req, res) => {
    try {
        const articlesPath = path.join(DATA_DIR, 'articles.json');
        if (fs.existsSync(articlesPath)) {
            const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
            res.json(articlesData);
        } else {
            res.json({ articles: [] });
        }
    } catch (error) {
        console.error('Error reading articles:', error);
        res.status(500).json({ error: 'Failed to read articles' });
    }
});

// Get specific article
app.get('/api/articles/:slug', (req, res) => {
    try {
        const { slug } = req.params;
        const articleDir = path.join(ARTICLES_DIR, slug);
        const metadataPath = path.join(articleDir, 'metadata.json');
        
        if (fs.existsSync(metadataPath)) {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            res.json(metadata);
        } else {
            res.status(404).json({ error: 'Article not found' });
        }
    } catch (error) {
        console.error('Error reading article:', error);
        res.status(500).json({ error: 'Failed to read article' });
    }
});

// Update article stats (views, likes, etc.)
app.post('/api/articles/:slug/stats', (req, res) => {
    try {
        const { slug } = req.params;
        const { type, increment = 1 } = req.body; // type: 'views', 'likes', 'comments'
        
        const articleDir = path.join(ARTICLES_DIR, slug);
        const metadataPath = path.join(articleDir, 'metadata.json');
        
        if (fs.existsSync(metadataPath)) {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            
            if (metadata.stats && metadata.stats[type] !== undefined) {
                metadata.stats[type] += increment;
                metadata.updated = new Date().toISOString();
                
                fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
                
                // Also update articles.json
                updateArticlesJSON(metadata);
                
                res.json({ success: true, stats: metadata.stats });
            } else {
                res.status(400).json({ error: 'Invalid stat type' });
            }
        } else {
            res.status(404).json({ error: 'Article not found' });
        }
    } catch (error) {
        console.error('Error updating article stats:', error);
        res.status(500).json({ error: 'Failed to update article stats' });
    }
});

/**
 * Helper Functions
 */

function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function calculateReadingTime(content) {
    const textContent = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    const words = textContent.split(/\s+/).filter(word => word.length > 0);
    return Math.ceil(words.length / 200); // 200 words per minute
}

function getAuthorInfo(authorId) {
    const authors = {
        'data-crusader': {
            id: 'data-crusader',
            name: 'Data Crusader',
            role: 'Head of Data Strategy',
            avatar: '🦸‍♂️',
            bio: 'A seasoned data professional with over 10 years of experience in enterprise data architecture and information asymmetry strategies.',
            articles: 16,
            followers: 1247
        },
        'cosmic-analyst': {
            id: 'cosmic-analyst',
            name: 'Cosmic Analyst',
            role: 'Data Architecture Lead',
            avatar: '🌌',
            bio: 'Specializing in building scalable data universes that connect disparate enterprise systems across organizational boundaries.',
            articles: 13,
            followers: 892
        },
        'web-weaver': {
            id: 'web-weaver',
            name: 'Web Weaver',
            role: 'Analytics Specialist',
            avatar: '🕷️',
            bio: 'Expert in crafting compelling data narratives that transform complex information into actionable insights.',
            articles: 19,
            followers: 1156
        }
    };
    return authors[authorId] || authors['data-crusader'];
}

function generateArticleHTML(articleData) {
    const authorInfo = articleData.author;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${articleData.title} - Kerv Talks-Data Blog</title>
    <meta name="description" content="${articleData.excerpt || 'Professional insights on data architecture and enterprise strategies.'}">
    <meta name="keywords" content="${articleData.tags.join(', ')}, data architecture, information asymmetry">
    <meta name="author" content="${authorInfo.name}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${articleData.title}">
    <meta property="og:description" content="${articleData.excerpt || 'Professional insights on data architecture and enterprise strategies.'}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://kervtalksdata.com/articles/${articleData.slug}/">
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="../../assets/css/main.css">
    <link rel="stylesheet" href="../../assets/css/responsive.css">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "${articleData.title}",
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
        "datePublished": "${articleData.published}",
        "description": "${articleData.excerpt || 'Professional insights on data architecture and enterprise strategies.'}"
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
            <span class="breadcrumb-current">${articleData.title}</span>
        </nav>

        <div class="article-layout">
            <article class="article-content">
                <!-- Article Header -->
                <header class="article-header-full">
                    <div class="article-category-badge">${articleData.category}</div>
                    <h1 class="article-title-full">${articleData.title}</h1>
                    
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
                                <span class="stat-value">${new Date(articleData.published).toLocaleDateString()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Read time</span>
                                <span class="stat-value">${articleData.readTime} min</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Views</span>
                                <span class="stat-value">${articleData.stats.views}</span>
                            </div>
                        </div>
                    </div>
                </header>

                ${articleData.image.featured ? `
                <!-- Article Image -->
                <div class="article-featured-image">
                    <img src="../../assets/images/articles/${articleData.image.featured}" alt="${articleData.title}" style="width: 100%; height: 300px; object-fit: cover;" id="featured-image">
                </div>
                ` : `
                <!-- Article Image -->
                <div class="article-featured-image">
                    <img src="../../assets/images/articles/${articleData.slug}.jpg" alt="${articleData.title}" style="width: 100%; height: 300px; object-fit: cover; display: none;" id="featured-image">
                    <div class="featured-image-placeholder" id="image-placeholder">${authorInfo.avatar}</div>
                </div>
                `}

                <!-- Article Body -->
                <div class="article-body">
                    ${articleData.excerpt ? `<p class="article-lead">${articleData.excerpt}</p>` : ''}
                    <div class="article-content-html">${articleData.content}</div>
                </div>

                <!-- Article Actions -->
                <div class="article-actions-full">
                    <button class="action-button like-button" data-article-id="${articleData.id}">
                        <span class="action-icon">👍</span>
                        <span class="action-text">Like</span>
                        <span class="action-count">${articleData.stats.likes}</span>
                    </button>
                    
                    <button class="action-button share-button" data-article-id="${articleData.id}">
                        <span class="action-icon">🔄</span>
                        <span class="action-text">Share</span>
                    </button>
                    
                    <button class="action-button bookmark-button">
                        <span class="action-icon">🔖</span>
                        <span class="action-text">Save</span>
                    </button>
                </div>

                <!-- Tags -->
                <div class="article-tags-full">
                    ${articleData.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </article>

            <!-- Sidebar -->
            <aside class="article-sidebar">
                <!-- Author Card -->
                <div class="card author-card">
                    <div class="author-card-header">
                        <div class="author-avatar-sidebar">${authorInfo.avatar}</div>
                        <div class="author-info-sidebar">
                            <h3>${authorInfo.name}</h3>
                            <p>${authorInfo.role}</p>
                        </div>
                    </div>
                    <p class="author-bio">${authorInfo.bio}</p>
                    <div class="author-stats">
                        <div class="author-stat">
                            <span class="stat-number">${authorInfo.articles}</span>
                            <span class="stat-label">Articles</span>
                        </div>
                        <div class="author-stat">
                            <span class="stat-number">${authorInfo.followers}</span>
                            <span class="stat-label">Followers</span>
                        </div>
                    </div>
                </div>

                <!-- Newsletter Signup -->
                <div class="card newsletter-card">
                    <h3>Stay Updated</h3>
                    <p>Get the latest insights on data architecture and enterprise strategies delivered to your inbox.</p>
                    <form class="newsletter-form">
                        <input type="email" placeholder="Enter your email" required>
                        <button type="submit">Subscribe</button>
                    </form>
                </div>
            </aside>
        </div>

        <!-- Comments Section -->
        <section class="comments-section" id="comments">
            <div class="comments-header">
                <h2>Comments (${articleData.stats.comments})</h2>
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

async function updateArticlesJSON(articleData) {
    const articlesJsonPath = path.join(DATA_DIR, 'articles.json');
    
    // Read existing articles
    let articlesData;
    try {
        if (fs.existsSync(articlesJsonPath)) {
            const content = fs.readFileSync(articlesJsonPath, 'utf8');
            articlesData = JSON.parse(content);
        } else {
            articlesData = { articles: [] };
        }
    } catch (error) {
        console.error('Error reading articles.json:', error);
        articlesData = { articles: [] };
    }
    
    // Check if article already exists
    const existingIndex = articlesData.articles.findIndex(article => article.id === articleData.id);
    
    const articleEntry = {
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
        image: articleData.image.featured || `${articleData.slug}.jpg`,
        content: `${articleData.slug}-content.html`,
        likes: articleData.stats.likes,
        comments: articleData.stats.comments,
        views: articleData.stats.views
    };
    
    if (existingIndex >= 0) {
        // Update existing article
        articlesData.articles[existingIndex] = articleEntry;
        console.log(`📝 Updated existing article in articles.json`);
    } else {
        // Add new article to the beginning
        articlesData.articles.unshift(articleEntry);
        console.log(`📝 Added new article to articles.json`);
    }
    
    // Write updated articles.json
    fs.writeFileSync(articlesJsonPath, JSON.stringify(articlesData, null, 2), 'utf8');
}

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
    }
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Kerv Talks-Data Blog API Server running on port ${PORT}`);
    console.log(`📝 Article creation endpoint: http://localhost:${PORT}/api/create-article`);
    console.log(`📚 Articles list endpoint: http://localhost:${PORT}/api/articles`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
